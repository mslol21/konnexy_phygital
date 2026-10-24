import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Cliente Supabase SSR para Server Components, Server Actions e Route Handlers.
 * Utiliza o manipulador de cookies nativo do `next/headers` com getAll/setAll
 * e proteção HttpOnly / SameSite=Lax.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, any>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              });
            });
          } catch {
            // Ignorado quando invocado dentro de um Server Component puro (somente leitura);
            // A renovação de sessão já ocorre automaticamente no middleware.ts.
          }
        }
      }
    }
  );
}
