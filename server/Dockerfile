FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY .env.example ./

RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/data/app.db

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
