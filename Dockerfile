FROM node:22-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 用 npm 安装（没有 pnpm 的构建限制问题）
RUN npm install --legacy-peer-deps

# 复制源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main"]
