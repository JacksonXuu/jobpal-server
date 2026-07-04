# JobPal Server — 后端服务

## 产品概述

**产品名称：** 求职助手（JobPal）

**产品定位：** 求职者的求职一站式助手，帮助求职者管理简历、记录心仪岗位，并通过 AI 大模型对简历进行针对性优化，提升面试机会。

**本项目定位：** 后端 API 服务，为 jobpal-app（用户端）和 jobpal-manage（管理端）提供统一接口。

## 项目结构

JobPal 由三个独立项目组成，各自拥有独立的 Git 仓库，托管在 Gitee：

| 项目 | 定位 | 技术栈 |
|------|------|--------|
| `jobpal-server`（本项目） | 后端 API 服务 | NestJS + TypeScript + Prisma + MySQL + Redis |
| `jobpal-app` | 用户端（移动端） | uni-app (Vue 3 + Composition API + TypeScript) |
| `jobpal-manage` | 管理端（PC 端） | React 18 + TypeScript + Vite + Ant Design 5 |

jobpal-app 和 jobpal-manage 共用 jobpal-server 提供的 API 服务。

## 一期产品功能

### 用户端
- **注册/登录模块：** 用户可注册账号、登录账号
- **简历夹模块：** 上传简历文件及描述，支持下载，支持多简历管理
- **心动岗位模块：** 粘贴来自 Boss 等平台的 JD 文本，支持增删改查及关键词过滤
- **简历优化模块 ⭐：** 单选简历 + 单选岗位，接入 AI 大模型，针对简历内容和心仪岗位要求做简历专项优化

### 管理端
- **登录模块：** 管理员账户登录
- **用户管理模块：** 管理用户账号（查询、禁用/启用、删除、手动注册）
- **数据分析模块：** 行为数据可视化（模块使用率、岗位求职热度、用户趋势）

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | NestJS |
| 语言 | TypeScript |
| ORM | Prisma |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 认证 | Passport JWT |
| 文件存储 | 阿里云 OSS |
| AI | 阿里云百炼 DashScope API（OpenAI 兼容，SSE 流式） |
| 部署 | Docker + Nginx + 阿里云 ECS |

## 开发工作流

**核心原则：按模块拆分，一个模块完成后提交推送再进行下一个模块。**

**Git 分支策略：**
- `main` 分支：稳定代码
- 每个模块从 main 创建 `feature/<模块名>` 分支
- 模块开发完成 → 本地自测 → 提交 → 推送 Gitee → 合并到 main

**模块开发顺序：**
1. 后端基础搭建（NestJS + Prisma + 认证 API）
2. 简历夹模块（CRUD + OSS 上传）
3. 心动岗位模块（CRUD + 搜索）
4. AI 简历优化模块（百炼集成 + SSE 流式）
5. 管理端模块（Admin API + 数据分析）
6. 跨端打磨 + 部署

## 目录结构

```
jobpal-server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker/
│   └── Dockerfile
├── docker-compose.yml          # 本地开发：MySQL + Redis
└── src/
    ├── main.ts                 # 入口
    ├── app.module.ts           # 根模块
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   └── admin.guard.ts
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts
    │   │   └── public.decorator.ts
    │   ├── filters/
    │   │   └── http-exception.filter.ts
    │   ├── interceptors/
    │   │   ├── transform.interceptor.ts     # 统一响应 { code, message, data }
    │   │   └── behavior-log.interceptor.ts  # 行为日志记录
    │   └── pipes/
    │       └── validation.pipe.ts
    ├── modules/
    │   ├── auth/               # 用户认证模块
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── dto/
    │   │   └── strategies/
    │   │       └── jwt.strategy.ts
    │   ├── user/               # 用户模块
    │   ├── resume/             # 简历模块
    │   ├── job/                # 心动岗位模块
    │   ├── optimize/           # AI 简历优化模块 ⭐
    │   ├── admin/              # 管理端模块
    │   ├── analytics/          # 数据分析模块
    │   └── oss/                # OSS 文件上传模块
    ├── prisma/
    │   ├── prisma.module.ts    # Prisma 全局模块
    │   └── prisma.service.ts   # PrismaClient 单例
    └── config/
        └── configuration.ts
```

## API 设计规范

**Base URL:** `https://api.jobpal.com/v1`

**统一响应格式：**
```json
{ "code": 0, "message": "success", "data": {} }
```

**错误码：** `0` 成功 / `40xxx` 认证错误 / `42xxx` 参数校验错误 / `50xxx` 服务端错误

### 接口列表

#### 用户认证
| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/auth/register | 用户注册 | 否 |
| POST | /v1/auth/login | 用户登录 | 否 |
| POST | /v1/auth/refresh | 刷新 token | 否 |
| POST | /v1/auth/logout | 退出登录 | 是 |
| GET | /v1/auth/me | 当前用户信息 | 是 |

#### 简历管理
| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/resumes | 上传简历（multipart） | 是 |
| GET | /v1/resumes | 简历列表（分页+搜索） | 是 |
| GET | /v1/resumes/:id | 简历详情 | 是 |
| PUT | /v1/resumes/:id | 编辑简历信息 | 是 |
| DELETE | /v1/resumes/:id | 删除简历 | 是 |
| GET | /v1/resumes/:id/download | 下载简历文件 | 是 |

#### 心动岗位
| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/jobs | 新增岗位 | 是 |
| GET | /v1/jobs | 岗位列表（分页+搜索+过滤） | 是 |
| GET | /v1/jobs/:id | 岗位详情 | 是 |
| PUT | /v1/jobs/:id | 编辑岗位 | 是 |
| DELETE | /v1/jobs/:id | 删除岗位 | 是 |

#### AI 简历优化 ⭐
| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | /v1/optimize | SSE 流式优化 | 是 |
| GET | /v1/optimize/history | 历史优化记录 | 是 |
| GET | /v1/optimize/:id | 某次优化详情 | 是 |

**SSE 事件类型：** `start` → `token`（逐块文本）→ `progress`（可选）→ `complete` → `error`

#### 管理端
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

## 数据库设计

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `users` | 用户表 | id(cuid), phone, passwordHash, nickname, status, createdAt |
| `resumes` | 简历表 | id(cuid), userId, title, fileName, fileUrl(OSS), fileType, fileSize, description |
| `job_positions` | 心动岗位表 | id(cuid), userId, companyName, positionName, platform, jdContent(Text), salaryRange, location, tags, status |
| `resume_optimizations` | AI优化记录 | id(cuid), userId, resumeId, jobPositionId, originalText, optimizedText, tokensUsed, createdAt |
| `admin_users` | 管理员表 | id(cuid), username, passwordHash, role, status |
| `user_behavior_logs` | 行为日志 | id(cuid), userId, module, action, targetId, metadata(JSON), createdAt |

**关键设计决策：** 主键用 cuid() 防枚举 / 大文本用 @db.Text / 用户级联删除、行为日志保留 / 复合索引 userId+module+createdAt

## AI 集成架构

### 百炼 DashScope API
- **接口地址：** `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **认证：** API Key（`DASHSCOPE_API_KEY` 环境变量）
- **推荐模型：** `qwen-turbo`（开发）、`qwen-plus`（生产）

### 简历优化 Prompt 策略
1. 诚实：绝不编造经历、技能、学历
2. 关键词匹配：分析 JD 关键词，自然突出对应经历
3. STAR 法则：Situation-Task-Action-Result 结构，量化成果
4. 简洁有力：去除冗余
5. 针对性提炼：最相关的放最前面
6. 输出末尾附「优化说明」

### SSE 流式数据流
```
Client → POST /v1/optimize → Server → 查DB → 构建Prompt → POST 百炼(stream:true)
                                                                      ↓
Client ← SSE: start/token/complete ← Server ← SSE streaming chunks ←─┘
Server → 保存结果到DB → 记录行为日志
```

## 部署架构

```
Nginx (ECS, :80/:443)
  ├── jobpal.com        → 管理端静态文件
  ├── api.jobpal.com    → proxy_pass → NestJS (本项目, :3000)
  └── app.jobpal.com    → 用户端 H5 静态文件
         │
  ┌──────┼──────┐
  ▼      ▼      ▼
NestJS  MySQL  Redis
(Docker) (RDS) (缓存/限流)
  │
  ├── 阿里云 OSS
  └── 百炼 DashScope
```

## 开发规范

- 每个业务域一个独立 module
- 全局 TransformInterceptor 统一响应 `{ code, message, data }`
- `@Public()` 装饰器标记不需认证的接口
- `@CurrentUser()` 装饰器获取当前用户
- BehaviorLogInterceptor 自动记录行为日志
- 请求校验统一用 Zod（ValidationPipe）
- 环境变量通过 config/configuration.ts 集中管理
