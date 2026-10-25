export type UserRole = 'super_admin' | 'tenant_admin';
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'canceled';
export type PlanTier = 'starter' | 'pro' | 'enterprise';

export type ModuleType =
  | 'google_reviews'
  | 'whatsapp_direct'
  | 'cardapio_link'
  | 'catalogo_produtos'
  | 'pix_facil'
  | 'social_links'
  | 'wifi_facil'
  | 'site_institucional'
  | 'custom_link';

export type AccessSource = 'nfc' | 'qr' | 'direct';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  owner_id?: string;
  slug: string;
  name: string;
  nicho: string;
  bio?: string | null;
  logo_url: string | null;
  cover_url?: string | null;
  primary_color: string;
  google_place_id: string | null;
  whatsapp_feedback: string | null;
  status?: TenantStatus;
  plan_tier?: PlanTier;
  mrr_cents?: number;
  next_billing_date?: string;
  owner_email?: string;
  owner_phone?: string;
  taps_30d?: number;
  nfc_30d?: number;
  qr_30d?: number;
  google_clicks_30d?: number;
  reviews_30d?: number;
  created_at: string;
}

export interface GoogleReviewsConfig {
  tags?: string[];
  subtitle?: string;
  incentive_text?: string;
}

export interface WhatsAppDirectConfig {
  phone: string;
  default_message?: string;
  button_label?: string;
}

export interface CardapioLinkConfig {
  url: string;
  mode?: 'pdf' | 'external';
  button_label?: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  description?: string;
  price: string;
  image_url?: string;
  badge?: string;
}

export interface CatalogoProdutosConfig {
  items: CatalogItem[];
}

export interface PixFacilConfig {
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp';
  beneficiary_name: string;
  city?: string;
}

export interface SocialLinksConfig {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
  announcement_url?: string;
  announcement_text?: string;
}

export interface WifiFacilConfig {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

export interface CustomLinkConfig {
  url: string;
  label: string;
  subtitle?: string;
}

export interface TenantModule<T = Record<string, any>> {
  id: string;
  tenant_id: string;
  module_type: ModuleType;
  title?: string | null;
  is_active: boolean;
  config_data: T;
  order_index: number;
}
