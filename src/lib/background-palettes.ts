import type { BackgroundTheme } from '@/types/phygital';

/** Valores explícitos: evita CSS injetado por usuários e preserva legibilidade. */
export const BACKGROUND_PALETTES: Record<BackgroundTheme, {
  label: string; background: string; tint: string; accent: string;
}> = {
  dark: { label: 'Escuro', background: '#18181B', tint: '#09090B', accent: '#6366F1' },
  cream: { label: 'Creme', background: '#FFF9ED', tint: '#F5EADC', accent: '#D2B894' },
  sage: { label: 'Sálvia', background: '#F1F7F0', tint: '#DFEADF', accent: '#9CBDA4' },
  lavender: { label: 'Lavanda', background: '#F7F2FC', tint: '#EAE0F5', accent: '#B6A0D4' },
  blush: { label: 'Rosé', background: '#FFF5F5', tint: '#F6E0E6', accent: '#D9ACBB' },
  sky: { label: 'Azul suave', background: '#F0F8FE', tint: '#DCECF8', accent: '#91BBD7' },
};
