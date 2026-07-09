---
name: jp-run-dev
description: 启动 JobPal 本地开发环境 — 确保 MySQL/Redis 容器运行、处理端口冲突、启动 NestJS 热重载服务
---

# 启动本地开发服务 `/jp-run-dev`

## 触发条件

- 用户输入 `/jp-run-dev`
- 用户说"启动开发服务"、"启动本地服务"、"运行开发环境"、"start dev"

## 执行流程

### Step 1: 检查并启动数据库容器

```bash
docker ps --format "{{.Names}}" | grep -q "jobpal-mysql"
docker ps --format "{{.Names}}" | grep -q "jobpal-redis"
```

如果任一容器未运行，执行：

```bash
docker compose up -d mysql redis
```

### Step 2: 处理 Docker 生产容器端口冲突

检查 `jobpal-server` 容器是否在运行，如果在则停止以释放 3000 端口：

```bash
docker ps --format "{{.Names}}" | grep -q "jobpal-server" && docker stop jobpal-server
```

### Step 3: 启动 NestJS 开发服务

```bash
pnpm run start:dev
```

编译成功后验证接口：

```bash
curl -s --connect-timeout 5 http://localhost:3000/v1/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

收到 `{"code":401,"message":"用户名或密码错误"}` 说明服务正常。

## 快捷脚本

也可以直接运行根目录下的 `bash start-dev.sh`。
