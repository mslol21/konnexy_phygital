import { NextRequest, NextResponse } from 'next/server';
import { getPublicTenant } from '@/lib/tenants';
import { apiError } from '@/lib/api';
export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return NextResponse.json({ error:'Página não encontrada.' }, { status:404 });
    const record = await getPublicTenant(slug);
    if (!record) return NextResponse.json({ error:'Página não encontrada.' }, { status:404 });
    if (record.unavailable) return NextResponse.json({ error:'Página indisponível.' }, { status:410 });
    return NextResponse.json({ tenant:record.tenant, modules:record.modules, demo:record.demo }, { headers:{ 'Cache-Control':'no-store' } });
  } catch (error) { return apiError(error); }
}
