import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { MicroPageClient } from '@/components/public/MicroPageClient';
import { DEFAULT_TENANTS_DB, createDefaultModulesForTenant } from '@/lib/store/tenant-store';
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Seleciona o perfil específico do slug (ex: barbearia-premium, burger-lab-artesanal, clinica-sorriso-prime, petshop-amigo-fiel)
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

  let tenant: Tenant = fallbackRecord.tenant;
  let modules: TenantModule[] = fallbackRecord.modules;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: dbTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (dbTenant) {
      tenant = dbTenant as Tenant;

      const { data: dbModules } = await supabase
        .from('tenant_modules')
        .select('*')
        .eq('tenant_id', dbTenant.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      modules = (dbModules as TenantModule[]) || [];

      supabase
        .from('analytics_events')
        .insert({
          tenant_id: dbTenant.id,
          event_type: 'page_view',
          source: accessSource
        })
        .then(() => {});
    }
  }

  return (
    <MicroPageClient
      tenant={tenant}
      modules={modules}
      accessSource={accessSource}
    />
  );
}
