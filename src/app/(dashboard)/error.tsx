'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-screen bg-zinc-950 text-white p-10"><h1 className="text-2xl font-bold">Não foi possível carregar seus dados</h1><p className="my-4">Tente novamente. Se persistir, fale com o suporte.</p><button onClick={reset} className="rounded-xl bg-indigo-600 px-5 py-3">Tentar novamente</button></main>;
}
