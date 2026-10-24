import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { env } from '@/lib/env';
import { DEFAULT_TENANTS_DB } from '@/lib/store/tenant-store';
import {
  PUBLIC_TENANT_SELECT_COLUMNS,
  toPublicTenantDTO,
  toPublicModulesDTO
} from '@/lib/dto/public-tenant.dto';

/**
 * Rota Pública Blindada (/api/public/tenant/[slug]):
 * Aplica Data Masking estrito via PublicTenantDTO, garantindo que e-mails de login,
 * owner_id, mensalidades (mrr_cents), vencimentos de fatura e notas internas
 * JAMAIS sejam expostos no payload JSON.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const cleanSlug = slug.trim().toLowerCase();

  const isLiveSupabase =
    !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();

      // Seleciona APENAS colunas públicas permitidas
      const { data: dbTenant } = await supabase
        .from('tenants')
        .select(PUBLIC_TENANT_SELECT_COLUMNS)
        .eq('slug', cleanSlug)
        .single();

      if (dbTenant) {
        const { data: dbModules } = await supabase
          .from('tenant_modules')
          .select('id, tenant_id, module_type, title, is_active, config_data, order_index')
          .eq('tenant_id', dbTenant.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        return NextResponse.json(
          {
            tenant: toPublicTenantDTO(dbTenant),
            modules: toPublicModulesDTO((dbModules as any) || [])
          },
          { status: 200 }
        );
      }
    } catch {
      // Fallback gracioso sem expor stacktrace ou erro de banco
    }
  }

  const demoRecord =
    DEFAULT_TENANTS_DB[cleanSlug] || DEFAULT_TENANTS_DB['barbearia-premium'];

  return NextResponse.json(
    {
      tenant: toPublicTenantDTO(demoRecord.tenant),
      modules: toPublicModulesDTO(demoRecord.modules)
    },
    { status: 200 }
  );
}
