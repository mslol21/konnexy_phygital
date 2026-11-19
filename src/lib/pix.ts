import type { PixFacilConfig } from '@/types/phygital';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp';

export interface PixKeyValidationResult {
  valid: boolean;
  normalizedKey?: string;
  error?: string;
}

/**
 * Valida o formato da chave Pix de acordo com as especificações do Banco Central do Brasil.
 */
export function validatePixKey(rawKey: string, keyType?: PixKeyType): PixKeyValidationResult {
  const key = (rawKey || '').trim();
  if (!key) {
    return { valid: false, error: 'A chave Pix não pode ser vazia.' };
  }

  // Comprimento máximo definido pelo Banco Central (RFC / SPI)
  if (new TextEncoder().encode(key).length > 77) {
    return { valid: false, error: 'Chave Pix excede o tamanho máximo de 77 caracteres.' };
  }

  // Detecção automática de tipo se não for informado
  let detectedType = keyType;
  if (!detectedType) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
      detectedType = 'evp';
    } else if (key.includes('@')) {
      detectedType = 'email';
    } else if (key.startsWith('+') || /^\d{10,13}$/.test(key.replace(/\D/g, ''))) {
      const digits = key.replace(/\D/g, '');
      if (digits.length === 11 && !key.startsWith('+')) {
        detectedType = 'cpf'; // Ambiguidade resolvida como CPF se tiver exatamente 11 dígitos sem +
      } else if (digits.length === 14) {
        detectedType = 'cnpj';
      } else {
        detectedType = 'phone';
      }
    }
  }

  switch (detectedType) {
    case 'cpf': {
      const clean = key.replace(/\D/g, '');
      if (clean.length !== 11) {
        return { valid: false, error: 'Chave CPF deve conter exatamente 11 dígitos numéricos.' };
      }
      return { valid: true, normalizedKey: clean };
    }
    case 'cnpj': {
      const clean = key.replace(/\D/g, '');
      if (clean.length !== 14) {
        return { valid: false, error: 'Chave CNPJ deve conter exatamente 14 dígitos numéricos.' };
      }
      return { valid: true, normalizedKey: clean };
    }
    case 'phone': {
      let clean = key.replace(/[^\d+]/g, '');
      if (!clean.startsWith('+')) {
        const digits = clean.replace(/\D/g, '');
        // Adiciona DDI 55 padrão se não fornecido
        clean = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
      }
      const digitsAfterDDI = clean.replace(/\D/g, '');
      if (digitsAfterDDI.length < 12 || digitsAfterDDI.length > 13) {
        return { valid: false, error: 'Chave de telefone deve conter DDI (+55), DDD e número válido.' };
      }
      return { valid: true, normalizedKey: clean };
    }
    case 'email': {
      if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(key) || key.length > 77) {
        return { valid: false, error: 'Chave de e-mail com formato inválido.' };
      }
      return { valid: true, normalizedKey: key.toLowerCase() };
    }
    case 'evp': {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
        return { valid: false, error: 'Chave aleatória (EVP) deve estar no formato UUID padrão.' };
      }
      return { valid: true, normalizedKey: key.toLowerCase() };
    }
    default:
      return { valid: true, normalizedKey: key };
  }
}

/**
 * Constrói elemento EMVCo no formato [ID (2 dígitos)][Tamanho (2 dígitos)][Valor]
 */
function emvItem(id: string, value: string): string {
  const len = new TextEncoder().encode(value).length;
  if (len > 99) {
    throw new Error(`Tamanho do campo Pix EMV ${id} excede 99 bytes.`);
  }
  return `${id}${String(len).padStart(2, '0')}${value}`;
}

/**
 * Normaliza textos para o padrão ASCII requerido pelo EMVCo (sem acentos ou caracteres de controle).
 */
export function normalizeEmvText(value: string, maxLen: number): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .-]/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, maxLen);
}

/**
 * Calcula o checksum CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF).
 */
export function calculateCrc16(payloadWithoutChecksum: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(payloadWithoutChecksum);
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Verifica se um payload EMVCo BR Code possui checksum CRC16 válido.
 */
export function verifyPixCrc16(fullPayload: string): boolean {
  if (!fullPayload || fullPayload.length < 8) return false;
  const payloadData = fullPayload.slice(0, -4);
  const expectedCrc = fullPayload.slice(-4).toUpperCase();
  const calculatedCrc = calculateCrc16(payloadData);
  return expectedCrc === calculatedCrc;
}

/**
 * Gera payload estático BR Code (EMVCo) compatível com o Banco Central do Brasil.
 * Não inclui valor para evitar confirmações financeiras inadvertidas no balcão.
 */
export function staticPixPayload(cfg: PixFacilConfig): string {
  const validation = validatePixKey(cfg.pix_key, cfg.pix_key_type as PixKeyType);
  if (!validation.valid || !validation.normalizedKey) {
    throw new Error(validation.error || 'Chave Pix informada é inválida.');
  }

  const key = validation.normalizedKey;
  const beneficiary = normalizeEmvText(cfg.beneficiary_name || 'RECEBEDOR', 25) || 'RECEBEDOR';
  const city = normalizeEmvText(cfg.city || 'SAO PAULO', 15) || 'SAO PAULO';

  // Subcampo Merchant Account Information (Tag 26)
  const merchantAccount = emvItem('00', 'br.gov.bcb.pix') + emvItem('01', key);

  // Payload Base
  const baseData =
    emvItem('00', '01') + // Payload Format Indicator
    emvItem('26', merchantAccount) + // Merchant Account Information
    emvItem('52', '0000') + // Merchant Category Code
    emvItem('53', '986') + // Transaction Currency (986 = BRL)
    emvItem('58', 'BR') + // Country Code
    emvItem('59', beneficiary) + // Beneficiary Name
    emvItem('60', city) + // Merchant City
    emvItem('62', emvItem('05', '***')) + // Additional Data Field (Reference Label)
    '6304'; // CRC16 Tag + Length indicator

  const crc = calculateCrc16(baseData);
  const fullPayload = baseData + crc;

  if (!verifyPixCrc16(fullPayload)) {
    throw new Error('Falha interna na verificação de integridade CRC16 do Pix.');
  }

  return fullPayload;
}
