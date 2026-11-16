'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/telemetry';
import type { AccessSource } from '@/types/phygital';

export function ReviewTextAssistant({tenantId,accessSource}:{tenantId:string;accessSource:AccessSource}){
  const [text,setText]=useState('');
  const [suggestion,setSuggestion]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const revise=async ()=>{
    if(text.trim().length<10){setError('Descreva sua experiência com pelo menos 10 caracteres.');return;}
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/generate-reviews',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tenantId,experience:text.trim()}),cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error || 'Assistência temporariamente indisponível.');
      if(typeof payload.suggestion!=='string'||!payload.suggestion.trim())throw new Error('Resposta inválida.');
      setSuggestion(payload.suggestion);
    }catch(e){
      setError('A revisão automática não está disponível agora. Seu texto foi preservado e você pode copiá-lo normalmente.');
    }finally{setBusy(false);}
  };
  const copy=async (value:string)=>{
    try{
      await navigator.clipboard.writeText(value);
      trackEvent(tenantId,accessSource,'review_copied','google_reviews');
      toast.success('Texto copiado. Cole no Google para publicar sua opinião.');
    }catch{toast.error('Não foi possível copiar. Selecione o texto manualmente.');}
  };
  return <section className="border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
    <p className="text-sm font-semibold">Quer organizar sua opinião antes de avaliar?</p>
    <label htmlFor="review-experience" className="block text-xs text-zinc-600 dark:text-zinc-300">
      Escreva com suas palavras, incluindo elogios ou críticas
    </label>
    <textarea id="review-experience" rows={3} maxLength={1000} value={text}
      onChange={e=>{setText(e.target.value);setSuggestion('');setError('');}}
      placeholder="Conte como foi sua experiência."
      className="w-full resize-y rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"/>
    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
      Opcional. Se solicitar uma revisão, o relato será enviado à IA do Google.
      A sugestão não é publicada automaticamente e você pode editá-la.
    </p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy || text.trim().length<10}
        onClick={()=>void revise()}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold disabled:opacity-50">
        {busy?'Revisando...':'Revisar clareza do texto'}
      </button>
      <button type="button" disabled={!text.trim()}
        onClick={()=>void copy(text)}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold disabled:opacity-50">
        Copiar meu texto
      </button>
    </div>
    {error && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">{error}</p>}
    {suggestion && <div className="space-y-2 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3">
      <label htmlFor="review-suggestion" className="block text-xs font-semibold">Sugestão editável</label>
      <textarea id="review-suggestion" value={suggestion} maxLength={1200}
        onChange={e=>setSuggestion(e.target.value)} rows={3}
        className="w-full rounded-lg bg-white dark:bg-zinc-950 p-2 text-sm text-zinc-900 dark:text-zinc-100"/>
      <button type="button" onClick={()=>void copy(suggestion)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
        Copiar sugestão revisada
      </button>
    </div>}
  </section>;
}
