# 历史人物时空地图交互应用

一个基于React构建的交互式历史人物生平时间线地图应用，通过可视化方式展现李白、李清照、苏轼等历史人物的生平轨迹与关键事件。

## 功能特点

- **多人物选择**：支持李白、李清照、苏轼三位历史人物选择
- **时空可视化**：结合地图展示人物生平地点与时间线
- **交互式探索**：点击地图标记查看详细事件内容
- **响应式设计**：适配桌面和移动设备
- **沉浸式体验**：精美的UI设计与流畅的交互动画

## 技术栈

- **前端框架**：React 19
- **构建工具**：Create React App
- **地图组件**：高德地图 JS API
- **样式**：CSS Modules + 自定义CSS
- **部署**：Nginx + Docker

## 项目结构

```
history/
├── fe/                    # 前端React应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── data/        # 人物数据(JSON)
│   │   ├── styles/      # 样式文件
│   │   └── constants/   # 常量定义
│   ├── public/          # 静态资源
│   ├── package.json     # 依赖配置
│   └── nginx.conf       # Nginx服务器配置
├── be/                  # 后端服务(预留)
├── Dockerfile          # Docker容器配置
└── README.md          # 项目文档
```

## 快速开始

### 本地开发环境

1. **环境要求**
   - Node.js 18+
   - npm 或 yarn

2. **安装依赖**
   ```bash
   cd fe
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm start
   ```
   应用将在 http://localhost:3000 启动

4. **构建生产版本**
   ```bash
   npm run build
   ```

### Docker部署（推荐）

#### 构建Docker镜像
```bash
docker build -t history-app .
```

#### 运行容器
```bash
docker run -d -p 8080:80 --name history-container history-app
```

访问 http://localhost:8080 查看应用

#### 使用Docker Compose（可选）
创建 `docker-compose.yml`：
```yaml
version: '3.8'
services:
  history-app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

启动服务：
```bash
docker-compose up -d
```

## Docker配置说明

### Dockerfile设计
采用多阶段构建模式：
1. **构建阶段**：使用Node.js Alpine镜像安装依赖并构建React应用
2. **运行阶段**：使用Nginx Alpine镜像提供静态文件服务

### Nginx配置优化
- **SPA路由支持**：所有路由重定向到index.html，支持React Router
- **Gzip压缩**：减小传输体积，提升加载速度
- **静态资源缓存**：设置长期缓存，提高二次访问速度
- **安全设置**：禁止访问隐藏文件

## 数据说明

应用数据存储在 `fe/src/data/` 目录下：
- `li_bai.json`：李白生平时间线数据
- `li_qingzhao.json`：李清照生平时间线数据  
- `su_shi.json`：苏轼生平时间线数据

数据格式包含：
- 时间点（年份）
- 地理位置（经纬度）
- 事件描述
- 人物状态
- 颜色标记

## 部署指南

### 传统部署
1. 构建生产版本：`npm run build`
2. 将`build/`目录内容复制到Web服务器（如Nginx、Apache）
3. 配置Web服务器支持SPA路由

### 云平台部署
- **Vercel**：直接连接Git仓库自动部署
- **Netlify**：拖拽build文件夹上传
- **阿里云/腾讯云**：使用容器服务部署Docker镜像

### GitHub Pages部署
项目已配置GitHub Actions自动部署到GitHub Pages

## 开发指南

### 添加新历史人物
1. 在`src/data/`目录创建对应的JSON数据文件
2. 在`src/constants/characters.js`中添加人物配置
3. 在`public/images/`目录添加人物头像图片
4. 在`SelectScreen.js`中更新人物选择列表

### 自定义样式
- 通用样式：`src/styles/common.css`
- 组件样式：各组件对应的CSS文件
- 响应式断点：768px（平板）、480px（手机）

### 地图配置
应用使用高德地图API，如需更换地图服务商：
1. 修改`GameScreen.js`中的地图初始化代码
2. 更新对应的地图标记样式

## 常见问题

### Q: 地图无法加载？
A: 检查高德地图API密钥配置，确保网络可访问地图服务

### Q: 本地开发时跨域问题？
A: 使用Create React App代理配置或配置CORS

### Q: 构建后路由404？
A: 确保Web服务器正确配置SPA路由重定向（参考fe/nginx.conf配置）

### Q: Docker容器启动失败？
A: 检查端口占用情况，确保80端口可用或修改映射端口

## 性能优化

- **代码分割**：React.lazy()动态加载组件
- **图片优化**：使用WebP格式，适当压缩
- **缓存策略**：静态资源设置长期缓存
- **压缩传输**：启用Gzip/Brotli压缩

## 贡献指南

1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送到分支：`git push origin feature/新功能`
5. 提交Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 致谢

- 数据来源：历史文献与学术研究
- 地图服务：高德地图API
- UI设计：自定义设计

---

**项目状态**：稳定运行  
**最后更新**：2024年  
**维护者**：项目团队