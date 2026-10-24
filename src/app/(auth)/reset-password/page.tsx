'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import {
  evaluatePasswordStrength,
  UpdatePasswordSchema
} from '@/lib/schemas/auth';
import { updatePassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    const parsed = UpdatePasswordSchema.safeParse({
      password,
      confirmPassword
    });

    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.password?.[0] ||
        parsed.error.flatten().fieldErrors.confirmPassword?.[0] ||
        'A senha não atende aos critérios de segurança.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('password', parsed.data.password);
      formData.set('confirmPassword', parsed.data.confirmPassword);

      const res = await updatePassword(formData);
      if (res.success) {
        toast.success('Nova senha configurada com sucesso!', {
          description: 'Redirecionando para a tela de login...'
        });
        router.push('/login');
      } else {
        setErrorMsg(res.message || 'Erro ao redefinir a senha.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const criteriaList = [
    { label: 'Mínimo de 8 caracteres', met: strength.checks.minLength },
    { label: 'Pelo menos 1 letra maiúscula (A-Z)', met: strength.checks.hasUpper },
    { label: 'Pelo menos 1 letra minúscula (a-z)', met: strength.checks.hasLower },
    { label: 'Pelo menos 1 número (0-9)', met: strength.checks.hasNumber },
    { label: 'Pelo menos 1 caractere especial (@, #, !, $)', met: strength.checks.hasSpecial }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 opacity-20 blur-3xl bg-gradient-to-b from-emerald-500/25 via-indigo-500/10 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[430px] rounded-3xl border border-zinc-800/80 bg-zinc-900/75 backdrop-blur-xl p-7 sm:p-8 shadow-2xl"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Login
        </Link>

        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Política de Senha Forte
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            Definir Nova Senha
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Crie uma credencial forte para proteger o painel do seu estabelecimento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-zinc-300"
            >
              Nova Senha
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                id="new-password"
                type={showPass ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* MEDIDOR VISUAL DE FORÇA DA SENHA (FRACA / MÉDIA / FORTE) */}
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-400">Força da Senha:</span>
              <span className="font-bold text-white">
                {password.length === 0 ? 'Aguardando digitação' : strength.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    password.length > 0 && bar <= strength.score
                      ? strength.colorClass
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            <ul className="space-y-1.5 pt-1">
              {criteriaList.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 text-[11px] transition ${
                    item.met ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                      item.met
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-zinc-700'
                    }`}
                  >
                    {item.met && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-zinc-300"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                id="confirm-password"
                type={showPass ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-rose-400">{errorMsg}</p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-zinc-950 shadow-lg hover:bg-zinc-100 transition disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando credencial...
              </>
            ) : (
              'Salvar Nova Senha e Entrar'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
