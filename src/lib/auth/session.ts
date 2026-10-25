import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/types/phygital';
export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireSession(adminOnly = false) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AccessError(401, 'Entre na sua conta para continuar.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || !profile || !['super_admin', 'tenant_admin'].includes(profile.role)) throw new AccessError(403, 'Acesso não autorizado.');
  const role = profile.role as UserRole;
  if (adminOnly && role !== 'super_admin') throw new AccessError(403, 'Acesso exclusivo do administrador.');
  return { user, role, supabase };
}
export async function requirePageSession(adminOnly = false) {
  try { return await requireSession(adminOnly); }
  catch (error) {
    if (error instanceof AccessError) redirect(error.status === 401 ? '/login' : '/dashboard?denied=1');
    throw error;
  }
}
