# JobPal Server — 后端服务

## 产品概述

**产品名称：** 求职助手（JobPal）

**产品定位：** 求职者的求职一站式助手，帮助求职者管理简历、记录心仪岗位，并通过 AI 大模型对简历进行针对性优化，提供 AI 求职问答助手。

**本项目定位：** 后端 API 服务，为 jobpal-app（用户端）和 jobpal-manage（管理端）提供统一接口。

## 项目关系

JobPal 由三个独立项目组成，各自拥有独立的 Git 仓库，托管在 Gitee：

| 项目 | 定位 | 技术栈 |
|------|------|--------|
| `jobpal-server`（本项目） | 后端 API 服务 | NestJS 11 + TypeScript + Prisma 6 + MySQL + Redis |
| `jobpal-app` | 用户端（移动端） | uni-app (Vue 3 + Composition API + TypeScript) |
| `jobpal-manage` | 管理端（PC 端） | React 18 + TypeScript + Vite + Ant Design 5 |

jobpal-app 和 jobpal-manage 共用 jobpal-server 提供的 API 服务。

## 一期功能清单

### 用户端（7 个模块）
1. **认证模块（auth）**：用户名注册、JWT 登录、退出登录、注销账号
2. **简历模块（resume）**：在线编辑简历（Markdown 文本），支持多简历 CRUD
3. **心动岗位模块（job）**：记录心仪岗位，增删改查、批量删除、状态流转（8 种状态）、多条件筛选排序
4. **AI 简历优化模块（optimize）**：选简历+选岗位，AI 异步生成优化结果，RAG 增强（向量嵌入+余弦相似度）
5. **AI 问一问模块（chat）**：对话式 AI 求职助手，SSE 流式输出，语义检索 RAG，多轮对话
6. **首页统计模块（home）**：简历数/岗位数/面试数统计
7. **管理端模块（admin）**：用户列表查询、禁用/启用用户、删除用户

## 技术栈

| 层 | 技术 | 备注 |
|---|---|---|
| 框架 | NestJS 11 | `@nestjs/core`, `@nestjs/common` |
| 语言 | TypeScript 5 | |
| ORM | Prisma 6 | `@prisma/client` |
| 数据库 | MySQL 8.0 | 生产容器化部署 |
| 缓存 | Redis 7 | 容器化部署（预留限流等场景） |
| 认证 | Passport JWT | `@nestjs/jwt` + `passport-jwt` |
| 参数校验 | class-validator + class-transformer | NestJS 内置 ValidationPipe |
| AI 框架 | LangChain | `@langchain/core` + `@langchain/openai` |
| AI 平台 | 阿里云百炼 DashScope | OpenAI 兼容模式，qwen-plus / qwen-turbo |
| 向量嵌入 | DashScope text-embedding-v1 | RAG 语义检索 |
| 包管理 | pnpm 11 | 配置文件：`pnpm-workspace.yaml` |
| 部署 | Docker + Nginx + 阿里云 ECS | |

## 目录结构

```
jobpal-server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── pnpm-workspace.yaml           # pnpm 11 配置（allowBuilds）
├── .env.example
├── .env                          # 本地开发环境变量
├── .env.production               # 生产环境变量
├── .env.production.example       # 生产环境变量模板
├── .dockerignore
├── Dockerfile                    # 生产镜像（node:22-alpine, pnpm 9）
├── docker-compose.yml            # 本地开发数据库（MySQL + Redis）
├── docker-compose.prod.yml       # 生产编排（MySQL + Redis + NestJS）
├── deploy.sh                     # 一键部署脚本
├── setup-ssh.sh                  # SSH 密钥配置脚本
├── prisma/
│   ├── schema.prisma             # 数据库模型（6 张表）
│   └── seed.ts                   # 种子数据（创建默认管理员 admin/admin123）
└── src/
    ├── main.ts                   # 入口：CORS + /v1 全局前缀 + ValidationPipe + 拦截器/过滤器
    ├── app.module.ts             # 根模块（8 个模块 + 全局 JWT Guard）
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts        # 全局 JWT 鉴权（检查 isPublic 元数据）
    │   │   └── admin-auth.guard.ts      # 管理员权限守卫（检查 role === 'admin'）
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts  # @CurrentUser() → request.user
    │   │   └── public.decorator.ts        # @Public() → 跳过 JWT 认证
    │   ├── filters/
    │   │   └── http-exception.filter.ts   # 异常 → { code, message }
    │   └── interceptors/
    │       └── transform.interceptor.ts   # 成功响应 → { code:0, message:'success', data }
    ├── modules/
    │   ├── auth/                 # 认证模块
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts    # 4 个端点
    │   │   ├── auth.service.ts
    │   │   ├── dto/                  # RegisterDto, LoginDto
    │   │   └── strategies/
    │   │       └── jwt.strategy.ts   # JWT 策略：从 DB 查用户，附到 request.user
    │   ├── resume/               # 简历模块
    │   │   ├── resume.module.ts
    │   │   ├── resume.controller.ts  # 5 个端点
    │   │   ├── resume.service.ts
    │   │   └── dto/                  # CreateResumeDto, UpdateResumeDto, QueryResumeDto
    │   ├── job/                  # 心动岗位模块
    │   │   ├── job.module.ts
    │   │   ├── job.controller.ts     # 7 个端点
    │   │   ├── job.service.ts
    │   │   └── dto/                  # CreateJobDto, UpdateJobDto, QueryJobDto, UpdateJobStatusDto, BatchDeleteDto
    │   ├── optimize/             # AI 简历优化模块
    │   │   ├── optimize.module.ts
    │   │   ├── optimize.controller.ts # 4 个端点
    │   │   ├── optimize.service.ts    # LangChain + DashScope 异步生成 + RAG
    │   │   └── dto/                   # OptimizeDto, BatchDeleteDto
    │   ├── chat/                 # AI 问一问模块
    │   │   ├── chat.module.ts
    │   │   ├── chat.controller.ts    # 5 个端点
    │   │   ├── chat.service.ts       # SSE 流式 + LangChain + 语义检索 RAG
    │   │   └── dto/                   # SendMessageDto
    │   ├── home/                 # 首页统计模块
    │   │   ├── home.module.ts
    │   │   ├── home.controller.ts    # 1 个端点
    │   │   └── home.service.ts
    │   └── admin/                # 管理端模块
    │       ├── admin.module.ts
    │       ├── admin.controller.ts   # 3 个端点（全部需要 AdminAuthGuard）
    │       ├── admin.service.ts
    │       └── dto/                   # UpdateUserStatusDto
    ├── prisma/
    │   ├── prisma.module.ts      # @Global() Prisma 模块
    │   └── prisma.service.ts     # PrismaClient 单例（onModuleInit 连接，onModuleDestroy 断开）
    └── config/
        └── configuration.ts      # 环境变量集中管理（port, database, jwt, dashscope）
```

## API 设计规范

**Base URL:** `https://api.jobpal.com/v1`（`main.ts` 中通过 `app.setGlobalPrefix('v1')` 设置）

**统一成功响应：**
```json
{ "code": 0, "message": "success", "data": {} }
```

**统一错误响应：**
```json
{ "code": 500, "message": "具体错误信息" }
```

**错误码规则：** `0` 成功 / `40xxx` 认证错误 / `42xxx` 参数校验错误 / `50xxx` 服务端错误

### 全局认证机制

- `JwtAuthGuard` 通过 `APP_GUARD` 注册为全局守卫 → **所有端点默认需要 JWT**
- `@Public()` 装饰器标记不需要认证的端点 → JwtAuthGuard 检查 `isPublic` 元数据并跳过
- `@CurrentUser()` 参数装饰器提取 `request.user`（由 JwtStrategy 在验证 token 后从 DB 查询并附加）
- `AdminAuthGuard` 检查 `request.user.role === 'admin'`，通过 `@UseGuards(AdminAuthGuard)` 按路由使用

### 完整接口列表（29 个端点，7 个模块）

#### 认证（auth）— 4 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /v1/auth/register | Public | 注册（username 2-20 字符, password 6-50 字符） |
| POST | /v1/auth/login | Public | 登录，返回 `{ access_token, user }`（JWT 7 天有效，payload: sub, username, role） |
| POST | /v1/auth/logout | JWT | 退出登录（当前为 no-op，预留 Redis token 黑名单） |
| DELETE | /v1/auth/account | JWT | 注销账号，级联删除用户所有数据 |

> 管理员通过同一 /v1/auth/login 登录，无独立 admin 登录接口。无 token 刷新接口。

#### 简历（resume）— 5 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /v1/resumes | JWT | 创建简历（title + content Markdown + description 可选） |
| GET | /v1/resumes | JWT | 列表（keyword 搜索 title, sortBy=updatedAt/title, sortOrder=asc/desc） |
| GET | /v1/resumes/:id | JWT | 详情（所有权校验） |
| PUT | /v1/resumes/:id | JWT | 编辑（所有权校验） |
| DELETE | /v1/resumes/:id | JWT | 删除（所有权校验） |

#### 心动岗位（job）— 7 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /v1/jobs | JWT | 创建岗位（jobName, companyName, salary 必填） |
| GET | /v1/jobs | JWT | 列表（keyword 搜索 jobName+companyName, status/sourcePlatform 筛选, sortBy=updatedAt/salary/rating） |
| GET | /v1/jobs/:id | JWT | 详情 |
| PUT | /v1/jobs/:id | JWT | 全量编辑 |
| PATCH | /v1/jobs/:id/status | JWT | 快速更新投递状态 |
| DELETE | /v1/jobs/:id | JWT | 单个删除 |
| DELETE | /v1/jobs/batch | JWT | 批量删除（body: `{ ids: [...] }`） |

#### AI 简历优化（optimize）— 4 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /v1/optimize | JWT | 创建优化任务（立即返回 recordId，后台异步生成） |
| GET | /v1/optimize/history | JWT | 历史记录（keyword 搜索 resume.title + jobPosition.jobName） |
| GET | /v1/optimize/:id | JWT | 详情（所有权校验，含 status: completed/generating） |
| DELETE | /v1/optimize/batch | JWT | 批量删除（body: `{ ids: [...] }`） |

> **异步生成流程：** POST 立即返回 `{ recordId, status: 'generating' }` → 服务端通过 LangChain + DashScope 后台异步生成 → 完成后写入 optimizedText → 前端轮询 GET /:id 检查 status

#### AI 问一问（chat）— 5 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /v1/chat | JWT | 发送消息，SSE 流式响应（start → token → complete/error） |
| GET | /v1/chat/suggestions | JWT | AI 生成个性化推荐问题（3-5 条） |
| GET | /v1/chat/conversations | JWT | 对话列表（按 updatedAt 倒序） |
| GET | /v1/chat/conversations/:id | JWT | 对话详情（含消息列表，按时间正序） |
| DELETE | /v1/chat/conversations/:id | JWT | 删除对话（级联删除消息） |

> chat 模块使用 LangChain + DashScope，通过语义检索从用户简历和岗位数据中获取 RAG 上下文，结合近 10 轮对话历史提供个性化回答。SSE 响应：设置 `Content-Type: text/event-stream`，逐 token 推送。

#### 首页（home）— 1 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /v1/home/stats | JWT | 返回 `{ resumeCount, jobCount, interviewCount }`（并行查询） |

#### 管理端（admin）— 3 个端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /v1/admin/users | JWT+Admin | 用户列表（keyword 搜索 username，排除 admin） |
| PUT | /v1/admin/users/:id/status | JWT+Admin | 更新用户状态（active/disabled） |
| DELETE | /v1/admin/users/:id | JWT+Admin | 删除用户 |

> AdminAuthGuard 施加于整个 admin controller，JWT 由全局守卫提供。管理员登录走 /v1/auth/login。默认管理员：admin / admin123（通过 seed 创建）。

## 数据库设计

### 表结构

**users** — 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| username | String (unique) | 用户名 |
| passwordHash | String | bcrypt 哈希 |
| role | String | `user`（默认）/ `admin` |
| status | String | `active`（默认）/ `disabled` |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**resumes** — 简历表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| userId | String → User | 外键，级联删除 |
| title | String | 简历标题 |
| content | String (@db.Text) | Markdown 文本（核心字段） |
| description | String? (@db.Text) | 备注 |
| fileName/fileUrl/fileType/fileSize | String?/Int? | 文件上传预留字段，当前未使用 |
| createdAt/updatedAt | DateTime | |

**job_positions** — 心动岗位表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| userId | String → User | 外键，级联删除 |
| jobName | String | 岗位名称（必填） |
| companyName | String | 公司名称（必填） |
| salary | Float | 薪资 k（必填，1-100，1 位小数） |
| requirements | String? (@db.Text) | 岗位要求 |
| responsibilities | String? (@db.Text) | 岗位职责 |
| attractiveness | String? (@db.Text) | 岗位吸引力/亮点 |
| rating | Int | 心动等级 1-5（默认 3） |
| sourcePlatform | String | `招聘平台` / `朋友推荐` / `官网` |
| status | String | 投递状态（8 种，默认 `待投递`） |
| remark | String? (@db.Text) | 面试备注 |
| createdAt/updatedAt | DateTime | |

索引：`@@index([userId])`, `@@index([userId, status])`

投递状态枚举：`待投递` → `已投递` → `待面试` → `面试中` → `面试结果待反馈` → `面试通过` / `面试失败` → `已归档`

**conversations** — 对话表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| userId | String → User | 外键，级联删除 |
| title | String | 对话标题（取首条消息前 30 字） |
| createdAt/updatedAt | DateTime | |

索引：`@@index([userId])`

**chat_messages** — 聊天消息表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| conversationId | String → Conversation | 外键，级联删除 |
| role | String | `user` / `assistant` |
| content | String (@db.Text) | 消息内容 |
| createdAt | DateTime | |

索引：`@@index([conversationId])`

**resume_optimizations** — AI 优化记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| userId | String → User | 外键，级联删除 |
| resumeId | String → Resume | 外键，级联删除 |
| jobPositionId | String → JobPosition | 外键，级联删除 |
| originalText | String (@db.Text) | 优化前简历快照 |
| optimizedText | String? (@db.Text) | 优化结果（null 表示生成中） |
| embedding | String? (@db.Text) | 优化结果向量嵌入（JSON） |
| tokensUsed | Int? | Token 消耗 |
| createdAt | DateTime | |

索引：`@@index([userId])`

### 关键设计决策
- 主键全部使用 cuid() 防枚举
- 大文本字段使用 @db.Text
- 用户删除时级联删除所有关联数据
- 管理员与普通用户同表，通过 role 字段区分（无独立 admin_users 表）
- 无独立行为日志表（user_behavior_logs 已移除）
- JobPosition 和 Resume 与 User 的关联都设置 onDelete: Cascade
- 复合索引 userId+status 用于岗位状态筛选

## 环境变量

| 变量名 | 必须 | 默认值 | 说明 |
|------|------|------|------|
| DATABASE_URL | 是 | — | MySQL 连接字符串 |
| JWT_SECRET | 是 | — | JWT 签名密钥 |
| JWT_EXPIRES_IN | 否 | `7d` | JWT 过期时间 |
| DASHSCOPE_API_KEY | 是 | — | 百炼 DashScope API Key |
| DASHSCOPE_MODEL | 否 | `qwen-plus` | AI 模型选择 |
| PORT | 否 | `3000` | 服务监听端口 |

> 配置定义：`src/config/configuration.ts`。ConfigModule 注册为全局模块。

## 关键架构模式

### 认证流程
1. 用户 → POST /v1/auth/login → AuthService 验证密码 → 签发 JWT（payload: sub, username, role; 7 天有效）
2. 后续请求 → Header `Authorization: Bearer <token>` → JwtAuthGuard（全局）→ JwtStrategy.validate() → 从 DB 查用户 → 附到 request.user
3. @CurrentUser() → 提取 request.user 注入控制器参数
4. @Public() → 跳过全局 JWT 验证
5. AdminAuthGuard → 检查 request.user.role === 'admin'

### AI 集成模式
- 使用 LangChain 框架（`@langchain/openai` 的 ChatOpenAI，配置为 DashScope 兼容端点）
- 简历优化：异步后台生成（POST 立即返回，fire-and-forget 后台执行），RAG 上下文来自历史优化记录的 embedding 余弦相似度检索
- 问一问：SSE 流式响应，RAG 上下文来自用户简历和岗位的语义检索（text-embedding-v1 嵌入 + 余弦相似度），降级方案为关键词匹配
- 建议生成：qwen-turbo（temperature 0.8），非流式

### 响应格式
- 成功：TransformInterceptor 包裹 `{ code: 0, message: 'success', data }`
- 异常：HttpExceptionFilter 捕获所有异常 → `{ code: status, message: string }`

### 参数校验
- 全局 ValidationPipe（whitelist + forbidNonWhitelisted + transform）
- DTO 使用 class-validator 装饰器 + class-transformer 类型转换

## 部署

### 脚本
- `bash setup-ssh.sh` — 首次部署配置 SSH 密钥（一次性）
- `bash deploy.sh` — 一键部署（编译 → scp 上传 dist/ → docker compose up -d --build server）

### 容器化
- **Dockerfile**：node:22-alpine + pnpm 9，仅安装生产依赖，复制 dist + prisma，端口 3000
- **docker-compose.prod.yml**：MySQL 8.0 + Redis 7 + server（build from Dockerfile），MySQL 有健康检查，server 启动时执行 `prisma db push` + `prisma seed` + `node dist/src/main`

### 部署架构
```
Nginx (ECS, :80/:443)
  ├── jobpal.com        → 管理端静态文件
  ├── api.jobpal.com    → proxy_pass → NestJS (:3000)
  └── app.jobpal.com    → 用户端 H5 静态文件
         │
  ┌──────┼──────┐
  ▼      ▼      ▼
NestJS  MySQL  Redis
(Docker) (容器) (缓存)
  │
  └── 百炼 DashScope
```

## 开发规范

- 每个业务域一个独立 Module，controller + service + dto 在同一目录
- 全局 JWT 认证 → 新接口默认需要认证，公开接口加 `@Public()`
- @CurrentUser() 获取当前用户，所有数据操作按 userId 做所有权校验
- 统一响应格式由 TransformInterceptor 保证，无需手动包裹
- DTO 校验使用 class-validator 装饰器 + NestJS ValidationPipe
- 环境变量通过 configuration.ts 集中管理，不直接使用 process.env
- pnpm 11 配置在 pnpm-workspace.yaml（allowBuilds），不使用 package.json#pnpm
- PrismaService 通过 @Global() 导出，所有模块可直接注入
