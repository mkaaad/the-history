#!/bin/bash

# 启动历史人物对话后端服务

echo "正在启动历史人物对话后端服务..."
echo "请确保已设置DEEPSEEK_API_KEY环境变量"
echo ""

# 加载环境变量（如果存在.env文件）
if [ -f .env ]; then
    echo "加载 .env 文件"
    export $(cat .env | grep -v '^#' | xargs)
fi

# 检查API密钥
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "错误: DEEPSEEK_API_KEY 环境变量未设置"
    echo "请在 .env 文件中设置，或运行: export DEEPSEEK_API_KEY=your_key"
    echo "可以使用示例文件: cp .env.example .env"
    exit 1
fi

echo "DeepSeek API密钥已配置"
echo "服务器启动在端口: ${PORT:-8080}"
echo "前端运行在: http://localhost:3000"
echo ""

# 编译并运行
go build -o backend main.go
./backend