import { NextRequest, NextResponse } from 'next/server';
import { requireSession, AccessError } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { listManagedTenants } from '@/lib/tenants';
import { tenantSchema } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';

export async function GET() {
  try { return NextResponse.json({ records: await listManagedTenants() }, { headers: {'Cache-Control':'private, no-store'} }); }
  catch (error) { return apiError(error); }
}
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const { user } = await requireSession(true);
    const tenant = tenantSchema.parse(await readJson(req));
    const plan = tenant.plan_tier || 'starter';
    let ownerId: string | null = null;
    if (tenant.owner_email) {
      const existing = await query<{id:string}>(
        'SELECT p.id FROM public.profiles p JOIN neon_auth."user" u ON u.id = p.id::text WHERE lower(p.email)=lower($1) LIMIT 1',
        [tenant.owner_email.trim()]
      );
      ownerId = existing[0]?.id || null;
    }
    const payload = { ...tenant, owner_id: ownerId, plan_tier: plan, mrr_cents: PLAN_LIMITS[plan].monthlyPriceCents };
    const result = await query<{ id: string }>(
      'SELECT public.save_managed_tenant($1::uuid,NULL,$2::jsonb,NULL) AS id',
      [user.id,JSON.stringify(payload)]
    );
    return NextResponse.json({id:result[0].id,records:await listManagedTenants()},{status:201});
  } catch (error) {
    if (String(error).includes('23505') || String(error).includes('duplicate key'))
      return apiError(new AccessError(409,'Este endereço já está em uso.'));
    return apiError(error);
  }
}
