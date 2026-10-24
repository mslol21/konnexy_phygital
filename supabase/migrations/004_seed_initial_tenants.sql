-- ============================================================================
-- KONNEXY TAG - MIGRATION 004: SEED DE COMÉRCIOS & MÓDULOS PHYGITAL INICIAIS
-- ============================================================================

-- Garante coluna de imagem de fundo do 1º quadro (Dimensão ideal: 1200x675px 16:9)
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 1. Insere os 4 perfis iniciais (Barbearia Dom Corleone, Burger Lab, Odonto Prime, Pet Amigo Fiel)
INSERT INTO public.tenants (
    id, slug, name, nicho, bio, logo_url, cover_url, primary_color, google_place_id,
    whatsapp_feedback, status, plan, plan_tier, mrr_cents, owner_email, is_active
)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'barbearia-premium',
        'Barbearia Dom Corleone',
        'Barbearia & Estética Masculina',
        'Cortes clássicos, barba na toalha quente e cerveja artesanal gelada.',
        '/logos/barbearia-dom-corleone.svg',
        '/covers/barbearia-cover.svg',
        '#D97706',
        'ChIJN1t_tDeuEmsRUsoyG83frY4',
        '5511999999999',
        'active',
        'pro',
        'pro',
        12700,
        'contato@domcorleone.com.br',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'burger-lab-artesanal',
        'Burger Lab Smash & Beer',
        'Hamburgueria Artesanal',
        'Smash burgers na chapa de ferro, blend Angus certificado e batata rústica com alecrim.',
        '/logos/burger-lab.svg',
        '/covers/burger-cover.svg',
        '#EF4444',
        'ChIJN1t_tDeuEmsRUsoyBurger',
        '5511988887777',
        'active',
        'enterprise',
        'enterprise',
        24700,
        'gerencia@burgerlab.com.br',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'clinica-sorriso-prime',
        'Odonto Sorriso Prime',
        'Clínica Odontológica & Estética',
        'Lentes de contato dental em porcelana, alinhadores invisíveis e implantes digitais sem dor.',
        '/logos/odonto-prime.svg',
        '/covers/odonto-cover.svg',
        '#0EA5E9',
        'ChIJN1t_tDeuEmsRUsoyOdonto',
        '5511977776666',
        'trial',
        'pro',
        'pro',
        12700,
        'dra.camila@sorrisoprime.com.br',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'petshop-amigo-fiel',
        'Pet Shop & Vet Amigo Fiel',
        'Pet Shop & Clínica Veterinária',
        'Banho e tosa humanizado com monitoramento por câmeras, farmácia pet e consultas 24h.',
        '/logos/pet-amigo-fiel.svg',
        '/covers/pet-cover.svg',
        '#10B981',
        'ChIJN1t_tDeuEmsRUsoyPet',
        '5511966665555',
        'suspended',
        'starter',
        'starter',
        6700,
        'financeiro@petamigofiel.com.br',
        false
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    nicho = EXCLUDED.nicho,
    bio = EXCLUDED.bio,
    logo_url = EXCLUDED.logo_url,
    cover_url = COALESCE(public.tenants.cover_url, EXCLUDED.cover_url),
    primary_color = EXCLUDED.primary_color,
    status = EXCLUDED.status,
    plan = EXCLUDED.plan,
    plan_tier = EXCLUDED.plan_tier,
    mrr_cents = EXCLUDED.mrr_cents;

-- 2. Configura os módulos personalizados para Barbearia Dom Corleone
INSERT INTO public.tenant_modules (tenant_id, module_type, title, is_active, order_index, config_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'google_reviews',
        'Avalie nossa Barbearia no Google',
        true,
        1,
        '{"tags": ["Corte Impecável", "Toalha Quente Relaxante", "Ambiente Top", "Pontualidade", "Cerveja Gelada"]}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'whatsapp_direct',
        'Agendar Horário no WhatsApp',
        true,
        2,
        '{"phone": "5511999999999", "default_message": "Olá! Passei o celular na placa NFC da Barbearia Dom Corleone e quero agendar."}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'catalogo_produtos',
        'Serviços & Combos Mais Pedidos',
        true,
        3,
        '{"items": [{"id": "1", "title": "Combo Corte + Barboterapia", "description": "Inclui toalha quente, massagem facial e 1 bebida cortesia", "price": "R$ 95,00", "badge": "Mais Pedido"}, {"id": "2", "title": "Corte Degradê Navalhado", "description": "Acabamento premium na navalha e finalização matte", "price": "R$ 60,00"}]}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'pix_facil',
        'Pix Rápido no Balcão',
        true,
        4,
        '{"pix_key": "12.345.678/0001-99", "pix_key_type": "cnpj", "beneficiary_name": "Barbearia Dom Corleone Ltda"}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'wifi_facil',
        'Wi-Fi Clientes',
        true,
        5,
        '{"ssid": "DomCorleone_5G", "password": "barbaecerveja", "encryption": "WPA"}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'social_links',
        'Siga nossas Redes Sociais',
        true,
        6,
        '{"instagram": "https://instagram.com/domcorleone", "tiktok": "https://tiktok.com/@domcorleone"}'::jsonb
    )
ON CONFLICT (tenant_id, module_type) DO UPDATE SET
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    order_index = EXCLUDED.order_index,
    config_data = EXCLUDED.config_data;

-- 3. Configura os módulos personalizados para Burger Lab Smash & Beer
INSERT INTO public.tenant_modules (tenant_id, module_type, title, is_active, order_index, config_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000002',
        'google_reviews',
        'Curtiu nosso Smash Burger? Avalie em 10s!',
        true,
        1,
        '{"tags": ["Smash Suculento", "Cheddar Cremoso", "Batata Crocante", "Entrega Super Rápida", "Chopp Trincando"]}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'catalogo_produtos',
        'Combos Smash em Destaque',
        true,
        2,
        '{"items": [{"id": "b1", "title": "Double Bacon Lab + Fritas Rústicas", "description": "2 carnes smash 90g, dobro de cheddar inglês, bacon artesanal e maionese defumada", "price": "R$ 44,90", "badge": "Campeão de Vendas"}, {"id": "b2", "title": "Truffle Gorgonzola Smash", "description": "Blend Angus 160g, creme de gorgonzola, cebola caramelizada no melado e pão brioche", "price": "R$ 49,90", "badge": "Chef Special"}]}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'whatsapp_direct',
        'Pedir Delivery ou Chamar Garçom',
        true,
        3,
        '{"phone": "5511988887777", "default_message": "Olá! Escaneie a placa da mesa na Burger Lab e quero fazer um pedido."}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'pix_facil',
        'Fechar Conta via Pix',
        true,
        4,
        '{"pix_key": "pix@burgerlab.com.br", "pix_key_type": "email", "beneficiary_name": "Burger Lab Gastronomia Ltda"}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'wifi_facil',
        'Wi-Fi Burger Lab',
        true,
        5,
        '{"ssid": "BurgerLab_Clientes", "password": "smashburger2026", "encryption": "WPA"}'::jsonb
    )
ON CONFLICT (tenant_id, module_type) DO UPDATE SET
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    order_index = EXCLUDED.order_index,
    config_data = EXCLUDED.config_data;
