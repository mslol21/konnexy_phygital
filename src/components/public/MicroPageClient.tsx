'use client';

import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, ExternalLink, Copy, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { BrandCardBackground, GoogleGLogo } from '@/components/public/BrandCardBackground';
import { BentoModulesGrid } from '@/components/public/BentoModuleCards';
import { trackEvent } from '@/lib/telemetry';
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
  const [dark, setDark] = useState(true);
  const [experience, setExperience] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
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
        experience || `Olá! Acessei a página de ${tenant.name}.`
      )}`
    : null;

  async function improveText() {
    setLoading(true);
    setSuggestion('');
    try {
      const res = await fetch('/api/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, experience })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível revisar o texto.');
      setSuggestion(data.suggestion);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Assistência indisponível. Seu texto foi mantido.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(experience);
      trackEvent(tenant.id, accessSource, 'review_copied', 'google_reviews');
      toast.success('Texto copiado. Cole no Google e revise antes de publicar.');
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 py-8">
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
              neonColors={{ firstColor: tenant.primary_color, secondColor: '#6366f1' }}
              innerClassName="relative overflow-hidden p-6 text-center bg-white dark:bg-zinc-900"
            >
              {tenant.cover_url && (
                <>
                  <img
                    src={tenant.cover_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-35 dark:opacity-40"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-zinc-950/90" />
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
                neonColors={{ firstColor: '#4285F4', secondColor: '#EA4335' }}
                innerClassName="relative overflow-hidden p-6 bg-white/95 dark:bg-zinc-900/95"
              >
                <BrandCardBackground brand="google" size={160} opacity={0.18} />

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

                  <details className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <summary className="cursor-pointer font-medium text-sm">
                      Quer organizar seu relato antes de avaliar?
                    </summary>
                    <label htmlFor="experience" className="block mt-4 mb-2 text-sm">
                      Conte sua experiência com suas palavras
                    </label>
                    <textarea
                      id="experience"
                      rows={4}
                      maxLength={1000}
                      value={experience}
                      onChange={(e) => {
                        setExperience(e.target.value);
                        setSuggestion('');
                      }}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/80 p-3 text-sm"
                      placeholder="O que aconteceu durante seu atendimento?"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      A assistência é opcional. Ao solicitar a revisão, o relato será enviado ao serviço de IA do Google. Evite dados pessoais. Nada é publicado automaticamente.
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        disabled={loading || experience.trim().length < 10}
                        onClick={improveText}
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Revisando...
                          </span>
                        ) : (
                          'Revisar clareza do texto'
                        )}
                      </button>
                      <button
                        onClick={copyText}
                        disabled={!experience.trim()}
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <Copy size={14} className="inline mr-1" />
                        Copiar meu texto
                      </button>
                    </div>
                    {suggestion && (
                      <div className="mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
                        <p className="text-xs font-semibold mb-2">
                          Sugestão — confira se representa sua experiência:
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
                        <button
                          className="mt-3 text-sm underline"
                          onClick={() => {
                            setExperience(suggestion);
                            setSuggestion('');
                          }}
                        >
                          Usar e editar sugestão
                        </button>
                      </div>
                    )}
                    {waUrl && (
                      <p className="mt-4 text-xs text-zinc-500">
                        Ao abrir o WhatsApp, revise a mensagem e toque em Enviar. Abrir a conversa não confirma o envio.
                      </p>
                    )}
                  </details>
                </div>
              </NeonGradientCard>
            )}

            <BentoModulesGrid tenant={tenant} modules={modules} demo={demo} />
          </div>

          <footer className="text-center py-4 text-xs text-zinc-500">
            Konnexy Tag · Conexões que aproximam
          </footer>
        </main>
      </div>
    </div>
  );
}
