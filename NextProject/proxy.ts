import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.INTERNAL_API_BASE_URL || 'http://backend:5000/api';

const ADMIN_PATH_RE = /^\/admin(?:\/|$)/;
const ADMIN_LOGIN_PATH = '/admin/login';

async function isAdminAuthenticated(cookies: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-admin`, {
      method: 'GET',
      headers: { Cookie: cookies },
      cache: 'no-store',
    });

    if (!res.ok) return false;

    const body = await res.json();
    const role = body?.data?.user?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_PATH_RE.test(pathname) && pathname !== ADMIN_LOGIN_PATH) {
    const cookieHeader = request.headers.get('cookie') || '';
    const authenticated = await isAdminAuthenticated(cookieHeader);

    if (!authenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN_PATH;
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
