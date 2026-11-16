import { NextRequest, NextResponse } from 'next/server';
import { requireSession, AccessError } from '@/lib/auth/session';
import { apiError } from '@/lib/api';
import { checkRateLimit, extractClientIp } from '@/lib/security/rate-limiter';

type GoogleTextSearchPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsLinks?: { writeAReviewUri?: string };
};
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireSession();
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    if (q.length < 3 || q.length > 120) throw new AccessError(400, 'Pesquise com 3 a 120 caracteres.');
    const rate = await checkRateLimit(user.id + ':' + extractClientIp(req), {
      namespace: 'google-place-search', maxRequests: 20, windowMs: 60000,
      errorMessage: 'Muitas buscas. Tente novamente em um minuto.'
    });
    if (!rate.allowed) throw new AccessError(429, 'Muitas buscas. Tente novamente em um minuto.');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new AccessError(503, 'Busca ainda não configurada: adicione GOOGLE_MAPS_API_KEY na Vercel para ativar a pesquisa automática.');
    const signal = AbortSignal.timeout(8000);
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks.writeAReviewUri'
      },
      body: JSON.stringify({ textQuery: q, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 8 }),
      cache: 'no-store'
    });
    if (!response.ok) {
      // Do not echo upstream errors: they might reveal API account or project details.
      console.error('Google Places failed with status', response.status);
      throw new AccessError(502, 'Não foi possível pesquisar no Google. Confira as configurações da API.');
    }
    const payload = await response.json() as { places?: GoogleTextSearchPlace[] };
    const places = (payload.places || []).filter(p => /^[-A-Za-z0-9_]{10,250}$/.test(p.id || ''))
      .map(p => ({
        id: p.id!, name: p.displayName?.text || 'Empresa sem nome',
        address: p.formattedAddress || 'Endereço não informado',
        reviewUrl: p.googleMapsLinks?.writeAReviewUri ||
          'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(p.id!)
      }));
    return NextResponse.json({ places }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
