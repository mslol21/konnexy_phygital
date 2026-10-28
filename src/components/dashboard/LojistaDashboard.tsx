'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const PhygitalExporter = dynamic(
  () => import('@/components/dashboard/PhygitalExporter').then((mod) => mod.PhygitalExporter),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Carregando estúdio de QR Code e NFC…
      </div>
    )
  }
);
import { saveTenant, uploadTenantImage, type TenantFullRecord, type TenantMap } from '@/lib/managed-client';
import { cropAndResizeCoverImageToBlob, IDEAL_COVER_WIDTH, IDEAL_COVER_HEIGHT } from '@/lib/images';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
import {
  LayoutGrid,
  Nfc,
  QrCode,
  Star,
  Save,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sun,
  Moon,
  SlidersHorizontal,
  ShieldCheck,
  ArrowUpRight,
  Store,
  Plus,
  Trash2,
  ImagePlus
} from 'lucide-react';
import type { ModuleType, Tenant, TenantModule } from '@/types/phygital';

const MODULE_META: Record<
  ModuleType,
  { label: string; description: string; upsellBadge: string }
> = {
  google_reviews: {
    label: 'Reputação Ativa (Avaliações no Google Gemini)',
    description: 'Permite avaliar no Google e conversar com a empresa sem filtro por nota.',
    upsellBadge: 'Core Engine'
  },
  whatsapp_direct: {
    label: 'WhatsApp Direto com Mensagem Pronta',
    description: 'Botão de conversão rápida para agendamentos, pedidos e atendimento.',
    upsellBadge: 'Incluso'
  },
  pix_facil: {
    label: 'Módulo Pix Fácil (copiar chave)',
    description: 'Exibe a chave Pix para copiar e usar no aplicativo do banco.',
    upsellBadge: '+ R$ 19,90/mês'
  },
  catalogo_produtos: {
    label: 'Vitrine & Catálogo Digital em Drawer',
    description: 'Exibe destaques, combos e serviços em Sheet deslizante com preços.',
    upsellBadge: '+ R$ 29,90/mês'
  },
  wifi_facil: {
    label: 'Wi-Fi Fácil com QR de Conexão Automática',
    description: 'Exibe SSID e gera QR Code nativo para conectar sem digitar senha.',
    upsellBadge: '+ R$ 14,90/mês'
  },
  cardapio_link: {
    label: 'Cardápio / Carta de Serviços em PDF ou Link',
    description: 'Abertura fluida em Drawer inferior ou cardápio externo.',
    upsellBadge: '+ R$ 19,90/mês'
  },
  social_links: {
    label: 'Hub de Redes Sociais (Instagram / TikTok)',
    description: 'Transforma clientes presenciais do balcão em seguidores recorrentes.',
    upsellBadge: 'Incluso'
  },
  site_institucional: {
    label: 'Site Oficial / Link Institucional',
    description: 'Cartão de redirecionamento para o site ou sistema de agendamento externo.',
    upsellBadge: 'Incluso'
  },
  custom_link: {
    label: 'Link Personalizado Extra',
    description: 'Botão customizado para campanhas, sorteios ou pesquise de satisfação.',
    upsellBadge: 'Add-on'
  }
};

function DashboardContent({ initialRecords }: { initialRecords: TenantMap }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedSlug = searchParams.get('tenant') || Object.keys(initialRecords)[0];

  const [isDark, setIsDark] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allTenantsMap, setAllTenantsMap] = useState<Record<string, TenantFullRecord>>(
    initialRecords
  );
  const [activeSlug, setActiveSlug] = useState<string>(requestedSlug);
  const [tenantProfile, setTenantProfile] = useState<Tenant>(
    (initialRecords[requestedSlug] || Object.values(initialRecords)[0]).tenant
  );
  const [modules, setModules] = useState<TenantModule[]>(
    (initialRecords[requestedSlug] || Object.values(initialRecords)[0]).modules
  );
  const [expandedModule, setExpandedModule] = useState<ModuleType | null>('google_reviews');

  // Browser back/forward selects a saved record without overwriting unsaved edits.
  useEffect(() => {
    if (requestedSlug === activeSlug || !allTenantsMap[requestedSlug]) return;
    const record = allTenantsMap[requestedSlug];
    setActiveSlug(requestedSlug);
    setTenantProfile(record.tenant);
    setModules(record.modules);
  }, [requestedSlug, activeSlug, allTenantsMap]);

  const handleSelectTenantProfile = (slug: string) => {
    const db = allTenantsMap;
    if (!db[slug]) return;
    router.push(`/dashboard?tenant=${slug}`);
    toast.info(`Gerenciando perfil: ${db[slug].tenant.name}`, {
      description: `Rota ativa: /r/${slug}`
    });
  };

  const persistCurrentProfile = async (nextTenant: Tenant, nextModules: TenantModule[]) => {
    setSaving(true);
    try {
      const records = await saveTenant({ tenant: nextTenant, modules: nextModules });
      const record = Object.values(records).find(r => r.tenant.id === nextTenant.id);
      if (!record) throw new Error('Não foi possível atualizar a página.');
      setAllTenantsMap(records);
      setTenantProfile(record.tenant);
      setModules(record.modules);
      router.replace(`/dashboard?tenant=${encodeURIComponent(record.tenant.slug)}`);
      return record;
    } finally { setSaving(false); }
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(true);
    try {
      const url = await uploadTenantImage(tenantProfile.id, file);
      await persistCurrentProfile({ ...tenantProfile, logo_url: url }, modules);
      toast.success('Logo salva e publicada.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.'); }
    finally { setSaving(false); e.target.value = ''; }
  };
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(true);
    try {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 4_000_000) throw new Error('Use JPG, PNG ou WebP de até 4 MB.');
      const blob = await cropAndResizeCoverImageToBlob(file);
      const url = await uploadTenantImage(tenantProfile.id, blob);
      await persistCurrentProfile({ ...tenantProfile, cover_url: url }, modules);
      toast.success('Capa salva e publicada.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a capa.'); }
    finally { setSaving(false); e.target.value = ''; }
  };
  const handleSaveProfile = async () => {
    try {
      const record = await persistCurrentProfile(tenantProfile, modules);
      router.replace(`/dashboard?tenant=${encodeURIComponent(record.tenant.slug)}`);
      toast.success('Alterações salvas e publicadas.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
  };
  const toggleModuleActive = (type: ModuleType) => {
    setModules(prev => prev.map(m => m.module_type === type ? { ...m, is_active: !m.is_active } : m));
  };
  const moveModuleOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index-1 : index+1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    const next = [...modules]; [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setModules(next.map((m,index) => ({ ...m, order_index:index })));
  };

  const updateModuleConfigField = (
    type: ModuleType,
    fieldKey: string,
    fieldValue: any,
    customTitle?: string
  ) => {
    const nextModules = modules.map((m) => {
      if (m.module_type !== type) return m;
      return {
        ...m,
        title: customTitle !== undefined ? customTitle : m.title,
        config_data: {
          ...m.config_data,
          [fieldKey]: fieldValue
        }
      };
    });
    setModules(nextModules);
  };

  const totalTaps = tenantProfile.taps_30d ?? 0;
  const nfcTaps = tenantProfile.nfc_30d ?? 0;
  const qrTaps = tenantProfile.qr_30d ?? 0;
  const totalReviews = tenantProfile.google_clicks_30d ?? 0;

  return (
    <fieldset disabled={saving} className={isDark ? 'dark min-w-0' : 'min-w-0'}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 p-3 sm:p-6 lg:p-8 pb-28 md:pb-12">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* =================================================================
           * SELETOR RÁPIDO DE PERFIL (MULTI-TENANT PROFILE SWITCHER)
           * ================================================================= */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 pl-1">
              <Store className="h-4 w-4 text-amber-500" />
              <span>Alternar Perfil Gerenciado:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Object.values(allTenantsMap).map(({ tenant: item }) => {
                const isSelected = item.slug === activeSlug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => handleSelectTenantProfile(item.slug)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                        : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.primary_color }}
                    />
                    <span className="truncate max-w-[160px]">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================================
           * HEADER DO PERFIL SELECIONADO
           * ================================================================= */}
          <header className="flex flex-col justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1 shadow-md overflow-hidden text-white font-black text-xl"
                style={{ backgroundColor: tenantProfile.primary_color }}
              >
                {tenantProfile.logo_url ? (
                  <img
                    src={tenantProfile.logo_url}
                    alt={tenantProfile.name}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span>{tenantProfile.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <img
                    src="/logos/konnexy-logo.svg"
                    alt="Konnexy Tag"
                    className="h-4 w-4 rounded"
                  />
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      tenantProfile.status === 'suspended'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Gerenciador do Perfil • Plano{' '}
                    {PLAN_LIMITS[tenantProfile.plan_tier || 'pro'].name}
                  </span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {tenantProfile.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
              >
                <ShieldCheck className="h-4 w-4" />
                Voltar ao Super Admin
              </Link>

              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                aria-label="Alternar tema"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <a
                href={`/r/${tenantProfile.slug}?src=nfc`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-zinc-950 shadow-sm hover:opacity-95 transition flex-1 sm:flex-initial text-center"
              >
                Abrir Micro-Página (/r/{tenantProfile.slug})
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </header>

          {/* =================================================================
           * 1. OVERVIEW & ANALYTICS DO PERFIL ATUAL
           * ================================================================= */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Acessos pelo link NFC ({tenantProfile.name})
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Nfc className="h-4 w-4" />
                </div>
              </div>
              <div className="my-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {nfcTaps}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <TrendingUp className="h-3 w-3" /> {totalTaps ? Math.round(nfcTaps / totalTaps * 100) : 0}% dos acessos registrados
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                Originados por aproximação no chip NTAG213/215
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Acessos pelo link QR Code
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <QrCode className="h-4 w-4" />
                </div>
              </div>
              <div className="my-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {qrTaps}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <TrendingUp className="h-3 w-3" /> {totalTaps ? Math.round(qrTaps / totalTaps * 100) : 0}% dos acessos registrados
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                Leituras nas placas acrílicas de mesa e balcão
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Cliques para avaliar no Google
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500" />
                </div>
              </div>
              <div className="my-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {totalReviews}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Últimos 30 dias
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                Cliques não confirmam avaliações publicadas.
              </p>
            </div>
          </section>

          {/* =================================================================
           * 2. BENTO GRID: EDITOR COMPLETO DO PERFIL + GERENCIADOR DE MÓDULOS
           * ================================================================= */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Identidade Visual, Bio, Cores e Place ID do Perfil Selecionado (4 Colunas) */}
            <section className="lg:col-span-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" /> Identidade do Perfil
                </div>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Dados de {tenantProfile.name}
                </h2>

                {/* Upload & Preview da Logo */}
                <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden text-white font-black"
                    style={{ backgroundColor: tenantProfile.primary_color }}
                  >
                    {tenantProfile.logo_url ? (
                      <img
                        src={tenantProfile.logo_url}
                        alt="Logo do Estabelecimento"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{tenantProfile.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Logo do Comércio
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      Exibida no topo e no centro do QR Code
                    </p>
                    <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-white dark:text-zinc-900 hover:opacity-90 transition">
                      <span>Enviar Logo (PNG/SVG)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Upload & Preview da Imagem de Fundo do 1º Quadro (Dimensão Ideal 1200x675px • 16:9) */}
                <div className="mt-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <ImagePlus className="h-3.5 w-3.5 text-amber-500" />
                        Fundo do 1º Quadro (Capa)
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Dimensão ideal: <strong>{IDEAL_COVER_WIDTH}×{IDEAL_COVER_HEIGHT}px (Proporção 16:9)</strong>
                      </p>
                    </div>
                    {tenantProfile.cover_url && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedTenant = { ...tenantProfile, cover_url: null };
                          persistCurrentProfile(updatedTenant, modules);
                          toast.info('Imagem de fundo removida do 1º quadro.');
                        }}
                        className="text-[10px] font-semibold text-rose-500 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {/* Preview proporcional 16:9 */}
                  <div className="relative h-24 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 flex items-center justify-center">
                    {tenantProfile.cover_url ? (
                      <>
                        <img
                          src={tenantProfile.cover_url}
                          alt="Preview Fundo 1º Quadro"
                          className="h-full w-full object-cover object-center"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-zinc-950/85" />
                        <span className="relative z-10 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300 border border-amber-500/30">
                          16:9 • {IDEAL_COVER_WIDTH}×{IDEAL_COVER_HEIGHT}px Ativo
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-zinc-500">
                        Sem imagem de fundo (usando cor sólida)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-[11px] font-bold text-white dark:text-zinc-900 hover:opacity-90 transition">
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Enviar Imagem (Auto-Ajuste 1200×675)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Nome do Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.name}
                      onChange={(e) =>
                        setTenantProfile({ ...tenantProfile, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Nicho Semântico (Confinamento da IA)
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.nicho}
                      onChange={(e) =>
                        setTenantProfile({ ...tenantProfile, nicho: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Bio / Subtítulo na Micro-Página
                    </label>
                    <textarea
                      rows={2}
                      value={tenantProfile.bio || ''}
                      onChange={(e) =>
                        setTenantProfile({ ...tenantProfile, bio: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Cor Primária da Marca (<code className="font-mono">--primary</code>)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={tenantProfile.primary_color}
                        onChange={(e) =>
                          setTenantProfile({
                            ...tenantProfile,
                            primary_color: e.target.value
                          })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tenantProfile.primary_color}
                        onChange={(e) =>
                          setTenantProfile({
                            ...tenantProfile,
                            primary_color: e.target.value
                          })
                        }
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Link do Google Maps / Avaliação (ou Place ID)
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.google_place_id || ''}
                      onChange={(e) =>
                        setTenantProfile({
                          ...tenantProfile,
                          google_place_id: e.target.value
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      WhatsApp de Retenção (Notas 1 a 3★)
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.whatsapp_feedback || ''}
                      onChange={(e) =>
                        setTenantProfile({
                          ...tenantProfile,
                          whatsapp_feedback: e.target.value
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveProfile}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white py-3 text-xs font-bold text-white dark:text-zinc-950 shadow-sm hover:opacity-95 transition"
              >
                <Save className="h-4 w-4" /> Salvar Alterações de {tenantProfile.name}
              </motion.button>
            </section>

            {/* Gerenciador de Módulos do Perfil Selecionado (8 Colunas) */}
            <section className="lg:col-span-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" /> Módulos de{' '}
                    {tenantProfile.name}
                  </div>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Configuração Individual da Micro-Página (/r/{tenantProfile.slug})
                  </h2>
                </div>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {modules.filter((m) => m.is_active).length} de {modules.length} ativos
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {modules.map((mod, idx) => {
                  const meta = MODULE_META[mod.module_type] || {
                    label: mod.module_type,
                    description: 'Módulo customizado',
                    upsellBadge: 'Add-on'
                  };
                  const isExpanded = expandedModule === mod.module_type;

                  return (
                    <div
                      key={mod.id}
                      className={`rounded-2xl border transition-all ${
                        mod.is_active
                          ? 'border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40'
                          : 'border-zinc-200/40 dark:border-zinc-800/40 opacity-65'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveModuleOrder(idx, 'up')}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                              aria-label="Mover para cima"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveModuleOrder(idx, 'down')}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                              aria-label="Mover para baixo"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div
                            onClick={() =>
                              setExpandedModule(isExpanded ? null : mod.module_type)
                            }
                            className="cursor-pointer min-w-0"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-zinc-400">
                                #{mod.order_index}
                              </span>
                              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {mod.title || meta.label}
                              </h3>
                              <span className="rounded-full bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                                {meta.upsellBadge}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {meta.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModule(isExpanded ? null : mod.module_type)
                            }
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            {isExpanded ? 'Fechar' : 'Editar Dados'}
                          </button>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={mod.is_active}
                            onClick={() => toggleModuleActive(mod.module_type)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              mod.is_active
                                ? 'bg-emerald-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                mod.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* GAVETA CONTEXTUAL POR TIPO DE MÓDULO */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="border-t border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 rounded-b-2xl space-y-3"
                          >
                            <div>
                              <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                Título Exibido no Cartão
                              </label>
                              <input
                                type="text"
                                value={mod.title || ''}
                                onChange={(e) => {
                                  const nextTitle = e.target.value;
                                  setModules((prev) =>
                                    prev.map((m) =>
                                      m.id === mod.id ? { ...m, title: nextTitle } : m
                                    )
                                  );
                                }}
                                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            {/* Campos específicos: GOOGLE REVIEWS */}
                            {mod.module_type === 'google_reviews' && <p className="text-sm text-zinc-400">Todos os clientes podem avaliar no Google ou conversar com a empresa, sem filtro por nota.</p>}

                            {/* Campos específicos: WHATSAPP DIRECT */}
                            {mod.module_type === 'whatsapp_direct' && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    WhatsApp de Atendimento (Com DDD)
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.phone || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'whatsapp_direct',
                                        'phone',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    Mensagem Predefinida
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.default_message || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'whatsapp_direct',
                                        'default_message',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Campos específicos: PIX FÁCIL */}
                            {mod.module_type === 'pix_facil' && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    Chave Pix Oficial
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.pix_key || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'pix_facil',
                                        'pix_key',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    Nome do Favorecido
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.beneficiary_name || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'pix_facil',
                                        'beneficiary_name',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Campos específicos: WI-FI FÁCIL */}
                            {mod.module_type === 'wifi_facil' && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    Nome da Rede (SSID)
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.ssid || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'wifi_facil',
                                        'ssid',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    Senha do Wi-Fi
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.password || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'wifi_facil',
                                        'password',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Campos específicos: REDES SOCIAIS */}
                            {mod.module_type === 'social_links' && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    URL do Instagram
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.instagram || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'social_links',
                                        'instagram',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                    URL do TikTok
                                  </label>
                                  <input
                                    type="text"
                                    value={mod.config_data.tiktok || ''}
                                    onChange={(e) =>
                                      updateModuleConfigField(
                                        'social_links',
                                        'tiktok',
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  persistCurrentProfile(tenantProfile, modules);
                                  toast.success(
                                    `Módulo atualizado para ${tenantProfile.name}!`
                                  );
                                  setExpandedModule(null);
                                }}
                                className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-bold text-white dark:text-zinc-900"
                              >
                                Salvar Módulo na Micro-Página
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* =================================================================
           * 3. ESTÚDIO QR CODE & NFC DO PERFIL SELECIONADO
           * ================================================================= */}
          <PhygitalExporter
            tenantId={tenantProfile.id}
            slug={tenantProfile.slug}
            tenantName={tenantProfile.name}
            nicho={tenantProfile.nicho}
            primaryColor={tenantProfile.primary_color}
            logoUrl={tenantProfile.logo_url}
          />
        </div>
      </div>
    </fieldset>
  );
}

export default function LojistaDashboard({ initialRecords }: { initialRecords: TenantMap }) {
  if (!Object.keys(initialRecords).length) return <div className="min-h-screen bg-zinc-950 text-white p-10"><h1 className="text-2xl font-bold">Nenhum estabelecimento vinculado</h1><p className="mt-3 text-zinc-400">Solicite ao administrador o vínculo da sua conta ao estabelecimento.</p><Link href="/super-admin" className="mt-6 inline-block underline">Gestão de estabelecimentos</Link></div>;
  return <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}><DashboardContent initialRecords={initialRecords} /></Suspense>;
}
