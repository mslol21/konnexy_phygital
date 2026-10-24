'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'default' | 'success' | 'error' | 'info';
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let memoryToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function emit() {
  listeners.forEach((l) => l([...memoryToasts]));
}

function addToast(item: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2, 10);
  const newToast: ToastItem = { id, duration: 3600, ...item };
  memoryToasts = [newToast, ...memoryToasts].slice(0, 4);
  emit();

  setTimeout(() => {
    dismissToast(id);
  }, newToast.duration);

  return id;
}

export function dismissToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emit();
}

export const toast = Object.assign(
  (title: string, opts?: { description?: string; duration?: number }) =>
    addToast({ title, type: 'default', ...opts }),
  {
    success: (title: string, opts?: { description?: string; duration?: number }) =>
      addToast({ title, type: 'success', ...opts }),
    error: (title: string, opts?: { description?: string; duration?: number }) =>
      addToast({ title, type: 'error', ...opts }),
    info: (title: string, opts?: { description?: string; duration?: number }) =>
      addToast({ title, type: 'info', ...opts })
  }
);

export function Toaster({
  position = 'top-center'
}: {
  position?: 'top-center' | 'bottom-right' | 'top-right';
  richColors?: boolean;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  const posClasses =
    position === 'bottom-right'
      ? 'bottom-5 right-5 items-end'
      : position === 'top-right'
      ? 'top-5 right-5 items-end'
      : 'top-4 left-1/2 -translate-x-1/2 items-center';

  return (
    <div
      className={`fixed z-[100] flex flex-col gap-2.5 pointer-events-none w-full max-w-sm px-4 ${posClasses}`}
      aria-live="polite"
    >
      {toasts.map((t, index) => (
        <div
          key={t.id}
          style={{
            transform: `scale(${1 - index * 0.03}) translateY(${index * 2}px)`,
            opacity: 1 - index * 0.12
          }}
          className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-4 py-3.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.28)] transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {t.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500" />}
            {t.type === 'info' && <Info className="h-4 w-4 text-sky-500" />}
            {t.type === 'default' && <Sparkles className="h-4 w-4 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t.title}
            </p>
            {t.description && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
