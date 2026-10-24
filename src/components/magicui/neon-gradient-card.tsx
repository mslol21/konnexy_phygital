'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface NeonColorsProps {
  firstColor: string;
  secondColor: string;
}

export interface NeonGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
  borderSize?: number;
  borderRadius?: number;
  neonColors?: NeonColorsProps;
}

/**
 * Magic UI `@magicui/neon-gradient-card`
 * Renderiza borda e aura neon animadas com isolamento de stacking context,
 * garantindo que o conteúdo interno esteja sempre 100% visível em qualquer tema.
 */
export const NeonGradientCard: React.FC<NeonGradientCardProps> = ({
  className,
  innerClassName,
  children,
  borderSize = 2,
  borderRadius = 24,
  neonColors = {
    firstColor: '#f59e0b',
    secondColor: '#6366f1'
  },
  style,
  ...props
}) => {
  const innerRadius = Math.max(8, borderRadius - borderSize);

  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        borderRadius: `${borderRadius}px`,
        padding: `${borderSize}px`,
        backgroundImage: `linear-gradient(135deg, ${neonColors.firstColor}, ${neonColors.secondColor}, ${neonColors.firstColor})`,
        backgroundSize: '200% 200%',
        ...style
      }}
      className={cn('relative w-full shadow-lg transition-all duration-300', className)}
      {...props}
    >
      {/* Aura Neon Difusa Externa (sempre atrás da superfície principal) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: `${borderRadius}px`,
          backgroundImage: `linear-gradient(135deg, ${neonColors.firstColor}, ${neonColors.secondColor})`,
          filter: 'blur(16px)',
          opacity: 0.32
        }}
      />

      {/* Superfície Interna de Alto Contraste (sempre acima na camada zIndex: 1) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          borderRadius: `${innerRadius}px`
        }}
        className={cn(
          'relative w-full bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 p-6 backdrop-blur-md',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
