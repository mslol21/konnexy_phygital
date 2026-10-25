import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Konnexy HQ • Controle Phygital',
    short_name: 'Konnexy HQ',
    description:
      'Aplicativo de controle Master e gestão de placas inteligentes NFC & QR Code Konnexy Tag.',
    start_url: '/super-admin',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#09090b',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/logos/konnexy-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/logos/konnexy-logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Painel Master (HQ)',
        short_name: 'HQ Master',
        description: 'Gerenciar todos os comércios, planos e mensalidades',
        url: '/super-admin',
        icons: [{ src: '/logos/konnexy-logo.svg', sizes: '192x192' }]
      },
      {
        name: 'Provisionar Novo Comércio',
        short_name: 'Nova Loja',
        description: 'Cadastrar um novo cliente e gerar placa QR/NFC',
        url: '/super-admin?new=1',
        icons: [{ src: '/logos/konnexy-logo.svg', sizes: '192x192' }]
      },
      {
        name: 'Editor de Perfil & Placa',
        short_name: 'Editor Lojas',
        description: 'Editar módulos, capa, Pix, Wi-Fi e cardápio',
        url: '/dashboard',
        icons: [{ src: '/logos/konnexy-logo.svg', sizes: '192x192' }]
      }
    ]
  };
}
