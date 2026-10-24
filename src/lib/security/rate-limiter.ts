import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Identificador do namespace (ex: 'rl:ai-reviews' ou 'rl:auth-login') */
  namespace: string;
  /** Número máximo de requisições permitidas dentro da janela */
  maxRequests: number;
  /** Duração da janela em milissegundos */
  windowMs: number;
  /** Mensagem amigável retornada ao atingir HTTP 429 */
  errorMessage: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

// Armazenamento Sliding Window em memória (compatível com Edge Runtime e Node)
const memoryBuckets = new Map<string, number[]>();

/**
 * Extrai o IP real do cliente de forma defensiva a partir dos headers de Proxy/Edge
 */
export function extractClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return sanitizeIp(cfIp);

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return sanitizeIp(realIp);

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return sanitizeIp(firstIp);
  }

  return '127.0.0.1';
}

function sanitizeIp(rawIp: string): string {
  return rawIp.replace(/[^0-9a-fA-F.:]/g, '').slice(0, 45) || '127.0.0.1';
}

/**
 * Executa verificação Sliding Window Log (ou Upstash Redis REST se configurado)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const bucketKey = `${config.namespace}:${identifier}`;

  // Se Upstash Redis REST estiver configurado no ambiente, executa pipeline atômico via REST
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const response = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['ZREMRANGEBYSCORE', bucketKey, 0, windowStart],
          ['ZADD', bucketKey, now, `${now}-${Math.random().toString(36).slice(2, 7)}`],
          ['ZCARD', bucketKey],
          ['PEXPIRE', bucketKey, config.windowMs]
        ])
      });

      if (response.ok) {
        const data = await response.json();
        const count = Number(data?.[2]?.result || 1);
        const allowed = count <= config.maxRequests;
        const resetAtMs = now + config.windowMs;
        return {
          allowed,
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - count),
          resetAtMs,
          retryAfterSeconds: Math.ceil(config.windowMs / 1000)
        };
      }
    } catch {
      // Fallback transparente para o Sliding Window em memória caso o Redis oscile
    }
  }

  // Sliding Window em Memória
  const existingTimestamps = memoryBuckets.get(bucketKey) || [];
  const validTimestamps = existingTimestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= config.maxRequests) {
    const oldestInWindow = validTimestamps[0] || now;
    const resetAtMs = oldestInWindow + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000));

    memoryBuckets.set(bucketKey, validTimestamps);
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAtMs,
      retryAfterSeconds
    };
  }

  validTimestamps.push(now);
  memoryBuckets.set(bucketKey, validTimestamps);

  // Limpeza preventiva para evitar crescimento indefinido do Map
  if (memoryBuckets.size > 5000) {
    const firstKey = memoryBuckets.keys().next().value;
    if (firstKey) memoryBuckets.delete(firstKey);
  }

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - validTimestamps.length),
    resetAtMs: now + config.windowMs,
    retryAfterSeconds: 0
  };
}

/**
 * Constrói resposta padronizada HTTP 429 Too Many Requests com headers RFC 6585
 */
export function buildRateLimitExceededResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  return NextResponse.json(
    {
      error: config.errorMessage,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: result.retryAfterSeconds
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAtMs / 1000))
      }
    }
  );
}

/**
 * 1. Política Estrita para Rota Pública de IA (/api/generate-reviews):
 * Máximo de 5 requisições por IP a cada 10 minutos (600.000 ms).
 */
export const AI_REVIEWS_RATE_LIMIT: RateLimitConfig = {
  namespace: 'rl:ai-generate-reviews',
  maxRequests: 5,
  windowMs: 10 * 60 * 1000, // 10 minutos
  errorMessage:
    'Você atingiu o limite de 5 gerações de avaliação por IA a cada 10 minutos. Por favor, escolha uma das opções já geradas na tela ou aguarde alguns instantes.'
};

/**
 * 2. Política Estrita para Rotas de Autenticação (/api/auth/*):
 * Máximo de 5 tentativas de login por IP a cada 15 minutos (900.000 ms) contra força bruta.
 */
export const AUTH_LOGIN_RATE_LIMIT: RateLimitConfig = {
  namespace: 'rl:auth-login',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
  errorMessage:
    'Muitas tentativas de autenticação consecutivas. Por segurança contra força bruta, seu acesso foi temporariamente bloqueado por 15 minutos.'
};
