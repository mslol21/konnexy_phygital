import React, { Suspense } from 'react';
import { MobileAppShell } from '@/components/pwa/MobileAppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950">{children}</div>}>
      <MobileAppShell>{children}</MobileAppShell>
    </Suspense>
  );
}
