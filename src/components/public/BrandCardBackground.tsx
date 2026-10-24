'use client';

import React from 'react';

export type BrandWatermarkType =
  | 'google'
  | 'whatsapp'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'youtube'
  | 'pix'
  | 'wifi'
  | 'services'
  | 'services_barber'
  | 'services_food'
  | 'services_clinic'
  | 'services_pet'
  | 'menu';

interface BrandCardBackgroundProps {
  brand: BrandWatermarkType;
  /** Posição do símbolo ao fundo (default: 'right') */
  align?: 'right' | 'center' | 'top-right';
  /** Tamanho do símbolo em px (default: 138) */
  size?: number;
  /** Opacidade do símbolo (default: 0.16) */
  opacity?: number;
}

/**
 * Resolve automaticamente o tema visual de Serviços de acordo com o nicho do lojista
 */
export function resolveServiceBrandByNicho(nicho?: string): BrandWatermarkType {
  const normalized = (nicho || '').toLowerCase();
  if (
    normalized.includes('barbearia') ||
    normalized.includes('salão') ||
    normalized.includes('salao') ||
    normalized.includes('beleza')
  ) {
    return 'services_barber';
  }
  if (
    normalized.includes('restaurante') ||
    normalized.includes('burger') ||
    normalized.includes('hamburgueria') ||
    normalized.includes('gastronomia') ||
    normalized.includes('bar') ||
    normalized.includes('café')
  ) {
    return 'services_food';
  }
  if (
    normalized.includes('clínica') ||
    normalized.includes('clinica') ||
    normalized.includes('odonto') ||
    normalized.includes('saúde') ||
    normalized.includes('estética')
  ) {
    return 'services_clinic';
  }
  if (normalized.includes('pet') || normalized.includes('veterin')) {
    return 'services_pet';
  }
  return 'services';
}

/**
 * Ícone Oficial Colorido do "G" do Google (4 cores oficiais)
 */
export function GoogleGLogo({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Renderiza ao fundo do card a atmosfera cromática + o símbolo oficial da Big Tech / Rede Social / Serviços
 */
export function BrandCardBackground({
  brand,
  align = 'right',
  size = 138,
  opacity = 0.16
}: BrandCardBackgroundProps) {
  const glowMap: Record<BrandWatermarkType, string> = {
    google:
      'radial-gradient(circle at 85% 20%, rgba(66,133,244,0.22), rgba(234,67,53,0.16) 38%, rgba(251,188,5,0.14) 68%, rgba(52,168,83,0.12) 100%)',
    whatsapp:
      'radial-gradient(circle at 88% 50%, rgba(37,211,102,0.25), rgba(18,140,126,0.10) 65%, transparent 100%)',
    instagram:
      'radial-gradient(circle at 85% 30%, rgba(253,29,29,0.24), rgba(131,58,180,0.22) 48%, rgba(252,176,69,0.16) 85%, transparent 100%)',
    tiktok:
      'radial-gradient(circle at 85% 40%, rgba(254,44,85,0.24), rgba(37,244,238,0.20) 55%, transparent 100%)',
    facebook:
      'radial-gradient(circle at 85% 40%, rgba(24,119,242,0.28), rgba(24,119,242,0.08) 65%, transparent 100%)',
    youtube:
      'radial-gradient(circle at 85% 40%, rgba(255,0,0,0.26), rgba(255,0,0,0.08) 65%, transparent 100%)',
    pix:
      'radial-gradient(circle at 85% 40%, rgba(50,188,173,0.25), rgba(50,188,173,0.08) 65%, transparent 100%)',
    wifi:
      'radial-gradient(circle at 85% 40%, rgba(14,165,233,0.25), rgba(99,102,241,0.12) 65%, transparent 100%)',
    services:
      'radial-gradient(circle at 88% 25%, rgba(245,158,11,0.26), rgba(217,119,6,0.15) 48%, rgba(99,102,241,0.10) 85%, transparent 100%)',
    services_barber:
      'radial-gradient(circle at 88% 25%, rgba(245,158,11,0.28), rgba(217,119,6,0.16) 45%, rgba(239,68,68,0.10) 80%, transparent 100%)',
    services_food:
      'radial-gradient(circle at 88% 25%, rgba(234,88,12,0.28), rgba(245,158,11,0.18) 50%, rgba(220,38,38,0.10) 85%, transparent 100%)',
    services_clinic:
      'radial-gradient(circle at 88% 25%, rgba(14,165,233,0.26), rgba(20,184,166,0.16) 50%, rgba(99,102,241,0.10) 85%, transparent 100%)',
    services_pet:
      'radial-gradient(circle at 88% 25%, rgba(139,92,246,0.26), rgba(245,158,11,0.18) 50%, transparent 100%)',
    menu:
      'radial-gradient(circle at 88% 35%, rgba(245,158,11,0.25), rgba(99,102,241,0.14) 60%, transparent 100%)'
  };

  const posStyle: React.CSSProperties =
    align === 'center'
      ? {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${size}px`,
          height: `${size}px`,
          transform: 'translate(-50%, -50%) rotate(-8deg)',
          opacity,
          pointerEvents: 'none',
          zIndex: 0
        }
      : align === 'top-right'
        ? {
            position: 'absolute',
            right: '-10px',
            top: '-10px',
            width: `${size}px`,
            height: `${size}px`,
            transform: 'rotate(-8deg)',
            opacity,
            pointerEvents: 'none',
            zIndex: 0
          }
        : {
            position: 'absolute',
            right: '-14px',
            bottom: '-14px',
            width: `${size}px`,
            height: `${size}px`,
            transform: 'rotate(-10deg)',
            opacity,
            pointerEvents: 'none',
            zIndex: 0
          };

  return (
    <>
      {/* Iluminação cromática ao fundo com as cores oficiais da marca / serviço */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: glowMap[brand],
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Símbolo Vetorial Representativo ao Fundo */}
      <div aria-hidden="true" style={posStyle}>
        {brand === 'google' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
        )}

        {brand === 'whatsapp' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#25D366"
              d="M24 4C12.95 4 4 12.95 4 24c0 3.62.97 7.01 2.66 9.94L4 44l10.35-2.62C17.18 43.06 20.48 44 24 44c11.05 0 20-8.95 20-20S35.05 4 24 4zm11.67 28.25c-.49 1.38-2.85 2.64-3.98 2.81-1.02.15-2.31.22-3.73-.23-.86-.27-1.97-.64-3.39-1.25-5.96-2.57-9.85-8.57-10.15-8.97-.3-.4-2.42-3.22-2.42-6.14 0-2.92 1.53-4.35 2.07-4.95.54-.6 1.18-.75 1.58-.75.4 0 .79.01 1.13.02.36.02.85-.14 1.33 1.02.49 1.18 1.68 4.09 1.83 4.39.15.3.25.65.05 1.05-.2.4-.3.65-.6.99-.3.35-.62.78-.89 1.05-.3.3-.61.62-.26 1.22.35.6 1.54 2.54 3.31 4.12 2.27 2.02 4.19 2.65 4.79 2.95.6.3.95.25 1.3-.15.35-.4 1.5-1.75 1.9-2.35.4-.6.8-.5 1.35-.3.55.2 3.5 1.65 4.1 1.95.6.3 1 .45 1.15.7.15.25.15 1.43-.34 2.81z"
            />
          </svg>
        )}

        {brand === 'instagram' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <defs>
              <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCB045" />
                <stop offset="50%" stopColor="#FD1D1D" />
                <stop offset="100%" stopColor="#833AB4" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#igGrad)" />
            <circle cx="24" cy="24" r="9" fill="none" stroke="#ffffff" strokeWidth="3.5" />
            <circle cx="34.5" cy="13.5" r="2.5" fill="#ffffff" />
          </svg>
        )}

        {brand === 'tiktok' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#25F4EE"
              d="M33.2 10.2c-1.8-1.5-2.9-3.7-3-6.2h-6.1v25.6c0 3.1-2.5 5.6-5.6 5.6-3.1 0-5.6-2.5-5.6-5.6 0-3.1 2.5-5.6 5.6-5.6.6 0 1.2.1 1.7.3v-6.3c-.6-.1-1.1-.1-1.7-.1-6.5 0-11.8 5.3-11.8 11.8 0 6.5 5.3 11.8 11.8 11.8 6.5 0 11.8-5.3 11.8-11.8V16.8c2.4 1.8 5.4 2.8 8.6 2.8v-6.1c-2.1 0-4.1-.8-5.7-2.3z"
              transform="translate(-1.5, -1.5)"
            />
            <path
              fill="#FE2C55"
              d="M33.2 10.2c-1.8-1.5-2.9-3.7-3-6.2h-6.1v25.6c0 3.1-2.5 5.6-5.6 5.6-3.1 0-5.6-2.5-5.6-5.6 0-3.1 2.5-5.6 5.6-5.6.6 0 1.2.1 1.7.3v-6.3c-.6-.1-1.1-.1-1.7-.1-6.5 0-11.8 5.3-11.8 11.8 0 6.5 5.3 11.8 11.8 11.8 6.5 0 11.8-5.3 11.8-11.8V16.8c2.4 1.8 5.4 2.8 8.6 2.8v-6.1c-2.1 0-4.1-.8-5.7-2.3z"
              transform="translate(1.5, 1.5)"
            />
          </svg>
        )}

        {brand === 'facebook' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#1877F2"
              d="M44 24C44 12.95 35.05 4 24 4S4 12.95 4 24c0 9.98 7.31 18.25 16.88 19.75V29.78h-5.08V24h5.08v-4.41c0-5.01 2.98-7.78 7.55-7.78 2.19 0 4.48.39 4.48.39v4.92h-2.52c-2.49 0-3.26 1.54-3.26 3.13V24h5.55l-.89 5.78h-4.66v13.97C36.69 42.25 44 33.98 44 24z"
            />
          </svg>
        )}

        {brand === 'youtube' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#FF0000"
              d="M43.2 13.9c-.5-2-2-3.5-4-4C35.7 9 24 9 24 9s-11.7 0-15.2.9c-2 .5-3.5 2-4 4C4 17.4 4 24 4 24s0 6.6.8 10.1c.5 2 2 3.5 4 4C12.3 39 24 39 24 39s11.7 0 15.2-.9c2-.5 3.5-2 4-4 .8-3.5.8-10.1.8-10.1s0-6.6-.8-10.1zM20 30.5v-13l10.5 6.5L20 30.5z"
            />
          </svg>
        )}

        {brand === 'pix' && (
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <path
              fill="#32BCAD"
              d="M34.8 29.7c-1.8 0-3.5-.7-4.8-2l-6-6 6-6c1.3-1.3 3-2 4.8-2h1.6l-7.6-7.6c-2.6-2.6-6.9-2.6-9.6 0l-7.6 7.6h1.6c1.8 0 3.5.7 4.8 2l6 6-6 6c-1.3 1.3-3 2-4.8 2h-1.6l7.6 7.6c2.6 2.6 6.9 2.6 9.6 0l7.6-7.6h-1.6z"
            />
          </svg>
        )}

        {brand === 'wifi' && (
          <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round">
            <path d="M4 17C15 7 33 7 44 17" />
            <path d="M11 25C18.5 18 29.5 18 37 25" />
            <path d="M18 33C21.5 30 26.5 30 30 33" />
            <circle cx="24" cy="40" r="2.5" fill="#0EA5E9" />
          </svg>
        )}

        {/* SERVIÇOS DE BARBEARIA: Tesoura Profissional + Coroa Imperial + Navalha */}
        {brand === 'services_barber' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="barberGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            {/* Coroa VIP no topo */}
            <path
              d="M22 14L26 20L32 12L38 20L42 14L40 24H24L22 14Z"
              fill="url(#barberGold)"
            />
            {/* Lâminas da Tesoura Cruzadas */}
            <path
              d="M20 44L46 18M44 44L18 18"
              stroke="url(#barberGold)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Anéis da Tesoura */}
            <circle cx="16" cy="48" r="6.5" stroke="url(#barberGold)" strokeWidth="4" />
            <circle cx="48" cy="48" r="6.5" stroke="url(#barberGold)" strokeWidth="4" />
            {/* Parafuso central dourado */}
            <circle cx="32" cy="31" r="2.5" fill="#FEF3C7" />
            {/* Estrelas de brilho */}
            <path d="M52 14L53.5 17.5L57 19L53.5 20.5L52 24L50.5 20.5L47 19L50.5 17.5L52 14Z" fill="#FBBF24" />
            <path d="M12 18L13 20.5L15.5 21.5L13 22.5L12 25L11 22.5L8.5 21.5L11 20.5L12 18Z" fill="#F59E0B" />
          </svg>
        )}

        {/* SERVIÇOS GASTRONÔMICOS: Cloche Gourmet + Chama Artesanal + Estrelas */}
        {brand === 'services_food' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="60%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            {/* Cloche Gourmet */}
            <path
              d="M12 42C12 29.85 20.95 20 32 20C43.05 20 52 29.85 52 42H12Z"
              stroke="url(#foodGrad)"
              strokeWidth="4"
              fill="url(#foodGrad)"
              fillOpacity="0.2"
            />
            <circle cx="32" cy="15" r="3.5" stroke="url(#foodGrad)" strokeWidth="3.5" />
            <path d="M8 47H56" stroke="url(#foodGrad)" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M16 53H48" stroke="url(#foodGrad)" strokeWidth="3.5" strokeLinecap="round" />
            {/* Estrela Gourmet */}
            <path d="M50 12L51.5 15.5L55 17L51.5 18.5L50 22L48.5 18.5L45 17L48.5 15.5L50 12Z" fill="#FBBF24" />
          </svg>
        )}

        {/* SERVIÇOS CLÍNICOS & ESTÉTICA: Escudo Diamante + Cruz + Brilho */}
        {brand === 'services_clinic' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="clinicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
            <path
              d="M32 10L50 18V32C50 44.5 42.2 53.6 32 57C21.8 53.6 14 44.5 14 32V18L32 10Z"
              stroke="url(#clinicGrad)"
              strokeWidth="4"
              fill="url(#clinicGrad)"
              fillOpacity="0.18"
            />
            <path d="M32 24V40M24 32H40" stroke="url(#clinicGrad)" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M50 10L51.5 13.5L55 15L51.5 16.5L50 20L48.5 16.5L45 15L48.5 13.5L50 10Z" fill="#38BDF8" />
          </svg>
        )}

        {/* SERVIÇOS PET SHOP: Patinha VIP + Coração */}
        {brand === 'services_pet' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="petGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="40" rx="12" ry="10" fill="url(#petGrad)" />
            <circle cx="18" cy="26" r="5" fill="url(#petGrad)" />
            <circle cx="27" cy="20" r="5" fill="url(#petGrad)" />
            <circle cx="37" cy="20" r="5" fill="url(#petGrad)" />
            <circle cx="46" cy="26" r="5" fill="url(#petGrad)" />
          </svg>
        )}

        {/* SERVIÇOS GERAIS / CATÁLOGO VIP: Diamante + Coroa + Estrelas */}
        {brand === 'services' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="vipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <path
              d="M20 14H44L54 26L32 52L10 26L20 14Z"
              stroke="url(#vipGrad)"
              strokeWidth="4"
              fill="url(#vipGrad)"
              fillOpacity="0.18"
              strokeLinejoin="round"
            />
            <path d="M10 26H54" stroke="url(#vipGrad)" strokeWidth="3.5" />
            <path d="M20 14L26 26L32 14L38 26L44 14" stroke="url(#vipGrad)" strokeWidth="3" strokeLinejoin="round" />
            <path d="M32 52L26 26M32 52L38 26" stroke="url(#vipGrad)" strokeWidth="3" />
          </svg>
        )}

        {/* CARDÁPIO / CARTA DE SERVIÇOS */}
        {brand === 'menu' && (
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
            <defs>
              <linearGradient id="menuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <rect x="14" y="10" width="36" height="44" rx="6" stroke="url(#menuGrad)" strokeWidth="4" fill="url(#menuGrad)" fillOpacity="0.16" />
            <path d="M22 22H42M22 31H42M22 40H34" stroke="url(#menuGrad)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </>
  );
}
