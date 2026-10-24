'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BacklightProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  blur?: number;
  saturation?: number;
  glowColor?: string;
  secondaryGlowColor?: string;
}

/**
 * Magic UI `@magicui/backlight`
 * Projeta uma aura cromática difusa atrás do elemento usando camadas isoladas
 * com estilos inline garantidos.
 */
export const Backlight: React.FC<BacklightProps> = ({
  children,
  className,
  blur = 22,
  glowColor = 'rgba(245, 158, 11, 0.45)',
  secondaryGlowColor,
  style,
  ...props
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        isolation: 'isolate',
        ...style
      }}
      className={cn('relative inline-flex items-center justify-center', className)}
      {...props}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-12px',
          right: '-12px',
          bottom: '-12px',
          left: '-12px',
          zIndex: 0,
          borderRadius: '9999px',
          opacity: 0.6,
          pointerEvents: 'none',
          background: secondaryGlowColor
            ? `radial-gradient(circle at 35% 35%, ${glowColor}, ${secondaryGlowColor}, transparent 72%)`
            : `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
          filter: `blur(${blur}px)`
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
