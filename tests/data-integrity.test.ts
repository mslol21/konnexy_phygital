import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { toPublicTenantDTO } from '@/lib/dto/public-tenant.dto';
import { saveTenantSchema, sanitizePublicModules } from '@/lib/schemas/tenant';
import { physicalLinks } from '@/lib/physical-links';
import { assertSameOrigin, readJson } from '@/lib/api';
import { saveTenant, type TenantFullRecord } from '@/lib/managed-client';
const id = 'aa6f3015-52cc-4890-9512-95324d723433';
afterEach(() => vi.unstubAllGlobals());
describe('public data and physical links', () => {
  it('does not serialize owner identity or billing information', () => {
    const dto = toPublicTenantDTO({ id, slug:'store', name:'Store', owner_email:'private@example.com', owner_id:id, mrr_cents:12700, plan_tier:'pro' });
    expect(dto).not.toHaveProperty('owner_email'); expect(dto).not.toHaveProperty('owner_id');
    expect(dto).not.toHaveProperty('mrr_cents'); expect(dto).not.toHaveProperty('plan_tier');
  });
  it('strips unknown module data and rejects executable URLs', () => {
    const modules = sanitizePublicModules([
      { id, tenant_id:id, module_type:'custom_link', is_active:true, order_index:1, config_data:{url:'https://example.com',label:'Site',secret:'private'} },
      { id, tenant_id:id, module_type:'site_institucional', is_active:true, order_index:2, config_data:{url:'javascript:alert(1)',label:'Invalid'} },
    ]);
    expect(modules).toHaveLength(1); expect(modules[0].config_data).not.toHaveProperty('secret');
  });
  it('rejects duplicate modules in a save', () => {
    const mod = { module_type:'google_reviews', is_active:true, order_index:0, config_data:{} };
    expect(saveTenantSchema.safeParse({tenant:{slug:'store',name:'Store',nicho:'Loja',primary_color:'#123456'},modules:[mod,mod]}).success).toBe(false);
  });
  it('uses a permanent ID and never guesses a domain', () => {
    expect(physicalLinks('https://tag.example.com/',id)?.nfc).toBe(`https://tag.example.com/t/${id}?src=nfc`);
    for (const url of ['', 'http://example.com','https://user:pass@example.com','https://example.com/path','https://example.com/?query=1']) expect(physicalLinks(url,id)).toBeNull();
  });
});
describe('write boundaries and failures', () => {
  it('rejects cross-origin and missing-origin writes', () => {
    for (const headers of [new Headers({origin:'https://evil.example'}),new Headers()]) expect(() => assertSameOrigin(new NextRequest('https://app.example/api/manage/tenants',{method:'POST',headers}))).toThrow();
    expect(() => assertSameOrigin(new NextRequest('https://app.example/api/manage/tenants',{method:'POST',headers:{origin:'https://app.example'}}))).not.toThrow();
  });
  it('rejects oversized bodies even without content-length', async () => {
    await expect(readJson(new NextRequest('https://app.example/api',{method:'POST',body:'x'.repeat(100001)}))).rejects.toMatchObject({ status:413 });
  });
  it('does not report success when persistence fails', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Banco indisponível'}),{status:503})));
    await expect(saveTenant({tenant:{id,slug:'store',name:'Store',nicho:'Loja',logo_url:null,primary_color:'#123456',google_place_id:null,whatsapp_feedback:null,created_at:'2026-10-24T00:00:00Z'},modules:[]} as TenantFullRecord)).rejects.toThrow('Banco indisponível');
  });
});
