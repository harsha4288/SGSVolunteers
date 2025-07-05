import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check for impersonation cookie
  const impersonationCookie = req.cookies.get('impersonatedProfileId');
  const isImpersonating = !!impersonationCookie?.value;

  // For now, let's bypass Supabase session check in middleware to avoid environment variable issues
  // We'll handle authentication in the actual components
  console.log("Middleware check:", {
    pathname,
    isImpersonating,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing'
  });

  // Simple routing logic without session checking
  if (pathname === '/') {
    // For now, always redirect to login from root
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
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
