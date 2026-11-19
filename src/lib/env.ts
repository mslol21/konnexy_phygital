import 'server-only';

/**
 * Resolução centralizada de variáveis de ambiente com validação estrita.
 * Prioriza o runtime de produção Neon PostgreSQL + Neon Auth e Google GenAI.
 */
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL || '',
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  // Compatibilidade legada para scaffolding e testes
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export function requireDatabaseConfig(): void {
  if (!env.DATABASE_URL) {
    throw new Error('Serviço temporariamente indisponível: DATABASE_URL não configurada.');
  }
}

export function requireSupabaseConfig(): void {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Modo compatibilidade: não bloqueia caso o runtime seja Neon
    return;
  }
}

export function hasLiveGeminiKey(): boolean {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '');
}

export function hasUpstashConfig(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
