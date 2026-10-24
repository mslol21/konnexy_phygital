export type SecurityAuditAction =
  | 'SUPER_ADMIN_DASHBOARD_ACCESS'
  | 'SUPER_ADMIN_TENANT_IMPERSONATION'
  | 'SUPER_ADMIN_TENANT_STATUS_CHANGE'
  | 'SUPER_ADMIN_PLAN_CHANGE'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_RATE_LIMITED'
  | 'SESSION_TAMPERING_BLOCKED'
  | 'AI_RATE_LIMIT_TRIGGERED';

export interface SecurityAuditEntry {
  timestamp: string;
  action: SecurityAuditAction;
  actorRole: string;
  clientIp: string;
  path: string;
  targetTenant?: string | null;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  metadata?: Record<string, unknown>;
}

/**
 * Registra eventos de auditoria de segurança em formato JSON estruturado (SIEM / Vercel Logs / Supabase)
 */
export function logSecurityAudit(entry: Omit<SecurityAuditEntry, 'timestamp'>): void {
  const payload: SecurityAuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  if (payload.severity === 'CRITICAL' || payload.severity === 'WARN') {
    console.warn(`[SECURITY_AUDIT][${payload.severity}]`, JSON.stringify(payload));
  } else {
    console.info(`[SECURITY_AUDIT][INFO]`, JSON.stringify(payload));
  }
}

/**
 * Gera assinatura determinística leve (Edge-safe) para validar integridade do papel RBAC nos cookies
 * e impedir escalação de privilégio via adulteração manual de cookie no navegador.
 */
export function computeRoleSignature(role: string, secret: string): string {
  let hash = 2166136261;
  const input = `${role}:${secret}:konnexy-rbac-v1`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
