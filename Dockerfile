# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

ARG VITE_API_BASE=http://103.7.41.145:3000/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build


FROM node:22-slim AS runner

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
    npm install -g wrangler

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/wrangler.jsonc ./

EXPOSE 4000

CMD ["wrangler", "dev", "--local", "dist/server/index.js", "--port", "4000"]
