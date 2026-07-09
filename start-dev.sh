#!/bin/bash
# ============================================
# JobPal 本地开发服务启动脚本
# ============================================
# 功能：
#   1. 自动启动 MySQL + Redis Docker 容器（如未运行）
#   2. 停止 Docker 生产容器（避免端口冲突）
#   3. 启动 NestJS 热重载开发服务
# ============================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================"
echo "  JobPal 本地开发服务启动"
echo "========================================"

# ---------- 1. 启动本地数据库容器 ----------
echo ""
echo "[1/3] 检查数据库容器..."

MYSQL_RUNNING=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -c "jobpal-mysql" || true)
REDIS_RUNNING=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -c "jobpal-redis" || true)

if [ "$MYSQL_RUNNING" = "0" ] || [ "$REDIS_RUNNING" = "0" ]; then
  echo "  MySQL 或 Redis 未运行，正在启动..."
  docker compose up -d mysql redis
  echo "  数据库容器已启动"
else
  echo "  MySQL ✅  Redis ✅  均已运行"
fi

# ---------- 2. 处理生产容器端口冲突 ----------
echo ""
echo "[2/3] 检查端口冲突..."

if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "jobpal-server"; then
  echo "  检测到 jobpal-server 容器正在运行，停止以释放 3000 端口..."
  docker stop jobpal-server
  echo "  jobpal-server 容器已停止"
else
  echo "  无 Docker 端口冲突"
fi

# ---------- 3. 启动开发服务 ----------
echo ""
echo "[3/3] 启动 NestJS 开发服务 (热重载)..."
echo "========================================"
echo ""
pnpm run start:dev
