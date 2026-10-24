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
import type { UserRole } from '@/types/phygital';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ceo@konnexy.app');
  const [password, setPassword] = useState('Konnexy@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
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
      password,
      role: selectedRole
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
          password: parsed.data.password,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        setErrorMessage(data.error);
        toast.error('Proteção Anti-Força Bruta (HTTP 429)', {
          description: data.error
        });
        return;
      }

      if (!res.ok) {
        // Mensagem padronizada e genérica (Prevenção de User Enumeration)
        const genericMsg = 'E-mail ou senha incorretos.';
        setErrorMessage(genericMsg);
        toast.error(genericMsg);
        return;
      }

      if (selectedRole === 'super_admin') {
        toast.success('Sessão SSR HttpOnly iniciada (Super Admin)', {
          description: 'Redirecionando para o painel central...'
        });
        router.push('/super-admin');
      } else {
        toast.success('Sessão SSR HttpOnly iniciada (Lojista)', {
          description: 'Redirecionando para o painel do estabelecimento...'
        });
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('E-mail ou senha incorretos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Iluminação ambiente sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 opacity-20 blur-3xl bg-gradient-to-b from-amber-500/30 via-indigo-500/15 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-zinc-800/80 bg-zinc-900/75 backdrop-blur-xl p-7 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]"
      >
        {/* Cabeçalho Minimalista */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <img
              src="/logos/konnexy-logo.svg"
              alt="Konnexy Tag"
              className="mx-auto h-12 w-12 rounded-2xl shadow-lg"
            />
          </Link>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            <KeyRound className="h-3 w-3 text-amber-400" /> Supabase SSR • HttpOnly Cookies
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white">
            Entrar na Konnexy
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Autenticação corporativa protegida por política de senha forte
          </p>
        </div>

        {/* Seletor Rápido de Contexto RBAC */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setSelectedRole('super_admin');
              setEmail('ceo@konnexy.app');
              setPassword('Konnexy@2026!');
              setErrorMessage(null);
            }}
            className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
              selectedRole === 'super_admin'
                ? 'border-amber-500/60 bg-amber-500/10 text-white shadow-sm'
                : 'border-zinc-800/90 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <ShieldCheck
              className={`h-4 w-4 ${
                selectedRole === 'super_admin' ? 'text-amber-400' : 'text-zinc-500'
              }`}
            />
            <span className="mt-1.5 text-xs font-bold">Super Admin</span>
            <span className="text-[10px] text-zinc-400">Gestão Multi-Tenant</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setSelectedRole('tenant_admin');
              setEmail('contato@domcorleone.com.br');
              setPassword('Konnexy@2026!');
              setErrorMessage(null);
            }}
            className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
              selectedRole === 'tenant_admin'
                ? 'border-indigo-500/60 bg-indigo-500/10 text-white shadow-sm'
                : 'border-zinc-800/90 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Store
              className={`h-4 w-4 ${
                selectedRole === 'tenant_admin' ? 'text-indigo-400' : 'text-zinc-500'
              }`}
            />
            <span className="mt-1.5 text-xs font-bold">Lojista</span>
            <span className="text-[10px] text-zinc-400">Painel do Comércio</span>
          </button>
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
              E-mail Corporativo
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
                placeholder="Mín. 8 chars, A-z, 0-9 e especial"
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

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-zinc-950 shadow-lg hover:bg-zinc-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
