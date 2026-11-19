import { describe, expect, it } from 'vitest';
import {
  staticPixPayload,
  validatePixKey,
  calculateCrc16,
  verifyPixCrc16,
  normalizeEmvText
} from '@/lib/pix';

describe('Pix EMVCo & CRC16 Engine', () => {
  it('validates CPF key correctly', () => {
    const valid = validatePixKey('123.456.789-01', 'cpf');
    expect(valid.valid).toBe(true);
    expect(valid.normalizedKey).toBe('12345678901');

    const invalid = validatePixKey('123.456', 'cpf');
    expect(invalid.valid).toBe(false);
  });

  it('validates CNPJ key correctly', () => {
    const valid = validatePixKey('12.345.678/0001-90', 'cnpj');
    expect(valid.valid).toBe(true);
    expect(valid.normalizedKey).toBe('12345678000190');

    const invalid = validatePixKey('12345', 'cnpj');
    expect(invalid.valid).toBe(false);
  });

  it('validates phone key with BR international format', () => {
    const validWithDdi = validatePixKey('+5511999998888', 'phone');
    expect(validWithDdi.valid).toBe(true);
    expect(validWithDdi.normalizedKey).toBe('+5511999998888');

    const autoPrefixed = validatePixKey('(11) 99999-8888', 'phone');
    expect(autoPrefixed.valid).toBe(true);
    expect(autoPrefixed.normalizedKey).toBe('+5511999998888');
  });

  it('validates email key correctly', () => {
    const valid = validatePixKey('financeiro@konnexy.com.br', 'email');
    expect(valid.valid).toBe(true);
    expect(valid.normalizedKey).toBe('financeiro@konnexy.com.br');

    const invalid = validatePixKey('email-sem-arroba', 'email');
    expect(invalid.valid).toBe(false);
  });

  it('validates random EVP key (UUID format)', () => {
    const valid = validatePixKey('123e4567-e89b-12d3-a456-426614174000', 'evp');
    expect(valid.valid).toBe(true);
    expect(valid.normalizedKey).toBe('123e4567-e89b-12d3-a456-426614174000');

    const invalid = validatePixKey('invalid-uuid-key', 'evp');
    expect(invalid.valid).toBe(false);
  });

  it('normalizes EMV text by stripping accents and control characters', () => {
    const normalized = normalizeEmvText('Café & Pão São Paulo çã', 25);
    expect(normalized).toBe('CAFE   PAO SAO PAULO CA');
  });

  it('generates a valid EMVCo BR Code payload with valid CRC16', () => {
    const payload = staticPixPayload({
      pix_key: 'financeiro@empresa.com.br',
      pix_key_type: 'email',
      beneficiary_name: 'Padaria Modelo',
      city: 'São Paulo'
    });

    expect(payload.startsWith('000201')).toBe(true);
    expect(payload.includes('br.gov.bcb.pix')).toBe(true);
    expect(payload.includes('financeiro@empresa.com.br')).toBe(true);
    expect(payload.includes('PADARIA MODELO')).toBe(true);
    expect(payload.includes('SAO PAULO')).toBe(true);
    expect(payload.includes('6304')).toBe(true);

    // Verificação matemática estrita do CRC16
    expect(verifyPixCrc16(payload)).toBe(true);
  });

  it('rejects payload with tampered checksum', () => {
    const payload = staticPixPayload({
      pix_key: '12345678901',
      pix_key_type: 'cpf',
      beneficiary_name: 'Loja Teste',
      city: 'Curitiba'
    });

    const tampered = payload.slice(0, -4) + '0000';
    expect(verifyPixCrc16(tampered)).toBe(false);
  });
});
