'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PhygitalExporter } from '@/components/dashboard/PhygitalExporter';
import { PLAN_LIMITS, formatCurrencyBRL } from '@/lib/auth/rbac';
import {
  DEFAULT_TENANTS_DB,
  loadTenantsDb,
  saveTenantsDb,
  createDefaultModulesForTenant,
  type TenantFullRecord
} from '@/lib/store/tenant-store';
import {
  ShieldCheck,
  Store,
  Plus,
  Search,
  DollarSign,
  Activity,
  Ban,
  QrCode,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  Settings2
} from 'lucide-react';
import type { Tenant, TenantStatus, PlanTier } from '@/types/phygital';

const STATUS_BADGES: Record<
  TenantStatus,
  { label: string; classes: string; dot: string }
> = {
  active: {
    label: 'Ativo (Em Dia)',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400'
  },
  trial: {
    label: 'Trial (7 Dias)',
    classes: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    dot: 'bg-sky-400'
  },
  suspended: {
    label: 'Suspenso (Inadimplente)',
    classes: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-500'
  },
  canceled: {
    label: 'Cancelado',
    classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-700',
    dot: 'bg-zinc-500'
  }
};

export default function SuperAdminDashboardPage() {
  const [tenantsMap, setTenantsMap] = useState<Record<string, TenantFullRecord>>(
    DEFAULT_TENANTS_DB
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [selectedTenantForStudio, setSelectedTenantForStudio] = useState<Tenant | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  const [newTenantForm, setNewTenantForm] = useState({
    name: '',
    slug: '',
    nicho: 'Restaurante & Gastronomia',
    bio: '',
    owner_email: '',
    whatsapp_feedback: '',
    google_place_id: '',
    primary_color: '#6366F1',
    plan_tier: 'pro' as PlanTier
  });

  useEffect(() => {
    setTenantsMap(loadTenantsDb());
  }, []);

  const tenants = Object.values(tenantsMap).map((r) => r.tenant);

  const handleStatusChange = (slug: string, nextStatus: TenantStatus) => {
    const record = tenantsMap[slug];
    if (!record) return;

    const nextMap: Record<string, TenantFullRecord> = {
      ...tenantsMap,
      [slug]: {
        ...record,
        tenant: { ...record.tenant, status: nextStatus }
      }
    };

    setTenantsMap(nextMap);
    saveTenantsDb(nextMap);

    if (nextStatus === 'suspended') {
      toast.error(`Placa de "${record.tenant.name}" SUSPENSA!`, {
        description: `O link /r/${slug} foi bloqueado até a regularização da mensalidade.`
      });
    } else if (nextStatus === 'active') {
      toast.success(`Comércio "${record.tenant.name}" ATIVADO!`, {
        description: `A placa física /r/${slug} está online e operando normalmente.`
      });
    } else {
      toast.info(`Status de "${record.tenant.name}" alterado para ${nextStatus.toUpperCase()}.`);
    }
  };

  const handlePlanChange = (slug: string, nextPlan: PlanTier) => {
    const record = tenantsMap[slug];
    if (!record) return;

    const newMrr = PLAN_LIMITS[nextPlan].monthlyPriceCents;
    const nextMap: Record<string, TenantFullRecord> = {
      ...tenantsMap,
      [slug]: {
        ...record,
        tenant: {
          ...record.tenant,
          plan_tier: nextPlan,
          mrr_cents: newMrr
        }
      }
    };

    setTenantsMap(nextMap);
    saveTenantsDb(nextMap);

    toast.success(
      `Plano de "${record.tenant.name}" atualizado para ${PLAN_LIMITS[nextPlan].name}!`,
      {
        description: `Nova mensalidade recorrente: ${formatCurrencyBRL(newMrr)}/mês.`
      }
    );
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantForm.name.trim()) return;

    const cleanSlug =
      newTenantForm.slug.trim() ||
      newTenantForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const createdTenant: Tenant = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      slug: cleanSlug,
      name: newTenantForm.name.trim(),
      nicho: newTenantForm.nicho.trim(),
      bio:
        newTenantForm.bio.trim() ||
        `Bem-vindo(a) a ${newTenantForm.name.trim()}. Avalie nossa experiência!`,
      logo_url: null,
      primary_color: newTenantForm.primary_color,
      google_place_id: newTenantForm.google_place_id || null,
      whatsapp_feedback: newTenantForm.whatsapp_feedback || null,
      status: 'active',
      plan_tier: newTenantForm.plan_tier,
      mrr_cents: PLAN_LIMITS[newTenantForm.plan_tier].monthlyPriceCents,
      next_billing_date: '2026-11-23',
      owner_email: newTenantForm.owner_email || 'lojista@cliente.com.br',
      taps_30d: 1,
      reviews_30d: 0,
      created_at: new Date().toISOString()
    };

    const newRecord: TenantFullRecord = {
      tenant: createdTenant,
      modules: createDefaultModulesForTenant(createdTenant)
    };

    const nextMap = {
      [cleanSlug]: newRecord,
      ...tenantsMap
    };

    setTenantsMap(nextMap);
    saveTenantsDb(nextMap);
    setIsProvisionModalOpen(false);
    setSelectedTenantForStudio(createdTenant);

    toast.success(`Comércio "${createdTenant.name}" provisionado com sucesso!`, {
      description: `Você já pode clicar em "Gerenciar Perfil" para customizar os módulos de /r/${createdTenant.slug}.`
    });

    setNewTenantForm({
      name: '',
      slug: '',
      nicho: 'Restaurante & Gastronomia',
      bio: '',
      owner_email: '',
      whatsapp_feedback: '',
      google_place_id: '',
      primary_color: '#6366F1',
      plan_tier: 'pro'
    });
  };

  const activeTenants = tenants.filter((t) => t.status === 'active' || t.status === 'trial');
  const suspendedTenants = tenants.filter((t) => t.status === 'suspended');
  const totalMrrCents = tenants
    .filter((t) => t.status === 'active')
    .reduce((acc, t) => acc + (t.mrr_cents || 0), 0);
  const totalTapsNetwork = tenants.reduce((acc, t) => acc + (t.taps_30d || 0), 0);

  const filteredTenants = tenants.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.nicho.toLowerCase().includes(q) ||
      (t.owner_email || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* TOPBAR DO SUPER ADMIN */}
        <header className="flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <img
              src="/logos/konnexy-logo.svg"
              alt="Konnexy Tag"
              className="h-12 w-12 rounded-2xl shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="h-3 w-3" /> ROLE: SUPER_ADMIN
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  RLS Bypass & Multi-Tenant Provisioning
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Konnexy HQ • Gestão de Comércios & Mensalidades
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard?tenant=barbearia-premium"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              <Store className="h-4 w-4 text-indigo-400" />
              Gerenciador de Perfis (/dashboard)
            </Link>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsProvisionModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
            >
              <Plus className="h-4 w-4" />
              Provisionar Novo Comércio
            </motion.button>
          </div>
        </header>

        {/* 1. KPIS FINANCEIROS & OPERACIONAIS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Receita Recorrente Mensal (MRR)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              {formatCurrencyBRL(totalMrrCents)}
            </p>
            <p className="mt-1 text-xs text-emerald-400 font-medium">
              ARR Projetado: {formatCurrencyBRL(totalMrrCents * 12)}/ano
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Comércios Ativos & Trial
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Store className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              {activeTenants.length}{' '}
              <span className="text-sm font-normal text-zinc-500">/ {tenants.length} total</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Placas NFC/QR operando em tempo real
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Placas Suspensas (Inadimplência)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <Ban className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-rose-400">
              {suspendedTenants.length}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Kill-Switch ativo bloqueando acesso público
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Tráfego Phygital da Rede (30d)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              {totalTapsNetwork.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-xs text-amber-400 font-medium">
              Aproximações NFC + Leituras QR Code
            </p>
          </div>
        </section>

        {/* 2. TABELA DE GESTÃO DE TENANTS + BOTÃO "GERENCIAR PERFIL" */}
        <section className="rounded-3xl border border-zinc-800/90 bg-zinc-900/80 p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Base de Comércios Cadastrados (Multi-Tenant Control)
              </h2>
              <p className="text-xs text-zinc-400">
                Clique em <strong className="text-indigo-400">Gerenciar Perfil</strong> para editar módulos, cardápio, Pix, Wi-Fi e logo de qualquer comércio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar comércio, slug ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {(['all', 'active', 'trial', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-white text-zinc-950'
                      : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {st === 'all'
                    ? 'Todos'
                    : st === 'active'
                    ? 'Ativos'
                    : st === 'trial'
                    ? 'Trial'
                    : 'Suspensos'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pl-2">Estabelecimento / Slug</th>
                  <th className="pb-3">Status da Placa</th>
                  <th className="pb-3">Plano & Limites</th>
                  <th className="pb-3">Mensalidade (MRR)</th>
                  <th className="pb-3">Tráfego 30d</th>
                  <th className="pb-3 text-right pr-2">Ações Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {filteredTenants.map((t) => {
                  const st = t.status || 'active';
                  const plan = t.plan_tier || 'pro';
                  const statusMeta = STATUS_BADGES[st];
                  const planMeta = PLAN_LIMITS[plan];

                  return (
                    <tr key={t.id} className="group hover:bg-zinc-950/50 transition">
                      <td className="py-4 pl-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 font-bold text-white overflow-hidden shadow-md"
                            style={{ backgroundColor: t.primary_color }}
                          >
                            {t.logo_url ? (
                              <img
                                src={t.logo_url}
                                alt={t.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{t.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {t.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                              <code className="font-mono text-amber-400/90">/r/{t.slug}</code>
                              <span>•</span>
                              <span>{t.nicho}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seletor Direto de Status */}
                      <td className="py-4 pr-4">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.classes}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                          </span>
                          <select
                            aria-label={`Alterar status de ${t.name}`}
                            value={st}
                            onChange={(e) =>
                              handleStatusChange(t.slug, e.target.value as TenantStatus)
                            }
                            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="active">Ativar</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspender (Bloquear)</option>
                            <option value="canceled">Cancelar</option>
                          </select>
                        </div>
                      </td>

                      {/* Seletor Direto de Plano */}
                      <td className="py-4 pr-4">
                        <select
                          aria-label={`Alterar plano de ${t.name}`}
                          value={plan}
                          onChange={(e) =>
                            handlePlanChange(t.slug, e.target.value as PlanTier)
                          }
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none bg-zinc-950 ${planMeta.badgeColor}`}
                        >
                          <option value="starter">Starter (Até 3 Módulos)</option>
                          <option value="pro">Pro Phygital (Até 6 Módulos)</option>
                          <option value="enterprise">Enterprise Full (Ilimitado)</option>
                        </select>
                      </td>

                      {/* MRR */}
                      <td className="py-4 pr-4">
                        <div className="font-bold text-white">
                          {formatCurrencyBRL(t.mrr_cents || planMeta.monthlyPriceCents)}
                          <span className="text-[10px] font-normal text-zinc-500">/mês</span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Venc: {t.next_billing_date || '15/11/2026'}
                        </div>
                      </td>

                      {/* Telemetria */}
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-zinc-200">
                          {t.taps_30d || 0} toques
                        </div>
                        <div className="text-[11px] text-amber-400">
                          ★ {t.reviews_30d || 0} avaliações IA
                        </div>
                      </td>

                      {/* Ações Rápidas: GERENCIAR PERFIL + GERAR PLACA + TESTAR LINK */}
                      <td className="py-4 pr-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/dashboard?tenant=${t.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Gerenciar Perfil
                          </Link>

                          <button
                            type="button"
                            onClick={() => setSelectedTenantForStudio(t)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition"
                          >
                            <QrCode className="h-3.5 w-3.5 text-amber-400" />
                            Gerar Placa
                          </button>

                          <a
                            href={`/r/${t.slug}?src=nfc`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                          >
                            Testar Link
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. ESTÚDIO DE PLACA ACRÍLICA DO CLIENTE SELECIONADO */}
        {selectedTenantForStudio && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
                Produção Gráfica Selecionada: {selectedTenantForStudio.name} (/r/
                {selectedTenantForStudio.slug})
              </span>
              <button
                type="button"
                onClick={() => setSelectedTenantForStudio(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Fechar Estúdio ✕
              </button>
            </div>
            <PhygitalExporter
              slug={selectedTenantForStudio.slug}
              tenantName={selectedTenantForStudio.name}
              nicho={selectedTenantForStudio.nicho}
              primaryColor={selectedTenantForStudio.primary_color}
              logoUrl={selectedTenantForStudio.logo_url}
            />
          </motion.div>
        )}
      </div>

      {/* MODAL DE PROVISIONAMENTO DE NOVO COMÉRCIO */}
      <AnimatePresence>
        {isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProvisionModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    Multi-Tenant Provisioning
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    Cadastrar Novo Comércio & Gerar Placa
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="mt-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Nome do Estabelecimento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pizzaria Bella Napoli"
                      value={newTenantForm.name}
                      onChange={(e) =>
                        setNewTenantForm({ ...newTenantForm, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Slug da URL (/r/[slug])
                    </label>
                    <input
                      type="text"
                      placeholder="pizzaria-bella-napoli"
                      value={newTenantForm.slug}
                      onChange={(e) =>
                        setNewTenantForm({ ...newTenantForm, slug: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Nicho Semântico (Para IA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTenantForm.nicho}
                      onChange={(e) =>
                        setNewTenantForm({ ...newTenantForm, nicho: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Plano Contratado
                    </label>
                    <select
                      value={newTenantForm.plan_tier}
                      onChange={(e) =>
                        setNewTenantForm({
                          ...newTenantForm,
                          plan_tier: e.target.value as PlanTier
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="starter">Starter — R$ 67,00/mês</option>
                      <option value="pro">Pro Phygital — R$ 127,00/mês</option>
                      <option value="enterprise">Enterprise Full — R$ 247,00/mês</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400">
                    Descrição Curta (Bio no Topo da Micro-Página)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pizzas napolitanas de fermentação natural assadas em forno a lenha."
                    value={newTenantForm.bio}
                    onChange={(e) =>
                      setNewTenantForm({ ...newTenantForm, bio: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      E-mail do Lojista (Login)
                    </label>
                    <input
                      type="email"
                      placeholder="dono@bellanapoli.com.br"
                      value={newTenantForm.owner_email}
                      onChange={(e) =>
                        setNewTenantForm({ ...newTenantForm, owner_email: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Cor Primária da Placa
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={newTenantForm.primary_color}
                        onChange={(e) =>
                          setNewTenantForm({
                            ...newTenantForm,
                            primary_color: e.target.value
                          })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-800 bg-transparent"
                      />
                      <input
                        type="text"
                        value={newTenantForm.primary_color}
                        onChange={(e) =>
                          setNewTenantForm({
                            ...newTenantForm,
                            primary_color: e.target.value
                          })
                        }
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Google Place ID
                    </label>
                    <input
                      type="text"
                      placeholder="ChIJ..."
                      value={newTenantForm.google_place_id}
                      onChange={(e) =>
                        setNewTenantForm({
                          ...newTenantForm,
                          google_place_id: e.target.value
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      WhatsApp Alertas (1-3★)
                    </label>
                    <input
                      type="text"
                      placeholder="5511999999999"
                      value={newTenantForm.whatsapp_feedback}
                      onChange={(e) =>
                        setNewTenantForm({
                          ...newTenantForm,
                          whatsapp_feedback: e.target.value
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg hover:bg-amber-400"
                  >
                    Provisionar Conta & Abrir Estúdio QR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
