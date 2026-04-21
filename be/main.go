package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"history-backend/config"
	"history-backend/routes"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 设置Gin模式
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化路由器
	router := gin.Default()

	// 配置CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"} // 前端开发服务器
	corsConfig.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(corsConfig))

	// 设置路由
	routes.SetupRoutes(router)

	// 启动服务器
	port := config.GetConfig().Port
	log.Printf("服务器启动在端口 %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("服务器启动失败: ", err)
	}
}