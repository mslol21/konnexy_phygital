import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });
  const pathname = req.nextUrl.pathname;
  // Public pages have no session requirement. A stale auth cookie or unavailable
  // Supabase project must not prevent an independent example from rendering.
  if (pathname === '/' || /^\/(r|t|api\/public)(\/|$)/.test(pathname)) return response;
  const protectedPage = /^\/(dashboard|super-admin|admin)(\/|$)/.test(pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('sandbox-project')) {
    if (protectedPage) return NextResponse.redirect(new URL('/login?error=unavailable', req.url));
    return response;
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        cookies.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, req.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  };
  if (protectedPage && !user) return redirectTo('/login');
  if (protectedPage && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['super_admin', 'tenant_admin'].includes(profile.role)) return redirectTo('/login?error=access');
    if (/^\/(admin|super-admin)(\/|$)/.test(pathname) && profile.role !== 'super_admin') return redirectTo('/dashboard?denied=1');
  }
  if (protectedPage || pathname.startsWith('/api/manage')) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|logos/|covers/).*)'] };
