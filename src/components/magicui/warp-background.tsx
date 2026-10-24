'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface WarpBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  gridColor?: string;
}

interface BeamSpec {
  id: string;
  x: number;
  hue: number;
  delay: number;
  duration: number;
}

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 180,
  beamsPerSide = 4,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3.5,
  gridColor = 'rgba(245, 158, 11, 0.14)',
  className,
  style,
  ...props
}) => {
  const beamsBySide = useMemo(() => {
    const sides = ['top', 'bottom', 'left', 'right'] as const;
    const cellsPerSide = Math.max(1, Math.floor(100 / beamSize));

    return sides.map((side, sideIdx) => {
      const list: BeamSpec[] = [];
      for (let i = 0; i < beamsPerSide; i++) {
        const seed = (sideIdx + 1) * 97 + (i + 1) * 31;
        const xCell = ((seed * 13) % cellsPerSide) * beamSize;
        const hue = (seed * 47) % 360;
        const normalized = ((seed * 19) % 100) / 100;
        const delay = beamDelayMin + normalized * (beamDelayMax - beamDelayMin);
        list.push({
          id: `${side}-${i}`,
          x: xCell,
          hue,
          delay: Number(delay.toFixed(2)),
          duration: Number((beamDuration + (i % 3) * 0.4).toFixed(2))
        });
      }
      return { side, list };
    });
  }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin, beamDuration]);

  const planeGridStyle = (transform: string): React.CSSProperties => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform,
    transformStyle: 'preserve-3d',
    backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
    backgroundSize: `${beamSize}% ${beamSize}%`
  });

  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        ...style
      }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-zinc-200/70 dark:border-zinc-800/80',
        className
      )}
      {...props}
    >
      {/* 3D Perspective Warp Grid Tunnel */}
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
          overflow: 'hidden',
          perspective: `${perspective}px`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Top Plane */}
        <div
          style={{
            ...planeGridStyle('rotateX(-65deg)'),
            top: '-50%',
            left: 0,
            transformOrigin: 'bottom'
          }}
        >
          {beamsBySide[0].list.map((beam) => (
            <div
              key={beam.id}
              style={{
                position: 'absolute',
                top: 0,
                left: `${beam.x}%`,
                width: `${beamSize}%`,
                height: '35%',
                opacity: 0.65,
                borderRadius: '9999px',
                background: `linear-gradient(hsl(${beam.hue} 85% 62%), transparent)`
              }}
            />
          ))}
        </div>

        {/* Bottom Plane */}
        <div
          style={{
            ...planeGridStyle('rotateX(65deg)'),
            bottom: '-50%',
            left: 0,
            transformOrigin: 'top'
          }}
        >
          {beamsBySide[1].list.map((beam) => (
            <div
              key={beam.id}
              style={{
                position: 'absolute',
                top: 0,
                left: `${beam.x}%`,
                width: `${beamSize}%`,
                height: '35%',
                opacity: 0.65,
                borderRadius: '9999px',
                background: `linear-gradient(hsl(${beam.hue} 85% 62%), transparent)`
              }}
            />
          ))}
        </div>

        {/* Left Plane */}
        <div
          style={{
            ...planeGridStyle('rotateY(65deg)'),
            left: '-50%',
            top: 0,
            transformOrigin: 'right'
          }}
        >
          {beamsBySide[2].list.map((beam) => (
            <div
              key={beam.id}
              style={{
                position: 'absolute',
                top: 0,
                left: `${beam.x}%`,
                width: `${beamSize}%`,
                height: '35%',
                opacity: 0.65,
                borderRadius: '9999px',
                background: `linear-gradient(hsl(${beam.hue} 85% 62%), transparent)`
              }}
            />
          ))}
        </div>

        {/* Right Plane */}
        <div
          style={{
            ...planeGridStyle('rotateY(-65deg)'),
            right: '-50%',
            top: 0,
            transformOrigin: 'left'
          }}
        >
          {beamsBySide[3].list.map((beam) => (
            <div
              key={beam.id}
              style={{
                position: 'absolute',
                top: 0,
                left: `${beam.x}%`,
                width: `${beamSize}%`,
                height: '35%',
                opacity: 0.65,
                borderRadius: '9999px',
                background: `linear-gradient(hsl(${beam.hue} 85% 62%), transparent)`
              }}
            />
          ))}
        </div>
      </div>

      {/* Foreground Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {children}
      </div>
    </div>
  );
};
