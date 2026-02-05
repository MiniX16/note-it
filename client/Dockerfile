FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tailwind.config.js postcss.config.js vite.config.js ./
COPY .env.example ./

RUN npm install

COPY index.html ./index.html
COPY public ./public
COPY src ./src

ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine AS runner

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
