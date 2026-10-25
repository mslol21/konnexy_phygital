import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), single: vi.fn(), from: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ auth: { signInWithPassword: mock.signIn, signOut: mock.signOut, getUser: mock.getUser }, from: mock.from }) }));
import { signIn } from '@/lib/auth/sign-in';
import { requireSession } from '@/lib/auth/session';
beforeEach(() => {
  vi.clearAllMocks();
  mock.from.mockReturnValue({ select: () => ({ eq: () => ({ single: mock.single }) }) });
  mock.single.mockResolvedValue({ data: { role: 'tenant_admin' }, error: null });
  mock.signIn.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
  mock.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
});
describe('authentication and trusted roles', () => {
  it('rejects a wrong password without issuing an authenticated result', async () => {
    mock.signIn.mockResolvedValue({ data: { user: null }, error: new Error('Invalid credentials') });
    await expect(signIn({ email: 'owner@example.com', password: 'incorrect' })).rejects.toMatchObject({ status: 401 });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('ignores a forged administrator role in the request', async () => {
    const result = await signIn({ email: 'OWNER@example.com', password: 'existing-password', role: 'super_admin' });
    expect(mock.signIn).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'existing-password' });
    expect(result).toMatchObject({ role: 'tenant_admin', redirectTo: '/dashboard' });
  });
  it('signs out a user whose profile cannot be verified', async () => {
    mock.single.mockResolvedValue({ data: null, error: new Error('database unavailable') });
    await expect(signIn({ email: 'owner@example.com', password: 'x' })).rejects.toMatchObject({ status: 403 });
    expect(mock.signOut).toHaveBeenCalledOnce();
  });
  it('blocks an anonymous session', async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireSession()).rejects.toMatchObject({ status: 401 });
  });
  it('blocks tenant administrators from administrative operations', async () => {
    await expect(requireSession(true)).rejects.toMatchObject({ status: 403 });
  });
  it('accepts an administrator role read from the database', async () => {
    mock.single.mockResolvedValue({ data: { role: 'super_admin' }, error: null });
    await expect(requireSession(true)).resolves.toMatchObject({ role: 'super_admin' });
  });
});
