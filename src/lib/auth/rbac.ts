import type { PlanTier, ModuleType } from '@/types/phygital';

/**
 * Matriz de Permissões de Módulos por Plano (Starter, Pro, Enterprise)
 */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    name: string;
    monthlyPriceCents: number;
    maxActiveModules: number;
    allowedModules: ModuleType[];
    badgeColor: string;
  }
> = {
  starter: {
    name: 'Starter',
    monthlyPriceCents: 6700, // R$ 67,00
    maxActiveModules: 3,
    allowedModules: ['google_reviews', 'whatsapp_direct', 'social_links'],
    badgeColor: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  },
  pro: {
    name: 'Pro Phygital',
    monthlyPriceCents: 12700, // R$ 127,00
    maxActiveModules: 6,
    allowedModules: [
      'google_reviews',
      'whatsapp_direct',
      'pix_facil',
      'wifi_facil',
      'cardapio_link',
      'social_links'
    ],
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  enterprise: {
    name: 'Enterprise Full',
    monthlyPriceCents: 24700, // R$ 247,00
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
