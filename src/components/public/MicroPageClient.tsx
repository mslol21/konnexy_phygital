'use client';
import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, ExternalLink, Copy, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { BentoModulesGrid } from '@/components/public/BentoModuleCards';
import { trackEvent } from '@/lib/telemetry';
import type { Tenant, TenantModule, AccessSource } from '@/types/phygital';
export function MicroPageClient({ tenant, modules, accessSource, demo = false }: { demo?:boolean; tenant:Tenant; modules:TenantModule[]; accessSource:AccessSource }) {
  const [dark,setDark]=useState(true);
  const [experience,setExperience]=useState('');
  const [suggestion,setSuggestion]=useState('');
  const [loading,setLoading]=useState(false);
  const tracked=useRef(false);
  useEffect(() => { if (!demo && !tracked.current) { tracked.current=true; trackEvent(tenant.id,accessSource,'page_view'); } },[tenant.id,accessSource,demo]);
  const reviews=modules.find(m=>m.module_type==='google_reviews');
  const whatsapp=tenant.whatsapp_feedback?.replace(/\D/g,'');
  const googleUrl=tenant.google_place_id ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(tenant.google_place_id)}` : null;
  const waUrl=whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(experience || `Olá! Acessei a página de ${tenant.name}.`)}` : null;
  async function improveText() {
    setLoading(true); setSuggestion('');
    try {
      const res=await fetch('/api/generate-reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:tenant.id,experience})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Não foi possível revisar o texto.');
      setSuggestion(data.suggestion);
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Assistência indisponível. Seu texto foi mantido.'); }
    finally { setLoading(false); }
  }
  async function copyText() {
    try { await navigator.clipboard.writeText(experience); trackEvent(tenant.id,accessSource,'review_copied','google_reviews'); toast.success('Texto copiado. Cole no Google e revise antes de publicar.'); }
    catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
  }
  return <div className={dark?'dark':''}><div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 py-8"><main className="mx-auto max-w-[460px] space-y-5">
    {demo && <aside className="rounded-xl border border-amber-500 bg-amber-100 p-4 text-sm text-amber-950"><strong>Exemplo fictício</strong><p>Conheça o visual da Konnexy Tag. Contatos, pagamentos e avaliações estão desativados nesta demonstração.</p></aside>}
    <div inert={demo} className="space-y-5">
    <NeonGradientCard borderRadius={24} borderSize={1.5} neonColors={{firstColor:tenant.primary_color,secondColor:'#6366f1'}} innerClassName="relative overflow-hidden p-6 text-center bg-white dark:bg-zinc-900">
      {tenant.cover_url && <img src={tenant.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
      <div className="relative"><button aria-label="Alternar tema" onClick={()=>setDark(!dark)} className="absolute right-0 top-0 rounded-full p-2 bg-zinc-200 dark:bg-zinc-800">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
      {tenant.logo_url && <img src={tenant.logo_url} alt={`Logo ${tenant.name}`} className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain bg-white"/>}
      <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{tenant.nicho}</p><h1 className="mt-2 text-2xl font-bold">{tenant.name}</h1>{tenant.bio && <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{tenant.bio}</p>}</div>
    </NeonGradientCard>
    {reviews && <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
      <h2 className="text-xl font-bold">Como foi sua experiência?</h2><p className="text-sm text-zinc-600 dark:text-zinc-300">Sua opinião é bem-vinda. Você pode avaliar no Google ou conversar com a empresa.</p>
      {googleUrl || demo ? <a href={demo ? undefined : googleUrl || undefined} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent(tenant.id,accessSource,'module_click','google_reviews')} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">Avaliar no Google <ExternalLink size={16}/></a> : <p className="text-sm text-zinc-500">O link de avaliação ainda não foi configurado.</p>}
      {waUrl && <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600 px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400"><MessageCircle size={18}/>Conversar com a empresa</a>}
      <details className="border-t border-zinc-200 dark:border-zinc-800 pt-4"><summary className="cursor-pointer font-medium text-sm">Quer organizar seu relato antes de avaliar?</summary>
        <label htmlFor="experience" className="block mt-4 mb-2 text-sm">Conte sua experiência com suas palavras</label><textarea id="experience" rows={4} maxLength={1000} value={experience} onChange={e=>{setExperience(e.target.value);setSuggestion('');}} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 text-sm" placeholder="O que aconteceu durante seu atendimento?"/>
        <p className="mt-2 text-xs text-zinc-500">A assistência é opcional. Ao solicitar a revisão, o relato será enviado ao serviço de IA do Google. Evite dados pessoais. Nada é publicado automaticamente.</p>
        <div className="mt-3 flex gap-2 flex-wrap"><button disabled={loading||experience.trim().length<10} onClick={improveText} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm disabled:opacity-50">{loading?<span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/>Revisando...</span>:'Revisar clareza do texto'}</button><button onClick={copyText} disabled={!experience.trim()} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm disabled:opacity-50"><Copy size={14} className="inline mr-1"/>Copiar meu texto</button></div>
        {suggestion && <div className="mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4"><p className="text-xs font-semibold mb-2">Sugestão — confira se representa sua experiência:</p><p className="text-sm whitespace-pre-wrap">{suggestion}</p><button className="mt-3 text-sm underline" onClick={()=>{setExperience(suggestion);setSuggestion('');}}>Usar e editar sugestão</button></div>}
        {waUrl && <p className="mt-4 text-xs text-zinc-500">Ao abrir o WhatsApp, revise a mensagem e toque em Enviar. Abrir a conversa não confirma o envio.</p>}
      </details>
    </section>}
    <BentoModulesGrid tenant={tenant} modules={modules} demo={demo}/>
    </div>
    <footer className="text-center py-4 text-xs text-zinc-500">Konnexy Tag · Conexões que aproximam</footer>
  </main></div></div>;
}
