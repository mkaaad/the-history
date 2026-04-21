package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"history-backend/models"
	"history-backend/services"
)



type ChatRequest struct {
	Character string               `json:"character" binding:"required"`
	Message   string               `json:"message" binding:"required"`
	Context   *models.ChatContext `json:"context,omitempty"`
}

// ChatController 处理普通聊天请求
func ChatController(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	// 调用聊天服务
	response, err := services.ChatWithCharacter(req.Character, req.Message, req.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "聊天服务暂时不可用"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"character": req.Character,
		"response":  response,
	})
}

// ChatStreamController 处理流式聊天请求
func ChatStreamController(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	// 设置SSE头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// 创建通道接收流式响应
	ch := make(chan string)
	go services.ChatWithCharacterStream(req.Character, req.Message, req.Context, ch)

	// 流式返回数据
	for chunk := range ch {
		c.SSEvent("message", chunk)
		c.Writer.Flush()
	}

	c.SSEvent("end", "对话结束")
}