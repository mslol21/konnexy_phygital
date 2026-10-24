'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { ForgotPasswordSchema } from '@/lib/schemas/auth';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldError(null);
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.email?.[0] ||
        'Informe um endereço de e-mail válido.';
      setFieldError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('email', parsed.data.email);
      const res = await requestPasswordReset(formData);

      if (res.success) {
        setSentMessage(
          res.message ||
            'Se o e-mail estiver cadastrado, enviamos um link de recuperação de uso único.'
        );
        toast.success('Solicitação processada com segurança');
      } else {
        setFieldError(res.message || 'Verifique o e-mail informado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 opacity-20 blur-3xl bg-gradient-to-b from-indigo-500/25 via-amber-500/10 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-zinc-800/80 bg-zinc-900/75 backdrop-blur-xl p-7 sm:p-8 shadow-2xl"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o Login
        </Link>

        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Recuperação Anti-Enumeração
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            Recuperar Credencial
          </h1>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            Informe seu e-mail corporativo para receber um link temporário de uso único para redefinição de senha.
          </p>
        </div>

        {sentMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-xs leading-relaxed text-zinc-200">{sentMessage}</p>
            <div className="pt-2">
              <Link
                href="/reset-password"
                className="inline-flex items-center justify-center w-full rounded-xl bg-white py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-100 transition"
              >
                Simular Abertura do Link (/reset-password)
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-zinc-300"
              >
                E-mail Cadastrado
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              {fieldError && (
                <p className="mt-1.5 text-[11px] text-rose-400">{fieldError}</p>
              )}
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-zinc-950 shadow-lg hover:bg-zinc-100 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando link seguro...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Link de Recuperação
                </>
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
