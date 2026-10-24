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
  KeyRound
} from 'lucide-react';
import type { UserRole } from '@/types/phygital';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ceo@konnexy.app');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error('Bloqueio Anti-Força Bruta Ativado (HTTP 429)', {
          description: data.error
        });
        return;
      }

      if (!res.ok) {
        toast.error(data.error || 'Credenciais inválidas.');
        return;
      }

      if (selectedRole === 'super_admin') {
        toast.success('Autenticado como Super Admin (Sessão Assinada)', {
          description: 'Acesso total liberado à gestão de tenants e faturamento.'
        });
        router.push('/super-admin');
      } else {
        toast.success('Autenticado como Lojista (Tenant Admin)', {
          description: 'Redirecionando para o painel do seu estabelecimento.'
        });
        router.push('/dashboard');
      }
    } catch {
      toast.error('Erro de conexão ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 opacity-25 blur-3xl bg-gradient-to-b from-amber-500/30 via-indigo-500/20 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800/80 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl"
      >
        <div className="text-center">
          <Link href="/" className="inline-block">
            <img
              src="/logos/konnexy-logo.svg"
              alt="Konnexy Tag"
              className="mx-auto h-14 w-14 rounded-2xl shadow-lg"
            />
          </Link>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-0.5 text-[11px] font-semibold text-zinc-400">
            <KeyRound className="h-3 w-3 text-amber-400" /> RBAC & Anti-Brute-Force (5 req/15m)
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            Acesso Seguro Konnexy
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Sessão assinada via HMAC com auditoria de acesso no Middleware
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('super_admin');
              setEmail('ceo@konnexy.app');
            }}
            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
              selectedRole === 'super_admin'
                ? 'border-amber-500/60 bg-amber-500/10 text-white shadow-sm'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 ${
                selectedRole === 'super_admin' ? 'text-amber-400' : 'text-zinc-500'
              }`}
            />
            <span className="mt-2 text-xs font-bold">Super Admin</span>
            <span className="text-[10px] text-zinc-400">Dono do SaaS / Tenants</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('tenant_admin');
              setEmail('contato@domcorleone.com.br');
            }}
            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
              selectedRole === 'tenant_admin'
                ? 'border-indigo-500/60 bg-indigo-500/10 text-white shadow-sm'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Store
              className={`h-5 w-5 ${
                selectedRole === 'tenant_admin' ? 'text-indigo-400' : 'text-zinc-500'
              }`}
            />
            <span className="mt-2 text-xs font-bold">Tenant Admin</span>
            <span className="text-[10px] text-zinc-400">Painel do Lojista</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400">
              E-mail Corporativo
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400">Senha</label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-zinc-950 shadow-lg hover:bg-zinc-100 transition"
          >
            {isLoading ? (
              'Verificando Rate Limit & Assinatura...'
            ) : (
              <>
                Entrar como {selectedRole === 'super_admin' ? 'Super Admin' : 'Lojista'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
