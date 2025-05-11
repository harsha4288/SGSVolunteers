import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // If user is not logged in and trying to access /app/*, redirect to /login
  if (!session && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If user is logged in and trying to access /login, redirect to /app/dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/app/dashboard', req.url));
  }
  
  // If user is accessing root, redirect to /app/dashboard (if logged in) or /login (if not)
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/app/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }


  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (Supabase auth callback)
     * Feel free to add more paths here that should not be Sprotected.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
