'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sun, Moon, ExternalLink, MessageCircle, Sparkles } from 'lucide-react';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { GoogleGLogo, GoogleReviewBackground } from '@/components/public/GoogleReviewBrand';

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
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (/^(maps\.app\.goo\.gl|goo\.gl\/maps|g\.page|www\.google\.com\/maps|google\.com\/maps)/i.test(value)) {
    return `https://${value}`;
  }
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(value)}`;
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
    if (!demo && !tracked.current) {
      tracked.current = true;
      trackEvent(tenant.id, accessSource, 'page_view');
    }
  }, [tenant.id, accessSource, demo]);

  const reviews = modules.find((m) => m.module_type === 'google_reviews');
  const whatsapp = tenant.whatsapp_feedback?.replace(/\D/g, '');
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

          <div inert={demo} className="space-y-5">
            {/* 1º QUADRO: IDENTIDADE DO COMÉRCIO + IMAGEM DE CAPA 16:9 (1200x675px) */}
            <NeonGradientCard
              borderRadius={24}
              borderSize={1.5}
              neonColors={{ firstColor: lightBackground ? palette.accent : tenant.primary_color, secondColor: lightBackground ? palette.tint : '#6366f1' }}
              innerClassName="relative overflow-hidden p-6 text-center bg-white dark:bg-zinc-900"
            >
              {tenant.cover_url && (
                <>
                  <img
                    src={tenant.cover_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-35 dark:opacity-40"
                  />
                  <div className={lightBackground ? "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/70 to-white/95" : "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-zinc-950/90"} />
                </>
              )}
              <div className="relative z-10">
                <button
                  aria-label="Alternar tema"
                  onClick={() => setDark(!dark)}
                  className="absolute right-0 top-0 rounded-full p-2 bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-sm"
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {tenant.logo_url && (
                  <img
                    src={tenant.logo_url}
                    alt={`Logo ${tenant.name}`}
                    className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover bg-white shadow-lg border border-white/20"
                  />
                )}
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-300 font-semibold">
                  {tenant.nicho}
                </p>
                <h1 className="mt-2 text-2xl font-bold">{tenant.name}</h1>
                {tenant.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {tenant.bio}
                  </p>
                )}
              </div>
            </NeonGradientCard>

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
