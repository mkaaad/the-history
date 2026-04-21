# 历史人物对话后端

为历史人物交互地图提供AI对话功能的后端服务，使用Go + Gin框架，集成DeepSeek API。

## 功能特性

- 与历史人物（李白、李清照、苏轼）AI对话
- 流式响应支持
- 角色扮演系统提示词
- RESTful API接口
- CORS跨域支持

## 快速开始

### 1. 环境要求

- Go 1.25+
- DeepSeek API密钥

### 2. 配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的DeepSeek API密钥：

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 安装依赖

```bash
go mod tidy
```

### 4. 启动服务

```bash
./start.sh
```

或者手动运行：

```bash
export DEEPSEEK_API_KEY=your_key
go run main.go
```

### 5. 验证服务

访问健康检查端点：
```
GET http://localhost:8080/health
```

## API接口

### 普通聊天

```
POST /api/chat
Content-Type: application/json

{
  "character": "李白",
  "message": "你好，李白先生"
}
```

响应：
```json
{
  "character": "李白",
  "response": "你好！我是李白，字太白..."
}
```

### 流式聊天

```
POST /api/chat/stream
Content-Type: application/json

{
  "character": "李白", 
  "message": "你好，李白先生"
}
```

响应：Server-Sent Events (SSE) 流

## 前端集成

前端React应用已集成对话功能：
1. 在游戏界面点击"与诗人对话"按钮
2. 在对话框中输入消息
3. AI将以历史人物的口吻回复

## 配置说明

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| DEEPSEEK_API_KEY | DeepSeek API密钥 | 必填 |
| DEEPSEEK_BASE_URL | DeepSeek API地址 | https://api.deepseek.com |
| PORT | 服务端口 | 8080 |
| GIN_MODE | Gin运行模式 | debug |

## 项目结构

```
be/
├── main.go              # 程序入口
├── config/              # 配置管理
├── controllers/         # 控制器层
├── routes/              # 路由定义
├── services/            # 业务逻辑层
└── models/              # 数据模型
```

## 开发说明

### 添加新历史人物

1. 在 `services/chat_service.go` 的 `getCharacterSystemPrompt` 函数中添加新角色的系统提示词
2. 确保前端传递正确的角色名称

### 测试API

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"character": "李白", "message": "你好"}'
```

## 注意事项

1. DeepSeek API有调用频率限制，请合理使用
2. 生产环境建议设置 `GIN_MODE=release`
3. 确保前端地址在CORS配置中允许