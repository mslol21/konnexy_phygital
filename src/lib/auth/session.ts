import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { query } from '@/lib/db';
import type { UserRole } from '@/types/phygital';

export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireSession(adminOnly = false) {
  const result = await auth.getSession();
  const user = result.data?.user;
  if (!user?.id || !user.email) throw new AccessError(401, 'Entre na sua conta para continuar.');
  const profiles = await query<{ role: UserRole }>(
    'SELECT role FROM public.profiles WHERE id = $1::uuid AND lower(email) = lower($2) LIMIT 1',
    [user.id, user.email]
  );
  const role = profiles[0]?.role;
  if (role !== 'super_admin' && role !== 'tenant_admin')
    throw new AccessError(403, 'Conta sem permissão de acesso.');
  if (adminOnly && role !== 'super_admin')
    throw new AccessError(403, 'Acesso exclusivo do administrador.');
  return { user, role };
}

export async function requirePageSession(adminOnly = false) {
  try { return await requireSession(adminOnly); }
  catch (error) {
    if (error instanceof AccessError)
      redirect(error.status === 401 ? '/login' : '/dashboard?denied=1');
    throw error;
  }
}
