FROM node:22-alpine

WORKDIR /app

# pin pnpm 9 to avoid pnpm 10 strict build script behavior
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY prisma ./prisma
COPY dist ./dist

RUN npx prisma@6 generate

EXPOSE 3000

CMD ["node", "dist/src/main"]
