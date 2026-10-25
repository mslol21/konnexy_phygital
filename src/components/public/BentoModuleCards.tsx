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
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import {
  BrandCardBackground,
  resolveServiceBrandByNicho,
  type BrandWatermarkType
} from '@/components/public/BrandCardBackground';
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
      // A Pix key is not an EMV payment payload: offer key copy only.
      payload = '';
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
    try { await navigator.clipboard.writeText(text); } catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.'); return; }
    setCopiedId(id);
    toast.success(toastMessage, { description });
    setTimeout(() => setCopiedId(null), 2200);
  };

  if (secondaryModules.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        {secondaryModules.map((mod) => {
          const brandColor = tenant.primary_color || '#f59e0b';

          switch (mod.module_type) {
            /* ===============================================================
             * WHATSAPP DIRETO (Full Width Span 2 - Símbolo e Cores WhatsApp ao Fundo)
             * =============================================================== */
            case 'whatsapp_direct': {
              const cfg = (mod.config_data || {}) as WhatsAppDirectConfig;
              const cleanPhone = (cfg.phone || '').replace(/\D/g, '');
              if (!cleanPhone) return null;
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
                  className="col-span-2 group block"
                >
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: '#25D366', secondColor: '#128C7E' }}
                    innerClassName="relative overflow-hidden flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-900/95"
                  >
                    <BrandCardBackground brand="whatsapp" size={110} opacity={0.18} />

                    <div style={{ position: 'relative', zIndex: 2 }} className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                          {mod.title || cfg.button_label || 'Atendimento via WhatsApp'}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Abra a conversa e envie sua mensagem
                        </p>
                      </div>
                    </div>
                    <div
                      style={{ position: 'relative', zIndex: 2 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 group-hover:text-[#25D366] transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </NeonGradientCard>
                </motion.a>
              );
            }

            /* ===============================================================
             * MÓDULO PIX FÁCIL (Símbolo e Cores Oficiais Pix Banco Central ao Fundo)
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
                  className="col-span-1 cursor-pointer flex"
                >
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: '#32BCAD', secondColor: '#0ea5e9' }}
                    className="flex-1 flex"
                    innerClassName="relative overflow-hidden flex flex-col justify-between p-4 bg-white/95 dark:bg-zinc-900/95 h-full"
                  >
                    <BrandCardBackground brand="pix" size={105} opacity={0.18} />

                    <div style={{ position: 'relative', zIndex: 2 }} className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#32BCAD]/15 text-[#32BCAD] border border-[#32BCAD]/30">
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
                        className="rounded-lg border border-zinc-200/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Ver QR
                      </button>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }} className="mt-3">
                      <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {mod.title || 'Pix Rápido'}
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {cfg.pix_key}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#32BCAD]">
                        {isCopied ? '✓ Chave Copiada' : 'Toque para copiar'}
                      </span>
                    </div>
                  </NeonGradientCard>
                </motion.div>
              );
            }

            /* ===============================================================
             * MÓDULO WI-FI FÁCIL (Ondas 5G e Cores ao Fundo)
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
                  className="col-span-1 text-left flex"
                >
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: '#0ea5e9', secondColor: '#6366f1' }}
                    className="flex-1 flex"
                    innerClassName="relative overflow-hidden flex flex-col justify-between p-4 bg-white/95 dark:bg-zinc-900/95 h-full"
                  >
                    <BrandCardBackground brand="wifi" size={105} opacity={0.18} />

                    <div style={{ position: 'relative', zIndex: 2 }} className="flex items-center justify-between w-full">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        <Wifi className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                        5G Grátis
                      </span>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }} className="mt-3 w-full">
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
                  </NeonGradientCard>
                </motion.button>
              );
            }

            /* ===============================================================
             * MÓDULO CARDÁPIO / CATÁLOGO (Abertura em Drawer - Símbolo de Carta/Menu ao Fundo)
             * =============================================================== */
            case 'cardapio_link': {
              const cfg = (mod.config_data || {}) as CardapioLinkConfig;
              const serviceBrand = resolveServiceBrandByNicho(tenant.nicho);
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
                  className="col-span-2 text-left block"
                >
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: brandColor, secondColor: '#6366f1' }}
                    innerClassName="relative overflow-hidden flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-900/95"
                  >
                    <BrandCardBackground brand={serviceBrand} size={115} opacity={0.20} />

                    <div style={{ position: 'relative', zIndex: 2 }} className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
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
                    <ChevronRight style={{ position: 'relative', zIndex: 2 }} className="h-4 w-4 text-zinc-400" />
                  </NeonGradientCard>
                </motion.button>
              );
            }

            /* ===============================================================
             * MÓDULO SERVIÇOS & COMBOS EM DESTAQUE (Símbolo do Nicho + Cores ao Fundo)
             * =============================================================== */
            case 'catalogo_produtos': {
              const cfg = (mod.config_data || {}) as CatalogoProdutosConfig;
              const items = cfg.items || [];
              if (items.length === 0) return null;

              const serviceBrand = resolveServiceBrandByNicho(tenant.nicho);

              return (
                <motion.div key={mod.id} className="col-span-2">
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: brandColor, secondColor: '#6366f1' }}
                    innerClassName="relative overflow-hidden p-4 bg-white/95 dark:bg-zinc-900/95"
                  >
                    {/* Símbolo Representativo dos Serviços do Nicho + Iluminação Cromática ao Fundo */}
                    <BrandCardBackground
                      brand={serviceBrand}
                      align="top-right"
                      size={148}
                      opacity={0.22}
                    />

                    <div
                      style={{ position: 'relative', zIndex: 2 }}
                      className="flex items-center justify-between mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500">
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                          {mod.title || 'Serviços & Experiências'}
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
                        className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                      >
                        Expandir ({items.length})
                      </button>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }} className="space-y-2">
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
                          className="cursor-pointer flex items-center justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-950/65 backdrop-blur-sm p-3 transition hover:border-amber-500/50"
                        >
                          <div className="pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
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
                          <span className="shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </NeonGradientCard>
                </motion.div>
              );
            }

            /* ===============================================================
             * REDES SOCIAIS & LINKS CUSTOMIZADOS (Símbolo e Cores de Cada Rede ao Fundo)
             * =============================================================== */
            case 'social_links': {
              const cfg = (mod.config_data || {}) as SocialLinksConfig;
              const allLinks: Array<{
                label: string;
                url?: string;
                brand: BrandWatermarkType;
                neon: { firstColor: string; secondColor: string };
                subtitle: string;
              }> = [
                {
                  label: 'Instagram',
                  url: cfg.instagram,
                  brand: 'instagram',
                  neon: { firstColor: '#FD1D1D', secondColor: '#833AB4' },
                  subtitle: 'Fotos, Reels & Stories'
                },
                {
                  label: 'TikTok',
                  url: cfg.tiktok,
                  brand: 'tiktok',
                  neon: { firstColor: '#FE2C55', secondColor: '#25F4EE' },
                  subtitle: 'Vídeos & Bastidores'
                },
                {
                  label: 'Facebook',
                  url: cfg.facebook,
                  brand: 'facebook',
                  neon: { firstColor: '#1877F2', secondColor: '#0ea5e9' },
                  subtitle: 'Página Oficial'
                },
                {
                  label: 'YouTube',
                  url: cfg.youtube,
                  brand: 'youtube',
                  neon: { firstColor: '#FF0000', secondColor: '#f97316' },
                  subtitle: 'Canal de Vídeos'
                }
              ];
              const links = allLinks.filter((l) => Boolean(l.url));

              if (links.length === 0) return null;

              return (
                <React.Fragment key={mod.id}>
                  {links.map((item) => (
                    <motion.a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="col-span-1 flex"
                    >
                      <NeonGradientCard
                        borderSize={1.5}
                        borderRadius={20}
                        neonColors={item.neon}
                        className="flex-1 flex"
                        innerClassName="relative overflow-hidden flex flex-col justify-between p-4 bg-white/95 dark:bg-zinc-900/95 h-full min-h-[112px]"
                      >
                        <BrandCardBackground brand={item.brand} size={96} opacity={0.22} />

                        <div
                          style={{ position: 'relative', zIndex: 2 }}
                          className="flex items-center justify-between w-full"
                        >
                          <span className="text-xs font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {item.label}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                        </div>

                        <div style={{ position: 'relative', zIndex: 2 }} className="mt-4">
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-300 font-medium">
                            {item.subtitle}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-zinc-900 dark:text-white">
                            Seguir agora →
                          </span>
                        </div>
                      </NeonGradientCard>
                    </motion.a>
                  ))}
                </React.Fragment>
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
                  className="col-span-2 block"
                >
                  <NeonGradientCard
                    borderSize={1.5}
                    borderRadius={20}
                    neonColors={{ firstColor: brandColor, secondColor: '#6366f1' }}
                    innerClassName="flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-900/95"
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
                  </NeonGradientCard>
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
