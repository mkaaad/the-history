# 历史人物交互地图 - 完整部署指南

## 项目概述

这是一个展示中国历史人物（李白、李清照、苏轼）生平轨迹的交互式地图应用，新增AI对话功能，用户可以与历史人物进行智能对话。

## 系统架构

### 前端 (React)
- 位置: `/fe/`
- 技术: React 19, Create React App, AMap（高德地图）
- 功能: 交互式地图、时间轴、关键抉择、诗作展示、AI对话

### 后端 (Go)
- 位置: `/be/`
- 技术: Go 1.25+, Gin框架
- 功能: DeepSeek API包装、角色扮演对话、流式响应

## 快速部署

### 1. 环境准备

```bash
# 安装Node.js (18+)
# 安装Go (1.25+)
# 获取DeepSeek API密钥: https://platform.deepseek.com/api_keys
```

### 2. 后端配置

```bash
cd be/
cp .env.example .env
# 编辑 .env 文件，设置你的DeepSeek API密钥
```

### 3. 启动后端服务

```bash
cd be/
./start.sh
# 或手动启动:
# export DEEPSEEK_API_KEY=your_key
# go run main.go
```

后端将运行在: `http://localhost:8080`

### 4. 启动前端

```bash
cd fe/
npm install
npm start
```

前端将运行在: `http://localhost:3000`

### 5. 访问应用

打开浏览器访问: `http://localhost:3000`

## 功能说明

### 核心功能

1. **历史人物选择** - 选择李白、李清照或苏轼
2. **交互式地图** - 查看人物生平轨迹
3. **时间轴导航** - 点击时间点跳转到对应事件
4. **关键抉择** - 在关键历史节点做出选择
5. **诗作展示** - 查看人物代表作品
6. **AI对话** - 与历史人物智能对话（新增功能）

### AI对话功能

1. 在游戏界面点击左上角的"与诗人对话"按钮
2. 在弹出的对话框中输入你的问题
3. AI将以历史人物的口吻和知识回答
4. 支持连续对话

## 配置详解

### 后端环境变量

```env
# DeepSeek API配置（必填）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 可选配置
DEEPSEEK_BASE_URL=https://api.deepseek.com  # API地址
PORT=8080                                   # 服务端口
GIN_MODE=debug                              # 运行模式
```

### 前端配置

前端使用相对路径 `/api/chat` 发送请求，由Nginx代理到后端服务。在不同部署方式中：

#### Docker Compose部署（推荐）
- 前端自动通过Nginx代理访问后端，无需配置
- Nginx配置位于 `fe/nginx.conf`

#### 开发环境
- 前端默认向后端 `http://localhost:8080` 发送请求
- 如需修改API地址，编辑 `fe/src/components/GameScreen.js`
- 找到 `handleSendMessage` 函数中的API地址，修改为你的后端地址

#### 生产环境
- 确保Nginx正确代理 `/api/` 路径到后端服务
- 查看 `fe/nginx.conf` 中的代理配置

## 生产部署

### Docker Compose部署（推荐）

使用Docker Compose一键部署完整应用：

```bash
# 1. 配置环境变量
cd be/
cp .env.example .env
# 编辑 .env 文件，设置你的DeepSeek API密钥

# 2. 启动所有服务
cd ..
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问应用
# 前端: http://localhost:80
# 后端API: http://localhost:8080
```

#### 服务说明
- **前端**: Nginx容器，提供React应用，代理API请求到后端
- **后端**: Go容器，提供AI对话API，从.env文件读取配置
- **网络**: 服务间通过内部网络通信，前端通过`/api/`路径访问后端

#### 环境变量文件 (.env)
```env
# DeepSeek API配置（必填）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 可选配置
DEEPSEEK_BASE_URL=https://api.deepseek.com  # API地址
PORT=8080                                   # 服务端口
GIN_MODE=debug                              # 运行模式
```

### 单容器Docker部署

```bash
# 构建前端
cd fe/
npm run build

# 构建后端
cd ../be/
go build -o backend main.go

# 创建Docker镜像
docker build -t history-app .
docker run -d -p 8080:80 --name history-app history-app
```

### 传统部署

1. **前端**: 将 `fe/build/` 目录内容部署到Web服务器
2. **后端**: 将Go二进制文件部署到服务器，设置环境变量
3. **配置Nginx**: 反向代理前端和后端

## 故障排除

### 常见问题

1. **对话功能无法使用**
   - 检查后端是否正常运行: `curl http://localhost:8080/health`
   - 检查DeepSeek API密钥是否正确
   - 查看后端日志中的错误信息

2. **跨域错误 (CORS)**
   - 确保前端访问地址在后端CORS允许列表中
   - 修改 `be/main.go` 中的 `corsConfig.AllowOrigins`

3. **API调用失败**
   - 检查网络连接
   - 验证DeepSeek API密钥是否有足够额度
   - 查看DeepSeek API文档的调用限制

### 日志查看

```bash
# 后端日志
cd be/
tail -f logs/app.log  # 如果配置了日志文件

# 前端开发日志
cd fe/
npm start  # 在终端查看
```

## 开发扩展

### 添加新历史人物

1. **前端数据**:
   - 在 `fe/src/data/` 添加JSON数据文件
   - 在 `fe/src/constants/characters.js` 添加人物配置
   - 添加人物图片到 `fe/public/images/`

2. **后端提示词**:
   - 编辑 `be/services/chat_service.go`
   - 在 `getCharacterSystemPrompt` 函数中添加新角色的系统提示词

3. **地图标记**:
   - 添加标记图标到 `fe/public/images/markers/`

### 修改对话风格

编辑 `be/services/chat_service.go` 中的系统提示词，调整:
- 人物性格描述
- 语言风格
- 知识范围
- 互动方式

## 性能优化

1. **前端**:
   - 图片压缩
   - 代码分割
   - 缓存策略

2. **后端**:
   - 连接池
   - 响应缓存
   - 限流策略

## 安全注意事项

1. **API密钥安全**:
   - 不要将API密钥提交到版本控制
   - 使用环境变量或密钥管理服务
   - 定期轮换密钥

2. **输入验证**:
   - 后端验证所有输入参数
   - 防止注入攻击
   - 限制请求频率

3. **数据保护**:
   - 不存储用户对话历史
   - 遵守数据隐私法规

## 技术支持

- 查看详细文档: `AGENTS.md`
- 后端API文档: `be/README.md`
- 问题反馈: 项目Issue页面

---

**提示**: 首次使用请务必配置DeepSeek API密钥，否则对话功能无法正常工作。