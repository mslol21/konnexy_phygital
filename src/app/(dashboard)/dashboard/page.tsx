import { requirePageSession } from '@/lib/auth/session';
import { listManagedTenants } from '@/lib/tenants';
import LojistaDashboard from '@/components/dashboard/LojistaDashboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requirePageSession();
  return <LojistaDashboard initialRecords={await listManagedTenants()} />;
}
