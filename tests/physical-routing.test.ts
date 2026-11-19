import { describe, expect, it } from 'vitest';
import { physicalLinks } from '@/lib/physical-links';

describe('Physical-Digital Immutable Link Resolution', () => {
  it('generates valid NFC and QR immutable URLs for a valid tenant UUID', () => {
    const tenantId = 'e02619da-1fae-4d57-b4d2-d1be8b7b2ce6';
    const links = physicalLinks('https://tag.konnexy.com.br', tenantId);

    expect(links).not.toBeNull();
    expect(links?.nfc).toBe(`https://tag.konnexy.com.br/t/${tenantId}?src=nfc`);
    expect(links?.qr).toBe(`https://tag.konnexy.com.br/t/${tenantId}?src=qr`);
  });

  it('rejects invalid or unencrypted (HTTP) base URLs for physical production', () => {
    const tenantId = 'e02619da-1fae-4d57-b4d2-d1be8b7b2ce6';
    expect(physicalLinks('http://inseguro.com', tenantId)).toBeNull();
    expect(physicalLinks('https://user:pass@dominio.com', tenantId)).toBeNull();
  });

  it('rejects malformed tenant UUIDs to prevent corrupted chip writes', () => {
    expect(physicalLinks('https://tag.konnexy.com.br', 'not-a-uuid')).toBeNull();
  });
});
