-- ============================================================================
-- KONNEXY TAG - MIGRATION 002: RBAC, SUPER ADMIN, PROFILES & BILLING CONTROL
-- ============================================================================

-- 1. ENUMs de Papéis (RBAC), Status do Tenant e Planos SaaS
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'tenant_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'trial', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.plan_tier AS ENUM ('starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 2. TABELA: profiles (Extensão 1:1 de auth.users com Papel RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role public.user_role NOT NULL DEFAULT 'tenant_admin',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Trigger para criar perfil automaticamente ao registrar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE
            WHEN NEW.raw_user_meta_data->>'role' = 'super_admin' THEN 'super_admin'::public.user_role
            ELSE 'tenant_admin'::public.user_role
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 3. FUNÇÃO HELPER DE SEGURANÇA (SECURITY DEFINER) PARA CHECAGEM DE SUPER ADMIN
-- Evita recursão infinita em políticas RLS e garante avaliação rápida
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'super_admin'::public.user_role
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 4. EVOLUÇÃO DA TABELA: tenants (Status de Assinatura, Plano e Mensalidade)
-- ============================================================================
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS status public.tenant_status NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS plan public.plan_tier NOT NULL DEFAULT 'pro',
    ADD COLUMN IF NOT EXISTS mrr_cents INTEGER NOT NULL DEFAULT 9700, -- R$ 97,00 padrão
    ADD COLUMN IF NOT EXISTS next_billing_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    ADD COLUMN IF NOT EXISTS owner_email TEXT,
    ADD COLUMN IF NOT EXISTS owner_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON public.tenants (plan);

-- ============================================================================
-- 5. TABELA: tenant_invoices (Histórico de Mensalidades & Cobrança SaaS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'canceled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'pix',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON public.tenant_invoices (tenant_id, due_date DESC);

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY) COM SUPORTE A SUPER_ADMIN
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invoices ENABLE ROW LEVEL SECURITY;

-- PROFILES: Usuário vê seu próprio perfil; Super Admin vê e gerencia todos
CREATE POLICY "Users can read own profile or super_admin reads all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Super admin manages all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- TENANTS: Atualização das políticas para respeitar `status` na leitura pública e `is_super_admin()`
DROP POLICY IF EXISTS "Public can read active tenants by slug" ON public.tenants;
CREATE POLICY "Public can read active or trial tenants by slug"
    ON public.tenants FOR SELECT
    TO anon, authenticated
    USING (status IN ('active', 'trial') OR public.is_super_admin() OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners manage their own tenants" ON public.tenants;
CREATE POLICY "Super admin full access on tenants"
    ON public.tenants FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Tenant admins can update their own tenant profile"
    ON public.tenants FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- TENANT_MODULES: Super Admin pode ativar/desativar módulos de qualquer cliente conforme o plano
DROP POLICY IF EXISTS "Owners manage their own tenant modules" ON public.tenant_modules;
CREATE POLICY "Owners and super_admin manage tenant modules"
    ON public.tenant_modules FOR ALL
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_modules.tenant_id AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_modules.tenant_id AND t.owner_id = auth.uid()
        )
    );

-- TENANT_INVOICES: Super Admin gerencia cobranças; Lojista apenas visualiza suas faturas
CREATE POLICY "Super admin manages all invoices"
    ON public.tenant_invoices FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Tenant admin views own invoices"
    ON public.tenant_invoices FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_invoices.tenant_id AND t.owner_id = auth.uid()
        )
    );
