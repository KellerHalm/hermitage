import app from './app.js';
import { config } from './config/index.js';
import prisma from './config/prisma.js';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});

const server = app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});

// Корректное завершение при получении SIGTERM/SIGINT (docker stop, Ctrl+C).
// Даёт серверу время дослужить входящие запросы и закрыть пул соединений БД,
// вместо жёсткого kill по истечении grace period, который рвёт соединения
// и приводит к дропу запросов при редеплоях.
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received: shutting down gracefully...`);

  // Принимаем новые соединения, но останавливаем уже существующие (keep-alive).
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected.');
    } catch (err) {
      console.log('Error disconnecting Prisma:', err instanceof Error ? err.message : err);
    }
    process.exit(0);
  });

  // Подстраховка: если закрытие зависнет (длинные keep-alive соединения),
  // принудительно выходим через 10 секунд — совпадает с docker stop grace period.
  setTimeout(() => {
    console.log('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err instanceof Error ? `${err.name}: ${err.message}` : err);
  server.close(() => {
    process.exit(1);
  });
});