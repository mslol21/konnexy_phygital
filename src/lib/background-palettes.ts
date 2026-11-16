import type { BackgroundTheme } from '@/types/phygital';

/**
 * Paletas de tons médios, levemente dessaturados: mais cor que os pastéis claros,
 * mas sem brilho excessivo. Valores fixos impedem CSS injetado por usuários.
 * Os cartões continuam claros para preservar legibilidade e contraste do texto.
 */
export const BACKGROUND_PALETTES: Record<BackgroundTheme, {
  label: string; background: string; tint: string; accent: string;
}> = {
  dark: { label: 'Escuro', background: '#18181B', tint: '#09090B', accent: '#6366F1' },
  cream: { label: 'Areia quente', background: '#DEC69F', tint: '#C6A779', accent: '#A77840' },
  sage: { label: 'Verde sálvia', background: '#AFCCB5', tint: '#87AD94', accent: '#4B8065' },
  lavender: { label: 'Lavanda', background: '#C3B1D9', tint: '#9D87C2', accent: '#75569E' },
  blush: { label: 'Rosé', background: '#E0B2BF', tint: '#C888A1', accent: '#A65477' },
  sky: { label: 'Azul sereno', background: '#A9CADC', tint: '#7EAFCB', accent: '#397EA5' },
};
