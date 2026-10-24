import type { Tenant, TenantModule, TenantStatus } from '@/types/phygital';

/**
 * Colunas explicitamente permitidas em SELECTs públicos no Supabase.
 * Jamais seleciona owner_id, owner_email, owner_phone, mrr_cents, next_billing_date ou notas internas.
 */
export const PUBLIC_TENANT_SELECT_COLUMNS =
  'id, slug, name, nicho, bio, logo_url, cover_url, primary_color, google_place_id, status, created_at' as const;

/**
 * Data Transfer Object (DTO) Estrito para a Micro-Página Pública (/r/[slug]) e API pública.
 * Garante Data Masking completo contra vazamento de PII e dados financeiros do lojista.
 */
export interface PublicTenantDTO {
  id: string;
  slug: string;
  name: string;
  nicho: string;
  bio: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string;
  google_place_id: string | null;
  status: TenantStatus;
  whatsapp_feedback: string | null;
  created_at: string;
}

export interface PublicModuleDTO {
  id: string;
  tenant_id: string;
  module_type: TenantModule['module_type'];
  title: string | null;
  is_active: boolean;
  config_data: Record<string, any>;
  order_index: number;
}

/**
 * Higieniza e mascara qualquer objeto `Tenant` bruto vindo do banco de dados,
 * removendo forçadamente:
 * - `owner_id` (UUID interno do auth.users)
 * - `owner_email` (E-mail de login do lojista)
 * - `owner_phone` (Telefone pessoal de cobrança)
 * - `mrr_cents` (Valor da mensalidade SaaS)
 * - `next_billing_date` (Data de vencimento da fatura)
 * - `plan_tier` (Nível interno de assinatura)
 * - `taps_30d` / `reviews_30d` (Métricas internas de negócio)
 */
export function toPublicTenantDTO(raw: Partial<Tenant> & { slug: string; name: string }): PublicTenantDTO {
  return {
    id: String(raw.id || '00000000-0000-0000-0000-000000000000'),
    slug: String(raw.slug),
    name: String(raw.name),
    nicho: String(raw.nicho || 'Comércio Local'),
    bio: raw.bio ? String(raw.bio) : null,
    logo_url: raw.logo_url ? String(raw.logo_url) : null,
    cover_url: raw.cover_url ? String(raw.cover_url) : null,
    primary_color: /^#[0-9A-Fa-f]{6}$/.test(String(raw.primary_color || ''))
      ? String(raw.primary_color)
      : '#0F172A',
    google_place_id: raw.google_place_id ? String(raw.google_place_id) : null,
    status: (raw.status as TenantStatus) || 'active',
    // Mantém apenas dígitos caso configurado como canal de retenção de notas 1-3★
    whatsapp_feedback: raw.whatsapp_feedback
      ? String(raw.whatsapp_feedback).replace(/\D/g, '')
      : null,
    created_at: raw.created_at || new Date().toISOString()
  };
}

/**
 * Filtra apenas módulos ativos e remove qualquer metadado interno não pertencente ao módulo público
 */
export function toPublicModulesDTO(rawModules: TenantModule[]): PublicModuleDTO[] {
  return (rawModules || [])
    .filter((m) => Boolean(m.is_active))
    .sort((a, b) => a.order_index - b.order_index)
    .map((mod) => ({
      id: String(mod.id),
      tenant_id: String(mod.tenant_id),
      module_type: mod.module_type,
      title: mod.title ? String(mod.title) : null,
      is_active: true,
      config_data: mod.config_data || {},
      order_index: Number(mod.order_index || 0)
    }));
}
