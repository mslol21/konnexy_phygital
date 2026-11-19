import { describe, expect, it } from 'vitest';
import { PLAN_LIMITS } from '@/lib/auth/rbac';
import type { ModuleType, PlanTier } from '@/types/phygital';

describe('Plan RBAC & 9 Modules Consistency Matrix', () => {
  const allNineModules: ModuleType[] = [
    'google_reviews',
    'whatsapp_direct',
    'pix_facil',
    'wifi_facil',
    'cardapio_link',
    'catalogo_produtos',
    'social_links',
    'site_institucional',
    'custom_link'
  ];

  it('verifies that exactly 9 unique module types exist in the ecosystem', () => {
    expect(allNineModules.length).toBe(9);
    expect(new Set(allNineModules).size).toBe(9);
  });

  it('enforces Starter tier boundaries (max 3 modules)', () => {
    const starter = PLAN_LIMITS.starter;
    expect(starter.maxActiveModules).toBe(3);
    expect(starter.allowedModules).toEqual(['google_reviews', 'whatsapp_direct', 'social_links']);
    expect(starter.allowedModules.includes('pix_facil')).toBe(false);
    expect(starter.allowedModules.includes('wifi_facil')).toBe(false);
  });

  it('enforces Pro tier boundaries (max 6 modules)', () => {
    const pro = PLAN_LIMITS.pro;
    expect(pro.maxActiveModules).toBe(6);
    expect(pro.allowedModules.length).toBe(6);
    expect(pro.allowedModules.includes('pix_facil')).toBe(true);
    expect(pro.allowedModules.includes('wifi_facil')).toBe(true);
    expect(pro.allowedModules.includes('cardapio_link')).toBe(true);
    expect(pro.allowedModules.includes('catalogo_produtos')).toBe(false);
  });

  it('enforces Enterprise tier boundaries (all 9 modules)', () => {
    const enterprise = PLAN_LIMITS.enterprise;
    expect(enterprise.maxActiveModules).toBe(9);
    expect(enterprise.allowedModules.length).toBe(9);
    allNineModules.forEach((mod) => {
      expect(enterprise.allowedModules.includes(mod)).toBe(true);
    });
  });
});
