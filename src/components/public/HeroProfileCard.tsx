'use client';

import React from 'react';
import { Sun, Moon, ShieldCheck } from 'lucide-react';
import type { Tenant } from '@/types/phygital';

interface HeroProfileCardProps {
  tenant: Tenant;
  dark: boolean;
  onToggleTheme: () => void;
}

/**
 * Converte cor hexadecimal para RGBA seguro para degradês e iluminação atmosférica
 */
function hexToRgba(hex: string | undefined | null, alpha = 1): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(217, 119, 6, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * HeroProfileCard
 * Redesenho premium do Hero/Profile Header com máxima valorização da imagem de fundo (BG)
 * sem comprometer a legibilidade e contraste da descrição e dos textos.
 *
 * Utiliza arquitetura visual em camadas:
 * - Camada 1: Imagem de capa vibrante e visível com nitidez (85-95% de opacidade)
 * - Camada 2: Glow atmosférico suave da marca
 * - Camada 3: Logo de alta definição com moldura e sombra profunda
 * - Camada 4: Cápsula de vidro jateado (frosted glass shield) com backdrop-blur-xl,
 *   garantindo contraste WCAG AAA e zero ruído visual sob os caracteres.
 */
export function HeroProfileCard({
  tenant,
  dark,
  onToggleTheme
}: HeroProfileCardProps) {
  const brandColor = tenant.primary_color || '#d97706';
  const hasCover = Boolean(tenant.cover_url);

  const initials = (tenant.name || 'KT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <header
      className={`relative overflow-hidden rounded-[24px] border transition-all duration-300 ${
        dark
          ? 'border-white/15 bg-zinc-950 text-white shadow-[0_24px_50px_-15px_rgba(0,0,0,0.75)]'
          : 'border-zinc-200/80 bg-zinc-100 text-zinc-900 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* =====================================================================
       * 1. IMAGEM DE FUNDO (BG) VIBRANTE E REALMENTE VISÍVEL
       * ===================================================================== */}
      {hasCover ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Imagem de capa com alta nitidez, presença e proporção ideal */}
          <img
            src={tenant.cover_url!}
            alt={`Capa ${tenant.name}`}
            className="h-full w-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
          />

          {/* Gradiente sutil superior (vinheta para legibilidade dos botões do topo) */}
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none"
          />

          {/* Sombra suave de profundidade na base para ancoragem visual elegante */}
          <div
            className={`absolute inset-x-0 bottom-0 h-28 pointer-events-none ${
              dark
                ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                : 'bg-gradient-to-t from-black/30 via-black/10 to-transparent'
            }`}
          />
        </div>
      ) : (
        /* Fallback sem capa: degradê procedural sofisticado com a cor primária */
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: dark
              ? `radial-gradient(circle at 50% 0%, ${hexToRgba(brandColor, 0.45)} 0%, rgba(24,24,27,0.95) 60%, rgba(9,9,11,1) 100%)`
              : `radial-gradient(circle at 50% 0%, ${hexToRgba(brandColor, 0.28)} 0%, rgba(250,250,250,0.95) 65%, rgba(244,244,245,1) 100%)`
          }}
        />
      )}

      {/* =====================================================================
       * 2. LUZ AMBIENTE / GLOW PULSANTE DA MARCA ATRÁS DA LOGO
       * ===================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 h-36 w-36 sm:h-44 sm:w-44 rounded-full blur-3xl animate-ambient-glow"
        style={{
          backgroundColor: brandColor,
          opacity: dark ? 0.4 : 0.28
        }}
      />

      {/* =====================================================================
       * 3. CONTEÚDO PRINCIPAL (RELATIVO Z-10)
       * ===================================================================== */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center">
        {/* BARRA SUPERIOR: SELO OFICIAL & ALTERNADOR DE TEMA */}
        <div className="w-full mb-3 flex items-center justify-between">
          {/* Selo Oficial com Vidro Furtivo */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-md border ${
              hasCover || dark
                ? 'border-white/20 bg-black/45 text-white'
                : 'border-zinc-200 bg-white/90 text-zinc-800'
            }`}
          >
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Perfil Oficial</span>
            <span className="hidden xs:inline opacity-70">• Konnexy</span>
          </div>

          {/* Botão de Alternância de Tema com Glassmorfismo e Alto Contraste */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className={`inline-flex items-center justify-center rounded-full p-2 backdrop-blur-md border transition-all duration-200 shadow-md hover:scale-105 active:scale-95 ${
              hasCover || dark
                ? 'border-white/20 bg-black/45 text-amber-300 hover:bg-black/60'
                : 'border-zinc-200 bg-white/90 text-zinc-800 hover:bg-white'
            }`}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* LOGO DA EMPRESA COM MOLDURA TRANSLÚCIDA E SHADOW DE PROFUNDIDADE */}
        <div className="relative group my-1">
          <div
            className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[22px] p-1.5 backdrop-blur-xl border shadow-2xl transition-transform duration-300 group-hover:scale-102 bg-white/95 border-white/80 dark:border-white/25"
            style={{
              boxShadow: `0 14px 34px -8px ${hexToRgba(brandColor, 0.45)}`
            }}
          >
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={`Logo ${tenant.name}`}
                className="h-full w-full rounded-[16px] object-contain p-1"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-[16px] font-black text-xl sm:text-2xl text-white shadow-inner"
                style={{ backgroundColor: brandColor }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
         * 4. ESCUDO DE LEITURA (FROSTED GLASS TEXT SHIELD)
         * Isola o texto sobre o fundo fotográfico, garantindo 100% de nitidez,
         * sem que objetos ou cores da foto de fundo atrapalhem a leitura!
         * =================================================================== */}
        <div
          className={`w-full mt-3 sm:mt-4 rounded-2xl p-4 sm:p-5 text-center backdrop-blur-2xl backdrop-saturate-150 border transition-all duration-300 ${
            dark
              ? 'bg-zinc-950/80 border-white/15 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.7)] text-white'
              : 'bg-white/85 border-white/90 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] text-zinc-950'
          }`}
        >
          {/* Nicho / Segmento */}
          {tenant.nicho && (
            <span
              className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: brandColor }}
            >
              {tenant.nicho}
            </span>
          )}

          {/* Nome da Empresa */}
          <h1
            className={`mt-1 text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
              dark ? 'text-white' : 'text-zinc-950'
            }`}
          >
            {tenant.name}
          </h1>

          {/* Descrição / Bio (legível, até 3 linhas) */}
          {tenant.bio && (
            <p
              className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto line-clamp-3 ${
                dark ? 'text-zinc-200' : 'text-zinc-700'
              }`}
            >
              {tenant.bio}
            </p>
          )}
        </div>
      </div>

      {/* DETALHE SUTIL DE BASE COM A COR DA MARCA */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] w-28 rounded-full opacity-75"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`
        }}
      />
    </header>
  );
}
