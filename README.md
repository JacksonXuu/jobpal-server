# JobPal Server — 求职助手后端服务

## 项目简介

**求职助手（JobPal）** 是求职者的一站式求职工具，帮助用户管理简历、记录心仪岗位，并通过 AI 大模型对简历进行针对性优化，提升面试机会。

本项目是 JobPal 的后端 API 服务，为 [jobpal-app](https://gitee.com/JacksonXuu/jobpal-app)（用户端）和 [jobpal-manage](https://gitee.com/JacksonXuu/jobpal-manage)（管理端）提供统一接口。

## 一期功能

### 用户端

- **注册 / 登录** — 手机号注册、JWT 登录认证
- **简历管理** — 上传简历文件（阿里云 OSS），支持多简历管理、下载
- **心动岗位** — 粘贴 JD 文本，增删改查，关键词搜索过滤
- **AI 简历优化 ⭐** — 面向特定岗位，AI 针对性优化简历，SSE 流式输出

### 管理端

- **管理员登录** — 管理员账户认证
- **用户管理** — 查询、禁用/启用、删除、手动注册用户
- **数据分析** — 模块使用率、热门岗位、用户趋势等数据可视化

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | NestJS |
| 语言 | TypeScript |
| ORM | Prisma |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 认证 | Passport JWT |
| 文件存储 | 阿里云 OSS |
| AI | 阿里云百炼 DashScope API（OpenAI 兼容，SSE 流式） |
| 部署 | Docker + Nginx + 阿里云 ECS |

## 项目结构

```
jobpal-server/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── seed.ts                # 种子数据
├── docker/
│   └── Dockerfile
├── docker-compose.yml         # 本地开发环境（MySQL + Redis）
└── src/
    ├── main.ts                # 应用入口
    ├── app.module.ts          # 根模块
    ├── common/
    │   ├── guards/            # JWT & Admin 鉴权守卫
    │   ├── decorators/        # @Public() / @CurrentUser() 装饰器
    │   ├── filters/           # HTTP 异常过滤器
    │   ├── interceptors/      # 统一响应 & 行为日志拦截器
    │   └── pipes/             # Zod 校验管道
    ├── modules/
    │   ├── auth/              # 用户认证
    │   ├── user/              # 用户管理
    │   ├── resume/            # 简历 CRUD + OSS 上传
    │   ├── job/               # 心动岗位 CRUD
    │   ├── optimize/          # AI 简历优化
    │   ├── admin/             # 管理端 API
    │   ├── analytics/         # 数据分析
    │   └── oss/               # OSS 文件上传
    ├── prisma/
    │   ├── prisma.module.ts   # Prisma 全局模块
    │   └── prisma.service.ts  # PrismaClient 单例
    └── config/
        └── configuration.ts   # 环境变量集中管理
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm
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

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret

# 阿里云百炼 AI
DASHSCOPE_API_KEY=your-dashscope-api-key

# 阿里云 OSS
OSS_ACCESS_KEY_ID=your-oss-access-key
OSS_ACCESS_KEY_SECRET=your-oss-secret
OSS_BUCKET=jobpal
OSS_REGION=oss-cn-hangzhou
```

### 启动数据库

```bash
# 启动 MySQL 和 Redis
docker compose up -d

# 执行数据库迁移
npx prisma migrate dev

# （可选）写入种子数据
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

## 运行测试

```bash
# 单元测试
pnpm run test

# E2E 测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## API 概览

**Base URL:** `https://api.jobpal.com/v1`

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
| POST | /v1/auth/refresh | 刷新 Token | 否 |
| POST | /v1/auth/logout | 退出登录 | 是 |
| GET | /v1/auth/me | 当前用户信息 | 是 |

### 简历管理

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/resumes | 上传简历（multipart） | 是 |
| GET | /v1/resumes | 简历列表（分页+搜索） | 是 |
| GET | /v1/resumes/:id | 简历详情 | 是 |
| PUT | /v1/resumes/:id | 编辑简历信息 | 是 |
| DELETE | /v1/resumes/:id | 删除简历 | 是 |
| GET | /v1/resumes/:id/download | 下载简历文件 | 是 |

### 心动岗位

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/jobs | 新增岗位 | 是 |
| GET | /v1/jobs | 岗位列表（分页+搜索+过滤） | 是 |
| GET | /v1/jobs/:id | 岗位详情 | 是 |
| PUT | /v1/jobs/:id | 编辑岗位 | 是 |
| DELETE | /v1/jobs/:id | 删除岗位 | 是 |

### AI 简历优化 ⭐

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/optimize | SSE 流式优化 | 是 |
| GET | /v1/optimize/history | 历史优化记录 | 是 |
| GET | /v1/optimize/:id | 某次优化详情 | 是 |

**SSE 事件流：** `start` → `token`（逐块文本）→ `progress`（可选）→ `complete` → `error`

### 管理端

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/admin/login | 管理员登录 | 否 |
| POST | /v1/admin/logout | 退出登录 | 管理员 |
| GET | /v1/admin/me | 当前管理员信息 | 管理员 |
| GET | /v1/admin/users | 用户列表（分页+搜索） | 管理员 |
| PUT | /v1/admin/users/:id/status | 禁用/启用用户 | 管理员 |
| DELETE | /v1/admin/users/:id | 删除用户 | 管理员 |
| POST | /v1/admin/users | 手动注册用户 | 管理员 |
| GET | /v1/admin/analytics/overview | 数据总览 | 管理员 |
| GET | /v1/admin/analytics/module-usage | 模块使用率 | 管理员 |
| GET | /v1/admin/analytics/top-jobs | 热门岗位 | 管理员 |
| GET | /v1/admin/analytics/user-trend | 用户趋势 | 管理员 |

## AI 集成

### 百炼 DashScope

- **接口：** `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **认证：** API Key（环境变量 `DASHSCOPE_API_KEY`）
- **模型：** `qwen-turbo`（开发环境）/ `qwen-plus`（生产环境）

### 优化策略

1. **诚实** — 绝不编造经历、技能、学历
2. **关键词匹配** — 分析 JD 关键词，自然突出对应经历
3. **STAR 法则** — Situation → Task → Action → Result 结构，量化成果
4. **简洁有力** — 去除冗余表述
5. **针对性提炼** — 最相关的内容放最前面
6. **优化说明** — 输出末尾附修改要点说明

### SSE 流式数据流

```
Client → POST /v1/optimize → Server → 查 DB → 构建 Prompt → POST 百炼 (stream: true)
                                                                        ↓
Client ← SSE: start / token / complete ← Server ← SSE streaming chunks ←┘
Server → 保存结果到 DB → 记录行为日志
```

## 部署架构

```
Nginx (ECS, :80 / :443)
  ├── jobpal.com        → 管理端静态文件
  ├── api.jobpal.com    → proxy_pass → NestJS（本项目，:3000）
  └── app.jobpal.com    → 用户端 H5 静态文件
         │
  ┌──────┼──────┐
  ▼      ▼      ▼
NestJS  MySQL  Redis
(Docker) (RDS) (缓存 / 限流)
  │
  ├── 阿里云 OSS
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
- `@Public()` 装饰器标记不需认证的接口
- `@CurrentUser()` 装饰器获取当前登录用户
- `BehaviorLogInterceptor` 自动记录用户行为日志
- 请求校验统一使用 Zod（`ValidationPipe`）
- 环境变量通过 `src/config/configuration.ts` 集中管理
