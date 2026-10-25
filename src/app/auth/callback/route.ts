import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL('/reset-password', req.url));
    } catch {}
  }
  return NextResponse.redirect(new URL('/forgot-password?error=expired', req.url));
}
