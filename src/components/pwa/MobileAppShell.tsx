'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Store,
  PlusCircle,
  Smartphone,
  LogOut,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Download
} from 'lucide-react';
import { logout } from '@/app/actions/auth';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Registra Service Worker para habilitar instalação PWA no celular
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }
    setShowInstallModal(true);
  };

  const isSuperAdminActive =
    pathname.startsWith('/super-admin') && searchParams.get('new') !== '1';
  const isNewTenantActive =
    pathname.startsWith('/super-admin') && searchParams.get('new') === '1';
  const isDashboardActive = pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      {/* BARRA SUPERIOR COMPACTA DE CONTROLE DO APP */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/logos/konnexy-logo.svg"
            alt="Konnexy HQ"
            className="h-7 w-7 rounded-lg"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold tracking-tight text-white">
              Konnexy App
            </span>
            {isStandalone ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> App Ativo
              </span>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/25 transition"
              >
                <Download className="h-3 w-3" />
                Instalar no Celular
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      {children}

      {/* BARRA DE NAVEGAÇÃO INFERIOR NATIVA NO CELULAR (MOBILE BOTTOM TAB BAR) */}
      <nav
        aria-label="Navegação Mobile do Aplicativo"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 px-2 py-1.5 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          <Link
            href="/super-admin"
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              isSuperAdminActive
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-5 w-5 mb-0.5" />
            <span>HQ Master</span>
          </Link>

          <Link
            href="/super-admin?new=1"
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              isNewTenantActive
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PlusCircle className="h-5 w-5 mb-0.5 text-amber-400" />
            <span>Nova Loja</span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              isDashboardActive
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="h-5 w-5 mb-0.5" />
            <span>Editor Lojas</span>
          </Link>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition"
          >
            <Smartphone className="h-5 w-5 mb-0.5 text-emerald-400" />
            <span>{isStandalone ? 'App Ativo' : 'Baixar App'}</span>
          </button>
        </div>
      </nav>

      {/* MODAL DE INSTRUÇÕES DE INSTALAÇÃO DO APP NO CELULAR (iOS / ANDROID) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logos/konnexy-logo.svg"
                  alt="Konnexy App"
                  className="h-10 w-10 rounded-xl"
                />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    Web App Instalável (PWA)
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Instalar Konnexy HQ no Celular
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed text-zinc-400">
                Instale o painel **Konnexy HQ** na tela inicial do seu smartphone para abrir em **tela cheia** e controlar clientes, status das placas e QR Codes com 1 toque:
              </p>

              {isIos ? (
                <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-bold text-amber-400">No iPhone / iPad (Safari):</p>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-white">
                      1
                    </span>
                    <span>
                      Toque no botão <strong>Compartilhar</strong>{' '}
                      <Share className="inline h-3.5 w-3.5 text-sky-400" /> na barra do Safari.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-white">
                      2
                    </span>
                    <span>
                      Role para baixo e toque em{' '}
                      <strong>Adicionar à Tela de Início</strong>{' '}
                      <PlusSquare className="inline h-3.5 w-3.5 text-amber-400" />.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-white">
                      3
                    </span>
                    <span>
                      Confirme em <strong>Adicionar</strong> no canto superior direito.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-bold text-emerald-400">No Android / Chrome:</p>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-white">
                      1
                    </span>
                    <span>
                      Toque no menu <strong>⋮ (três pontos)</strong> no canto superior do navegador Chrome.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-white">
                      2
                    </span>
                    <span>
                      Selecione <strong>Instalar aplicativo</strong> ou{' '}
                      <strong>Adicionar à tela inicial</strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
