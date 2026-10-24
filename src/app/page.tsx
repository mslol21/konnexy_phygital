import Link from 'next/link';
import { Nfc, QrCode, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-3xl text-center space-y-6">
        <div className="flex justify-center">
          <img
            src="/logos/konnexy-logo.svg"
            alt="Konnexy Tag Logo"
            className="h-16 w-16 rounded-2xl shadow-lg shadow-amber-500/10"
          />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" /> SaaS Phygital Multi-Tenant (NFC + QR Code + IA)
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Konnexy Tag • Arquitetura Phygital
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Transforme aproximações no balcão em avaliações 5 estrelas no Google com IA e ative módulos de receita recorrente em menos de 1 segundo.
        </p>

        <div className="flex flex-wrap justify-center gap-3.5 pt-4">
          <Link
            href="/super-admin"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            Painel Super Admin (/super-admin)
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
          >
            Painel do Lojista (/dashboard)
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/r/barbearia-premium?src=nfc"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition"
          >
            <Nfc className="h-4 w-4 text-amber-400" />
            Testar Placa Pública (/r/barbearia-premium)
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-8 text-left">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <Nfc className="h-5 w-5 text-indigo-400 mb-2" />
            <h3 className="text-sm font-bold">Hardware NFC & QR 300 DPI</h3>
            <p className="text-xs text-slate-400 mt-1">
              Gravação Web NFC para NTAG213/215 e exportação PNG/SVG pronta para placas acrílicas.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <Sparkles className="h-5 w-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold">Google Reviews com Gemini</h3>
            <p className="text-xs text-slate-400 mt-1">
              3 opções de resenhas otimizadas para SEO Local ao tocar em tags de elogios.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold">Blindagem de Notas 1-3★</h3>
            <p className="text-xs text-slate-400 mt-1">
              Retém insatisfações em formulário privado e dispara alerta no WhatsApp do gerente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
