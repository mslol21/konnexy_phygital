'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, MapPin, Search, CheckCircle2, ChevronDown } from 'lucide-react';

type GooglePlace = { id: string; name: string; address: string; reviewUrl: string };

export function GoogleBusinessFinder({
  value, onChange, initialQuery = '', compact = false
}: { value: string; onChange: (value: string) => void; initialQuery?: string; compact?: boolean }) {
  const [searchText, setSearchText] = useState(initialQuery);
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<GooglePlace | null>(null);
  const [manual, setManual] = useState(false);
  const counter = useRef(0);

  // The server may already know a Place ID, even when this control has not searched yet.
  useEffect(() => {
    if (selected && selected.id !== value) setSelected(null);
  }, [value, selected]);

  const search = async () => {
    const query = searchText.trim();
    if (query.length < 3) { setMessage('Digite pelo menos 3 caracteres do nome da empresa.'); return; }
    const current = ++counter.current;
    setBusy(true);
    setResults([]);
    setMessage('');
    try {
      const resp = await fetch('/api/manage/google-places?q=' + encodeURIComponent(query), {
        credentials: 'same-origin', cache: 'no-store'
      });
      const body = await resp.json();
      if (current !== counter.current) return;
      if (!resp.ok) throw new Error(body.error || 'Não foi possível consultar o Google.');
      const places = (body.places || []) as GooglePlace[];
      setResults(places);
      if (!places.length) setMessage('Nenhuma empresa encontrada. Tente incluir o bairro ou cidade.');
    } catch (error) {
      if (current === counter.current) setMessage(error instanceof Error ? error.message : 'Falha na busca.');
    } finally {
      if (current === counter.current) setBusy(false);
    }
  };

  const reviewUrl = selected?.reviewUrl ||
    (/^ChI[A-Za-z0-9_-]+$/.test(value) ? 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(value) :
    /^https:\/\/(www\.)?(google\.[a-z.]+|maps\.app\.goo\.gl|g\.page)\//i.test(value) ? value : '');

  return (
    <section className="min-w-0 space-y-2">
      <label htmlFor={compact ? 'google-place-new' : 'google-place-edit'}
        className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        Perfil da empresa no Google
      </label>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Pesquise pelo nome e confirme o endereço correto. O link para avaliação é preenchido automaticamente.
      </p>
      <form onSubmit={event => { event.preventDefault(); void search(); }} className="flex min-w-0 gap-2">
        <input id={compact ? 'google-place-new' : 'google-place-edit'} type="search" autoComplete="off"
          value={searchText} onChange={e => { setSearchText(e.target.value); setMessage(''); }}
          placeholder="Nome da empresa, bairro ou cidade"
          className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400" />
        <button type="submit" disabled={busy || searchText.trim().length < 3}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </form>
      {message && <p role="status" className="text-[11px] text-amber-700 dark:text-amber-300">{message}</p>}
      {results.length > 0 && (
        <div className="max-h-60 space-y-1 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700 p-1"
          role="list" aria-label="Empresas encontradas">
          {results.map(place => (
            <button type="button" role="listitem" key={place.id}
              onClick={() => { onChange(place.id); setSelected(place); setResults([]); setMessage(''); setSearchText(place.name); }}
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
              <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-900 dark:text-white">{place.name}</span>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{place.address}</span></span>
            </button>
          ))}
        </div>
      )}
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={14} className="shrink-0" /> Perfil selecionado {selected ? '— ' + selected.name : ''}
          </span>
          {reviewUrl && <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] underline text-emerald-800 dark:text-emerald-300">
            Testar <ExternalLink size={12} />
          </a>}
        </div>
      )}
      <button type="button" onClick={() => setManual(v => !v)}
        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 underline underline-offset-2"
        aria-expanded={manual}>
        <ChevronDown size={12} /> Inserir Place ID ou link manualmente (opcional)
      </button>
      {manual && <input type="text" value={value} onChange={e => onChange(e.target.value.trim())}
        placeholder="ChIJ... ou link de avaliação"
        className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white" />}
    </section>
  );
}
