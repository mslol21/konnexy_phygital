import { describe, expect, it } from 'vitest';
import {
  buildWifiPayload,
  escapeWifiField,
  unescapeWifiField,
  parseWifiPayload
} from '@/lib/wifi';

describe('Wi-Fi QR Code Payload Engine', () => {
  it('escapes reserved characters correctly (;, :, ", \\)', () => {
    const raw = 'Minha;Rede:Com"Aspas\\Barra';
    const escaped = escapeWifiField(raw);
    expect(escaped).toBe('Minha\\;Rede\\:Com\\"Aspas\\\\Barra');
    expect(unescapeWifiField(escaped)).toBe(raw);
  });

  it('builds a standard WPA payload correctly', () => {
    const payload = buildWifiPayload({
      ssid: 'Cafeteria_Clientes',
      password: 'SenhaForte123!',
      encryption: 'WPA'
    });

    expect(payload).toBe('WIFI:T:WPA;S:Cafeteria_Clientes;P:SenhaForte123!;;');
  });

  it('builds an open network payload (nopass) without password field', () => {
    const payload = buildWifiPayload({
      ssid: 'Wi-Fi Aberto',
      encryption: 'nopass'
    });

    expect(payload).toBe('WIFI:T:nopass;S:Wi-Fi Aberto;;');
  });

  it('builds payload with special characters escaped properly', () => {
    const payload = buildWifiPayload({
      ssid: 'Rede;Livre:2.4G',
      password: 'p@ss;word:123"\\',
      encryption: 'WPA'
    });

    expect(payload).toBe('WIFI:T:WPA;S:Rede\\;Livre\\:2.4G;P:p@ss\\;word\\:123\\"\\\\;;');
    const parsed = parseWifiPayload(payload);
    expect(parsed?.ssid).toBe('Rede;Livre:2.4G');
    expect(parsed?.password).toBe('p@ss;word:123"\\');
    expect(parsed?.encryption).toBe('WPA');
  });

  it('throws an error if SSID is missing', () => {
    expect(() =>
      buildWifiPayload({
        ssid: '   ',
        password: '123'
      })
    ).toThrow('O nome da rede Wi-Fi (SSID) é obrigatório.');
  });

  it('throws an error if WPA network has no password', () => {
    expect(() =>
      buildWifiPayload({
        ssid: 'Rede_Protegida',
        password: '',
        encryption: 'WPA'
      })
    ).toThrow('A senha é obrigatória para redes com criptografia WPA.');
  });
});
