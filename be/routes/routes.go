package routes

import (
	"github.com/gin-gonic/gin"
	"history-backend/controllers"
)

func SetupRoutes(router *gin.Engine) {
	// 健康检查端点
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"service": "history-backend",
		})
	})

	// 对话API
	router.POST("/api/chat", controllers.ChatController)
	router.POST("/api/chat/stream", controllers.ChatStreamController)
}