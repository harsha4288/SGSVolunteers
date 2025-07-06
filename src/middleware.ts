import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  console.log('Middleware executing for:', pathname);
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Redirect root to login
  if (pathname === '/') {
    console.log('Redirecting root to login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Skip auth check for public paths
  if (isPublicPath) {
    console.log('Skipping auth check for public path:', pathname);
    return NextResponse.next();
  }

  try {
    // Create a response to handle cookies
    let response = NextResponse.next({
      request: {
        headers: req.headers,
      },
    });

    // Create Supabase client for middleware
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if user is authenticated - use getUser() for security
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('Middleware session check:', {
      hasUser: !!user,
      userEmail: user?.email,
      error: error?.message,
      pathname,
      cookies: req.cookies.getAll().map(c => c.name).join(', ')
    });

    if (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // If no user, redirect to login
    if (!user) {
      console.log('No user found, redirecting to login');
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // For protected app routes, just check if user has a session
    // Profile linking will be handled client-side to avoid redirect loops
    if (pathname.startsWith('/app/')) {
      console.log('Middleware: Allowing access to protected route for authenticated user');
    }

    console.log('Middleware: User authenticated', {
      pathname,
      userId: user.id,
      email: user.email
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Only match app routes to avoid unnecessary middleware execution
     * This prevents loops on login/auth pages
     */
    '/app/:path*',
    '/',
  ],
};
