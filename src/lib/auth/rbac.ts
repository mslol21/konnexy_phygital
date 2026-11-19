import type { PlanTier, ModuleType } from '@/types/phygital';

/**
 * Matriz de Permissões de Módulos e Preços por Plano
 *
 * Modelo de Cobrança Oficial:
 * - Placa Base (Starter): R$ 80,00 Pagamento Único, SEM MENSALIDADE (R$ 0,00/mês).
 *   Inclui a placa física acrílica NFC/QR e as 3 ferramentas essenciais de balcão:
 *   Google Reviews, WhatsApp Direto e Redes Sociais.
 * - Mais Funções (Pro): R$ 14,90/mês de assinatura recorrente opcional.
 *   Libera todos os 9 módulos do ecossistema: Pix Fácil com QR EMVCo, Wi-Fi sem senha,
 *   Cardápio Digital, Catálogo/Vitrine, Site Institucional e Link Customizado.
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    name: string;
    description: string;
    upfrontPriceCents: number;
    monthlyPriceCents: number;
    maxActiveModules: number;
    allowedModules: ModuleType[];
    badgeColor: string;
  }
> = {
  starter: {
    name: 'Placa Base (Sem Mensalidade)',
    description: 'R$ 80,00 pagamento único pela placa física. Sem mensalidade obrigatória.',
    upfrontPriceCents: 8000, // R$ 80,00 taxa única
    monthlyPriceCents: 0, // R$ 0,00/mês
    maxActiveModules: 3,
    allowedModules: ['google_reviews', 'whatsapp_direct', 'social_links'],
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  pro: {
    name: 'Mais Funções (+ R$ 14,90/mês)',
    description: 'Todas as ferramentas liberadas por apenas R$ 14,90/mês.',
    upfrontPriceCents: 8000, // R$ 80,00 da placa
    monthlyPriceCents: 1490, // R$ 14,90/mês
    maxActiveModules: 9,
    allowedModules: [
      'google_reviews',
      'whatsapp_direct',
      'pix_facil',
      'wifi_facil',
      'cardapio_link',
      'catalogo_produtos',
      'social_links',
      'site_institucional',
      'custom_link'
    ],
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  enterprise: {
    name: 'Redes & Franquias',
    description: 'Multi-lojas, relatórios unificados e suporte prioritário.',
    upfrontPriceCents: 8000,
    monthlyPriceCents: 1490, // R$ 14,90/mês por ponto ativo
    maxActiveModules: 9,
    allowedModules: [
      'google_reviews',
      'whatsapp_direct',
      'pix_facil',
      'wifi_facil',
      'cardapio_link',
      'catalogo_produtos',
      'social_links',
      'site_institucional',
      'custom_link'
    ],
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
  }
};

export function formatCurrencyBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}
