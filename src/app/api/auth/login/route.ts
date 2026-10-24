import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import {
  extractClientIp,
  checkRateLimit,
  buildRateLimitExceededResponse,
  AUTH_LOGIN_RATE_LIMIT
} from '@/lib/security/rate-limiter';
import {
  logSecurityAudit,
  computeRoleSignature
} from '@/lib/security/audit-logger';

const LoginRequestSchema = z.object({
  email: z.string().email('E-mail inválido.').max(120),
  password: z.string().min(4, 'Senha inválida.').max(128),
  role: z.enum(['super_admin', 'tenant_admin'])
});

export async function POST(req: NextRequest) {
  const clientIp = extractClientIp(req);

  // 1. Rate Limiting Estrito Anti-Força Bruta (Máximo 5 tentativas a cada 15 minutos)
  const rl = await checkRateLimit(clientIp, AUTH_LOGIN_RATE_LIMIT);
  if (!rl.allowed) {
    logSecurityAudit({
      action: 'AUTH_LOGIN_RATE_LIMITED',
      actorRole: 'unauthenticated',
      clientIp,
      path: '/api/auth/login',
      severity: 'WARN',
      metadata: { retryAfterSeconds: rl.retryAfterSeconds }
    });
    return buildRateLimitExceededResponse(rl, AUTH_LOGIN_RATE_LIMIT);
  }

  try {
    const body = await req.json();
    const parsed = LoginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Credenciais em formato inválido.' },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // 2. Gera assinatura de integridade para o papel RBAC (impede adulteração de cookie)
    const signature = computeRoleSignature(role, env.SESSION_HMAC_SECRET);

    logSecurityAudit({
      action: 'AUTH_LOGIN_SUCCESS',
      actorRole: role,
      clientIp,
      path: '/api/auth/login',
      severity: 'INFO',
      metadata: { email }
    });

    const response = NextResponse.json(
      {
        authenticated: true,
        role,
        email,
        remainingAttempts: rl.remaining
      },
      { status: 200 }
    );

    // Define cookies protegidos (SameSite=Lax)
    response.cookies.set('konnexy_role', role, {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax'
    });

    response.cookies.set('konnexy_sig', signature, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      sameSite: 'lax'
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Falha ao processar requisição de autenticação.' },
      { status: 500 }
    );
  }
}
