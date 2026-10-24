'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ children, className, variant = 'default', size = 'default', style, ...props }, ref) => {
    const sizeClasses = {
      default: 'px-6 py-2.5 text-sm',
      sm: 'px-4 py-2.5 text-xs',
      lg: 'px-8 py-3.5 text-sm sm:text-base',
      icon: 'p-2.5'
    }[size];

    return (
      <button
        ref={ref}
        style={{
          position: 'relative',
          isolation: 'isolate',
          backgroundImage:
            variant === 'default'
              ? 'linear-gradient(#121215, #121215), linear-gradient(90deg, #ff4d4d, #f59e0b, #10b981, #3b82f6, #a855f7, #ff4d4d)'
              : 'linear-gradient(#ffffff, #ffffff), linear-gradient(90deg, #ff4d4d, #f59e0b, #10b981, #3b82f6, #a855f7, #ff4d4d)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          backgroundSize: '200% 100%',
          border: '2px solid transparent',
          color: variant === 'default' ? '#ffffff' : '#18181b',
          ...style
        }}
        className={cn(
          'group relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] shadow-md hover:shadow-lg',
          sizeClasses,
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '15%',
            width: '70%',
            height: '8px',
            zIndex: 0,
            pointerEvents: 'none',
            borderRadius: '9999px',
            opacity: 0.55,
            background: 'linear-gradient(90deg, #ff4d4d, #f59e0b, #10b981, #3b82f6, #a855f7)',
            filter: 'blur(8px)'
          }}
        />
        <span
          style={{ position: 'relative', zIndex: 1 }}
          className="inline-flex items-center justify-center gap-2"
        >
          {children}
        </span>
      </button>
    );
  }
);

RainbowButton.displayName = 'RainbowButton';
