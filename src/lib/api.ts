import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AccessError } from '@/lib/auth/session';
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = new URL(req.url).origin;
  const canonical = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || (origin !== expected && origin !== canonical)) throw new AccessError(403, 'Origem da solicitação não autorizada.');
}
export async function readJson(req: NextRequest) {
  if (Number(req.headers.get('content-length') || 0) > 100_000) throw new AccessError(413, 'Dados muito grandes.');
  const body = await req.text();
  if (body.length > 100_000) throw new AccessError(413, 'Dados muito grandes.');
  try { return JSON.parse(body); } catch { throw new AccessError(400, 'Dados inválidos.'); }
}
export function apiError(error: unknown) {
  if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Confira os campos informados.', details: error.flatten().fieldErrors }, { status: 400 });
  console.error('Operation failed:', error instanceof Error ? error.message : 'database error');
  return NextResponse.json({ error: 'Não foi possível concluir. Tente novamente.' }, { status: 503 });
}
