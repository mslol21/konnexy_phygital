-- ============================================================================
-- KONNEXY TAG - MIGRATION 003: AUDITORIA DE SUPER ADMIN & VERIFICAÇÃO RLS
-- ============================================================================

-- 1. TABELA DE AUDITORIA DE SEGURANÇA (SIEM / SUPER ADMIN LOGS)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_tenant_slug TEXT,
    client_ip TEXT,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'CRITICAL')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created
    ON public.security_audit_logs (created_at DESC);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas Super Admin pode consultar a trilha de auditoria; escrita nunca é liberada para anon
DROP POLICY IF EXISTS "Only super_admin can read security audit logs" ON public.security_audit_logs;
CREATE POLICY "Only super_admin can read security audit logs"
    ON public.security_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.security_audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.security_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id OR public.is_super_admin());

-- ============================================================================
-- 2. FUNÇÃO AUTOMATIZADA DE AUDITORIA DE INTEGRIDADE RLS (SECURITY SCANNER SQL)
-- Valida se:
--   a) RLS está explicitamente ativado (relrowsecurity = true) em todas as tabelas
--   b) Nenhuma tabela crítica permite UPDATE ou DELETE para o papel anônimo ('anon')
--   c) Existem políticas de isolamento por tenant_id / owner_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_rls_security_posture()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    anon_write_blocked BOOLEAN,
    tenant_isolation_ok BOOLEAN,
    audit_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH target_tables AS (
        SELECT unnest(ARRAY[
            'tenants',
            'profiles',
            'tenant_modules',
            'review_logs',
            'analytics_events',
            'tenant_invoices',
            'security_audit_logs'
        ]) AS tbl
    )
    SELECT
        t.tbl AS table_name,
        COALESCE(c.relrowsecurity, false) AS rls_enabled,
        COUNT(p.policyname) AS policy_count,
        -- Garante que 'anon' jamás tenha permissão de UPDATE ou DELETE
        NOT EXISTS (
            SELECT 1 FROM pg_policies pol
            WHERE pol.schemaname = 'public'
              AND pol.tablename = t.tbl
              AND pol.cmd IN ('UPDATE', 'DELETE', 'ALL')
              AND ('anon' = ANY(pol.roles) OR 'public' = ANY(pol.roles))
        ) AS anon_write_blocked,
        -- Garante que exista ao menos uma política verificando owner_id, tenant_id ou is_super_admin()
        EXISTS (
            SELECT 1 FROM pg_policies pol
            WHERE pol.schemaname = 'public'
              AND pol.tablename = t.tbl
              AND (
                  pol.qual ILIKE '%owner_id%'
                  OR pol.qual ILIKE '%tenant_id%'
                  OR pol.qual ILIKE '%is_super_admin%'
                  OR pol.with_check ILIKE '%tenant_id%'
              )
        ) AS tenant_isolation_ok,
        CASE
            WHEN COALESCE(c.relrowsecurity, false) = true
                 AND COUNT(p.policyname) > 0
            THEN 'PASS (BLINDADO)'
            ELSE 'FAIL (VULNERÁVEL)'
        END AS audit_status
    FROM target_tables t
    LEFT JOIN pg_class c ON c.relname = t.tbl
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    LEFT JOIN pg_policies p ON p.tablename = t.tbl AND p.schemaname = 'public'
    GROUP BY t.tbl, c.relrowsecurity
    ORDER BY t.tbl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
