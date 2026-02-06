FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite-dev curl

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/data/app.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
