#!/bin/bash
# ============================================
#  JobPal Server 一键部署脚本
#  使用方式: bash deploy.sh
#  前置条件: 先运行 bash setup-ssh.sh（一次）
# ============================================
set -e

SSH_HOST="jobpal"
SERVER_DIR="~/jobpal-server"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()  { echo -e "${GREEN}✔${NC} $1"; }

log "=========================================="
log "  JobPal Server 部署开始"
log "=========================================="

# ── Step 1: 构建 ───────────────────────────
log "Step 1/3: 编译 TypeScript..."
pnpm run build
ok "编译完成"

# ── Step 2: 上传 ───────────────────────────
log "Step 2/3: 上传文件到服务器..."
scp -r dist/                     "$SSH_HOST:$SERVER_DIR/"
scp    package.json pnpm-lock.yaml "$SSH_HOST:$SERVER_DIR/"
scp    Dockerfile .dockerignore     "$SSH_HOST:$SERVER_DIR/"
scp    docker-compose.prod.yml      "$SSH_HOST:$SERVER_DIR/"
scp -r prisma/                   "$SSH_HOST:$SERVER_DIR/"
ok "上传完成"

# ── Step 3: 重启服务 ───────────────────────
log "Step 3/3: 服务器重建容器并重启..."
ssh "$SSH_HOST" \
  "cd $SERVER_DIR && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --force-recreate server"
ok "容器重建完成"

# ── 状态确认 ───────────────────────────────
log "=========================================="
log "  部署完成，容器状态："
log "=========================================="
ssh "$SSH_HOST" "cd $SERVER_DIR && docker compose -f docker-compose.prod.yml ps"

echo ""
ok "🎉 部署成功！"
echo ""
echo "  查看实时日志:  ssh $SSH_HOST"
echo "                 cd $SERVER_DIR"
echo "                 docker compose -f docker-compose.prod.yml logs -f server"
