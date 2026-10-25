import type { Tenant, TenantModule } from '@/types/phygital';
export type TenantFullRecord = { tenant: Tenant; modules: TenantModule[] };
export type TenantMap = Record<string, TenantFullRecord>;
async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: 'same-origin' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');
  return data;
}
export async function saveTenant(record: TenantFullRecord): Promise<TenantMap> {
  const data = await request(`/api/manage/tenants/${record.tenant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
  return data.records;
}
export async function createTenant(tenant: Partial<Tenant>): Promise<{ records: TenantMap; id: string }> {
  return request('/api/manage/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tenant) });
}
export async function uploadTenantImage(id: string, file: Blob): Promise<string> {
  const form = new FormData(); form.set('file', file, 'image');
  const data = await request(`/api/manage/tenants/${id}/image`, { method: 'POST', body: form });
  return data.url;
}
