import 'server-only';
import { auth } from '@/lib/auth/server';
import { query } from '@/lib/db';
import { LoginCredentialsSchema } from '@/lib/schemas/auth';
import { AccessError } from './session';
export async function signIn(input: unknown) {
  const credentials = LoginCredentialsSchema.parse(input);
  const response = await auth.signIn.email(credentials);
  const user = response.data?.user;
  if (response.error || !user?.id) throw new AccessError(401, 'E-mail ou senha incorretos.');
  const profiles = await query<{ role: 'super_admin' | 'tenant_admin' }>(
    'SELECT role FROM public.profiles WHERE id=$1::uuid AND lower(email)=lower($2) LIMIT 1',
    [user.id, credentials.email]
  );
  const role = profiles[0]?.role;
  if (role !== 'super_admin' && role !== 'tenant_admin') {
    await auth.signOut();
    throw new AccessError(403, 'Conta sem permissão de acesso.');
  }
  return { authenticated: true, role, redirectTo: role === 'super_admin' ? '/super-admin' : '/dashboard' };
}
