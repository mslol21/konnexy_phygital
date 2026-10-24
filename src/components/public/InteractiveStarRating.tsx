'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface InteractiveStarRatingProps {
  rating: number;
  onChange: (newRating: number) => void;
  primaryColor?: string;
}

const RATING_LABELS: Record<number, { text: string; tone: string }> = {
  1: { text: 'Precisa melhorar muito', tone: 'text-rose-500 dark:text-rose-400' },
  2: { text: 'Abaixo do esperado', tone: 'text-orange-500 dark:text-orange-400' },
  3: { text: 'Experiência regular', tone: 'text-amber-500 dark:text-amber-400' },
  4: { text: 'Muito bom! Gostei bastante', tone: 'text-emerald-600 dark:text-emerald-400' },
  5: { text: 'Experiência impecável! Nota 10', tone: 'text-amber-500 dark:text-amber-300' }
};

export function InteractiveStarRating({
  rating,
  onChange
}: InteractiveStarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const displayValue = hoveredStar || rating;
  const activeFeedback = RATING_LABELS[displayValue];

  return (
    <div className="flex flex-col items-center">
      <div
        className="inline-flex items-center gap-1.5 sm:gap-2.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-950/70 px-3.5 py-2.5 shadow-inner"
        onMouseLeave={() => setHoveredStar(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          const isSelected = star === rating;

          return (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.14, y: -2 }}
              whileTap={{ scale: 0.86 }}
              onMouseEnter={() => setHoveredStar(star)}
              onClick={() => onChange(star)}
              aria-label={`Avaliar com ${star} de 5 estrelas`}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isSelected
                  ? 'bg-amber-400/15 dark:bg-amber-400/10'
                  : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Star
                className={`h-7 w-7 transition-all duration-200 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.55)] scale-105'
                    : 'text-zinc-300 dark:text-zinc-700'
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Micro-badge de estado semântico */}
      <div className="mt-2.5 h-5 flex items-center justify-center">
        {activeFeedback ? (
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs font-semibold tracking-tight ${activeFeedback.tone}`}
          >
            {activeFeedback.text}
          </motion.span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Toque em uma estrela para iniciar
          </span>
        )}
      </div>
    </div>
  );
}
