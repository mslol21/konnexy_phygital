import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { LoginCredentialsSchema } from '@/lib/schemas/auth';
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

const GENERIC_AUTH_ERROR = 'E-mail ou senha incorretos.';

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
    const parsed = LoginCredentialsSchema.safeParse(body);

    if (!parsed.success) {
      // Prevenção de User Enumeration: retorna mensagem padronizada e genérica
      return NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 }
      );
    }

    const { email, role = 'tenant_admin' } = parsed.data;

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

    // Define cookies HttpOnly protegidos (Zero localStorage para tokens de sessão)
    response.cookies.set('konnexy_role', role, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    response.cookies.set('konnexy_sig', signature, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: GENERIC_AUTH_ERROR },
      { status: 401 }
    );
  }
}
