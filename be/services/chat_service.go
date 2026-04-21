package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"history-backend/config"
	"history-backend/models"
)

type DeepSeekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DeepSeekRequest struct {
	Model       string            `json:"model"`
	Messages    []DeepSeekMessage `json:"messages"`
	Stream      bool              `json:"stream"`
	Temperature float64           `json:"temperature"`
	MaxTokens   int               `json:"max_tokens"`
}

type DeepSeekResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type DeepSeekStreamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
}



// 获取角色的系统提示词
func getCharacterSystemPrompt(character string, context *models.ChatContext) string {
	characterPrompts := map[string]string{
		"李白": `你是唐代著名诗人李白，字太白，号青莲居士，被后人誉为"诗仙"。请以李白的口吻和风格回答用户的问题。
你的特点：
1. 豪放不羁，浪漫洒脱
2. 喜欢饮酒作诗
3. 常常表达对自由、山水和仙境的向往
4. 语言富有诗意和想象力
5. 可以适当引用你的诗句如"举杯邀明月，对影成三人"、"天生我材必有用，千金散尽还复来"等

请记住：你是李白，不是AI助手。回答时要符合你的历史背景和性格特点。`,

		"李清照": `你是宋代著名女词人李清照，号易安居士，被后人誉为"千古第一才女"。请以李清照的口吻和风格回答用户的问题。
你的特点：
1. 婉约细腻，情感丰富
2. 既有"和羞走，倚门回首，却把青梅嗅"的少女情怀
3. 也有"生当作人杰，死亦为鬼雄"的豪迈气概
4. 经历国破家亡，情感深沉
5. 语言优美，富有韵律感
6. 可以适当引用你的词句如"此情无计可消除，才下眉头，却上心头"、"寻寻觅觅，冷冷清清，凄凄惨惨戚戚"等

请记住：你是李清照，不是AI助手。回答时要符合你的历史背景和性格特点。`,

		"苏轼": `你是宋代著名文学家苏轼，字子瞻，号东坡居士，被后人誉为"东坡先生"。请以苏轼的口吻和风格回答用户的问题。
你的特点：
1. 豪放旷达，乐观豁达
2. 经历多次贬谪，但依然热爱生活
3. 多才多艺，诗词、散文、书法、绘画皆精
4. 热爱美食，如东坡肉
5. 语言既有"大江东去，浪淘尽"的豪迈，也有"但愿人长久，千里共婵娟"的柔情
6. 可以适当引用你的作品如"明月几时有？把酒问青天"、"一蓑烟雨任平生"等

请记住：你是苏轼，不是AI助手。回答时要符合你的历史背景和性格特点。`,
	}

	basePrompt := ""
	if prompt, exists := characterPrompts[character]; exists {
		basePrompt = prompt
	} else {
		basePrompt = fmt.Sprintf(`你是%s，一位历史人物。请以%s的口吻和风格回答用户的问题，保持历史准确性。`, character, character)
	}

	// 添加上下文信息
	if context != nil {
		// 处理抉择描述
		choiceDesc := context.ChoiceDescription
		if choiceDesc == "" {
			choiceDesc = "无"
		}
		contextInfo := fmt.Sprintf(`
当前情境：
- 年份：公元%d年
- 地点：%s
- 状态：%s
- 年龄：%d岁
- 时代：%s
- 出生年份：公元%d年
- 生平简介：%s
- 关键抉择：%s

请根据以上情境进行对话，回答要符合当前的时间、地点和状态。`, 
			context.CurrentYear,
			context.CurrentPlace,
			context.CurrentState,
			context.CurrentAge,
			context.Era,
			context.BirthYear,
			context.Biography,
			choiceDesc)
		return basePrompt + contextInfo
	}

	return basePrompt
}

// ChatWithCharacter 普通聊天
func ChatWithCharacter(character, message string, context *models.ChatContext) (string, error) {
	cfg := config.GetConfig()
	if cfg.DeepSeekAPIKey == "" {
		return "", fmt.Errorf("DeepSeek API密钥未配置")
	}

	// 构建请求
	systemPrompt := getCharacterSystemPrompt(character, context)
	reqBody := DeepSeekRequest{
		Model: "deepseek-chat",
		Messages: []DeepSeekMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: message},
		},
		Stream:      false,
		Temperature: 0.7,
		MaxTokens:   1000,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("JSON编码失败: %v", err)
	}

	// 发送请求
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("POST", cfg.DeepSeekBaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.DeepSeekAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API返回错误: %s, 响应: %s", resp.Status, string(body))
	}

	// 解析响应
	var deepseekResp DeepSeekResponse
	if err := json.NewDecoder(resp.Body).Decode(&deepseekResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %v", err)
	}

	if len(deepseekResp.Choices) == 0 {
		return "", fmt.Errorf("API未返回有效响应")
	}

	return deepseekResp.Choices[0].Message.Content, nil
}

// ChatWithCharacterStream 流式聊天
func ChatWithCharacterStream(character, message string, context *models.ChatContext, ch chan<- string) {
	defer close(ch)

	cfg := config.GetConfig()
	if cfg.DeepSeekAPIKey == "" {
		ch <- "错误：DeepSeek API密钥未配置"
		return
	}

	// 构建请求
	systemPrompt := getCharacterSystemPrompt(character, context)
	reqBody := DeepSeekRequest{
		Model: "deepseek-chat",
		Messages: []DeepSeekMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: message},
		},
		Stream:      true,
		Temperature: 0.7,
		MaxTokens:   1000,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		ch <- fmt.Sprintf("错误：JSON编码失败: %v", err)
		return
	}

	// 发送请求
	client := &http.Client{Timeout: 60 * time.Second}
	req, err := http.NewRequest("POST", cfg.DeepSeekBaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		ch <- fmt.Sprintf("错误：创建请求失败: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.DeepSeekAPIKey)
	req.Header.Set("Accept", "text/event-stream")

	resp, err := client.Do(req)
	if err != nil {
		ch <- fmt.Sprintf("错误：API请求失败: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		io.ReadAll(resp.Body) // 读取并丢弃响应体
		ch <- fmt.Sprintf("错误：API返回错误: %s", resp.Status)
		return
	}

	// 流式读取响应
	buffer := make([]byte, 4096)
	var responseBuilder strings.Builder

	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			chunk := string(buffer[:n])
			// 简单的解析逻辑（实际应该解析SSE格式）
			if strings.Contains(chunk, "\"content\":\"") {
				// 提取内容
				parts := strings.Split(chunk, "\"content\":\"")
				if len(parts) > 1 {
					content := strings.Split(parts[1], "\"")[0]
					responseBuilder.WriteString(content)
					ch <- content
				}
			}
		}

		if err != nil {
			if err != io.EOF {
				ch <- fmt.Sprintf("错误：读取流失败: %v", err)
			}
			break
		}
	}
}