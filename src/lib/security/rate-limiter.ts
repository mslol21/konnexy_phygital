import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { env, hasUpstashConfig } from '@/lib/env';

export interface RateLimitConfig {
  namespace: string;
  maxRequests: number;
  windowMs: number;
  errorMessage: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
  backend: 'upstash' | 'database' | 'memory';
}

// In-Memory Sliding Window Fallback (contingência se Redis e PostgreSQL estiverem offline)
const inMemoryStore = new Map<string, { count: number; resetAtMs: number }>();

/**
 * Limpeza periódica do mapa em memória para evitar memory leaks
 */
function cleanupExpiredMemoryKeys(): void {
  const now = Date.now();
  for (const [key, val] of inMemoryStore.entries()) {
    if (val.resetAtMs <= now) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Extrai e normaliza o IP do cliente preservando privacidade (LGPD).
 * O IP nunca é armazenado em formato legível em tabelas de auditoria pública.
 */
export function extractClientIp(req: NextRequest): string {
  const raw =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for') ||
    '127.0.0.1';

  return (
    raw
      .split(',')[0]
      ?.trim()
      .replace(/[^0-9a-fA-F.:]/g, '')
      .slice(0, 45) || '127.0.0.1'
  );
}

/**
 * Gera hash criptográfico irreversível para a chave de limitação de taxa
 */
async function computeRateLimitKey(namespace: string, identifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`konnexy-rate:${namespace}:${identifier}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Driver Upstash Redis REST
 */
async function checkWithUpstash(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  if (!hasUpstashConfig()) return null;

  try {
    const url = env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    // Pipeline atômica: INCR e EXPIRE condicional
    const pipelineRes = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX']
      ]),
      signal: AbortSignal.timeout(3000)
    });

    if (!pipelineRes.ok) return null;
    const results = (await pipelineRes.json()) as Array<{ result: number }>;
    const hits = Number(results[0]?.result || 1);
    const resetAtMs = Date.now() + config.windowMs;

    return {
      allowed: hits <= config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - hits),
      resetAtMs,
      retryAfterSeconds: Math.max(1, Math.ceil(config.windowMs / 1000)),
      backend: 'upstash'
    };
  } catch {
    return null; // Fallback para banco se Upstash oscilar
  }
}

/**
 * Driver PostgreSQL (Tabela request_limits)
 */
async function checkWithDatabase(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  try {
    const rows = await query<{ hits: number; expires_at: string }>(
      `INSERT INTO public.request_limits(key, hits, expires_at)
       VALUES($1, 1, now() + ($2::integer * interval '1 millisecond'))
       ON CONFLICT(key) DO UPDATE SET
         hits = CASE WHEN public.request_limits.expires_at <= now() THEN 1 ELSE public.request_limits.hits + 1 END,
         expires_at = CASE WHEN public.request_limits.expires_at <= now() THEN EXCLUDED.expires_at ELSE public.request_limits.expires_at END
       RETURNING hits, expires_at`,
      [key, config.windowMs]
    );

    const row = rows[0];
    if (!row) return null;
    const resetAtMs = new Date(row.expires_at).getTime();

    return {
      allowed: row.hits <= config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - row.hits),
      resetAtMs,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000)),
      backend: 'database'
    };
  } catch {
    return null; // Fallback para memória se a tabela não existir ou banco estiver lento
  }
}

/**
 * Driver In-Memory Fallback
 */
function checkWithMemory(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredMemoryKeys();
  const now = Date.now();
  const current = inMemoryStore.get(key);

  if (!current || current.resetAtMs <= now) {
    const resetAtMs = now + config.windowMs;
    inMemoryStore.set(key, { count: 1, resetAtMs });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAtMs,
      retryAfterSeconds: Math.max(1, Math.ceil(config.windowMs / 1000)),
      backend: 'memory'
    };
  }

  current.count += 1;
  const hits = current.count;
  const remaining = Math.max(0, config.maxRequests - hits);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAtMs - now) / 1000));

  return {
    allowed: hits <= config.maxRequests,
    limit: config.maxRequests,
    remaining,
    resetAtMs: current.resetAtMs,
    retryAfterSeconds,
    backend: 'memory'
  };
}

/**
 * Função principal de Rate Limiting com arquitetura em camadas:
 * 1. Upstash Redis (distribuído / serverless)
 * 2. PostgreSQL Serverless (persistente)
 * 3. In-Memory Sliding Window (contingência sem cold-start)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = await computeRateLimitKey(config.namespace, identifier);

  // Tentativa 1: Upstash
  const upstashResult = await checkWithUpstash(key, config);
  if (upstashResult) return upstashResult;

  // Tentativa 2: PostgreSQL
  const dbResult = await checkWithDatabase(key, config);
  if (dbResult) return dbResult;

  // Tentativa 3: In-Memory
  return checkWithMemory(key, config);
}

export function buildRateLimitExceededResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  return NextResponse.json(
    { error: config.errorMessage },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAtMs / 1000)),
        'Cache-Control': 'no-store'
      }
    }
  );
}

// Configurações padronizadas de Rate Limiting por Domínio
export const AUTH_LOGIN_RATE_LIMIT: RateLimitConfig = {
  namespace: 'auth-login',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
  errorMessage: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.'
};

export const AI_REVIEWS_RATE_LIMIT: RateLimitConfig = {
  namespace: 'ai-reviews',
  maxRequests: 6,
  windowMs: 10 * 60 * 1000, // 10 minutos
  errorMessage: 'Limite de assistência por IA atingido. Você pode continuar com seu próprio texto.'
};

export const EVENTS_RATE_LIMIT: RateLimitConfig = {
  namespace: 'events',
  maxRequests: 120,
  windowMs: 60 * 1000, // 1 minuto
  errorMessage: 'Muitas requisições de telemetria.'
};

export const PLACES_LOOKUP_RATE_LIMIT: RateLimitConfig = {
  namespace: 'places-lookup',
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minuto
  errorMessage: 'Limite de buscas do Google Places atingido. Aguarde um momento.'
};
