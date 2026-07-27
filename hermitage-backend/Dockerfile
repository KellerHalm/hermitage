FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npx prisma generate

COPY src ./src/

RUN mkdir -p uploads/images

# Фиксируем NODE_ENV=production, чтобы Express и errorHandler скрывали
# стек-трейсы и подробности ошибок от клиентов. Без этого, если env забыли
# выставить в runtime, errorHandler отдаёт полный stack в ответах.
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
