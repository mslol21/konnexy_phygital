import type { AccessSource, ModuleType } from '@/types/phygital';
export function trackEvent(tenantId: string, source: AccessSource, event: 'page_view' | 'module_click' | 'review_copied', moduleType?: ModuleType) {
  void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
    body: JSON.stringify({ id: crypto.randomUUID(), tenantId, source, event, moduleType })
  }).catch(() => {});
}
