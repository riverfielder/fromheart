# 一问 / from heart

极简清新的每日一问应用（Web 版），后端使用 Go + Gin，前端使用 Next.js。

## 功能概览
- 每日只回答一个问题
- 卦象生成（梅花易数思路）
- 文心一言调用（占位适配，可替换）
- 输出二次优化（结构化模板）
- 历史记录

## 目录结构
- backend：Go/Gin 服务
- frontend：Next.js Web
- docker-compose.yml：本地依赖（Postgres/Redis）

## 运行（本地）
1) 复制环境变量模板并按需填写
   - .env.example → .env
2) 启动依赖：Postgres、Redis
3) 启动后端
4) 启动前端

## API
- POST /api/question
- GET /api/divination/:id
- GET /api/history

## 备注
文心一言接口为占位适配器，请替换为你的真实调用逻辑。