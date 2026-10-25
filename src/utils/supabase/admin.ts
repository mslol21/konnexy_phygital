import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env, requireSupabaseConfig } from '@/lib/env';
export function createAdminClient() {
  requireSupabaseConfig();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Serviço temporariamente indisponível.');
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
