import { logout } from '@/app/actions/auth';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><form action={logout} className="flex justify-end bg-zinc-950 px-6 pt-4"><button className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-white">Sair da conta</button></form>{children}</>;
}
