import { describe, expect, it } from 'vitest';
import { checkRateLimit, type RateLimitConfig } from '@/lib/security/rate-limiter';

describe('Multi-Backend Rate Limiter', () => {
  const testConfig: RateLimitConfig = {
    namespace: 'test-limiter',
    maxRequests: 3,
    windowMs: 2000,
    errorMessage: 'Limite de requisições de teste excedido.'
  };

  it('allows requests within the threshold', async () => {
    const id = `client-${Date.now()}-1`;

    const r1 = await checkRateLimit(id, testConfig);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(id, testConfig);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(id, testConfig);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests that exceed maxRequests threshold', async () => {
    const id = `client-${Date.now()}-2`;

    await checkRateLimit(id, testConfig);
    await checkRateLimit(id, testConfig);
    await checkRateLimit(id, testConfig);

    const r4 = await checkRateLimit(id, testConfig);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates rate limits between different client identifiers', async () => {
    const clientA = `client-a-${Date.now()}`;
    const clientB = `client-b-${Date.now()}`;

    // Consome todas de A
    await checkRateLimit(clientA, testConfig);
    await checkRateLimit(clientA, testConfig);
    await checkRateLimit(clientA, testConfig);

    const blockedA = await checkRateLimit(clientA, testConfig);
    expect(blockedA.allowed).toBe(false);

    // Client B deve continuar com quota livre
    const allowedB = await checkRateLimit(clientB, testConfig);
    expect(allowedB.allowed).toBe(true);
    expect(allowedB.remaining).toBe(2);
  });
});
