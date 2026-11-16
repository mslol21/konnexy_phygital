import 'server-only';
import { getDemoTenant } from '@/lib/demo-tenants';
import { query } from '@/lib/db';
import { requireSession, AccessError } from '@/lib/auth/session';
import { toPublicTenantDTO } from '@/lib/dto/public-tenant.dto';
import { sanitizePublicModules } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
import type { Tenant, TenantModule } from '@/types/phygital';

export type TenantRecord = { tenant: Tenant; modules: TenantModule[] };
type DBTenant = Tenant & { is_active: boolean; is_demo: boolean; status: 'active' | 'trial' | 'suspended' | 'canceled' };

export async function listManagedTenants() {
  const { user, role } = await requireSession();
  const tenants = await query<Tenant>(
    'SELECT * FROM public.tenants WHERE is_demo = false AND ($1::text = '+ "'super_admin'"+' OR owner_id = $2::uuid) ORDER BY created_at DESC',
    [role, user.id]
  );
  if (!tenants.length) return {} as Record<string, TenantRecord>;
  const ids = tenants.map(t => t.id);
  const modules = await query<TenantModule>(
    'SELECT * FROM public.tenant_modules WHERE tenant_id = ANY($1::uuid[]) ORDER BY order_index',
    [ids]
  );
  const metrics = await query<{tenant_id:string;views:string;nfc:string;qr:string;google_clicks:string}>(
    "SELECT tenant_id, count(*) FILTER (WHERE event_type='page_view') AS views,"+
    " count(*) FILTER (WHERE event_type='page_view' AND source='nfc') AS nfc,"+
    " count(*) FILTER (WHERE event_type='page_view' AND source='qr') AS qr,"+
    " count(*) FILTER (WHERE event_type='module_click' AND module_type='google_reviews') AS google_clicks"+
    " FROM public.analytics_events WHERE tenant_id=ANY($1::uuid[]) AND created_at >= now()-interval '30 days' GROUP BY tenant_id",
    [ids]
  );
  const moduleClicks = await query<{tenant_id:string;module_type:string;clicks:string}>(
    "SELECT tenant_id,module_type::text AS module_type,count(*)::text AS clicks"+
    " FROM public.analytics_events WHERE tenant_id=ANY($1::uuid[])"+
    " AND event_type='module_click' AND created_at>=now()-interval '30 days'"+
    " AND module_type IS NOT NULL GROUP BY tenant_id,module_type",
    [ids]
  );
  return Object.fromEntries(tenants.map(tenant => {
    const counts = metrics.find(m => m.tenant_id === tenant.id);
    return [tenant.slug, {
      tenant: {
        ...tenant,
        taps_30d: Number(counts?.views || 0),
        nfc_30d: Number(counts?.nfc || 0),
        qr_30d: Number(counts?.qr || 0),
        google_clicks_30d: Number(counts?.google_clicks || 0),
        module_clicks_30d: Object.fromEntries(moduleClicks.filter(row=>row.tenant_id===tenant.id).map(row=>[row.module_type,Number(row.clicks)]))
      },
      modules: modules.filter(m => m.tenant_id === tenant.id)
    }];
  })) as Record<string, TenantRecord>;
}

export async function getPublicTenant(value: string, byId = false) {
  const demo = getDemoTenant(value, byId);
  if (demo) return demo;
  const data = await query<DBTenant>(
    'SELECT * FROM public.tenants WHERE '+(byId ? 'id=$1::uuid' : 'slug=$1')+' LIMIT 1',
    [value]
  );
  const tenant = data[0];
  if (!tenant) return null;
  if (!tenant.is_active || !['active','trial'].includes(tenant.status))
    return { unavailable: true as const };
  const modules = await query<TenantModule>(
    'SELECT id,tenant_id,module_type,title,is_active,config_data,order_index FROM public.tenant_modules WHERE tenant_id=$1::uuid AND is_active=true ORDER BY order_index',
    [tenant.id]
  );
  const plan = PLAN_LIMITS[tenant.plan_tier as keyof typeof PLAN_LIMITS];
  const allowed = plan?.allowedModules || PLAN_LIMITS.starter.allowedModules;
  return {
    unavailable: false as const, demo: Boolean(tenant.is_demo),
    tenant: toPublicTenantDTO(tenant),
    modules: sanitizePublicModules(modules).filter(m => allowed.includes(m.module_type)).slice(0,plan?.maxActiveModules || 3)
  };
}

export async function requireOwnedTenant(id: string) {
  const session = await requireSession();
  const data = await query<Tenant>('SELECT * FROM public.tenants WHERE id=$1::uuid LIMIT 1',[id]);
  const tenant = data[0];
  if (!tenant || (session.role !== 'super_admin' && tenant.owner_id !== session.user.id))
    throw new AccessError(404, 'Estabelecimento não encontrado.');
  return { ...session, tenant };
}
