'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-screen bg-zinc-950 text-white p-8"><h1 className="text-xl font-bold">Não foi possível carregar esta página</h1><p className="my-4">Tente novamente em instantes.</p><button className="bg-indigo-600 px-4 py-3 rounded-xl" onClick={reset}>Tentar novamente</button></main>;
}
