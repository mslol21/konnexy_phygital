import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwnedTenant, listManagedTenants } from '@/lib/tenants';
import { createAdminClient } from '@/utils/supabase/admin';
import { AccessError } from '@/lib/auth/session';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { saveTenantSchema } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const id = z.uuid().parse((await context.params).id);
    const { user, role, tenant: current } = await requireOwnedTenant(id);
    const input = saveTenantSchema.parse(await readJson(req));
    const plan = role === 'super_admin' ? input.tenant.plan_tier || current.plan_tier || 'starter' : current.plan_tier || 'starter';
    const limits = PLAN_LIMITS[plan];
    const modules = input.modules.map(mod => ({ ...mod, is_active: mod.is_active && limits.allowedModules.includes(mod.module_type) }));
    if (modules.filter(m => m.is_active).length > limits.maxActiveModules) throw new AccessError(400, 'Quantidade de módulos excede o plano.');
    const tenant = { ...input.tenant, status: role === 'super_admin' ? input.tenant.status || current.status : current.status, plan_tier: plan, mrr_cents: role === 'super_admin' && plan !== current.plan_tier ? limits.monthlyPriceCents : current.mrr_cents };
    const { error } = await createAdminClient().rpc('save_managed_tenant', { actor_id: user.id, target_id: id, tenant_data: tenant, module_data: modules });
    if (error?.code === '23505') throw new AccessError(409, 'Este endereço já está em uso.');
    if (error) throw error;
    return NextResponse.json({ records: await listManagedTenants() });
  } catch (error) { return apiError(error); }
}
