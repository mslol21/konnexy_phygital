import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicTenant } from '@/lib/tenants';
import { query } from '@/lib/db';
import { apiError } from '@/lib/api';
import type { AccessSource } from '@/types/phygital';

const tagParamSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/);

/**
 * Roteamento Físico-Digital Imutável:
 * Tags físicas (NFC gravado com /t/[tagId]?src=nfc ou QR Code /t/[tagId]?src=qr)
 * resolvem dinamicamente para o slug ativo atual do estabelecimento.
 * Evita que alterações futuras de slug quebrem peças acrílicas já instaladas no balcão.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const rawId = (await context.params).id;
    const parsedTag = tagParamSchema.safeParse(rawId);
    if (!parsedTag.success) {
      return new NextResponse('Identificador de placa inválido.', { status: 400 });
    }

    const tagIdentifier = parsedTag.data;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagIdentifier);

    // 1. Busca pelo identificador imutável (UUID do tenant) ou fallback para slug
    const record = await getPublicTenant(tagIdentifier, isUuid);
    if (!record) {
      return new NextResponse('Placa física não encontrada ou desativada.', { status: 404 });
    }

    if (record.unavailable) {
      return new NextResponse('Esta placa está temporariamente indisponível. Contate o estabelecimento.', {
        status: 410,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const rawSource = req.nextUrl.searchParams.get('src');
    const source: AccessSource = rawSource === 'nfc' ? 'nfc' : rawSource === 'qr' ? 'qr' : 'direct';

    // 2. Telemetria server-side não bloqueante para contagem precisa de aproximações físicas
    if (!record.demo && record.tenant?.id) {
      const tenantId = record.tenant.id;
      void (async () => {
        try {
          await query(
            `INSERT INTO public.analytics_events (id, tenant_id, source, event_type, metadata)
             VALUES ($1::uuid, $2::uuid, $3::public.access_source_enum, 'page_view', $4::jsonb)
             ON CONFLICT (id) DO NOTHING`,
            [
              crypto.randomUUID(),
              tenantId,
              source,
              JSON.stringify({ routed_via: 'phygital_tag', tag_id: tagIdentifier })
            ]
          );
        } catch {
          // Falhas de telemetria nunca devem impedir o redirecionamento do cliente final
        }
      })();
    }

    // 3. Redirecionamento 307 com Cache-Control estrito para evitar cache permanente de slug
    const destinationUrl = new URL(`/r/${encodeURIComponent(record.tenant.slug)}`, req.url);
    destinationUrl.searchParams.set('src', source);
    destinationUrl.searchParams.set('tag', tagIdentifier);

    const response = NextResponse.redirect(destinationUrl, 307);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    return apiError(error);
  }
}
