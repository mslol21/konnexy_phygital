import { NextRequest, NextResponse } from 'next/server';
import { requireSession, AccessError } from '@/lib/auth/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { listManagedTenants } from '@/lib/tenants';
import { tenantSchema } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';

export async function GET() {
  try {
    return NextResponse.json(
      { records: await listManagedTenants() },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return apiError(error);
  }
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
      const normalizedEmail = tenant.owner_email.toLowerCase();
      const { data: existingProfile, error: profileError } = await admin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (existingProfile?.id) {
        ownerId = existingProfile.id;
      } else {
        // Provisiona automaticamente a conta do lojista no Supabase Auth se ainda não existir
        const { data: createdAuth } = await admin.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: { full_name: tenant.name }
        });
        if (createdAuth?.user?.id) {
          ownerId = createdAuth.user.id;
        }
      }
    }

    const { data, error } = await admin.rpc('save_managed_tenant', {
      actor_id: user.id,
      target_id: null,
      tenant_data: {
        ...tenant,
        plan_tier: plan,
        owner_id: ownerId,
        mrr_cents: PLAN_LIMITS[plan].monthlyPriceCents
      },
      module_data: null
    });

    if (error?.code === '23505') {
      throw new AccessError(409, 'Este endereço já está em uso. Escolha outro.');
    }
    if (error) throw error;

    return NextResponse.json(
      { id: data, records: await listManagedTenants() },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
