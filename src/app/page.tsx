import Link from 'next/link';
import {
  Nfc,
  MessageCircle,
  QrCode,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Layers,
  Store,
  ChevronRight
} from 'lucide-react';
import { WarpBackground } from '@/components/magicui/warp-background';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { RainbowButton } from '@/components/magicui/rainbow-button';

export default function HomePage() {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const contact = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        'Olá! Quero saber mais sobre a placa Konnexy Tag para meu negócio.'
      )}`
    : null;

  const demoExamples = [
    {
      slug: 'barbearia-premium',
      name: 'Barbearia Dom Corleone',
      nicho: 'Barbearia & Estética',
      color: '#D97706',
      badge: 'Corte + Barboterapia',
      rating: '5.0 ★'
    },
    {
      slug: 'burger-lab-artesanal',
      name: 'Burger Lab Smash & Beer',
      nicho: 'Hamburgueria Artesanal',
      color: '#EF4444',
      badge: 'Cardápio Digital',
      rating: '4.9 ★'
    },
    {
      slug: 'clinica-sorriso-prime',
      name: 'Odonto Sorriso Prime',
      nicho: 'Clínica Odontológica',
      color: '#0EA5E9',
      badge: 'Agendamento WhatsApp',
      rating: '5.0 ★'
    },
    {
      slug: 'petshop-amigo-fiel',
      name: 'Pet Shop Amigo Fiel',
      nicho: 'Pet Shop & Veterinária',
      color: '#10B981',
      badge: 'Banho & Tosa',
      rating: '4.8 ★'
    }
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-400 selection:text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* =====================================================================
         * HEADER / NAV RESPONSIVO
         * ===================================================================== */}
        <nav className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-6 mb-8 sm:mb-12">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-base sm:text-xl tracking-tight">
            <img
              src="/logos/konnexy-logo.svg"
              alt="Konnexy Tag"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-lg shrink-0"
            />
            <span className="truncate">Konnexy Tag</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
            >
              Área do Cliente
            </Link>
          </div>
        </nav>

        {/* =====================================================================
         * HERO SECTION COM WARP BACKGROUND
         * ===================================================================== */}
        <WarpBackground
          beamsPerSide={3}
          className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-10 sm:px-8 sm:py-16 lg:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              Seu balcão conectado ao celular do cliente
            </span>

            <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Um toque para aproximar seu cliente do seu negócio.
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
              Com uma placa NFC e QR Code de alta precisão (ECC Level H), seus clientes acessam avaliações no Google, WhatsApp, Pix, Wi-Fi e cardápio instantaneamente no celular.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              {contact ? (
                <a
                  href={contact}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-zinc-950 px-6 py-3.5 text-sm font-bold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition text-center"
                >
                  Quero minha placa
                  <ArrowRight size={18} />
                </a>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-zinc-950 px-6 py-3.5 text-sm font-bold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition text-center"
                >
                  Começar agora
                  <ArrowRight size={18} />
                </Link>
              )}

              <Link
                href="/r/barbearia-premium"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition text-center"
              >
                Ver demonstração real
              </Link>

              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 text-center"
              >
                Veja como funciona ↓
              </a>
            </div>
          </div>
        </WarpBackground>

        {/* =====================================================================
         * VITRINE DE EXEMPLOS POR NICHO (RESPONSIVA)
         * ===================================================================== */}
        <section className="py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Experiências Demonstrativas
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Ideal para qualquer tipo de comércio
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
              Toque para abrir a página de exemplo exatamente como seus clientes verão no celular.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoExamples.map((ex) => (
              <Link
                key={ex.slug}
                href={`/r/${ex.slug}`}
                className="group block rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 hover:border-amber-400/50 hover:bg-zinc-900/90 transition shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                    style={{ backgroundColor: ex.color }}
                  >
                    {ex.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {ex.rating}
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-base text-white group-hover:text-amber-400 transition truncate">
                  {ex.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{ex.nicho}</p>

                <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">{ex.badge}</span>
                  <span className="font-semibold text-zinc-300 group-hover:translate-x-1 transition flex items-center gap-1">
                    Ver página <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================
         * COMO FUNCIONA (GRID RESPONSIVO)
         * ===================================================================== */}
        <section id="como-funciona" className="py-12 sm:py-16 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Passo a Passo Físico-Digital
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Simples para você. Fácil para o cliente.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400">
              Sem precisar baixar aplicativos ou digitar senhas difíceis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Nfc,
                step: '01',
                title: 'Aproxime ou escaneie',
                text: 'O cliente aproxima qualquer smartphone compatível no chip NFC da placa acrílica ou lê o QR Code direto pela câmera.'
              },
              {
                icon: QrCode,
                step: '02',
                title: 'Abre a página da empresa',
                text: 'Uma micro-página leve com sua marca, capa personalizada 16:9, iluminação neon e atalhos customizados para seu balcão.'
              },
              {
                icon: MessageCircle,
                step: '03',
                title: 'Escolha o próximo passo',
                text: 'Avaliar no Google com 1 toque, falar no WhatsApp, copiar chave Pix, conectar no Wi-Fi sem senha ou ver o cardápio digital.'
              }
            ].map(({ icon: Icon, step, title, text }) => (
              <NeonGradientCard key={title} innerClassName="h-full p-6 sm:p-7 bg-zinc-900/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-500">ETAPA {step}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white">{title}</h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">{text}</p>
                </div>
              </NeonGradientCard>
            ))}
          </div>
        </section>

        {/* =====================================================================
         * DIFERENCIAIS DA PLATAFORMA (2 COLUNAS RESPONSIVAS)
         * ===================================================================== */}
        <section className="py-12 sm:py-16 border-t border-zinc-800/80">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-10 lg:p-12">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Tecnologia Blindada
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Uma presença digital que acompanha seu atendimento
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400">
                Construído para operar com latência zero e segurança corporativa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
              {[
                { title: 'Links Imutáveis com Redirecionamento Dinâmico', desc: 'Altere promoções, WhatsApp ou serviços sem nunca precisar reimprimir a placa acrílica.' },
                { title: 'QR Code Vetorial de Alta Densidade (ECC Level H)', desc: 'Leitura mesmo com até 30% de desgaste físico ou arranhões na peça.' },
                { title: 'Compatível com Web NFC API e iPhones', desc: 'Funciona com aproximação nativa em Android e leitura de câmera em iOS.' },
                { title: 'Painel Master Mobile & PWA Instalável', desc: 'Gerencie múltiplos comércios, consulte acessos e ative kill-switch pelo celular.' }
              ].map((item) => (
                <div key={item.title} className="flex gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 mt-0.5">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
         * FOOTER RESPONSIVO
         * ===================================================================== */}
        <footer className="border-t border-zinc-800/80 pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <img src="/logos/konnexy-logo.svg" alt="" className="h-5 w-5 rounded shrink-0" />
            <span>Konnexy Tag • Conexões que aproximam o mundo físico ao digital</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-zinc-300 transition">
              Acesso ao Painel
            </Link>
            <span>•</span>
            <Link href="/r/barbearia-premium" className="hover:text-zinc-300 transition">
              Demonstração
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
