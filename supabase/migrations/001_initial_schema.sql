-- ============================================================================
-- KONNEXY TAG - PLATAFORMA PHYGITAL SAAS MULTI-TENANT
-- Migration 001: Core Schema, Indexes, RLS Policies & Analytics RPC
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMs de Módulos e Origem de Acesso
DO $$ BEGIN
    CREATE TYPE public.module_type_enum AS ENUM (
        'google_reviews',
        'whatsapp_direct',
        'cardapio_link',
        'catalogo_produtos',
        'pix_facil',
        'social_links',
        'wifi_facil',
        'site_institucional',
        'custom_link'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.access_source_enum AS ENUM (
        'nfc',
        'qr',
        'direct'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABELA: tenants (Comércios / Estabelecimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    nicho TEXT NOT NULL DEFAULT 'Comércio Local',
    bio TEXT,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#0F172A',
    google_place_id TEXT,
    whatsapp_feedback TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'pro' CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Índices de alta performance para leitura na Edge (/r/[slug])
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants (owner_id);

-- ============================================================================
-- 3. TABELA: tenant_modules (Serviços e Add-ons de Receita Recorrente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_type public.module_type_enum NOT NULL,
    title TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, module_type)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_lookup 
    ON public.tenant_modules (tenant_id, is_active, order_index ASC);

-- ============================================================================
-- 4. TABELA: review_logs (Histórico de Avaliações IA & Feedbacks Retidos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    selected_tags TEXT[] DEFAULT '{}',
    generated_review_text TEXT,
    private_feedback TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    redirected_to_google BOOLEAN NOT NULL DEFAULT false,
    source public.access_source_enum NOT NULL DEFAULT 'direct',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_logs_tenant_date 
    ON public.review_logs (tenant_id, created_at DESC);

-- ============================================================================
-- 5. TABELA: analytics_events (Telemetria Phygital: NFC vs QR Code e Cliques)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'module_click', 'review_copied', 'feedback_sent', 'pix_copied', 'wifi_copied')),
    source public.access_source_enum NOT NULL DEFAULT 'direct',
    module_type public.module_type_enum,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_created 
    ON public.analytics_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_source 
    ON public.analytics_events (tenant_id, source, event_type);

-- ============================================================================
-- 6. TRIGGERS DE UPDATED_AT E PROVISIONAMENTO AUTOMÁTICO DE MÓDULOS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tenant_modules_updated_at ON public.tenant_modules;
CREATE TRIGGER trg_tenant_modules_updated_at
    BEFORE UPDATE ON public.tenant_modules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cria automaticamente os módulos padrão quando um novo Tenant é cadastrado
CREATE OR REPLACE FUNCTION public.seed_default_tenant_modules()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.tenant_modules (tenant_id, module_type, title, is_active, order_index, config_data)
    VALUES
        (NEW.id, 'google_reviews', 'Avalie nossa experiência no Google', true, 1, '{"tags": ["Atendimento Impecável", "Ambiente Incrível", "Qualidade Nota 10", "Preço Justo", "Super Rápido"]}'::jsonb),
        (NEW.id, 'whatsapp_direct', 'Falar no WhatsApp', true, 2, '{"phone": "", "default_message": "Olá! Vim pela placa inteligente do balcão."}'::jsonb),
        (NEW.id, 'pix_facil', 'Pagamento via Pix Rápido', false, 3, '{"pix_key": "", "pix_key_type": "cnpj", "beneficiary_name": "", "city": "SAO PAULO"}'::jsonb),
        (NEW.id, 'cardapio_link', 'Cardápio / Catálogo Digital', false, 4, '{"url": "", "mode": "pdf", "button_label": "Abrir Cardápio Digital"}'::jsonb),
        (NEW.id, 'catalogo_produtos', 'Destaques & Promoções', false, 5, '{"items": []}'::jsonb),
        (NEW.id, 'wifi_facil', 'Conectar ao Wi-Fi Grátis', false, 6, '{"ssid": "", "password": "", "encryption": "WPA"}'::jsonb),
        (NEW.id, 'social_links', 'Siga nossas Redes Sociais', false, 7, '{"instagram": "", "tiktok": "", "facebook": "", "youtube": ""}'::jsonb),
        (NEW.id, 'site_institucional', 'Nosso Site Oficial', false, 8, '{"url": "", "label": "Visitar Site Oficial"}'::jsonb)
    ON CONFLICT (tenant_id, module_type) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_seed_tenant_modules ON public.tenants;
CREATE TRIGGER trg_seed_tenant_modules
    AFTER INSERT ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.seed_default_tenant_modules();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) - SEGURANÇA MULTI-TENANT
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas para TENANTS
-- Leitura pública apenas para estabelecimentos ativos (necessário para /r/[slug])
DROP POLICY IF EXISTS "Public can read active tenants by slug" ON public.tenants;
CREATE POLICY "Public can read active tenants by slug"
    ON public.tenants FOR SELECT
    USING (is_active = true);

-- Lojista autenticado gerencia apenas seu próprio comércio
DROP POLICY IF EXISTS "Owners manage their own tenants" ON public.tenants;
CREATE POLICY "Owners manage their own tenants"
    ON public.tenants FOR ALL
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Políticas para TENANT_MODULES
-- Público lê apenas módulos ativos de tenants ativos
DROP POLICY IF EXISTS "Public can view active modules" ON public.tenant_modules;
CREATE POLICY "Public can view active modules"
    ON public.tenant_modules FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_modules.tenant_id AND t.is_active = true
        )
    );

-- Lojista autenticado vê e edita todos os módulos (ativos ou inativos) do seu tenant
DROP POLICY IF EXISTS "Owners manage their own tenant modules" ON public.tenant_modules;
CREATE POLICY "Owners manage their own tenant modules"
    ON public.tenant_modules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_modules.tenant_id AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_modules.tenant_id AND t.owner_id = auth.uid()
        )
    );

-- Políticas para REVIEW_LOGS
-- Clientes anônimos na micro-página podem inserir avaliações/feedbacks
DROP POLICY IF EXISTS "Public can insert review logs" ON public.review_logs;
CREATE POLICY "Public can insert review logs"
    ON public.review_logs FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = review_logs.tenant_id AND t.is_active = true
        )
    );

-- Apenas o dono do estabelecimento pode ler os logs de avaliação
DROP POLICY IF EXISTS "Owners can read their review logs" ON public.review_logs;
CREATE POLICY "Owners can read their review logs"
    ON public.review_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = review_logs.tenant_id AND t.owner_id = auth.uid()
        )
    );

-- Políticas para ANALYTICS_EVENTS
-- Qualquer visitante da placa física pode registrar eventos de toque/leitura
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
    ON public.analytics_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = analytics_events.tenant_id AND t.is_active = true
        )
    );

-- Apenas o dono visualiza o dashboard de analytics
DROP POLICY IF EXISTS "Owners can read their analytics events" ON public.analytics_events;
CREATE POLICY "Owners can read their analytics events"
    ON public.analytics_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = analytics_events.tenant_id AND t.owner_id = auth.uid()
        )
    );
