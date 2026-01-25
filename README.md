# 一问 / From Heart (从心)

<div align="center">
  <img src="frontend/public/logo.svg" width="120" height="120" alt="From Heart Logo" />
</div>

极简清新的 AI 梅花易数占卜应用。心诚则灵，每日一问。
融合传统玄学与现代 AI 技术，为您提供富有禅意的指引。

## ✨ 特性 (Features)

- **AI 智能解卦**：基于文心一言 (ERNIE) 模型，通过深度 Prompt Engineering 打造“玄学大师”人设。
- **每日一诗**：每日自动生成与之共鸣的诗句，抚慰心灵。
- **玄妙交互**：动态八卦推演动画 (Framer Motion)，沉浸式体验。
- **直指人心**：不仅有详细卦辞，更有一语道破的“直接回应”与建议。
- **历史回溯**：记录您的每一次叩问与启示。
- **隐私保护**：基于设备指纹去重，保护用户隐私。

## 🛠 技术栈 (Tech Stack)

- **Backend**: Go (Gin), GORM, Postgres, Redis
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **AI**: Baidu Wenxin (Ernie-3.5-8k) via API
- **Infrastructure**: Docker, Docker Compose

## 🚀 快速开始 (Quick Start)

### 使用 Docker (推荐)

1. 克隆项目
   ```bash
   git clone https://github.com/riverfielder/fromheart.git
   cd fromheart
   ```

2. 配置环境变量
   复制 `.env.example` 到 `.env` 并填入您的百度文心一言 API Key 和 Secret。
   ```bash
   cp .env.example .env
   ```

3. 启动服务
   ```bash
   docker-compose up -d --build
   ```
   
   - 前端访问: `http://localhost:3000`
   - 后端 API: `http://localhost:8080`

## 📂 目录结构

```
.
├── backend/            # Go 后端服务
│   ├── cmd/            # 入口文件
│   ├── internal/       # 业务逻辑 (Adapters, Services, Handlers)
│   └── Dockerfile
├── frontend/           # Next.js 前端应用
│   ├── app/            # App Router 页面
│   ├── public/         # 静态资源 (Logo, SVG)
│   └── Dockerfile
└── docker-compose.yml  # 容器编排
```

## 📜 版权 (License)

Made with ❤️ by River. 
本项目仅供娱乐与学习交流。
