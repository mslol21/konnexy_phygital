import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { apiError } from '@/lib/api';

export async function GET(_req:NextRequest,context:{params:Promise<{assetId:string}>}) {
  try {
    const id=z.string().uuid().safeParse((await context.params).assetId);
    if(!id.success)return new NextResponse(null,{status:404});
    const rows=await query<{mime:string;image_b64:string}>(
      "SELECT a.mime,encode(a.bytes,'base64') AS image_b64"+
      " FROM public.tenant_assets a JOIN public.tenants t ON t.id=a.tenant_id"+
      " WHERE a.id=$1::uuid AND t.is_active AND t.status IN ('active','trial') LIMIT 1",
      [id.data]
    );
    if(!rows.length)return new NextResponse(null,{status:404});
    return new NextResponse(new Uint8Array(Buffer.from(rows[0].image_b64,'base64')),{headers:{
      'Content-Type':rows[0].mime,'Cache-Control':'public, max-age=3600',
      'X-Content-Type-Options':'nosniff'
    }});
  }catch(error){return apiError(error);}
}
