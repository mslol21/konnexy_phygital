import { NextRequest, NextResponse } from 'next/server';
import { extractClientIp } from '@/lib/security/rate-limiter';
import {
  logSecurityAudit,
  computeRoleSignature
} from '@/lib/security/audit-logger';

const VALID_ROLES = new Set(['super_admin', 'tenant_admin']);
const HMAC_SECRET =
  process.env.SESSION_HMAC_SECRET || 'konnexy_dev_hmac_secret_2026_safe';

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.googleapis.com https://*.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.googleapis.com https://search.google.com https://*.upstash.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  res.headers.set('Content-Security-Policy', CSP_HEADER);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const clientIp = extractClientIp(req);

  // 1. Rotas Públicas e Assets recebem os Security Headers sem bloqueio de sessão
  if (
    pathname.startsWith('/r/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/logos') ||
    pathname === '/' ||
    pathname === '/login'
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Validação de Integridade de Claims RBAC (Anti-Tampering)
  const roleCookie = req.cookies.get('konnexy_role')?.value;
  const sigCookie = req.cookies.get('konnexy_sig')?.value;

  if (roleCookie) {
    // Bloqueia imediatamente se o papel for inválido ou se a assinatura criptográfica tiver sido adulterada
    const expectedSig = computeRoleSignature(roleCookie, HMAC_SECRET);
    const isRoleMalformed = !VALID_ROLES.has(roleCookie);
    const isSigTampered = Boolean(sigCookie && sigCookie !== expectedSig);

    if (isRoleMalformed || isSigTampered) {
      logSecurityAudit({
        action: 'SESSION_TAMPERING_BLOCKED',
        actorRole: roleCookie || 'unknown',
        clientIp,
        path: pathname,
        severity: 'CRITICAL',
        metadata: {
          reason: isRoleMalformed ? 'INVALID_ROLE_CLAIM' : 'INVALID_ROLE_SIGNATURE'
        }
      });

      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'tampered_session');
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete('konnexy_role');
      redirectRes.cookies.delete('konnexy_sig');
      return applySecurityHeaders(redirectRes);
    }
  }

  // 3. Controle de Acesso Estrito ao /super-admin
  if (pathname.startsWith('/super-admin')) {
    if (roleCookie === 'tenant_admin') {
      logSecurityAudit({
        action: 'SESSION_TAMPERING_BLOCKED',
        actorRole: 'tenant_admin',
        clientIp,
        path: pathname,
        severity: 'WARN',
        metadata: { reason: 'TENANT_ADMIN_ATTEMPTED_SUPER_ADMIN_ROUTE' }
      });

      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('denied', 'super_admin_only');
      return applySecurityHeaders(NextResponse.redirect(url));
    }

    // Registra log de auditoria de acesso ao painel Super Admin
    logSecurityAudit({
      action: 'SUPER_ADMIN_DASHBOARD_ACCESS',
      actorRole: roleCookie || 'super_admin_dev',
      clientIp,
      path: pathname,
      severity: 'INFO'
    });
  }

  // 4. Auditoria de Impersonation quando Super Admin gerencia perfil específico (?tenant=slug)
  const impersonatedTenant = searchParams.get('tenant');
  if (pathname.startsWith('/dashboard') && impersonatedTenant) {
    logSecurityAudit({
      action: 'SUPER_ADMIN_TENANT_IMPERSONATION',
      actorRole: roleCookie || 'super_admin',
      clientIp,
      path: pathname,
      targetTenant: impersonatedTenant,
      severity: 'INFO'
    });
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
