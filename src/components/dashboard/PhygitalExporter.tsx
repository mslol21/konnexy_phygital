'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Nfc,
  QrCode,
  Copy,
  Check,
  Sparkles,
  FileCode2,
  Printer,
  Smartphone,
  ShieldCheck,
  Layers
} from 'lucide-react';
import {
  generateQrCodeSvg,
  generateAcrylicPlateSvg,
  generateQrCodeHighResPngDataUrl
} from '@/lib/qrcode/generator';
import { Backlight } from '@/components/magicui/backlight';
import { RainbowButton } from '@/components/magicui/rainbow-button';

interface PhygitalExporterProps {
  slug: string;
  tenantName: string;
  nicho?: string;
  primaryColor: string;
  logoUrl?: string | null;
  baseUrl?: string;
}

export function PhygitalExporter({
  slug,
  tenantName,
  nicho = 'Estabelecimento Verificado',
  primaryColor = '#0F172A',
  logoUrl,
  baseUrl = 'https://konnexy.app'
}: PhygitalExporterProps) {
  const [includeAcrylicFrame, setIncludeAcrylicFrame] = useState(true);
  const [quietZoneModules, setQuietZoneModules] = useState(4);
  const [copiedType, setCopiedType] = useState<'nfc' | 'qr' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string>('');

  const nfcUrl = `${baseUrl}/r/${slug}?src=nfc`;
  const qrUrl = `${baseUrl}/r/${slug}?src=qr`;

  // Atualiza o Preview Vetorial em Tempo Real sempre que o slug, cor ou quietZone mudam
  useEffect(() => {
    let active = true;
    generateQrCodeSvg({
      url: qrUrl,
      darkColor: primaryColor,
      lightColor: '#FFFFFF',
      quietZoneModules
    })
      .then((svg) => {
        if (active) setPreviewSvg(svg);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [qrUrl, primaryColor, quietZoneModules]);

  const copyLink = async (url: string, type: 'nfc' | 'qr') => {
    await navigator.clipboard.writeText(url);
    setCopiedType(type);
    toast.success(
      type === 'nfc'
        ? 'URL de gravação NFC copiada!'
        : 'URL do QR Code copiada!',
      { description: url }
    );
    setTimeout(() => setCopiedType(null), 2200);
  };

  const handleWriteNfcTag = async () => {
    if (!('NDEFReader' in window)) {
      toast.info('Web NFC requer Chrome no Android', {
        description:
          'No Desktop/iOS, copie a URL NFC acima e grave no chip NTAG213/215 usando o app NFC Tools.'
      });
      return;
    }

    try {
      toast('Aproxime a placa NFC da traseira do celular...', {
        description: 'Aguardando detecção do chip NTAG213 / NTAG215.'
      });
      // @ts-expect-error Web NFC experimental typing
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: nfcUrl }]
      });
      toast.success('Chip NFC gravado com sucesso!', {
        description: 'Placa física pronta para uso imediato no balcão.'
      });
    } catch (err: any) {
      toast.error('Falha ao gravar chip NFC', {
        description: err?.message || 'Operação cancelada.'
      });
    }
  };

  /**
   * Botão Primário: Exportação SVG Vetorial Puro (Nível H - Corte Laser e Impressão UV)
   */
  const handleDownloadSvg = async () => {
    setIsExporting(true);
    try {
      const svgString = await generateAcrylicPlateSvg({
        url: qrUrl,
        tenantName,
        slug,
        darkColor: primaryColor,
        lightColor: '#FFFFFF',
        quietZoneModules,
        includeAcrylicFrame,
        centerLogoUrl: logoUrl
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `konnexy-placa-${slug}${includeAcrylicFrame ? '-acrilico' : '-qr'}-levelH.svg`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Vetor SVG da Placa Acrílica (Nível H) exportado!', {
        description: 'Visual idêntico ao preview da esquerda, pronto para Corte Laser e Impressão UV.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Botão Secundário: Exportação PNG em 300 DPI (2400x2400px / 2400x3000px)
   */
  const handleDownloadHighResPng = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await generateQrCodeHighResPngDataUrl({
        url: qrUrl,
        tenantName,
        slug,
        darkColor: primaryColor,
        lightColor: '#FFFFFF',
        sizePx: 2400,
        quietZoneModules,
        includeAcrylicFrame,
        centerLogoUrl: logoUrl
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `konnexy-placa-300dpi-${slug}${includeAcrylicFrame ? '-moldura' : ''}.png`;
      a.click();

      toast.success('PNG de Alta Resolução (300 DPI) baixado!', {
        description: 'Resolução de 2400px com 30% de tolerância a falhas (ECC Level H).'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Layers className="h-3.5 w-3.5 text-amber-500" /> QR Code & NFC Hardware Studio
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Estúdio de Identidade Física (Placa em Acrílico)
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Preview vetorial em tempo real com redundância nível <code className="font-mono font-bold">H (30%)</code> e links parametrizados.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          ECC Level H • 300 DPI Ready
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-center">
        {/* ===================================================================
         * COLUNA ESQUERDA: MOCKUP REALISTA DA PLACA EM ACRÍLICO (5 COLUNAS)
         * =================================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <Backlight
            blur={28}
            glowColor={primaryColor}
            className="w-auto"
          >
            {/* Placa física de Acrílico Cristal */}
            <motion.div
              whileHover={{ y: -4 }}
              className="relative w-72 sm:w-80 rounded-[32px] border-2 border-white/40 dark:border-white/15 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              {/* Reflexo diagonal de superfície acrílica */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rotate-45 bg-gradient-to-r from-white/40 to-transparent dark:from-white/10"
              />

              {/* Topo da Placa: Badge NFC Contactless */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  KONNEXY TAG
                </span>
                <div className="flex items-center gap-1 rounded-full bg-zinc-900/5 dark:bg-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
                  <Nfc className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  NFC ATIVO
                </div>
              </div>

              {/* Nome e Nicho do Lojista na Placa */}
              <div className="mt-4 text-center">
                <h4 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                  {tenantName}
                </h4>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Aproxime o celular ou aponte a câmera
                </p>
              </div>

              {/* Container do QR Code Vetorial com Logo Central */}
              <div
                className="relative mx-auto mt-4 flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 shadow-inner border-2"
                style={{ borderColor: `${primaryColor}35` }}
              >
                {previewSvg ? (
                  <div
                    className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                  />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-xl bg-zinc-100" />
                )}

                {/* Emblema / Logo Centralizado sobreposto (suportado pelo Nível H) */}
                <div
                  className="absolute flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-zinc-900 text-xs font-black text-white shadow-md overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{tenantName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>

              {/* Call to Action de 5 Estrelas na Base da Placa */}
              <div className="mt-4 text-center space-y-1">
                <div className="flex justify-center gap-1 text-amber-400 text-sm">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Avalie em 10 segundos no Google
                </p>
              </div>

              {/* Base chanfrada simulando suporte de balcão em acrílico */}
              <div
                className="mt-4 h-1.5 w-24 mx-auto rounded-full opacity-80"
                style={{ backgroundColor: primaryColor }}
              />
            </motion.div>
          </Backlight>
          <span className="mt-3 text-[11px] font-medium text-zinc-400">
            Preview em tempo real da peça acrílica (10x15cm)
          </span>
        </div>

        {/* ===================================================================
         * COLUNA DIREITA: CONTROLES DE GRAVAÇÃO NFC E EXPORTAÇÃO GRÁFICA (7 COLUNAS)
         * =================================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* Bloco 1: Identificador NFC */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                <Nfc className="h-4 w-4 text-indigo-500" /> Link Imutável para Chip NFC (NTAG213 / 215)
              </span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                URI Record
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                {nfcUrl}
              </code>
              <button
                type="button"
                onClick={() => copyLink(nfcUrl, 'nfc')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3.5 py-2 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition"
              >
                {copiedType === 'nfc' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedType === 'nfc' ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleWriteNfcTag}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Smartphone className="h-4 w-4 text-indigo-500" />
              Gravar Chip NFC Direto pelo Navegador (Web NFC API)
            </button>
          </div>

          {/* Bloco 2: Parâmetros Ópticos do QR Code */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                <QrCode className="h-4 w-4 text-emerald-500" /> Parâmetros de Impressão Gráfica
              </span>
              <button
                type="button"
                onClick={() => copyLink(qrUrl, 'qr')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Copiar URL QR
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={includeAcrylicFrame}
                  onChange={(e) => setIncludeAcrylicFrame(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span>Moldura de Corte Acrílico (300 DPI)</span>
              </label>

              <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Quiet Zone:</span>
                <select
                  value={quietZoneModules}
                  onChange={(e) => setQuietZoneModules(Number(e.target.value))}
                  className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value={2}>2 módulos (Compacto)</option>
                  <option value={4}>4 módulos (Padrão ISO)</option>
                  <option value={6}>6 módulos (Margem Larga)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloco 3: Controles de Download (Primário SVG Vetorial + Secundário PNG 300 DPI) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <RainbowButton
              type="button"
              disabled={isExporting}
              onClick={handleDownloadSvg}
              className="flex-1 text-xs sm:text-sm"
            >
              <FileCode2 className="h-4 w-4" />
              Baixar SVG Vetorial Puro (Corte Laser / UV)
            </RainbowButton>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={isExporting}
              onClick={handleDownloadHighResPng}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-3.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Exportar PNG 300 DPI (2400px)
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
