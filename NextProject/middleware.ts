import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Генерируем per-request nonce и выставляем Content-Security-Policy.
// 'unsafe-inline' для скриптов заменяется на nonce — основной XSS-вектор закрыт.
// Для стилей оставляем 'unsafe-inline', т.к. Tailwind/inline-стили Next.js
// не получают nonce автоматически, и их блокировка ломает вёрстку.
// img-src/connect-src разрешают origin бэкенда (API), откуда грузятся изображения
// и идут запросы к API.
function buildCsp(nonce: string, request: NextRequest): string {
  const isDev = process.env.NODE_ENV === 'development';

  // API origin вычисляется из публичной env-переменной (одинакова на клиенте и сервере).
  let apiOrigin = '';
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiUrl) apiOrigin = new URL(apiUrl).origin;
  } catch {
    // Некорректный URL — оставляем пустым.
  }

  // Если API на том же origin, что и сайт, не дублируем его в списке.
  const sameOrigin = apiOrigin && apiOrigin === new URL(request.nextUrl.origin).href.replace(/\/$/, '');

  const imgSources = sameOrigin
    ? "'self' data: blob:"
    : `'self' ${apiOrigin} data: blob:`;
  const connectSources = sameOrigin ? "'self'" : `'self' ${apiOrigin}`;

  // В dev React использует eval() для отладки (реконструкция стек-трейсов).
  // В production eval() не требуется, поэтому там его не добавляем.
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src ${imgSources}`,
    `connect-src ${connectSources}`,
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

export function middleware(request: NextRequest) {
  // btoa доступен и в Edge runtime, и в Node.js. Buffer в Edge runtime
  // отсутствует, поэтому раньше nonce падал здесь и layout получал пустую строку
  // (hydration mismatch server="" vs client="...").
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, request);

  // CSP нужно выставить в ОБА набора заголовков:
  //  - в request-заголовки: чтобы Next.js во время SSR извлёк nonce из CSP
  //    и автоматически применил его к своим фреймворк-скриптам;
  //  - в response-заголовки: чтобы браузер применил политику к странице.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    // Применяем ко всем маршрутам, кроме статики и API Next.js.
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
