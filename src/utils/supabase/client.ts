'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase SSR para Client Components.
 * Configurado para operar exclusivamente via cookies gerenciados pelo servidor (Zero localStorage para tokens de sessão).
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sandbox-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_anon_key_dev';

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}
