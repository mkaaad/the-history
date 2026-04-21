# 使用官方Go镜像作为构建阶段
FROM golang:1.26-alpine AS builder

# 安装必要的工具（git用于依赖获取）
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 复制go.mod和go.sum文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o history-backend .

# 使用轻量级运行时镜像
FROM alpine:latest

# 安装必要的运行时依赖（如时区数据，可选）
RUN apk --no-cache add ca-certificates tzdata

# 设置工作目录
WORKDIR /root/

# 从构建阶段复制可执行文件
COPY --from=builder /app/history-backend .

# 复制环境变量示例文件（可选）
COPY .env.example .env

# 暴露端口（后端默认端口8080）
EXPOSE 8080

# 启动命令
CMD ["./history-backend"]
