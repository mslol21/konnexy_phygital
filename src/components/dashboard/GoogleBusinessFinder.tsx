'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, MapPin, Search, CheckCircle2, ChevronDown, Link2 } from 'lucide-react';

type GooglePlace = { id: string; name: string; address: string; reviewUrl: string };

function mapsSearchUrl(query: string): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim());
}
function isPlaceId(value: string) { return /^ChI[A-Za-z0-9_-]{10,}$/.test(value); }
function isAllowedLink(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (
      u.hostname === 'maps.app.goo.gl' || u.hostname === 'g.page' ||
      u.hostname === 'google.com' || u.hostname.endsWith('.google.com') ||
      u.hostname === 'google.com.br' || u.hostname.endsWith('.google.com.br') ||
      u.hostname === 'search.google.com'
    );
  } catch { return false; }
}

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

  useEffect(() => {
    if (selected && selected.id !== value) setSelected(null);
  }, [value, selected]);

  const search = async () => {
    const query = searchText.trim();
    if (query.length < 3) {
      setMessage('Digite pelo menos 3 caracteres do nome da empresa.');
      return;
    }
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
      if (!resp.ok) throw new Error(body.error || 'Busca automática indisponível.');
      const places = (body.places || []) as GooglePlace[];
      setResults(places);
      if (!places.length) setMessage('Nenhuma empresa encontrada. Tente incluir o bairro ou cidade.');
    } catch (error) {
      if (current === counter.current)
        setMessage('Busca integrada indisponível. Use a pesquisa gratuita no Google Maps abaixo.');
    } finally { if (current === counter.current) setBusy(false); }
  };

  const query = searchText.trim();
  const searchUrl = query.length >= 3 ? mapsSearchUrl(query) : '';
  const reviewUrl = selected?.reviewUrl ||
    (isPlaceId(value) ? 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(value)
      : isAllowedLink(value) ? value : '');

  const searchFallback = value.startsWith('https://www.google.com/maps/search/?api=1');

  return (
    <section className="min-w-0 space-y-3">
      <label htmlFor={compact ? 'google-place-new' : 'google-place-edit'}
        className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        Perfil da empresa no Google
      </label>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Encontre sua empresa pelo nome. A pesquisa gratuita abre o Google Maps sem API e sem cobrança.
      </p>
      <div className="flex min-w-0 gap-2">
        <input id={compact ? 'google-place-new' : 'google-place-edit'} type="search" autoComplete="off"
          value={searchText} onChange={e => { setSearchText(e.target.value); setMessage(''); }}
          onKeyDown={e => { if (e.key === 'Enter') {e.preventDefault(); void search();} }}
          placeholder="Nome da empresa + cidade ou bairro"
          className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400" />
        <button type="button" onClick={() => void search()} disabled={busy || query.length < 3}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
        </button>
      </div>
      {message && <p role="status" className="text-[11px] text-amber-700 dark:text-amber-300">{message}</p>}
      {results.length > 0 && (
        <div className="max-h-60 space-y-1 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700 p-1"
          role="list" aria-label="Empresas encontradas">
          {results.map(place => (
            <button type="button" key={place.id}
              onClick={() => { onChange(place.id); setSelected(place); setResults([]); setMessage(''); setSearchText(place.name); }}
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
              <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-500" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-zinc-900 dark:text-white">{place.name}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{place.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2.5">
        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Sem Google Places API? Use gratuitamente:</p>
        <a href={searchUrl || undefined} target="_blank" rel="noopener noreferrer"
          aria-disabled={!searchUrl}
          className={"inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-xs font-medium " + (!searchUrl ? 'opacity-40 pointer-events-none' : 'text-indigo-700 dark:text-indigo-300')}>
          <Search size={14}/> Encontrar no Google Maps <ExternalLink size={13}/>
        </a>
        <button type="button" disabled={!searchUrl}
          onClick={() => {onChange(searchUrl);setSelected(null);setResults([]);setMessage('Pesquisa pelo nome configurada. Confirme no Maps se o primeiro resultado é a empresa certa.');}}
          className="block w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Usar pesquisa pelo nome na página
        </button>
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          A pesquisa pelo nome abre a ficha no Maps, mas <strong>não abre diretamente o formulário de avaliação</strong>.
          Para avaliação direta, cole abaixo o link de “Pedir avaliações” do Perfil da Empresa no Google ou selecione um resultado pela API.
        </p>
      </div>
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={14} className="shrink-0" />
            {searchFallback ? 'Busca pelo nome configurada' : 'Destino do Google configurado'} {selected ? '— ' + selected.name : ''}
          </span>
          {reviewUrl && <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] underline text-emerald-800 dark:text-emerald-300">
            Testar <ExternalLink size={12}/>
          </a>}
        </div>
      )}
      <button type="button" onClick={() => setManual(v => !v)}
        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 underline underline-offset-2"
        aria-expanded={manual}>
        <ChevronDown size={12}/> Inserir link direto de avaliações (opcional)
      </button>
      {manual && (
        <div className="space-y-1">
          <input type="text" value={value} onChange={e => {onChange(e.target.value.trim());setSelected(null);}}
            placeholder="https://g.page/r/.../review ou ChIJ..."
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white" />
          <a href="https://support.google.com/business/answer/16816815?hl=pt-BR" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300">
            <Link2 size={12}/> Onde obter o link oficial <ExternalLink size={12}/>
          </a>
        </div>
      )}
    </section>
  );
}
