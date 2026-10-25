'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Store,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LoginCredentialsSchema } from '@/lib/schemas/auth';
import { WarpBackground } from '@/components/magicui/warp-background';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { RainbowButton } from '@/components/magicui/rainbow-button';
import { Backlight } from '@/components/magicui/backlight';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Debounce / bloqueio estrito contra envios múltiplos
    if (isSubmitting) return;

    setErrorMessage(null);

    // Validação defensiva via Zod (RFC Email + Política de Senha Forte)
    const parsed = LoginCredentialsSchema.safeParse({
      email,
      password
    });

    if (!parsed.success) {
      const firstErr =
        parsed.error.flatten().fieldErrors.email?.[0] ||
        parsed.error.flatten().fieldErrors.password?.[0] ||
        'Verifique os dados informados.';
      setErrorMessage(firstErr);
      toast.error('Credenciais fora do padrão de segurança', {
        description: firstErr
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        setErrorMessage(data.error);
        toast.error('Aguarde antes de tentar novamente', {
          description: data.error
        });
        return;
      }

      if (!res.ok) {
        // Mensagem padronizada e genérica (Prevenção de User Enumeration)
        const genericMsg = res.status >= 500 ? 'Serviço indisponível. Tente novamente em instantes.' : data.error || 'E-mail ou senha incorretos.';
        setErrorMessage(genericMsg);
        toast.error(genericMsg);
        return;
      }

      toast.success('Acesso confirmado.');
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setErrorMessage('Não foi possível conectar. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      <WarpBackground
        perspective={180}
        beamsPerSide={3}
        beamSize={5}
        gridColor="rgba(245, 158, 11, 0.14)"
        className="w-full max-w-2xl border-none bg-transparent py-6 flex justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[420px] mx-auto"
        >
          <NeonGradientCard
            borderSize={1.5}
            borderRadius={24}
            neonColors={{ firstColor: '#6366f1', secondColor: '#06b6d4' }}
            innerClassName="p-7 sm:p-8 bg-zinc-900/95"
          >
            {/* Cabeçalho Minimalista */}
            <div className="text-center">
              <Link href="/" className="inline-block">
                <Backlight
                  blur={20}
                  glowColor="rgba(245, 158, 11, 0.5)"
                  className="w-auto"
                >
                  <img
                    src="/logos/konnexy-logo.svg"
                    alt="Konnexy Tag"
                    className="mx-auto h-12 w-12 rounded-2xl shadow-lg"
                  />
                </Backlight>
              </Link>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                <KeyRound className="h-3 w-3 text-amber-400" /> Acesso à sua conta
              </span>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white">
                Entrar na Konnexy
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Gerencie a página e as placas do seu estabelecimento.
              </p>
            </div>

        {/* Alerta de erro padronizado (Anti-User-Enumeration) */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-zinc-300"
            >
              E-mail
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 transition focus:border-zinc-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-zinc-300"
              >
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-zinc-400 hover:text-white transition"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 transition focus:border-zinc-500 focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <RainbowButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autenticando com segurança...
              </>
            ) : (
              <>
                Acessar Plataforma
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </RainbowButton>
        </form>
          </NeonGradientCard>
        </motion.div>
      </WarpBackground>
    </div>
  );
}
