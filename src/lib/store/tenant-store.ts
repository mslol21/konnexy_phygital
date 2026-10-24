import type { Tenant, TenantModule, ModuleType, PlanTier } from '@/types/phygital';
import { PLAN_LIMITS } from '@/lib/auth/rbac';

const STORAGE_KEY = 'konnexy_tenants_db_v2';

export interface TenantFullRecord {
  tenant: Tenant;
  modules: TenantModule[];
}

export const DEFAULT_TENANTS_DB: Record<string, TenantFullRecord> = {
  'barbearia-premium': {
    tenant: {
      id: '00000000-0000-0000-0000-000000000001',
      slug: 'barbearia-premium',
      name: 'Barbearia Dom Corleone',
      nicho: 'Barbearia & Estética Masculina',
      bio: 'Cortes clássicos, barba na toalha quente e cerveja artesanal gelada.',
      logo_url: '/logos/barbearia-dom-corleone.svg',
      primary_color: '#D97706',
      google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      whatsapp_feedback: '5511999999999',
      status: 'active',
      plan_tier: 'pro',
      mrr_cents: 12700,
      next_billing_date: '2026-11-15',
      owner_email: 'contato@domcorleone.com.br',
      taps_30d: 1238,
      reviews_30d: 319,
      created_at: '2026-08-10T10:00:00Z'
    },
    modules: [
      {
        id: 'barb-1',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'google_reviews',
        title: 'Avalie nossa Barbearia no Google',
        is_active: true,
        order_index: 1,
        config_data: {
          tags: [
            'Corte Impecável',
            'Toalha Quente Relaxante',
            'Ambiente Top',
            'Pontualidade',
            'Cerveja Gelada'
          ]
        }
      },
      {
        id: 'barb-2',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'whatsapp_direct',
        title: 'Agendar Horário no WhatsApp',
        is_active: true,
        order_index: 2,
        config_data: {
          phone: '5511999999999',
          default_message: 'Olá! Passei o celular na placa NFC da Barbearia Dom Corleone e quero agendar.'
        }
      },
      {
        id: 'barb-3',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'catalogo_produtos',
        title: 'Serviços & Combos Mais Pedidos',
        is_active: true,
        order_index: 3,
        config_data: {
          items: [
            {
              id: '1',
              title: 'Combo Corte + Barboterapia',
              description: 'Inclui toalha quente, massagem facial e 1 bebida cortesia',
              price: 'R$ 95,00',
              badge: 'Mais Pedido'
            },
            {
              id: '2',
              title: 'Corte Degradê Navalhado',
              description: 'Acabamento premium na navalha e finalização matte',
              price: 'R$ 60,00'
            }
          ]
        }
      },
      {
        id: 'barb-4',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'pix_facil',
        title: 'Pix Rápido no Balcão',
        is_active: true,
        order_index: 4,
        config_data: {
          pix_key: '12.345.678/0001-99',
          pix_key_type: 'cnpj',
          beneficiary_name: 'Barbearia Dom Corleone Ltda'
        }
      },
      {
        id: 'barb-5',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'wifi_facil',
        title: 'Wi-Fi Clientes',
        is_active: true,
        order_index: 5,
        config_data: {
          ssid: 'DomCorleone_5G',
          password: 'barbaecerveja',
          encryption: 'WPA'
        }
      },
      {
        id: 'barb-6',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        module_type: 'social_links',
        title: 'Siga nossas Redes Sociais',
        is_active: true,
        order_index: 6,
        config_data: {
          instagram: 'https://instagram.com/domcorleone',
          tiktok: 'https://tiktok.com/@domcorleone'
        }
      }
    ]
  },

  'burger-lab-artesanal': {
    tenant: {
      id: '00000000-0000-0000-0000-000000000002',
      slug: 'burger-lab-artesanal',
      name: 'Burger Lab Smash & Beer',
      nicho: 'Hamburgueria Artesanal',
      bio: 'Smash burgers na chapa de ferro, blend Angus certificado e batata rústica com alecrim.',
      logo_url: '/logos/burger-lab.svg',
      primary_color: '#EF4444',
      google_place_id: 'ChIJN1t_tDeuEmsRUsoyBurger',
      whatsapp_feedback: '5511988887777',
      status: 'active',
      plan_tier: 'enterprise',
      mrr_cents: 24700,
      next_billing_date: '2026-11-05',
      owner_email: 'gerencia@burgerlab.com.br',
      taps_30d: 2890,
      reviews_30d: 614,
      created_at: '2026-07-22T14:30:00Z'
    },
    modules: [
      {
        id: 'burg-1',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'google_reviews',
        title: 'Curtiu nosso Smash Burger? Avalie em 10s!',
        is_active: true,
        order_index: 1,
        config_data: {
          tags: [
            'Smash Suculento',
            'Cheddar Cremoso',
            'Batata Crocante',
            'Entrega Super Rápida',
            'Chopp Trincando'
          ]
        }
      },
      {
        id: 'burg-2',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'catalogo_produtos',
        title: 'Combos Smash em Destaque',
        is_active: true,
        order_index: 2,
        config_data: {
          items: [
            {
              id: 'b1',
              title: 'Double Bacon Lab + Fritas Rústicas',
              description: '2 carnes smash 90g, dobro de cheddar inglês, bacon artesanal e maionese defumada',
              price: 'R$ 44,90',
              badge: 'Campeão de Vendas'
            },
            {
              id: 'b2',
              title: 'Truffle Gorgonzola Smash',
              description: 'Blend Angus 160g, creme de gorgonzola, cebola caramelizada no melado e pão brioche',
              price: 'R$ 49,90',
              badge: 'Chef Special'
            }
          ]
        }
      },
      {
        id: 'burg-3',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'whatsapp_direct',
        title: 'Pedir Delivery ou Chamar Garçom',
        is_active: true,
        order_index: 3,
        config_data: {
          phone: '5511988887777',
          default_message: 'Olá! Escaneie a placa da mesa na Burger Lab e quero fazer um pedido.'
        }
      },
      {
        id: 'burg-4',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'pix_facil',
        title: 'Fechar Conta via Pix',
        is_active: true,
        order_index: 4,
        config_data: {
          pix_key: 'pix@burgerlab.com.br',
          pix_key_type: 'email',
          beneficiary_name: 'Burger Lab Gastronomia Ltda'
        }
      },
      {
        id: 'burg-5',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'wifi_facil',
        title: 'Wi-Fi Burger Lab',
        is_active: true,
        order_index: 5,
        config_data: {
          ssid: 'BurgerLab_Clientes',
          password: 'smashburger2026',
          encryption: 'WPA'
        }
      },
      {
        id: 'burg-6',
        tenant_id: '00000000-0000-0000-0000-000000000002',
        module_type: 'social_links',
        title: 'Siga o Burger Lab',
        is_active: true,
        order_index: 6,
        config_data: {
          instagram: 'https://instagram.com/burgerlab',
          tiktok: 'https://tiktok.com/@burgerlab'
        }
      }
    ]
  },

  'clinica-sorriso-prime': {
    tenant: {
      id: '00000000-0000-0000-0000-000000000003',
      slug: 'clinica-sorriso-prime',
      name: 'Odonto Sorriso Prime',
      nicho: 'Clínica Odontológica & Estética',
      bio: 'Lentes de contato dental em porcelana, alinhadores invisíveis e implantes digitais sem dor.',
      logo_url: '/logos/odonto-prime.svg',
      primary_color: '#0EA5E9',
      google_place_id: 'ChIJN1t_tDeuEmsRUsoyOdonto',
      whatsapp_feedback: '5511977776666',
      status: 'trial',
      plan_tier: 'pro',
      mrr_cents: 12700,
      next_billing_date: '2026-10-30',
      owner_email: 'dra.camila@sorrisoprime.com.br',
      taps_30d: 194,
      reviews_30d: 58,
      created_at: '2026-10-16T09:15:00Z'
    },
    modules: [
      {
        id: 'odo-1',
        tenant_id: '00000000-0000-0000-0000-000000000003',
        module_type: 'google_reviews',
        title: 'Avalie seu atendimento na Sorriso Prime',
        is_active: true,
        order_index: 1,
        config_data: {
          tags: [
            'Mão Super Leve',
            'Clínica Moderna',
            'Pontualidade Britânica',
            'Recepção Acolhedora',
            'Resultado Perfeito'
          ]
        }
      },
      {
        id: 'odo-2',
        tenant_id: '00000000-0000-0000-0000-000000000003',
        module_type: 'whatsapp_direct',
        title: 'Agendar Retorno / Falar com Recepção',
        is_active: true,
        order_index: 2,
        config_data: {
          phone: '5511977776666',
          default_message: 'Olá! Estou na recepção da Odonto Sorriso Prime e gostaria de confirmar meu agendamento.'
        }
      },
      {
        id: 'odo-3',
        tenant_id: '00000000-0000-0000-0000-000000000003',
        module_type: 'wifi_facil',
        title: 'Wi-Fi Sala de Espera VIP',
        is_active: true,
        order_index: 3,
        config_data: {
          ssid: 'SorrisoPrime_VIP',
          password: 'sorriso100',
          encryption: 'WPA'
        }
      },
      {
        id: 'odo-4',
        tenant_id: '00000000-0000-0000-0000-000000000003',
        module_type: 'pix_facil',
        title: 'Pagamento via Pix (Recepção)',
        is_active: true,
        order_index: 4,
        config_data: {
          pix_key: '44.555.666/0001-01',
          pix_key_type: 'cnpj',
          beneficiary_name: 'Sorriso Prime Odontologia Digital'
        }
      }
    ]
  },

  'petshop-amigo-fiel': {
    tenant: {
      id: '00000000-0000-0000-0000-000000000004',
      slug: 'petshop-amigo-fiel',
      name: 'Pet Shop & Vet Amigo Fiel',
      nicho: 'Pet Shop & Clínica Veterinária',
      bio: 'Banho e tosa humanizado com monitoramento por câmeras, farmácia pet e consultas 24h.',
      logo_url: '/logos/pet-amigo-fiel.svg',
      primary_color: '#10B981',
      google_place_id: 'ChIJN1t_tDeuEmsRUsoyPet',
      whatsapp_feedback: '5511966665555',
      status: 'suspended',
      plan_tier: 'starter',
      mrr_cents: 6700,
      next_billing_date: '2026-10-05',
      owner_email: 'financeiro@petamigofiel.com.br',
      taps_30d: 412,
      reviews_30d: 89,
      created_at: '2026-06-01T11:00:00Z'
    },
    modules: [
      {
        id: 'pet-1',
        tenant_id: '00000000-0000-0000-0000-000000000004',
        module_type: 'google_reviews',
        title: 'Seu pet foi bem cuidado? Avalie no Google!',
        is_active: true,
        order_index: 1,
        config_data: {
          tags: [
            'Carinho com os Pets',
            'Banho Cheiroso',
            'Tosa Perfeita',
            'Veterinários Atenciosos',
            'Ambiente Limpo'
          ]
        }
      },
      {
        id: 'pet-2',
        tenant_id: '00000000-0000-0000-0000-000000000004',
        module_type: 'whatsapp_direct',
        title: 'Agendar Banho & Tosa ou Táxi Dog',
        is_active: true,
        order_index: 2,
        config_data: {
          phone: '5511966665555',
          default_message: 'Olá! Quero agendar um horário de banho e tosa no Pet Amigo Fiel.'
        }
      },
      {
        id: 'pet-3',
        tenant_id: '00000000-0000-0000-0000-000000000004',
        module_type: 'pix_facil',
        title: 'Pix Balcão Pet Shop',
        is_active: true,
        order_index: 3,
        config_data: {
          pix_key: 'financeiro@petamigofiel.com.br',
          pix_key_type: 'email',
          beneficiary_name: 'Pet Amigo Fiel Veterinária'
        }
      }
    ]
  }
};

export function createDefaultModulesForTenant(tenant: Tenant): TenantModule[] {
  return [
    {
      id: `${tenant.id}-rev`,
      tenant_id: tenant.id,
      module_type: 'google_reviews',
      title: `Avalie ${tenant.name} no Google`,
      is_active: true,
      order_index: 1,
      config_data: {
        tags: ['Atendimento Nota 10', 'Qualidade Impecável', 'Ambiente Incrível', 'Super Rápido']
      }
    },
    {
      id: `${tenant.id}-wa`,
      tenant_id: tenant.id,
      module_type: 'whatsapp_direct',
      title: 'Atendimento via WhatsApp',
      is_active: true,
      order_index: 2,
      config_data: {
        phone: tenant.whatsapp_feedback || '5511999999999',
        default_message: `Olá! Acessei a placa inteligente em ${tenant.name}.`
      }
    },
    {
      id: `${tenant.id}-pix`,
      tenant_id: tenant.id,
      module_type: 'pix_facil',
      title: 'Pagamento via Pix Rápido',
      is_active: true,
      order_index: 3,
      config_data: {
        pix_key: tenant.owner_email || '00.000.000/0001-00',
        pix_key_type: 'email',
        beneficiary_name: tenant.name
      }
    },
    {
      id: `${tenant.id}-wifi`,
      tenant_id: tenant.id,
      module_type: 'wifi_facil',
      title: 'Wi-Fi Clientes',
      is_active: true,
      order_index: 4,
      config_data: {
        ssid: `${tenant.slug.slice(0, 12)}_5G`,
        password: 'clientes123',
        encryption: 'WPA'
      }
    },
    {
      id: `${tenant.id}-cat`,
      tenant_id: tenant.id,
      module_type: 'catalogo_produtos',
      title: 'Destaques & Promoções',
      is_active: false,
      order_index: 5,
      config_data: {
        items: [
          {
            id: 'item-1',
            title: 'Destaque Principal da Casa',
            description: 'Consulte condições especiais no balcão',
            price: 'R$ 49,90',
            badge: 'Destaque'
          }
        ]
      }
    },
    {
      id: `${tenant.id}-soc`,
      tenant_id: tenant.id,
      module_type: 'social_links',
      title: 'Siga nossas Redes Sociais',
      is_active: true,
      order_index: 6,
      config_data: {
        instagram: 'https://instagram.com'
      }
    }
  ];
}

export function loadTenantsDb(): Record<string, TenantFullRecord> {
  if (typeof window === 'undefined') return DEFAULT_TENANTS_DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TENANTS_DB));
      return DEFAULT_TENANTS_DB;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TENANTS_DB, ...parsed };
  } catch {
    return DEFAULT_TENANTS_DB;
  }
}

export function saveTenantsDb(db: Record<string, TenantFullRecord>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

export function getTenantRecordBySlug(slug: string): TenantFullRecord {
  const db = loadTenantsDb();
  if (db[slug]) return db[slug];
  return DEFAULT_TENANTS_DB['barbearia-premium'];
}

export function updateTenantRecord(slug: string, updated: TenantFullRecord) {
  const db = loadTenantsDb();
  // Se o lojista ou super admin alterou o slug, mantém também a nova chave
  if (updated.tenant.slug !== slug) {
    delete db[slug];
  }
  db[updated.tenant.slug] = updated;
  saveTenantsDb(db);
}
