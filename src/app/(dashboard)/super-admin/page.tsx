import { requirePageSession } from '@/lib/auth/session';
import { listManagedTenants } from '@/lib/tenants';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requirePageSession(true);
  return <SuperAdminDashboard initialRecords={await listManagedTenants()} />;
}
