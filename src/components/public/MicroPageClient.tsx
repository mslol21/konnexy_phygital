'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sun, Moon, ExternalLink, MessageCircle, Sparkles } from 'lucide-react';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { GoogleGLogo, GoogleReviewBackground } from '@/components/public/GoogleReviewBrand';
import { HeroProfileCard } from '@/components/public/HeroProfileCard';

const BentoModulesGrid = dynamic(
  () => import('@/components/public/BentoModuleCards').then((mod) => mod.BentoModulesGrid),
  {
    ssr: false,
    loading: () => <div className="h-24 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-900/70" />
  }
);
import { trackEvent } from '@/lib/telemetry';
import { BACKGROUND_PALETTES } from '@/lib/background-palettes';
import type { Tenant, TenantModule, AccessSource } from '@/types/phygital';

/**
 * Aceita tanto um Link Direto do Google Maps / Google Meu Negócio
 * (ex: https://maps.app.goo.gl/TJeLztZNUQ93EMU46 ou https://g.page/r/.../review)
 * quanto um Place ID tradicional (ex: ChIJ...).
 */
export function resolveGoogleReviewUrl(raw?: string | null): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  let url: URL | null = null;
  try { url = new URL(value.startsWith('https://') ? value : 'https://' + value); } catch { /* use Place ID below */ }
  if (url && url.protocol === 'https:') {
    const host = url.hostname.toLowerCase();
    if (host === 'google.com' || host.endsWith('.google.com') ||
        host === 'google.com.br' || host.endsWith('.google.com.br') ||
        host === 'maps.app.goo.gl' || host === 'g.page') return url.toString();
  }
  if (/^ChI[A-Za-z0-9_-]{10,}$/.test(value))
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(value)}`;
  return null;
}

export function MicroPageClient({
  tenant,
  modules,
  accessSource,
  demo = false
}: {
  demo?: boolean;
  tenant: Tenant;
  modules: TenantModule[];
  accessSource: AccessSource;
}) {
  const [dark, setDark] = useState((tenant.background_theme || 'dark') === 'dark');
  const tracked = useRef(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
  }, [dark]);

  useEffect(() => {
    if (!demo && !tracked.current) {
      tracked.current = true;
      trackEvent(tenant.id, accessSource, 'page_view');
    }
  }, [tenant.id, accessSource, demo]);

  const reviews = modules.find((m) => m.module_type === 'google_reviews');
  const rawWhatsapp = (tenant.whatsapp_feedback || '').replace(/\D/g, '');
  const whatsapp = rawWhatsapp.startsWith('55') && (rawWhatsapp.length === 12 || rawWhatsapp.length === 13)
    ? rawWhatsapp
    : (rawWhatsapp.length === 10 || rawWhatsapp.length === 11 ? '55' + rawWhatsapp : '');
  const googleUrl = resolveGoogleReviewUrl(tenant.google_place_id);
  const waUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Olá! Acessei a página de ${tenant.name}.`
      )}`
    : null;

  const palette = BACKGROUND_PALETTES[tenant.background_theme || 'dark'];
  const lightBackground = !dark && tenant.background_theme !== 'dark';

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-3 sm:px-4 py-6 sm:py-8 transition-colors duration-300" style={!dark ? { backgroundColor: lightBackground ? palette.background : "#f4f4f5", backgroundImage: lightBackground ? `linear-gradient(145deg, ${palette.background}, ${palette.tint})` : undefined } : undefined}>
        <main className="mx-auto max-w-[460px] space-y-5">
          {demo && (
            <aside className="rounded-xl border border-amber-500 bg-amber-100 p-4 text-sm text-amber-950">
              <strong>Exemplo fictício</strong>
              <p>
                Conheça o visual da Konnexy Tag. Contatos, pagamentos e avaliações estão desativados nesta demonstração.
              </p>
            </aside>
          )}

          {/* 1º QUADRO: HERO PROFILE HEADER REDESENHADO */}
          <HeroProfileCard
            tenant={tenant}
            dark={dark}
            onToggleTheme={() => setDark(!dark)}
          />

          <div className="space-y-5">

            {/* 2º QUADRO: AVALIAÇÃO DO GOOGLE COM SÍMBOLO OFICIAL "G" E CORES AO FUNDO */}
            {reviews && (
              <NeonGradientCard
                borderRadius={24}
                borderSize={1.5}
                neonColors={{ firstColor: lightBackground ? palette.accent : '#4285F4', secondColor: lightBackground ? palette.tint : '#EA4335' }}
                innerClassName="relative overflow-hidden p-6 bg-white/95 dark:bg-zinc-900/95"
              >
                <GoogleReviewBackground size={160} opacity={0.18} />

                <div style={{ position: 'relative', zIndex: 2 }} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 dark:bg-white/10 border border-blue-500/25 dark:border-white/15 px-3 py-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
                      <GoogleGLogo className="h-3.5 w-3.5" />
                      <span>Google Reviews Oficial</span>
                      <Sparkles className="h-3 w-3 text-amber-400" />
                    </span>
                  </div>

                  <h2 className="text-xl font-bold">Como foi sua experiência?</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Sua opinião é bem-vinda. Você pode avaliar no Google ou conversar com a empresa.
                  </p>

                  {googleUrl || demo ? (
                    <a
                      href={demo ? undefined : googleUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent(tenant.id, accessSource, 'module_click', 'google_reviews')
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] px-4 py-3 font-bold text-white shadow-md transition"
                    >
                      <GoogleGLogo className="h-4 w-4 bg-white rounded-full p-0.5" />
                      Avaliar no Google <ExternalLink size={16} />
                    </a>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      O link de avaliação ainda não foi configurado.
                    </p>
                  )}

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600/80 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      <MessageCircle size={18} />
                      Conversar com a empresa
                    </a>
                  )}


                </div>
              </NeonGradientCard>
            )}

            <BentoModulesGrid tenant={tenant} modules={modules} demo={demo} accessSource={accessSource} />
          </div>

          <footer className="text-center py-4 text-xs text-zinc-500">
            Konnexy Tag · Conexões que aproximam
          </footer>
        </main>
      </div>
    </div>
  );
}
