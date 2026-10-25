import { notFound } from 'next/navigation';
import { getPublicTenant } from '@/lib/tenants';
import { MicroPageClient } from '@/components/public/MicroPageClient';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ src?: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) notFound();
  const record = await getPublicTenant(slug);
  if (!record) notFound();
  if (record.unavailable) return <main className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center"><p>Esta página está temporariamente indisponível. Entre em contato diretamente com o estabelecimento.</p></main>;
  const { src } = await searchParams;
  return <MicroPageClient demo={record.demo} tenant={record.tenant} modules={record.modules} accessSource={src === 'nfc' ? 'nfc' : src === 'qr' ? 'qr' : 'direct'} />;
}
