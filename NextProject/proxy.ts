import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CSP заголовки задаются в nginx.conf (Content-Security-Policy).
// Proxy-функция оставлена как заглушка на случай расширения логики
// (редиректы, rewrite, авторизация и т.д.).
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
