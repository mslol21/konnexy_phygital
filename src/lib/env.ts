import 'server-only';

// Resolve secrets only when the corresponding operation is used. Missing settings
// must never enable demo authentication or manufacture successful operations.
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
export function requireSupabaseConfig() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project')) {
    throw new Error('Serviço temporariamente indisponível. Configuração do banco pendente.');
  }
}
export function hasLiveGeminiKey() { return Boolean(env.GEMINI_API_KEY); }
