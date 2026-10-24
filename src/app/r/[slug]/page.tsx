import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { env } from '@/lib/env';
import { MicroPageClient } from '@/components/public/MicroPageClient';
import { DEFAULT_TENANTS_DB, createDefaultModulesForTenant } from '@/lib/store/tenant-store';
import {
  PUBLIC_TENANT_SELECT_COLUMNS,
  toPublicTenantDTO,
  toPublicModulesDTO
} from '@/lib/dto/public-tenant.dto';
import type { AccessSource, Tenant, TenantModule } from '@/types/phygital';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}

export default async function PublicMicroPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { src } = await searchParams;

  const accessSource: AccessSource =
    src === 'nfc' ? 'nfc' : src === 'qr' ? 'qr' : 'direct';

  const fallbackRecord = DEFAULT_TENANTS_DB[slug] || {
    tenant: {
      ...DEFAULT_TENANTS_DB['barbearia-premium'].tenant,
      slug,
      name: slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    },
    modules: createDefaultModulesForTenant({
      ...DEFAULT_TENANTS_DB['barbearia-premium'].tenant,
      slug
    })
  };

  // Aplica Data Masking estrito via DTO antes de serializar para o Client Component
  let maskedTenant: Tenant = toPublicTenantDTO(fallbackRecord.tenant);
  let maskedModules: TenantModule[] = toPublicModulesDTO(fallbackRecord.modules);

  const isLiveSupabase =
    !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();

      // Seleciona estritamente as colunas públicas permitidas (nunca owner_email, owner_id ou mrr_cents)
      const { data: dbTenant } = await supabase
        .from('tenants')
        .select(PUBLIC_TENANT_SELECT_COLUMNS)
        .eq('slug', slug)
        .single();

      if (dbTenant) {
        maskedTenant = toPublicTenantDTO(dbTenant);

        const { data: dbModules } = await supabase
          .from('tenant_modules')
          .select('id, tenant_id, module_type, title, is_active, config_data, order_index')
          .eq('tenant_id', dbTenant.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (dbModules && dbModules.length > 0) {
          maskedModules = toPublicModulesDTO(dbModules as TenantModule[]);
        }

        supabase
          .from('analytics_events')
          .insert({
            tenant_id: dbTenant.id,
            event_type: 'page_view',
            source: accessSource
          })
          .then(() => {});
      }
    } catch {
      // Mantém DTO mascarado de fallback sem vazar erros de banco
    }
  }

  return (
    <MicroPageClient
      tenant={maskedTenant}
      modules={maskedModules}
      accessSource={accessSource}
    />
  );
}
