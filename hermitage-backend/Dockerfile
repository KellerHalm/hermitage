FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npx prisma generate

COPY src ./src/

RUN mkdir -p uploads/images

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
