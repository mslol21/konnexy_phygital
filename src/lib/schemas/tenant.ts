import { z } from 'zod';
const text = (max: number) => z.string().trim().max(max);
const webUrl = text(2048).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}, 'Use um endereço HTTPS válido.');
const imageUrl = text(2048).refine(value => !value || /^\/(logos|covers)\/[a-zA-Z0-9_.-]+$/.test(value) || /^https:\/\//.test(value), 'Envie a imagem pelo botão de upload.').nullable().optional();
export const tenantSchema = z.object({
  slug: text(80).min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: text(120).min(2), nicho: text(120).min(2), bio: text(1000).nullable().optional(),
  logo_url: imageUrl, cover_url: imageUrl,
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  google_place_id: text(256).nullable().optional(),
  whatsapp_feedback: text(20).regex(/^\+?[0-9]*$/).nullable().optional(),
  status: z.enum(['active','trial','suspended','canceled']).optional(),
  plan_tier: z.enum(['starter','pro','enterprise']).optional(),
  owner_email: z.union([z.email(), z.literal('')]).optional(),
});
const moduleTypes = ['google_reviews','whatsapp_direct','pix_facil','wifi_facil','cardapio_link','catalogo_produtos','social_links','site_institucional','custom_link'] as const;
const configSchemas = {
  google_reviews: z.object({ tags: z.array(text(45)).max(10).optional(), subtitle: text(300).optional() }),
  whatsapp_direct: z.object({ phone: text(20).regex(/^\+?[0-9]*$/), default_message: text(1000).optional(), button_label: text(80).optional() }),
  pix_facil: z.object({ pix_key: text(200), pix_key_type: z.enum(['cpf','cnpj','email','phone','evp']), beneficiary_name: text(120), city: text(60).optional() }),
  wifi_facil: z.object({ ssid: text(64), password: text(128).optional(), encryption: z.enum(['WPA','WEP','nopass']) }),
  cardapio_link: z.object({ url: webUrl, mode: z.enum(['pdf','external']).optional(), button_label: text(80).optional() }),
  catalogo_produtos: z.object({ items: z.array(z.object({ id: text(80), title: text(120), description: text(500).optional(), price: text(50), image_url: imageUrl, badge: text(60).optional() })).max(50) }),
  social_links: z.object({ instagram: webUrl.optional(), tiktok: webUrl.optional(), facebook: webUrl.optional(), youtube: webUrl.optional(), announcement_url: webUrl.optional(), announcement_text: text(300).optional() }),
  site_institucional: z.object({ url: webUrl, label: text(80), subtitle: text(300).optional() }),
  custom_link: z.object({ url: webUrl, label: text(80), subtitle: text(300).optional() }),
};
export const moduleSchema = z.object({
  module_type: z.enum(moduleTypes), title: text(120).nullable().optional(),
  is_active: z.boolean(), order_index: z.number().int().min(0).max(100),
  config_data: z.record(z.string(), z.unknown())
}).transform((mod, ctx) => {
  const result = configSchemas[mod.module_type].safeParse(mod.config_data);
  if (!result.success) { ctx.addIssue({ code: 'custom', message: `Configuração inválida: ${mod.module_type}` }); return z.NEVER; }
  return { ...mod, config_data: result.data };
});
export const saveTenantSchema = z.object({
  tenant: tenantSchema,
  modules: z.array(moduleSchema).max(9).refine(modules => new Set(modules.map(m => m.module_type)).size === modules.length, 'Módulo duplicado.')
});
export function sanitizePublicModules(modules: unknown[]) {
  return modules.flatMap(raw => {
    const parsed = moduleSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.is_active) return [];
    const row = raw as { id: string; tenant_id: string };
    return [{ ...parsed.data, id: String(row.id), tenant_id: String(row.tenant_id) }];
  }).sort((a,b) => a.order_index-b.order_index);
}
