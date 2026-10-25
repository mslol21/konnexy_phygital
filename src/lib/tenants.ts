import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';
import { requireSession, AccessError } from '@/lib/auth/session';
import { toPublicTenantDTO } from '@/lib/dto/public-tenant.dto';
import { sanitizePublicModules } from '@/lib/schemas/tenant';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
import type { Tenant, TenantModule } from '@/types/phygital';
export type TenantRecord = { tenant: Tenant; modules: TenantModule[] };
export async function listManagedTenants() {
  const { user, role, supabase } = await requireSession();
  let query = supabase.from('tenants').select('*').eq('is_demo', false).order('created_at', { ascending: false });
  if (role !== 'super_admin') query = query.eq('owner_id', user.id);
  const { data: tenants, error } = await query;
  if (error) throw error;
  const ids = (tenants || []).map(t => t.id);
  if (!ids.length) return {} as Record<string, TenantRecord>;
  const { data: modules, error: moduleError } = await supabase.from('tenant_modules').select('*').in('tenant_id', ids).order('order_index');
  if (moduleError) throw moduleError;
  const { data: metrics, error: metricsError } = await createAdminClient().rpc('tenant_metrics', { tenant_ids: ids });
  if (metricsError) throw metricsError;
  return Object.fromEntries((tenants || []).map(tenant => {
    const counts = (metrics || []).find((m: { tenant_id: string }) => m.tenant_id === tenant.id) || {};
    return [tenant.slug, { tenant: { ...tenant, taps_30d: Number(counts.views || 0), nfc_30d: Number(counts.nfc || 0), qr_30d: Number(counts.qr || 0), google_clicks_30d: Number(counts.google_clicks || 0) }, modules: (modules || []).filter(m => m.tenant_id === tenant.id) }];
  })) as Record<string, TenantRecord>;
}
export async function getPublicTenant(value: string, byId = false) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('tenants').select('id,slug,name,nicho,bio,logo_url,cover_url,primary_color,google_place_id,whatsapp_feedback,status,created_at,is_active,plan_tier,is_demo').eq(byId ? 'id' : 'slug', value).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!data.is_active || !['active','trial'].includes(data.status)) return { unavailable: true as const };
  const { data: modules, error: moduleError } = await admin.from('tenant_modules').select('id,tenant_id,module_type,title,is_active,config_data,order_index').eq('tenant_id', data.id).eq('is_active', true);
  if (moduleError) throw moduleError;
  const plan = PLAN_LIMITS[data.plan_tier as keyof typeof PLAN_LIMITS];
  const allowed = plan?.allowedModules || PLAN_LIMITS.starter.allowedModules;
  return { unavailable: false as const, demo: Boolean(data.is_demo), tenant: toPublicTenantDTO(data), modules: sanitizePublicModules(modules || []).filter(m => allowed.includes(m.module_type)).slice(0, plan?.maxActiveModules || 3) };
}
export async function requireOwnedTenant(id: string) {
  const session = await requireSession();
  const { data, error } = await session.supabase.from('tenants').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data || (session.role !== 'super_admin' && data.owner_id !== session.user.id)) throw new AccessError(404, 'Estabelecimento não encontrado.');
  return { ...session, tenant: data as Tenant };
}
