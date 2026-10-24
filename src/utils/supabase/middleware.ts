import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Utilitário SSR para renovação e validação segura de tokens JWT no Middleware do Next.js.
 * Garante que os cookies de sessão sejam sincronizados entre Request e Response com HttpOnly ativo.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se o ambiente estiver com chaves reais do Supabase configuradas, valida o token JWT via getUser()
  if (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('sandbox-project.supabase.co')
  ) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, any>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            })
          );
        }
      }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();

    return { response: supabaseResponse, user };
  }

  return { response: supabaseResponse, user: null };
}
