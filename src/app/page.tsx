import Link from 'next/link';
import { Nfc, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { WarpBackground } from '@/components/magicui/warp-background';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { RainbowButton } from '@/components/magicui/rainbow-button';
import { Backlight } from '@/components/magicui/backlight';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 py-10">
      <WarpBackground
        perspective={160}
        beamsPerSide={4}
        beamSize={5}
        gridColor="rgba(245, 158, 11, 0.14)"
        className="w-full max-w-5xl bg-zinc-950/90 px-6 py-12 sm:px-12 sm:py-16 shadow-2xl"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <Backlight
              blur={24}
              glowColor="rgba(245, 158, 11, 0.55)"
              secondaryGlowColor="rgba(99, 102, 241, 0.45)"
              className="w-auto"
            >
              <img
                src="/logos/konnexy-logo.svg"
                alt="Konnexy Tag Logo"
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
            </Backlight>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> SaaS Phygital Multi-Tenant (NFC + QR Code + IA)
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Konnexy Tag • Arquitetura Phygital
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            Transforme aproximações no balcão em avaliações 5 estrelas no Google com IA e ative módulos de receita recorrente em menos de 1 segundo.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <Link href="/r/barbearia-premium?src=nfc">
              <RainbowButton size="lg">
                <Nfc className="h-4 w-4 text-amber-400" />
                Testar Placa Pública (/r/barbearia-premium)
              </RainbowButton>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              Painel do Lojista (/dashboard)
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/super-admin"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Super Admin (/super-admin)
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-8 text-left">
            <NeonGradientCard
              borderSize={1.5}
              borderRadius={20}
              neonColors={{ firstColor: '#6366f1', secondColor: '#06b6d4' }}
              innerClassName="p-5 bg-zinc-900/95"
            >
              <Nfc className="h-5 w-5 text-indigo-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Hardware NFC & QR 300 DPI</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Gravação Web NFC para NTAG213/215 e exportação PNG/SVG pronta para placas acrílicas.
              </p>
            </NeonGradientCard>

            <NeonGradientCard
              borderSize={1.5}
              borderRadius={20}
              neonColors={{ firstColor: '#f59e0b', secondColor: '#ec4899' }}
              innerClassName="p-5 bg-zinc-900/95"
            >
              <Sparkles className="h-5 w-5 text-amber-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Google Reviews com Gemini</h3>
              <p className="text-xs text-zinc-400 mt-1">
                3 opções de resenhas otimizadas para SEO Local ao tocar em tags de elogios.
              </p>
            </NeonGradientCard>

            <NeonGradientCard
              borderSize={1.5}
              borderRadius={20}
              neonColors={{ firstColor: '#10b981', secondColor: '#3b82f6' }}
              innerClassName="p-5 bg-zinc-900/95"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Blindagem de Notas 1-3★</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Retém insatisfações em formulário privado e dispara alerta no WhatsApp do gerente.
              </p>
            </NeonGradientCard>
          </div>
        </div>
      </WarpBackground>
    </div>
  );
}
