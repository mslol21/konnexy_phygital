'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Share2,
  Sun,
  Moon,
  Send,
  Nfc,
  Loader2
} from 'lucide-react';
import { AiReviewsOutputSchema, buildNicheFallbackReviews } from '@/lib/schemas/reviews';
import { loadTenantsDb } from '@/lib/store/tenant-store';
import { InteractiveStarRating } from '@/components/public/InteractiveStarRating';
import { BentoModulesGrid } from '@/components/public/BentoModuleCards';
import type {
  Tenant,
  TenantModule,
  AccessSource,
  GoogleReviewsConfig
} from '@/types/phygital';

interface MicroPageClientProps {
  tenant: Tenant;
  modules: TenantModule[];
  accessSource: AccessSource;
}

export function MicroPageClient({
  tenant: initialTenant,
  modules: initialModules,
  accessSource
}: MicroPageClientProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [modules, setModules] = useState<TenantModule[]>(initialModules);
  const [isDark, setIsDark] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiReviews, setAiReviews] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedReviewIndex, setCopiedReviewIndex] = useState<number | null>(null);

  // Estados de Retenção (1 a 3 estrelas - Feedback Direto com a Gerência)
  const [privateComplaint, setPrivateComplaint] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  // Sincroniza dados personalizados do perfil no Gerenciador (/dashboard?tenant=...) e Super Admin
  useEffect(() => {
    const db = loadTenantsDb();
    const record = db[initialTenant.slug];
    if (record) {
      setTenant(record.tenant);
      setModules(record.modules);
    }
  }, [initialTenant.slug]);

  const activeModules = [...modules]
    .filter((m) => m.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  const googleReviewModule = activeModules.find((m) => m.module_type === 'google_reviews');
  const reviewCfg = (googleReviewModule?.config_data || {}) as GoogleReviewsConfig;
  const availableTags = reviewCfg.tags?.length
    ? reviewCfg.tags
    : [
        'Atendimento Impecável',
        'Ambiente Incrível',
        'Qualidade Nota 10',
        'Preço Justo',
        'Super Rápido'
      ];

  const handleRatingSelect = (newRating: number) => {
    setRating(newRating);
    setComplaintSubmitted(false);
    if (newRating >= 4 && selectedTags.length === 0) {
      triggerAiGeneration([availableTags[0]], newRating);
    }
  };

  const triggerAiGeneration = async (tagsToUse: string[], currentRating: number) => {
    setSelectedTags(tagsToUse);
    if (tagsToUse.length === 0) {
      setAiReviews([]);
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: tenant.name,
          nicho: tenant.nicho,
          rating: currentRating >= 4 ? currentRating : 5,
          tags: tagsToUse
        })
      });

      const rawData = await res.json();

      if (res.status === 429) {
        toast.error('Limite de gerações atingido (5 req / 10 min)', {
          description: rawData.error || 'Utilize uma das opções abaixo ou aguarde alguns minutos.'
        });
        const fallback = buildNicheFallbackReviews({
          tenantName: tenant.name,
          nicho: tenant.nicho,
          tags: tagsToUse
        });
        if (aiReviews.length === 0) {
          setAiReviews(fallback.opcoes);
        }
        return;
      }

      const parsed = AiReviewsOutputSchema.safeParse(rawData);

      if (parsed.success) {
        setAiReviews(parsed.data.opcoes);
      } else {
        const fallback = buildNicheFallbackReviews({
          tenantName: tenant.name,
          nicho: tenant.nicho,
          tags: tagsToUse
        });
        setAiReviews(fallback.opcoes);
      }
    } catch {
      const fallback = buildNicheFallbackReviews({
        tenantName: tenant.name,
        nicho: tenant.nicho,
        tags: tagsToUse
      });
      setAiReviews(fallback.opcoes);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag].slice(0, 5);
    triggerAiGeneration(nextTags, rating || 5);
  };

  const handleCopyAndOpenGoogle = async (reviewText: string, index: number) => {
    await navigator.clipboard.writeText(reviewText);
    setCopiedReviewIndex(index);

    toast.success('Avaliação copiada com sucesso!', {
      description: 'Redirecionando para o Google Maps. Basta colar e publicar!'
    });

    const googleReviewUrl = tenant.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(
          tenant.google_place_id
        )}`
      : `https://www.google.com/search?q=${encodeURIComponent(tenant.name)}`;

    setTimeout(() => {
      window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    }, 650);
  };

  const handlePrivateFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateComplaint.trim()) return;

    setComplaintSubmitted(true);
    toast.success('Mensagem enviada diretamente à gerência!', {
      description: 'Agradecemos seu relato. Nossa equipe entrará em ação imediatamente.'
    });

    if (tenant.whatsapp_feedback) {
      const cleanPhone = tenant.whatsapp_feedback.replace(/\D/g, '');
      const alertMsg =
        `⚠️ *ALERTA DE FEEDBACK INTERNO (${rating}★)*\n` +
        `📍 *Unidade:* ${tenant.name}\n` +
        `📲 *Origem:* Placa Física (${accessSource.toUpperCase()})\n` +
        `👤 *Cliente:* ${customerContact || 'Anônimo'}\n` +
        `💬 *Relato:* "${privateComplaint}"`;

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMsg)}`;
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 450);
    }
  };

  const handleSharePage = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: tenant.name,
          text: `Confira ${tenant.name} (${tenant.nicho})`,
          url: shareUrl
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link da página copiado!', {
      description: 'Compartilhe com seus amigos.'
    });
  };

  // KILL-SWITCH DO SUPER ADMIN: Bloqueia a placa física se o lojista estiver suspenso ou cancelado
  if (tenant.status === 'suspended' || tenant.status === 'canceled') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-zinc-900/90 p-8 text-center shadow-2xl space-y-4">
          <img
            src="/logos/konnexy-logo.svg"
            alt="Konnexy Tag"
            className="mx-auto h-12 w-12 rounded-2xl"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
            Placa Temporariamente Suspensa
          </span>
          <h1 className="text-xl font-extrabold text-white">{tenant.name}</h1>
          <p className="text-xs leading-relaxed text-zinc-400">
            Esta placa inteligente encontra-se temporariamente indisponível. Se você é o responsável pelo estabelecimento, acesse o painel financeiro para reativação imediata.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div
        style={{ '--primary': tenant.primary_color || '#D97706' } as React.CSSProperties}
        className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 flex justify-center px-3.5 py-6 sm:py-10 relative overflow-hidden"
      >
        {/* Glow radial dinâmico com a cor primária do lojista */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 h-80 opacity-25 dark:opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${
              tenant.primary_color || '#D97706'
            }, transparent 72%)`
          }}
        />

        <main className="relative z-10 w-full max-w-[460px] space-y-4 pb-14">
          {/* 1. HEADER DO ESTABELECIMENTO */}
          <header className="relative rounded-3xl backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/70 p-6 text-center shadow-glass-md">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                aria-label="Alternar tema claro/escuro"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-950/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Nfc className="h-3 w-3 text-[var(--primary)]" />
                Placa Inteligente • {accessSource.toUpperCase()}
              </span>

              <button
                type="button"
                onClick={handleSharePage}
                aria-label="Compartilhar página"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Avatar com anel suave de borda e Logo do Estabelecimento */}
            <div
              className="relative mx-auto mt-1 flex h-24 w-24 items-center justify-center rounded-3xl p-1 ring-2 ring-[var(--primary)]/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-brand-glow overflow-hidden"
              style={{ backgroundColor: tenant.primary_color || '#18181B' }}
            >
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={`Logo ${tenant.name}`}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-2xl font-black tracking-tighter text-white">
                  {tenant.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Badge de categoria */}
            <div className="mt-3.5">
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold border"
                style={{
                  borderColor: `${tenant.primary_color}40`,
                  backgroundColor: `${tenant.primary_color}15`,
                  color: tenant.primary_color
                }}
              >
                {tenant.nicho}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {tenant.name}
            </h1>

            {tenant.bio && (
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                {tenant.bio}
              </p>
            )}
          </header>

          {/* 2. SELETOR DE AVALIAÇÃO CENTRAL COM IA GEMINI */}
          {googleReviewModule && (
            <section className="rounded-3xl backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 border border-zinc-200/70 dark:border-zinc-800/80 p-5 shadow-glass-md">
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" /> Reputação Assistida por IA
                </span>
                <h2 className="mt-2 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {googleReviewModule.title || 'Como foi sua experiência hoje?'}
                </h2>
              </div>

              <InteractiveStarRating
                rating={rating}
                onChange={handleRatingSelect}
                primaryColor={tenant.primary_color}
              />

              <AnimatePresence>
                {rating >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-5 space-y-4 border-t border-zinc-200/60 dark:border-zinc-800/80 pt-4"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center">
                        Selecione os destaques para personalizar sua resenha
                      </p>
                      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                        {availableTags.map((tag) => {
                          const active = selectedTags.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => toggleTag(tag)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                active
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                                  : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              {active ? `✓ ${tag}` : `+ ${tag}`}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {isGeneratingAi && (
                      <div className="space-y-2 py-2">
                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Gerando 3 resenhas exclusivas com IA...
                        </div>
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-20 w-full rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-950/50 animate-pulse"
                          />
                        ))}
                      </div>
                    )}

                    {!isGeneratingAi && aiReviews.length > 0 && (
                      <div className="space-y-2.5">
                        {aiReviews.map((reviewText, idx) => {
                          const isCopied = copiedReviewIndex === idx;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-zinc-50/80 dark:bg-zinc-950/70 p-3.5 transition hover:border-amber-500/40"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-200 font-medium">
                                  “{reviewText}”
                                </p>
                                <span className="shrink-0 rounded-md bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                                  {reviewText.length}/140
                                </span>
                              </div>

                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCopyAndOpenGoogle(reviewText, idx)}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-3.5 py-2.5 text-xs font-bold text-white dark:text-zinc-950 shadow-sm transition hover:opacity-95"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    Copiado! Abrindo Google Maps...
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copiar e Abrir Google
                                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {rating >= 1 && rating <= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-4"
                  >
                    {complaintSubmitted ? (
                      <div className="py-3 text-center space-y-1.5">
                        <Check className="mx-auto h-8 w-8 text-emerald-500" />
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Recebemos seu feedback prioritário
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          O responsável já foi notificado para solucionar sua questão.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handlePrivateFeedbackSubmit} className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              Feedback Direto com a Gerência
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Queremos resolver qualquer imprevisto agora mesmo. Fale direto com o responsável:
                            </p>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Seu nome ou WhatsApp (opcional)"
                          value={customerContact}
                          onChange={(e) => setCustomerContact(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-rose-500 focus:outline-none"
                        />

                        <textarea
                          required
                          rows={3}
                          placeholder="Conte-nos o que aconteceu para melhorarmos..."
                          value={privateComplaint}
                          onChange={(e) => setPrivateComplaint(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-rose-500 focus:outline-none"
                        />

                        <motion.button
                          type="submit"
                          whileTap={{ scale: 0.98 }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enviar Direto para o WhatsApp da Gerência
                        </motion.button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* 3. SEÇÃO DE MÓDULOS RÁPIDOS (BENTO MOBILE GRID + DRAWER) */}
          <BentoModulesGrid tenant={tenant} modules={activeModules} />

          {/* Rodapé minimalista com Logo Konnexy */}
          <footer className="pt-4 flex items-center justify-center gap-2 text-center">
            <img
              src="/logos/konnexy-logo.svg"
              alt="Konnexy Tag"
              className="h-4 w-4 rounded"
            />
            <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Powered by <span className="font-bold text-zinc-600 dark:text-zinc-300">Konnexy Phygital</span> • Latência Zero
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
