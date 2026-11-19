'use client';

import React from 'react';
import { Sun, Moon, ShieldCheck, Sparkles } from 'lucide-react';
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
    return `rgba(217, 119, 6, ${alpha})`; // fallback dourado / âmbar
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * HeroProfileCard
 * Redesenho de alta fidelidade e sofisticação do primeiro card da micro-página phygital.
 * Elimina o aspecto de "card branco sobre fundo desbotado", unificando identidade visual,
 * iluminação ambiente suave, tipografia de impacto e micro-interações fluidas.
 */
export function HeroProfileCard({
  tenant,
  dark,
  onToggleTheme
}: HeroProfileCardProps) {
  const brandColor = tenant.primary_color || '#d97706';
  const glowLight = hexToRgba(brandColor, dark ? 0.38 : 0.22);
  const glowSubtle = hexToRgba(brandColor, dark ? 0.14 : 0.08);

  const initials = (tenant.name || 'KT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <header
      className={`relative overflow-hidden rounded-[24px] border p-5 sm:p-7 text-center transition-all duration-300 ${
        dark
          ? 'border-white/10 bg-zinc-950/90 text-white shadow-[0_24px_50px_-15px_rgba(0,0,0,0.7)]'
          : 'border-black/5 bg-white/95 text-zinc-900 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)]'
      }`}
      style={{
        backgroundImage: dark
          ? `radial-gradient(ellipse 90% 65% at 50% 0%, ${glowLight} 0%, ${glowSubtle} 50%, rgba(9,9,11,0.95) 100%)`
          : `radial-gradient(ellipse 90% 65% at 50% 0%, ${glowLight} 0%, ${glowSubtle} 45%, rgba(255,255,255,0.98) 100%)`
      }}
    >
      {/* 1. IMAGEM DE CAPA COM MESCLAGEM CINEMATOGRÁFICA (SE CADASTRADA) */}
      {tenant.cover_url && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={tenant.cover_url}
            alt=""
            aria-hidden="true"
            className={`h-full w-full object-cover transition-transform duration-700 hover:scale-105 ${
              dark ? 'opacity-30 mix-blend-luminosity' : 'opacity-20'
            }`}
          />
          {/* Gradiente de fade para assegurar 100% de contraste com os textos */}
          <div
            className={`absolute inset-0 ${
              dark
                ? 'bg-gradient-to-b from-black/40 via-zinc-950/80 to-zinc-950'
                : 'bg-gradient-to-b from-white/30 via-white/80 to-white'
            }`}
          />
        </div>
      )}

      {/* 2. LUZ AMBIENTE / GLOW PULSANTE ATRÁS DA LOGO */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 h-36 w-36 sm:h-44 sm:w-44 rounded-full blur-3xl animate-ambient-glow"
        style={{
          backgroundColor: brandColor,
          opacity: dark ? 0.35 : 0.22
        }}
      />

      {/* 3. BARRA SUPERIOR: SELO DE VERIFICAÇÃO & ALTERNADOR DE TEMA */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        {/* Emblema Oficial / Selo de Autenticidade Konnexy */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border shadow-sm ${
            dark
              ? 'border-white/10 bg-white/10 text-zinc-200'
              : 'border-zinc-200/80 bg-white/80 text-zinc-700'
          }`}
        >
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          <span>Perfil Oficial</span>
          <span className="hidden xs:inline text-zinc-400">• Konnexy</span>
        </div>

        {/* Botão de Alternância de Tema Reposicionado (Discreto e Harmonioso) */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className={`inline-flex items-center justify-center rounded-full p-2 backdrop-blur-md border transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 ${
            dark
              ? 'border-white/15 bg-zinc-900/80 text-amber-300 hover:bg-zinc-800'
              : 'border-zinc-200/90 bg-white/90 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* 4. BLOCO CENTRAL: LOGO COM AURA E MOLDURA CHANFRADA */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative group">
          {/* Anel Externo Translúcido */}
          <div
            className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[24px] p-1.5 backdrop-blur-xl border shadow-xl transition-transform duration-300 group-hover:scale-102 ${
              dark
                ? 'border-white/20 bg-gradient-to-b from-white/15 to-white/5'
                : 'border-black/5 bg-gradient-to-b from-white/90 to-white/60'
            }`}
            style={{
              boxShadow: `0 12px 30px -8px ${hexToRgba(brandColor, dark ? 0.45 : 0.25)}`
            }}
          >
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={`Logo ${tenant.name}`}
                className="h-full w-full rounded-[18px] object-contain bg-white p-1.5 shadow-inner"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-[18px] font-black text-xl sm:text-2xl text-white shadow-inner"
                style={{ backgroundColor: brandColor }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* 5. NICHO / SEGMENTO */}
        {tenant.nicho && (
          <span
            className="mt-3.5 inline-block text-[11px] font-extrabold uppercase tracking-widest"
            style={{ color: brandColor }}
          >
            {tenant.nicho}
          </span>
        )}

        {/* 6. NOME DA EMPRESA (TÍTULO DE DESTAQUE) */}
        <h1
          className={`mt-1 text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
            dark ? 'text-white' : 'text-zinc-950'
          }`}
        >
          {tenant.name}
        </h1>

        {/* 7. DESCRIÇÃO / BIO (ATÉ 3 LINHAS, SEM TRUNCAMENTO INDEVIDO) */}
        {tenant.bio && (
          <p
            className={`mt-2 max-w-sm text-xs sm:text-sm font-medium leading-relaxed line-clamp-3 ${
              dark ? 'text-zinc-300' : 'text-zinc-600'
            }`}
          >
            {tenant.bio}
          </p>
        )}
      </div>

      {/* 8. DETALHE SUTIL DE BASE COM A COR DA MARCA */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-24 rounded-full opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`
        }}
      />
    </header>
  );
}
