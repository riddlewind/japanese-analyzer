# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
# AGPL-3.0 §13：把实际构建版本写入前端，用户可在 /legal 页面看到并据此定位对应源码。
ARG SOURCE_VERSION=""
ARG SOURCE_URL=""
ENV NEXT_PUBLIC_SOURCE_VERSION=${SOURCE_VERSION}
ENV NEXT_PUBLIC_SOURCE_URL=${SOURCE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# AGPL-3.0 §13：把构建时的源码地址与版本带到运行阶段。runner 是独立阶段，
# 不重新声明就拿不到 builder 的 ARG；保留后容器可用 `-e SOURCE_URL=...` 覆盖，
# 无需重建镜像即可把源码入口指向实际部署的仓库。
ARG SOURCE_VERSION=""
ARG SOURCE_URL=""
ENV NEXT_PUBLIC_SOURCE_VERSION=${SOURCE_VERSION}
ENV NEXT_PUBLIC_SOURCE_URL=${SOURCE_URL}

# 镜像元数据：声明许可与源码位置，便于镜像仓库和用户直接识别。
LABEL org.opencontainers.image.title="japanese-analyzer" \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.opencontainers.image.source="https://github.com/riddlewind/japanese-analyzer" \
      org.opencontainers.image.description="AI-assisted Japanese sentence analyzer (AGPL-3.0-only)"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
# AGPL-3.0 §4/§5/§6：许可、版权、第三方与源码要约随目标代码一并分发。
COPY --from=builder /app/LICENSE /app/NOTICE /app/LICENSING.md /app/THIRD-PARTY-NOTICES.md /app/SOURCE ./
COPY --from=builder /app/LICENSES ./LICENSES
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]
