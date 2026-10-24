'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  Wifi,
  FileText,
  ShoppingBag,
  MessageCircle,
  Share2,
  Globe,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import type {
  Tenant,
  TenantModule,
  WhatsAppDirectConfig,
  PixFacilConfig,
  CardapioLinkConfig,
  CatalogoProdutosConfig,
  WifiFacilConfig,
  SocialLinksConfig,
  CustomLinkConfig
} from '@/types/phygital';

interface BentoModulesGridProps {
  tenant: Tenant;
  modules: TenantModule[];
}

type DrawerState =
  | { type: 'wifi'; title: string; cfg: WifiFacilConfig }
  | { type: 'cardapio'; title: string; cfg: CardapioLinkConfig }
  | { type: 'catalogo'; title: string; cfg: CatalogoProdutosConfig }
  | { type: 'pix'; title: string; cfg: PixFacilConfig }
  | null;

export function BentoModulesGrid({ tenant, modules }: BentoModulesGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerState>(null);
  const [drawerQrSvg, setDrawerQrSvg] = useState<string | null>(null);

  // Filtra módulos secundários (o google_reviews já é renderizado em destaque no topo)
  const secondaryModules = modules.filter(
    (m) => m.is_active && m.module_type !== 'google_reviews'
  );

  // Gera QR Code dinâmico quando o Drawer de Wi-Fi ou Pix é aberto
  useEffect(() => {
    if (!activeDrawer) {
      setDrawerQrSvg(null);
      return;
    }

    let payload = '';
    if (activeDrawer.type === 'wifi') {
      const { ssid, password, encryption = 'WPA' } = activeDrawer.cfg;
      payload = `WIFI:S:${ssid};T:${encryption};P:${password || ''};;`;
    } else if (activeDrawer.type === 'pix') {
      payload = activeDrawer.cfg.pix_key;
    }

    if (payload) {
      QRCode.toString(payload, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
        color: { dark: '#09090B', light: '#FFFFFF' }
      })
        .then(setDrawerQrSvg)
        .catch(() => setDrawerQrSvg(null));
    }
  }, [activeDrawer]);

  const handleCopyText = async (text: string, id: string, toastMessage: string, description?: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(toastMessage, { description });
    setTimeout(() => setCopiedId(null), 2200);
  };

  if (secondaryModules.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {secondaryModules.map((mod) => {
          switch (mod.module_type) {
            /* ===============================================================
             * WHATSAPP DIRETO (Full Width Span 2)
             * =============================================================== */
            case 'whatsapp_direct': {
              const cfg = (mod.config_data || {}) as WhatsAppDirectConfig;
              const cleanPhone = (cfg.phone || '').replace(/\D/g, '');
              const msg =
                cfg.default_message ||
                `Olá! Estou na ${tenant.name} e acessei a placa inteligente.`;
              const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

              return (
                <motion.a
                  key={mod.id}
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    toast.info('Abrindo conversa no WhatsApp...', {
                      description: tenant.name
                    })
                  }
                  className="col-span-2 group flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm transition hover:border-emerald-500/40"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {mod.title || cfg.button_label || 'Atendimento via WhatsApp'}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Resposta rápida sem fila de espera
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 group-hover:text-emerald-500 transition">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </motion.a>
              );
            }

            /* ===============================================================
             * MÓDULO PIX FÁCIL (1-Tap Copy + Toast + QR Modal)
             * =============================================================== */
            case 'pix_facil': {
              const cfg = (mod.config_data || {}) as PixFacilConfig;
              const isCopied = copiedId === mod.id;

              return (
                <motion.div
                  key={mod.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    handleCopyText(
                      cfg.pix_key,
                      mod.id,
                      'Chave Pix copiada para a área de transferência!',
                      `Favorecido: ${cfg.beneficiary_name || tenant.name}`
                    )
                  }
                  role="button"
                  tabIndex={0}
                  className="col-span-1 cursor-pointer flex flex-col justify-between rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm transition hover:border-teal-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {isCopied ? <Check className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDrawer({
                          type: 'pix',
                          title: mod.title || 'Pagamento Pix',
                          cfg
                        });
                      }}
                      className="rounded-lg border border-zinc-200/70 dark:border-zinc-700/70 px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Ver QR
                    </button>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {mod.title || 'Pix Rápido'}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {cfg.pix_key}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      {isCopied ? '✓ Chave Copiada' : 'Toque para copiar'}
                    </span>
                  </div>
                </motion.div>
              );
            }

            /* ===============================================================
             * MÓDULO WI-FI FÁCIL (Exibe SSID + Abre Drawer de Conexão Direta)
             * =============================================================== */
            case 'wifi_facil': {
              const cfg = (mod.config_data || {}) as WifiFacilConfig;
              return (
                <motion.button
                  key={mod.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (cfg.password) {
                      navigator.clipboard.writeText(cfg.password);
                      toast.success(`Senha do Wi-Fi "${cfg.ssid}" copiada!`, {
                        description: 'Escaneie o código na tela para conectar automaticamente.'
                      });
                    }
                    setActiveDrawer({
                      type: 'wifi',
                      title: `Wi-Fi: ${cfg.ssid}`,
                      cfg
                    });
                  }}
                  className="col-span-1 text-left flex flex-col justify-between rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm transition hover:border-sky-500/40"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      <Wifi className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                      5G Grátis
                    </span>
                  </div>

                  <div className="mt-3 w-full">
                    <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                      {cfg.ssid || 'Wi-Fi Clientes'}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      Senha: {cfg.password ? '••••••••' : 'Aberta'}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      Conectar agora →
                    </span>
                  </div>
                </motion.button>
              );
            }

            /* ===============================================================
             * MÓDULO CARDÁPIO / CATÁLOGO (Abertura em Drawer/Sheet Inferior)
             * =============================================================== */
            case 'cardapio_link': {
              const cfg = (mod.config_data || {}) as CardapioLinkConfig;
              return (
                <motion.button
                  key={mod.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setActiveDrawer({
                      type: 'cardapio',
                      title: mod.title || cfg.button_label || 'Cardápio Digital',
                      cfg
                    })
                  }
                  className="col-span-2 flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm transition hover:border-amber-500/40 text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {mod.title || cfg.button_label || 'Cardápio & Carta de Serviços'}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Toque para abrir visualização rápida
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </motion.button>
              );
            }

            case 'catalogo_produtos': {
              const cfg = (mod.config_data || {}) as CatalogoProdutosConfig;
              const items = cfg.items || [];
              if (items.length === 0) return null;

              return (
                <motion.div
                  key={mod.id}
                  className="col-span-2 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        {mod.title || 'Destaques & Experiências'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer({
                          type: 'catalogo',
                          title: mod.title || 'Catálogo Completo',
                          cfg
                        })
                      }
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Expandir ({items.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setActiveDrawer({
                            type: 'catalogo',
                            title: mod.title || 'Catálogo Completo',
                            cfg
                          })
                        }
                        className="cursor-pointer flex items-center justify-between rounded-xl border border-zinc-200/60 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-950/60 p-3 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                      >
                        <div className="pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            }

            /* ===============================================================
             * REDES SOCIAIS & LINKS CUSTOMIZADOS
             * =============================================================== */
            case 'social_links': {
              const cfg = (mod.config_data || {}) as SocialLinksConfig;
              const links = [
                { label: 'Instagram', url: cfg.instagram },
                { label: 'TikTok', url: cfg.tiktok },
                { label: 'Facebook', url: cfg.facebook },
                { label: 'YouTube', url: cfg.youtube }
              ].filter((l) => Boolean(l.url));

              if (links.length === 0) return null;

              return (
                <div
                  key={mod.id}
                  className="col-span-2 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <Share2 className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {mod.title || 'Canais Oficiais'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {links.map((item) => (
                      <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/70 px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
                      >
                        <span>{item.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            }

            case 'site_institucional':
            case 'custom_link': {
              const cfg = (mod.config_data || {}) as CustomLinkConfig;
              return (
                <a
                  key={mod.id}
                  href={cfg.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-glass-sm transition hover:border-zinc-400 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {mod.title || cfg.label || 'Site Oficial'}
                      </h3>
                      {cfg.subtitle && (
                        <p className="text-xs text-zinc-500">{cfg.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                </a>
              );
            }

            default:
              return null;
          }
        })}
      </div>

      {/* =====================================================================
       * DRAWER / SHEET INFERIOR (ESTILO VAUL / RADIX SHEET)
       * ===================================================================== */}
      <AnimatePresence>
        {activeDrawer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative z-10 w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl"
            >
              {/* Handle bar mobile */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />

              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
                <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {activeDrawer.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Conteúdo: WI-FI QR */}
              {activeDrawer.type === 'wifi' && (
                <div className="mt-5 text-center space-y-4">
                  {drawerQrSvg && (
                    <div
                      className="mx-auto h-48 w-48 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: drawerQrSvg }}
                    />
                  )}
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-3.5 text-xs space-y-1 border border-zinc-200/60 dark:border-zinc-800">
                    <p className="text-zinc-500">
                      Rede (SSID):{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {activeDrawer.cfg.ssid}
                      </strong>
                    </p>
                    <p className="text-zinc-500">
                      Senha:{' '}
                      <code className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {activeDrawer.cfg.password || 'Sem senha'}
                      </code>
                    </p>
                  </div>
                  {activeDrawer.cfg.password && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          activeDrawer.cfg.password!,
                          'drawer-wifi',
                          'Senha do Wi-Fi copiada!'
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 py-3 text-xs font-bold text-white dark:text-zinc-900"
                    >
                      <Copy className="h-4 w-4" /> Copiar Senha da Rede
                    </button>
                  )}
                </div>
              )}

              {/* Conteúdo: PIX QR */}
              {activeDrawer.type === 'pix' && (
                <div className="mt-5 text-center space-y-4">
                  {drawerQrSvg && (
                    <div
                      className="mx-auto h-48 w-48 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: drawerQrSvg }}
                    />
                  )}
                  <p className="text-xs text-zinc-500">
                    Favorecido:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {activeDrawer.cfg.beneficiary_name || tenant.name}
                    </strong>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        activeDrawer.cfg.pix_key,
                        'drawer-pix',
                        'Chave Pix copiada!'
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-zinc-950"
                  >
                    <Copy className="h-4 w-4" /> Copiar Chave: {activeDrawer.cfg.pix_key}
                  </button>
                </div>
              )}

              {/* Conteúdo: CATÁLOGO */}
              {activeDrawer.type === 'catalogo' && (
                <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
                  {activeDrawer.cfg.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3.5"
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {item.title}
                          </h4>
                          {item.badge && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conteúdo: CARDÁPIO PDF / LINK */}
              {activeDrawer.type === 'cardapio' && (
                <div className="mt-5 space-y-4 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Acesse o cardápio digital atualizado diretamente no seu navegador.
                  </p>
                  <a
                    href={activeDrawer.cfg.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 py-3 text-xs font-bold text-white dark:text-zinc-900"
                  >
                    Abrir Cardápio Completo <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
