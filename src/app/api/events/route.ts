import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { getPublicTenant } from '@/lib/tenants';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { checkRateLimit, extractClientIp } from '@/lib/security/rate-limiter';
const schema = z.object({ id: z.string().uuid(), tenantId: z.string().uuid(), source: z.enum(['nfc','qr','direct']), event: z.enum(['page_view','module_click','review_copied']), moduleType: z.enum(['google_reviews','whatsapp_direct','pix_facil','wifi_facil','cardapio_link','catalogo_produtos','social_links','site_institucional','custom_link']).optional() });
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const input = schema.parse(await readJson(req));
    const rate = await checkRateLimit(extractClientIp(req), { namespace: 'events', maxRequests: 120, windowMs: 60_000, errorMessage: 'Limite de eventos.' });
    if (!rate.allowed) return new NextResponse(null, { status: 429 });
    const record = await getPublicTenant(input.tenantId, true);
    if (!record || record.unavailable || record.demo) return new NextResponse(null, { status: 404 });
    if (input.event !== 'page_view' && (!input.moduleType || !record.modules.some(m => m.module_type === input.moduleType))) return new NextResponse(null, { status: 400 });
    const { error } = await createAdminClient().from('analytics_events').upsert({ id: input.id, tenant_id: input.tenantId, source: input.source, event_type: input.event, module_type: input.moduleType || null }, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
