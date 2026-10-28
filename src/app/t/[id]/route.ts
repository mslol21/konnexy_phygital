import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicTenant } from '@/lib/tenants';
import { apiError } from '@/lib/api';
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const parsed = z.string().uuid().safeParse((await context.params).id);
    if (!parsed.success) return new NextResponse('Placa não encontrada.', { status:404 });
    const record = await getPublicTenant(parsed.data, true);
    if (!record) return new NextResponse('Placa não encontrada.', { status:404 });
    if (record.unavailable) return new NextResponse('Esta placa está temporariamente indisponível.', { status:410 });
    const url = new URL(`/r/${encodeURIComponent(record.tenant.slug)}`, req.url);
    const source = req.nextUrl.searchParams.get('src');
    url.searchParams.set('src', source === 'nfc' ? 'nfc' : source === 'qr' ? 'qr' : 'direct');
    const response = NextResponse.redirect(url,307); response.headers.set('Cache-Control','no-store'); return response;
  } catch (error) { return apiError(error); }
}
