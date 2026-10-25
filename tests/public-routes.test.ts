import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({ getPublicTenant: vi.fn() }));
vi.mock('@/lib/tenants', () => mock);
import { GET as tenantGet } from '@/app/api/public/tenant/[slug]/route';
import { GET as redirectGet } from '@/app/t/[id]/route';
const id='aa6f3015-52cc-4890-9512-95324d723433';
beforeEach(() => vi.clearAllMocks());
it('returns 404 instead of inventing a page for an unknown slug', async () => {
  mock.getPublicTenant.mockResolvedValue(null);
  expect((await tenantGet(new NextRequest('https://tag.example/api/public/tenant/missing'),{params:Promise.resolve({slug:'missing'})})).status).toBe(404);
});
it('does not revive suspended tenants', async () => {
  mock.getPublicTenant.mockResolvedValue({unavailable:true});
  expect((await tenantGet(new NextRequest('https://tag.example/api/public/tenant/store'),{params:Promise.resolve({slug:'store'})})).status).toBe(410);
});
it('resolves the new slug from the stable tag ID with no permanent cache', async () => {
  mock.getPublicTenant.mockResolvedValue({unavailable:false,tenant:{slug:'renamed-store'},modules:[]});
  const response=await redirectGet(new NextRequest(`https://tag.example/t/${id}?src=nfc&redirect=https://evil.example`),{params:Promise.resolve({id})});
  expect(response.headers.get('location')).toBe('https://tag.example/r/renamed-store?src=nfc');
  expect(response.status).toBe(307); expect(response.headers.get('cache-control')).toBe('no-store');
  expect(mock.getPublicTenant).toHaveBeenCalledWith(id,true);
});
