'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PhygitalExporter } from '@/components/dashboard/PhygitalExporter';
import {
  DEFAULT_TENANTS_DB,
  loadTenantsDb,
  updateTenantRecord,
  type TenantFullRecord
} from '@/lib/store/tenant-store';
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
  Trash2
} from 'lucide-react';
import type { ModuleType, Tenant, TenantModule } from '@/types/phygital';

const MODULE_META: Record<
  ModuleType,
  { label: string; description: string; upsellBadge: string }
> = {
  google_reviews: {
    label: 'Reputação Ativa (Google Reviews + IA Gemini)',
    description: 'Gera 3 resenhas com IA para notas 4-5★ e retém reclamações 1-3★ no WhatsApp.',
    upsellBadge: 'Core Engine'
  },
  whatsapp_direct: {
    label: 'WhatsApp Direto com Mensagem Pronta',
    description: 'Botão de conversão rápida para agendamentos, pedidos e atendimento.',
    upsellBadge: 'Incluso'
  },
  pix_facil: {
    label: 'Módulo Pix Fácil (1-Tap Copy + QR)',
    description: 'Cópia instantânea da chave Pix com toast de confirmação e modal QR Code.',
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

function SparklineChart({
  data,
  strokeColor = '#10B981'
}: {
  data: number[];
  strokeColor?: string;
}) {
  const width = 110;
  const height = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedSlug = searchParams.get('tenant') || 'barbearia-premium';

  const [isDark, setIsDark] = useState(true);
  const [allTenantsMap, setAllTenantsMap] = useState<Record<string, TenantFullRecord>>(
    DEFAULT_TENANTS_DB
  );
  const [activeSlug, setActiveSlug] = useState<string>(requestedSlug);
  const [tenantProfile, setTenantProfile] = useState<Tenant>(
    DEFAULT_TENANTS_DB['barbearia-premium'].tenant
  );
  const [modules, setModules] = useState<TenantModule[]>(
    DEFAULT_TENANTS_DB['barbearia-premium'].modules
  );
  const [expandedModule, setExpandedModule] = useState<ModuleType | null>('google_reviews');

  // Carrega todos os perfis e sincroniza quando ?tenant=[slug] muda
  useEffect(() => {
    const db = loadTenantsDb();
    setAllTenantsMap(db);
    const targetSlug = db[requestedSlug] ? requestedSlug : Object.keys(db)[0];
    setActiveSlug(targetSlug);
    setTenantProfile(db[targetSlug].tenant);
    setModules(db[targetSlug].modules);
  }, [requestedSlug]);

  const handleSelectTenantProfile = (slug: string) => {
    const db = loadTenantsDb();
    if (!db[slug]) return;
    setActiveSlug(slug);
    setTenantProfile(db[slug].tenant);
    setModules(db[slug].modules);
    router.push(`/dashboard?tenant=${slug}`);
    toast.info(`Gerenciando perfil: ${db[slug].tenant.name}`, {
      description: `Rota ativa: /r/${slug}`
    });
  };

  const persistCurrentProfile = (nextTenant: Tenant, nextModules: TenantModule[]) => {
    setTenantProfile(nextTenant);
    setModules(nextModules);
    updateTenantRecord(activeSlug, {
      tenant: nextTenant,
      modules: nextModules
    });
    setAllTenantsMap(loadTenantsDb());
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const updatedTenant = { ...tenantProfile, logo_url: dataUrl };
      persistCurrentProfile(updatedTenant, modules);
      toast.success(`Logo de "${tenantProfile.name}" atualizada!`, {
        description: 'Aplicada na Micro-Página e no centro do QR Code da placa acrílica.'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    persistCurrentProfile(tenantProfile, modules);
    if (tenantProfile.slug !== activeSlug) {
      setActiveSlug(tenantProfile.slug);
      router.push(`/dashboard?tenant=${tenantProfile.slug}`);
    }
    toast.success(`Perfil de "${tenantProfile.name}" salvo com sucesso!`, {
      description: `Todas as alterações já estão no ar em /r/${tenantProfile.slug}.`
    });
  };

  const toggleModuleActive = (type: ModuleType) => {
    const nextModules = modules.map((m) => {
      if (m.module_type !== type) return m;
      const nextState = !m.is_active;
      toast.success(
        nextState
          ? `Módulo "${MODULE_META[type]?.label || type}" ativado!`
          : `Módulo "${MODULE_META[type]?.label || type}" desativado.`,
        {
          description: `Sincronizado na página /r/${tenantProfile.slug}.`
        }
      );
      return { ...m, is_active: nextState };
    });
    persistCurrentProfile(tenantProfile, nextModules);
  };

  const moveModuleOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const cloned = [...modules];
    const temp = cloned[index];
    cloned[index] = cloned[targetIndex];
    cloned[targetIndex] = temp;

    const reindexed = cloned.map((item, idx) => ({ ...item, order_index: idx + 1 }));
    persistCurrentProfile(tenantProfile, reindexed);
    toast('Ordem de exibição atualizada', {
      description: `Posição #${targetIndex + 1} salva para ${tenantProfile.name}.`
    });
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

  const totalTaps = tenantProfile.taps_30d || 842;
  const nfcTaps = Math.round(totalTaps * 0.68);
  const qrTaps = totalTaps - nfcTaps;
  const totalReviews = tenantProfile.reviews_30d || 319;

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 p-4 sm:p-8 lg:p-10">
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

            <div className="flex flex-wrap items-center gap-2.5">
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
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-zinc-950 shadow-sm hover:opacity-95 transition"
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
                  Toques Físicos via NFC ({tenantProfile.name})
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
                    <TrendingUp className="h-3 w-3" /> 68% do tráfego da unidade
                  </span>
                </div>
                <SparklineChart data={[32, 48, 45, 62, 71, 88, 110]} strokeColor="#6366F1" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Originados por aproximação no chip NTAG213/215
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Leituras de Câmera QR Code
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
                    <TrendingUp className="h-3 w-3" /> 32% do tráfego da unidade
                  </span>
                </div>
                <SparklineChart data={[18, 22, 27, 29, 36, 44, 54]} strokeColor="#10B981" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Leituras nas placas acrílicas de mesa e balcão
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Conversões 5★ Google (IA)
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
                    <ShieldCheck className="h-3.5 w-3.5" /> Blindagem 1-3★ ativa
                  </span>
                </div>
                <SparklineChart data={[14, 19, 24, 31, 39, 48, 63]} strokeColor="#F59E0B" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Resenhas geradas com IA e redirecionadas ao Google Maps
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
                        accept="image/*"
                        onChange={handleLogoUpload}
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
                      Google Place ID Oficial
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
                      <div className="flex items-center justify-between p-3.5 gap-3">
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

                        <div className="flex items-center gap-3 shrink-0">
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
                            {mod.module_type === 'google_reviews' && (
                              <div>
                                <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-500">
                                  Tags de Elogio Rápido (Separadas por vírgula)
                                </label>
                                <input
                                  type="text"
                                  value={(mod.config_data.tags || []).join(', ')}
                                  onChange={(e) =>
                                    updateModuleConfigField(
                                      'google_reviews',
                                      'tags',
                                      e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                                />
                              </div>
                            )}

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
            slug={tenantProfile.slug}
            tenantName={tenantProfile.name}
            nicho={tenantProfile.nicho}
            primaryColor={tenantProfile.primary_color}
            logoUrl={tenantProfile.logo_url}
          />
        </div>
      </div>
    </div>
  );
}

export default function LojistaDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <DashboardContent />
    </Suspense>
  );
}
