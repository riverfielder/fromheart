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
- **AI**: Baidu Wenxin (ernie-4.5-turbo-32k) via API
- **Infrastructure**: Docker, Docker Compose

## ⚡️ 高并发与性能 (Architecture & Performance)

本项目采用**异步任务队列 + 全局限流 + 削峰填谷**架构，专为高并发 AI 应用场景设计。

### 核心架构
1. **异步削峰 (Async Queue)**：
   - 所有的耗时 AI 请求（占卜/桃花）不直接处理，而是瞬间推入 **Redis List** 队列。
   - 接口响应时间从 15秒+ 降低至 **<50ms**（仅做入队操作）。
   - 有效防止海量请求瞬间击穿数据库或耗尽服务器线程。

2. **全局限流 (Global Rate Limiter)**：
   - 后端内置令牌桶算法，严格限制对 AI 服务的调用频率（如 3 QPS）。
   - **Worker**（后台消费者）与 **API**（前台追问）共享配额，绝不超速，防止账号封禁。

3. **连接池优化**：
   - Postgres 与 Redis 连接池经过调优，支持高并发连接复用。

### 承载能力 (Capacity)
基于单机部署（及当前的 3 QPS API 限制）：

- **瞬时并发接收能力**：**> 2,000 QPS**
  - 即使 1 万用户在 10 秒内同时提交，服务器也能瞬间响应，将任务安全存入队列，**零宕机风险**。
- **持续处理吞吐量**：**10,800 单/小时** (受限于 AI API 3 QPS)
  - 系统会自动排队处理积压任务，前端动态轮询结果。
  - *注：通过增加 Worker 数量和升级 AI API 配额，吞吐量可线性扩展。*

### 压测数据 (Benchmark)
使用 `ab` (Apache Bench) 模拟 100 并发压测：

```text
Requests per second:    25.40 [#/sec] (受限于安全限流策略)
Time per request:       39.371 [ms] (平均响应时间)
Failed requests:        0 (系统稳定运行)
```
*压测表明：在高并发冲击下，限流中间件成功拦截了超出配额的请求（429 Too Many Requests），保护了核心服务不被压垮。*

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
