# 多阶段构建：构建React应用并使用Nginx提供服务
# 第一阶段：构建React应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用（生成build目录）
RUN npm run build

# 第二阶段：使用Nginx提供服务
FROM nginx:alpine

# 复制构建产物到Nginx的默认静态文件目录
COPY --from=builder /app/build /usr/share/nginx/html

# 复制自定义Nginx配置文件（如果需要）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]