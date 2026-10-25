import 'server-only';
import { createClient } from '@/utils/supabase/server';
import { LoginCredentialsSchema } from '@/lib/schemas/auth';
import { AccessError } from './session';
export async function signIn(input: unknown) {
  const credentials = LoginCredentialsSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error || !data.user) throw new AccessError(401, 'E-mail ou senha incorretos.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  if (profileError || !profile || !['super_admin', 'tenant_admin'].includes(profile.role)) {
    await supabase.auth.signOut();
    throw new AccessError(403, 'Conta sem permissão de acesso. Fale com o suporte.');
  }
  return { authenticated: true, role: profile.role, redirectTo: profile.role === 'super_admin' ? '/super-admin' : '/dashboard' };
}
