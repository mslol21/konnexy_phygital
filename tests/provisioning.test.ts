import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ createUser: vi.fn(), rpc: vi.fn(), requireSession: vi.fn(), listManagedTenants: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ AccessError: class AccessError extends Error { constructor(public status: number, message: string) { super(message); } }, requireSession: mocks.requireSession }));
vi.mock('@/lib/tenants', () => ({ listManagedTenants: mocks.listManagedTenants }));
vi.mock('@/utils/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }), auth: { admin: { createUser: mocks.createUser } }, rpc: mocks.rpc }) }));
import { POST } from '@/app/api/manage/tenants/route';
const body = { slug: 'loja-teste', name: 'Loja Teste', nicho: 'Comércio', primary_color: '#112233', owner_email: 'loja@example.com' };
function request() { return new NextRequest('https://example.com/api/manage/tenants', { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); mocks.requireSession.mockResolvedValue({ user: { id: 'admin' } }); });
it('does not create an unowned store when account creation fails', async () => {
  mocks.createUser.mockResolvedValue({ data: { user: null }, error: new Error('auth unavailable') });
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('links the new account and reports that first access is needed', async () => {
  mocks.createUser.mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: null });
  mocks.rpc.mockResolvedValue({ data: 'tenant-id', error: null });
  mocks.listManagedTenants.mockResolvedValue({});
  const response = await POST(request());
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ id: 'tenant-id', accountCreated: true });
  expect(mocks.rpc.mock.calls[0][1].tenant_data.owner_id).toBe('owner-id');
});
