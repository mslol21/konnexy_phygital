import { beforeEach, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn() }));
vi.mock('@/utils/supabase/admin', () => ({ createAdminClient: mocks.admin }));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.session }));
import { getPublicTenant } from '@/lib/tenants';
import { getDemoTenant } from '@/lib/demo-tenants';
import { tenantSchema } from '@/lib/schemas/tenant';
import { GET } from '@/app/api/public/tenant/[slug]/route';
import { middleware } from '@/middleware';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockImplementation(() => { throw new Error('Supabase unavailable'); });
  mocks.session.mockImplementation(() => { throw new Error('Auth unavailable'); });
});
it.each(['barbearia-premium','burger-lab-artesanal','clinica-sorriso-prime','petshop-amigo-fiel'])('serves the explicit %s demo without database configuration', async slug => {
  const record = await getPublicTenant(slug);
  expect(record).toMatchObject({ unavailable:false, demo:true, tenant:{slug,google_place_id:null,whatsapp_feedback:null} });
  expect(mocks.admin).not.toHaveBeenCalled();
  const demo = getDemoTenant(slug)!;
  expect(existsSync(`public${demo.tenant.logo_url}`)).toBe(true);
  expect(existsSync(`public${demo.tenant.cover_url}`)).toBe(true);
});
it('does not disguise a real customer database failure as a demonstration', async () => {
  await expect(getPublicTenant('real-customer')).rejects.toThrow('Supabase unavailable');
  expect(getDemoTenant('unknown')).toBeNull();
});
it('returns an explicit demo from the public API without calling Supabase', async () => {
  const response = await GET(new NextRequest('https://tag.example/api/public/tenant/barbearia-premium'), { params:Promise.resolve({slug:'barbearia-premium'}) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({demo:true,tenant:{name:'Barbearia Dom Corleone'}});
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('keeps public pages accessible even with stale auth cookies', async () => {
  const response = await middleware(new NextRequest('https://tag.example/r/barbearia-premium?src=nfc',{headers:{cookie:'sb-broken-auth-token=invalid'}}));
  expect(response.status).toBe(200);
  expect(mocks.session).not.toHaveBeenCalled();
});
it('reserves demo addresses to avoid shadowing real customers', () => {
  expect(tenantSchema.safeParse({slug:'barbearia-premium',name:'Real store',nicho:'Loja',primary_color:'#123456'}).success).toBe(false);
});
