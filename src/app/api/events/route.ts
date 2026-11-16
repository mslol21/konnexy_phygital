import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getPublicTenant } from '@/lib/tenants';
import { assertSameOrigin, readJson, apiError } from '@/lib/api';
import { checkRateLimit, extractClientIp } from '@/lib/security/rate-limiter';

const schema=z.object({
  id:z.string().uuid(),tenantId:z.string().uuid(),source:z.enum(['nfc','qr','direct']),
  event:z.enum(['page_view','module_click','review_copied']),
  moduleType:z.enum(['google_reviews','whatsapp_direct','pix_facil','wifi_facil',
    'cardapio_link','catalogo_produtos','social_links','site_institucional','custom_link']).optional()
});
export async function POST(req:NextRequest) {
  try {
    assertSameOrigin(req);
    const input=schema.parse(await readJson(req));
    const rate=await checkRateLimit(extractClientIp(req),{
      namespace:'events',maxRequests:120,windowMs:60000,errorMessage:'Limite de eventos.'
    });
    if(!rate.allowed)return new NextResponse(null,{status:429});
    const record=await getPublicTenant(input.tenantId,true);
    if(!record || record.unavailable || record.demo)return new NextResponse(null,{status:404});
    if(input.event!=='page_view' && (!input.moduleType || !record.modules.some(m=>m.module_type===input.moduleType)))
      return new NextResponse(null,{status:400});
    await query(
      'INSERT INTO public.analytics_events(id,tenant_id,source,event_type,module_type)'+
      ' VALUES($1::uuid,$2::uuid,$3::public.access_source_enum,$4,$5::public.module_type_enum)'+
      ' ON CONFLICT(id) DO NOTHING',
      [input.id,input.tenantId,input.source,input.event,input.moduleType||null]
    );
    return new NextResponse(null,{status:204});
  }catch(error){return apiError(error);}
}
