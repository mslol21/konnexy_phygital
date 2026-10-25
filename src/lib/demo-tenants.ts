import type { Tenant, TenantModule } from '@/types/phygital';

// Explicit, reserved examples. Never used as a fallback for a customer's page.
// No real contact, payment, login or billing data belongs in this fixture.
const examples = [
  {
    slug: 'barbearia-premium', name: 'Barbearia Dom Corleone',
    nicho: 'Barbearia & Estética Masculina', color: '#D97706',
    logo: 'barbearia-dom-corleone', cover: 'barbearia-cover',
    bio: 'Cortes clássicos, barba na toalha quente e um ambiente pensado para você.',
    items: [
      { id: 'corte', title: 'Corte Degradê', description: 'Acabamento na navalha e finalização.', price: 'R$ 60,00' },
      { id: 'combo', title: 'Combo Corte + Barboterapia', description: 'Inclui toalha quente e massagem facial.', price: 'R$ 95,00', badge: 'Destaque' },
    ],
  },
  {
    slug: 'burger-lab-artesanal', name: 'Burger Lab Smash & Beer',
    nicho: 'Hamburgueria Artesanal', color: '#EF4444',
    logo: 'burger-lab', cover: 'burger-cover',
    bio: 'Smash burgers, batata rústica e combinações para compartilhar.',
    items: [
      { id: 'smash', title: 'Double Bacon + Fritas', description: 'Dois smash burgers, queijo e bacon.', price: 'R$ 44,90' },
      { id: 'burger', title: 'Burger da Casa', description: 'Hambúrguer artesanal e molho especial.', price: 'R$ 39,90' },
    ],
  },
  {
    slug: 'clinica-sorriso-prime', name: 'Odonto Sorriso Prime',
    nicho: 'Clínica Odontológica', color: '#0EA5E9',
    logo: 'odonto-prime', cover: 'odonto-cover',
    bio: 'Conheça nossos serviços e converse com a equipe sobre seu atendimento.',
    items: [
      { id: 'consulta', title: 'Avaliação odontológica', description: 'Atendimento com horário marcado.', price: 'Consulte a equipe' },
      { id: 'limpeza', title: 'Limpeza e prevenção', description: 'Cuidados para a saúde do seu sorriso.', price: 'Consulte a equipe' },
    ],
  },
  {
    slug: 'petshop-amigo-fiel', name: 'Pet Shop & Vet Amigo Fiel',
    nicho: 'Pet Shop & Clínica Veterinária', color: '#10B981',
    logo: 'pet-amigo-fiel', cover: 'pet-cover',
    bio: 'Carinho e cuidado para seu melhor amigo. Conheça nossos serviços.',
    items: [
      { id: 'banho', title: 'Banho e tosa', description: 'Agende o cuidado do seu pet.', price: 'Consulte a equipe' },
      { id: 'consulta', title: 'Consulta veterinária', description: 'Atendimento com horário marcado.', price: 'Consulte a equipe' },
    ],
  },
];

export function isDemoSlug(slug: string) {
  return examples.some(example => example.slug === slug);
}

export function getDemoTenant(value: string, byId = false) {
  const index = examples.findIndex((example, i) =>
    byId ? value === `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}` : value === example.slug
  );
  if (index === -1) return null;
  const example = examples[index];
  const id = `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`;
  const tenant: Tenant = {
    id, slug: example.slug, name: example.name, nicho: example.nicho, bio: example.bio,
    logo_url: `/logos/${example.logo}.svg`, cover_url: `/covers/${example.cover}.svg`,
    primary_color: example.color, google_place_id: null, whatsapp_feedback: null,
    status: 'active', created_at: '2026-10-24T00:00:00Z',
  };
  const definitions: Pick<TenantModule, 'module_type' | 'title' | 'config_data'>[] = [
    { module_type: 'google_reviews', title: 'Compartilhe sua experiência', config_data: {} },
    { module_type: 'whatsapp_direct', title: 'Falar no WhatsApp', config_data: { phone: '', default_message: '' } },
    { module_type: 'catalogo_produtos', title: 'Serviços & Destaques', config_data: { items: example.items } },
    { module_type: 'wifi_facil', title: 'Wi-Fi para clientes', config_data: { ssid: 'REDE-DEMONSTRACAO', password: '', encryption: 'nopass' } },
  ];
  const modules: TenantModule[] = definitions.map((module, order_index) => ({
    ...module, id: `demo-${example.slug}-${module.module_type}`, tenant_id: id, is_active: true, order_index,
  }));
  return { unavailable: false as const, demo: true as const, tenant, modules };
}
