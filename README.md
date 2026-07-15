# JobPal Server — 求职助手后端服务

## 项目简介

**求职助手（JobPal）** 是求职者的一站式求职工具，帮助用户管理简历、记录心仪岗位，并通过 AI 大模型对简历进行针对性优化，提供 AI 求职问答助手，提升面试机会。

本项目是 JobPal 的后端 API 服务，为 [jobpal-app](https://gitee.com/JacksonXuu/jobpal-app)（用户端）和 [jobpal-manage](https://gitee.com/JacksonXuu/jobpal-manage)（管理端）提供统一接口。

## 一期功能

### 用户端

- **注册 / 登录** — 用户名注册、JWT 登录认证、注销账号
- **简历管理** — 在线编辑简历（Markdown 格式），支持多简历管理
- **心动岗位** — 记录心仪岗位，支持增删改查、批量删除、状态流转、关键词过滤
- **AI 简历优化** — 面向特定岗位，AI 针对性优化简历（LangChain + RAG 增强）
- **AI 问一问** — AI 求职问答助手，支持对话式交互、语义检索用户数据（SSE 流式输出）
- **首页统计** — 简历数、岗位数、面试数等数据概览

### 管理端

- **管理员登录** — 与用户共用同一登录接口，通过 role 字段区分
- **用户管理** — 查询用户列表、禁用/启用用户、删除用户

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | NestJS 11 |
| 语言 | TypeScript |
| ORM | Prisma 6 |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 认证 | Passport JWT |
| AI | 阿里云百炼 DashScope API（OpenAI 兼容）+ LangChain |
| 向量嵌入 | DashScope text-embedding-v1 |
| 部署 | Docker + Nginx + 阿里云 ECS |
| 包管理 | pnpm 11 |

## 项目结构

```
jobpal-server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── pnpm-workspace.yaml       # pnpm 配置
├── .env.example
├── Dockerfile
├── docker-compose.yml         # 本地开发环境（MySQL + Redis）
├── docker-compose.prod.yml    # 生产环境（MySQL + Redis + NestJS）
├── deploy.sh                  # 一键部署脚本
├── setup-ssh.sh               # SSH 密钥配置脚本
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── seed.ts                # 种子数据（默认 admin 账户）
└── src/
    ├── main.ts                # 应用入口
    ├── app.module.ts          # 根模块
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts       # JWT 全局鉴权守卫
    │   │   └── admin-auth.guard.ts     # 管理员权限守卫
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts  # @CurrentUser() 注入当前用户
    │   │   └── public.decorator.ts        # @Public() 标记公开接口
    │   ├── filters/
    │   │   └── http-exception.filter.ts   # 异常过滤器 → { code, message }
    │   └── interceptors/
    │       └── transform.interceptor.ts   # 统一响应包裹 { code, message, data }
    ├── modules/
    │   ├── auth/              # 用户认证（注册/登录/注销）
    │   ├── resume/            # 简历管理（CRUD）
    │   ├── job/               # 心动岗位（CRUD + 批量删除 + 状态流转）
    │   ├── optimize/          # AI 简历优化（异步后台生成 + RAG）
    │   ├── chat/              # AI 问一问（对话 + SSE 流式 + 语义检索）
    │   ├── home/              # 首页统计
    │   └── admin/             # 管理端（用户管理）
    ├── prisma/
    │   ├── prisma.module.ts   # Prisma 全局模块
    │   └── prisma.service.ts  # PrismaClient 单例
    └── config/
        └── configuration.ts   # 环境变量集中管理
```

## 快速开始

### 环境要求

- Node.js >= 22
- pnpm 11
- MySQL 8.0
- Redis 7
- Docker & Docker Compose

### 安装依赖

```bash
pnpm install
```

### 环境变量

复制 `.env.example` 为 `.env`，按实际情况配置：

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/jobpal"

# JWT
JWT_SECRET=your-jwt-secret
# JWT_EXPIRES_IN=7d

# 阿里云百炼 AI
DASHSCOPE_API_KEY=your-dashscope-api-key
# DASHSCOPE_MODEL=qwen-plus
```

### 启动数据库

```bash
# 启动 MySQL 和 Redis
docker compose up -d

# 执行数据库迁移
npx prisma migrate dev

# （可选）写入种子数据（创建默认管理员 admin / admin123）
npx prisma db seed
```

### 启动服务

```bash
# 开发模式（热重载）
pnpm run start:dev

# 生产构建
pnpm run build
pnpm run start:prod
```

服务默认运行在 `http://localhost:3000`。

## 测试

```bash
# 单元测试
pnpm run test

# E2E 测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## API 概览

**Base URL:** `https://jobpal.jacksonxu.cn/api`

**统一响应格式：**

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**错误码：** `0` 成功 · `40xxx` 认证错误 · `42xxx` 参数校验错误 · `50xxx` 服务端错误

### 用户认证

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/auth/register | 用户注册 | 否 |
| POST | /v1/auth/login | 用户登录 | 否 |
| POST | /v1/auth/logout | 退出登录 | 是 |
| DELETE | /v1/auth/account | 注销账号（级联删除所有数据） | 是 |

> **说明：** 管理员与普通用户共用同一登录接口，管理员登录后返回 `role: "admin"` 的 JWT。没有独立的 admin/login 或 token 刷新接口。

### 简历管理

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/resumes | 创建简历 | 是 |
| GET | /v1/resumes | 简历列表（关键词搜索 + 排序） | 是 |
| GET | /v1/resumes/:id | 简历详情 | 是 |
| PUT | /v1/resumes/:id | 编辑简历 | 是 |
| DELETE | /v1/resumes/:id | 删除简历 | 是 |

> **注意：** 简历内容以 Markdown 文本形式存储（`content` 字段），暂未启用文件上传功能（`fileName`、`fileUrl` 等字段为预留字段）。

### 心动岗位

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/jobs | 新增岗位 | 是 |
| GET | /v1/jobs | 岗位列表（多条件筛选 + 排序） | 是 |
| GET | /v1/jobs/:id | 岗位详情 | 是 |
| PUT | /v1/jobs/:id | 编辑岗位 | 是 |
| PATCH | /v1/jobs/:id/status | 快速更新投递状态 | 是 |
| DELETE | /v1/jobs/:id | 删除岗位 | 是 |
| DELETE | /v1/jobs/batch | 批量删除岗位 | 是 |

**岗位字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `jobName` | string | 岗位名称（必填） |
| `companyName` | string | 公司名称（必填） |
| `salary` | number | 薪资（k），1-100，保留 1 位小数（必填） |
| `requirements` | string | 岗位要求（可选） |
| `responsibilities` | string | 岗位职责（可选） |
| `attractiveness` | string | 岗位吸引力/亮点（可选） |
| `rating` | number | 心动等级 1-5（默认 3） |
| `sourcePlatform` | enum | 来源：`招聘平台` / `朋友推荐` / `官网` |
| `status` | enum | 投递状态（见下方） |
| `remark` | string | 面试备注（可选） |

**投递状态流转：** `待投递` → `已投递` → `待面试` → `面试中` → `面试结果待反馈` → `面试通过` / `面试失败` → `已归档`

### AI 简历优化 ⭐

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/optimize | 创建优化任务（立即返回，后台异步生成） | 是 |
| GET | /v1/optimize/history | 历史优化记录（支持关键词搜索） | 是 |
| GET | /v1/optimize/:id | 某次优化详情 | 是 |
| DELETE | /v1/optimize/batch | 批量删除优化记录 | 是 |

**POST /v1/optimize 请求体：**
```json
{
  "resumeId": "clx...",
  "jobPositionId": "clx..."
}
```

**响应（立即返回）：**
```json
{
  "code": 0,
  "data": {
    "recordId": "clx...",
    "status": "generating"
  }
}
```

> **说明：** 优化任务创建后立即返回，服务端通过 LangChain + DashScope 在后台异步生成优化结果，完成后写入 `optimizedText` 字段。前端轮询 `/v1/optimize/:id` 检查 `status` 是否为 `completed`。如果 `optimizedText` 为空，状态为 `generating`。

### AI 问一问 ⭐

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/chat | 发送消息（SSE 流式响应） | 是 |
| GET | /v1/chat/suggestions | 获取 AI 个性化推荐问题 | 是 |
| GET | /v1/chat/conversations | 对话列表 | 是 |
| GET | /v1/chat/conversations/:id | 对话详情（含消息列表） | 是 |
| DELETE | /v1/chat/conversations/:id | 删除对话（级联删除消息） | 是 |

**POST /v1/chat 请求体：**
```json
{
  "message": "帮我分析一下这个岗位的要求...",
  "conversationId": "clx...（可选，不传则创建新对话）"
}
```

**SSE 事件流：** `start` → `token`（逐块文本）→ `complete` / `error`

> **说明：** AI 问一问基于 LangChain + DashScope，使用语义检索（text-embedding-v1）从用户简历和岗位数据中检索 RAG 上下文，结合对话历史提供个性化求职建议。

### 首页统计

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | /v1/home/stats | 获取当前用户数据统计 | 是 |

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "resumeCount": 3,
    "jobCount": 12,
    "interviewCount": 4
  }
}
```

### 管理端

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | /v1/admin/users | 用户列表（关键词搜索） | JWT + Admin |
| PUT | /v1/admin/users/:id/status | 禁用/启用用户 | JWT + Admin |
| DELETE | /v1/admin/users/:id | 删除用户 | JWT + Admin |

> **说明：** 管理员认证通过全局 JWT Guard + AdminAuthGuard（检查 `role === 'admin'`）。管理员使用普通用户登录接口获取 JWT。默认管理员账户通过 `prisma db seed` 创建（admin / admin123）。

## AI 集成

### 百炼 DashScope API

- **接口地址：** `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **认证：** API Key（环境变量 `DASHSCOPE_API_KEY`）
- **模型：** `qwen-plus`（简历优化）/ `qwen-turbo`（问一问建议生成）
- **嵌入模型：** `text-embedding-v1`（RAG 语义检索）

### AI 框架

- **LangChain：** `@langchain/core` + `@langchain/openai`，统一管理 Prompt、Chat Model 调用
- **RAG 增强：** 简历优化和问一问均使用向量嵌入 + 余弦相似度检索，从用户历史数据中获取上下文增强 AI 输出质量

### 简历优化策略

1. **诚实** — 绝不编造经历、技能、学历
2. **关键词匹配** — 分析 JD 关键词，自然突出对应经历
3. **STAR 法则** — Situation → Task → Action → Result 结构，量化成果
4. **简洁有力** — 去除冗余表述
5. **针对性提炼** — 最相关的内容放最前面
6. **优化说明** — 输出末尾附修改要点说明

### 数据流

```
Client → POST /v1/optimize → Server → 创建记录 → 立即返回 { recordId, status: 'generating' }
                                            ↓ (后台异步)
                                    LangChain + DashScope 生成优化结果
                                            ↓
                                    写入 optimizedText 到 DB
                                            ↓
Client → GET /v1/optimize/:id → 轮询检查 status === 'completed'

问一问（SSE 流式）：
Client → POST /v1/chat → Server → 查 DB → 语义检索 RAG → LangChain + DashScope (stream: true)
                                                                           ↓
Client ← SSE: start / token / complete ← Server ← SSE streaming chunks ←─┘
Server → 保存消息到 DB
```

## 数据库设计

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `users` | 用户表 | id(cuid), username(unique), passwordHash, role(admin/user), status(active/disabled), createdAt |
| `resumes` | 简历表 | id(cuid), userId, title, content(@db.Text Markdown), description, fileName/fileUrl/fileType/fileSize(预留) |
| `job_positions` | 心动岗位表 | id(cuid), userId, jobName, companyName, salary(Float), requirements, responsibilities, attractiveness, rating(1-5), sourcePlatform, status(8 种状态), remark |
| `conversations` | 对话表 | id(cuid), userId, title, createdAt |
| `chat_messages` | 聊天消息表 | id(cuid), conversationId, role(user/assistant), content(@db.Text) |
| `resume_optimizations` | AI 优化记录 | id(cuid), userId, resumeId, jobPositionId, originalText(@db.Text), optimizedText(@db.Text), embedding(@db.Text), tokensUsed |

**关键设计决策：** 主键用 cuid() 防枚举 · 大文本用 @db.Text · 用户级联删除 · 管理员与普通用户同表通过 role 区分 · 无独立的 admin_users 和行为日志表

## 部署

### 初次部署

服务器上需要 **Docker 运行环境**，共 8 个必要文件（源文件 `src/` 不需要上传）：

```bash
# 1. 本地编译
pnpm run build

# 2. 上传必要文件到服务器（注意：不上传 src/ node_modules/ .git/）
ssh root@47.107.30.30 "mkdir -p ~/jobpal-server"
scp -r dist/ package.json pnpm-lock.yaml prisma/ \
        Dockerfile .dockerignore \
        docker-compose.prod.yml \
        root@47.107.30.30:~/jobpal-server/

# 3. 上传环境变量文件（含真实密钥，不进 git）
scp .env.production root@47.107.30.30:~/jobpal-server/

# 4. 配置 SSH 免密登录（仅一次）
bash setup-ssh.sh

# 5. 启动所有容器（MySQL + Redis + NestJS）
ssh jobpal "cd ~/jobpal-server && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
```

> 首次启动会自动：拉取镜像 → 构建 NestJS → `prisma db push` 建表 → `prisma db seed` 创建 admin → 启动服务。

### 后续更新代码

每次改完业务代码，一条命令搞定：

```bash
bash deploy.sh
```

脚本自动完成：本地编译 → 上传 `dist/` + `package.json` + `pnpm-lock.yaml` + `prisma/` → 服务器重建 server 容器（MySQL/Redis 不受影响）。

> **原理：** 本地 `pnpm run build` 把 TypeScript 源码编译为 `dist/`（JavaScript），服务器只跑 `dist/`，不需要 `src/`。这就是为什么源码变化只需要上传编译产物。

### 部署架构

```
Nginx (ECS, :80/:443)
  └── jobpal.jacksonxu.cn  → JobPal 项目
        ├── /api/*   → proxy_pass → NestJS（本项目，:3000）
        ├── /app/*   → 用户端 H5 静态文件
        └── /manage/* → 管理端静态文件
  └── me.jacksonxu.cn     → 个人门户
         │
  ┌──────┼──────┐
  ▼      ▼      ▼
NestJS  MySQL  Redis
(Docker) (容器) (缓存)
  │
  └── 百炼 DashScope
```

## 相关项目

| 项目 | 定位 | 技术栈 |
|------|------|--------|
| [jobpal-app](https://gitee.com/JacksonXuu/jobpal-app) | 用户端（移动端） | uni-app (Vue 3 + TypeScript) |
| [jobpal-manage](https://gitee.com/JacksonXuu/jobpal-manage) | 管理端（PC 端） | React 18 + TypeScript + Ant Design 5 |

## 开发规范

- 每个业务域一个独立 Module
- 全局 `TransformInterceptor` 统一包裹 `{ code, message, data }` 响应
- `@Public()` 装饰器标记不需认证的接口（免 JWT）
- `@CurrentUser()` 装饰器获取当前登录用户
- `AdminAuthGuard` + `@UseGuards()` 按路由施加管理员权限
- 全局 `HttpExceptionFilter` 统一错误响应格式
- 请求校验使用 NestJS 内置 ValidationPipe（class-validator / class-transformer）
- 环境变量通过 `src/config/configuration.ts` 集中管理
- pnpm 11 配置在 `pnpm-workspace.yaml`

---

## 相关文档

更详细的项目上下文（供 AI 辅助开发使用）见 [CLAUDE.md](./CLAUDE.md)。
