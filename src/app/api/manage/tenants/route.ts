import { NextRequest, NextResponse } from 'next/server';
import { requireSession, AccessError } from '@/lib/auth/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { listManagedTenants } from '@/lib/tenants';
import { tenantSchema } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
export async function GET() {
  try { return NextResponse.json({ records: await listManagedTenants() }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return apiError(error); }
}
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const { user } = await requireSession(true);
    const tenant = tenantSchema.parse(await readJson(req));
    const admin = createAdminClient();
    const plan = tenant.plan_tier || 'starter';
    let ownerId: string | null = null;
    if (tenant.owner_email) {
      const { data, error } = await admin.from('profiles').select('id').eq('email', tenant.owner_email.toLowerCase()).maybeSingle();
      if (error) throw error;
      if (!data) throw new AccessError(400, 'Cadastre primeiro a conta do lojista no Supabase Auth ou deixe o e-mail vazio para gestão pelo administrador.');
      ownerId = data.id;
    }
    const { data, error } = await admin.rpc('save_managed_tenant', { actor_id: user.id, target_id: null, tenant_data: { ...tenant, plan_tier: plan, owner_id: ownerId, mrr_cents: PLAN_LIMITS[plan].monthlyPriceCents }, module_data: null });
    if (error?.code === '23505') throw new AccessError(409, 'Este endereço já está em uso. Escolha outro.');
    if (error) throw error;
    return NextResponse.json({ id: data, records: await listManagedTenants() }, { status: 201 });
  } catch (error) { return apiError(error); }
}
