#!/bin/bash
# ============================================
#  SSH 密钥配置脚本（仅需运行一次）
#  运行: bash setup-ssh.sh
# ============================================

SERVER="root@47.107.30.30"
SSH_KEY="$HOME/.ssh/id_ed25519_jobpal"

echo "=== 正在生成 SSH 密钥 ==="
if [ -f "$SSH_KEY" ]; then
  echo "密钥已存在，跳过生成"
else
  ssh-keygen -t ed25519 -C "jobpal-deploy" -f "$SSH_KEY" -N ""
  echo "密钥生成成功"
fi

echo ""
echo "=== 将公钥上传到服务器 ==="
echo "请输入服务器 root 密码："
echo ""
cat "$SSH_KEY.pub"
echo ""
echo "────────────────────────────────────────────"
echo "正在上传公钥到服务器..."
ssh-copy-id -i "$SSH_KEY" "$SERVER"

echo ""
echo "=== 测试免密登录 ==="
ssh -i "$SSH_KEY" "$SERVER" "echo 'SSH 免密登录配置成功!'"

echo ""
echo "🎉 配置完成！以后直接运行 bash deploy.sh 即可一键部署。"
