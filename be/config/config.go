package config

import (
	"os"
)

type Config struct {
	DeepSeekAPIKey string
	DeepSeekBaseURL string
	Port string
}

var AppConfig Config

func LoadConfig() {
	// 从环境变量加载配置
	AppConfig = Config{
		DeepSeekAPIKey:  os.Getenv("DEEPSEEK_API_KEY"),
		DeepSeekBaseURL: os.Getenv("DEEPSEEK_BASE_URL"),
		Port:            os.Getenv("PORT"),
	}

	// 设置默认值
	if AppConfig.DeepSeekBaseURL == "" {
		AppConfig.DeepSeekBaseURL = "https://api.deepseek.com"
	}
	if AppConfig.Port == "" {
		AppConfig.Port = "8080"
	}
}

func GetConfig() Config {
	return AppConfig
}