// Общий помощник пагинации с защитой от DoS: жёстко ограничивает максимально
// допустимый `limit`, чтобы запрос вида ?limit=1000000 не выгружал миллион
// записей и не вызывал OOM/перегрузку БД.
//
// Применяется в getAllProducts / getAllOrders / getAllUsers.

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Разбирает параметры пагинации из строки запроса.
// Возвращает корректные pageNumber, take (сколько строк выбрать) и skip.
export const parsePagination = (query, { defaultLimit = DEFAULT_LIMIT } = {}) => {
  // pageNumber: минимум 1. Отрицательные/нулевые ранее давали отрицательный
  // skip → ошибка 500 от Prisma/Postgres. Теперь надёжно приводится к 1.
  let pageNumber = Number.parseInt(query?.page, 10);
  if (!Number.isFinite(pageNumber) || pageNumber < 1) pageNumber = 1;

  // take: ограничиваем сверху MAX_LIMIT, чтобы клиент не мог запросить
  // произвольно большой объём данных одним запросом.
  let take = Number.parseInt(query?.limit, 10);
  if (!Number.isFinite(take) || take < 1) take = defaultLimit;
  take = Math.min(take, MAX_LIMIT);

  const skip = (pageNumber - 1) * take;

  return { pageNumber, take, skip };
};
