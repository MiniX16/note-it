FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install

COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/data/app.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:4000/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
