import type { WifiFacilConfig } from '@/types/phygital';

export interface WifiPayloadOptions {
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

/**
 * Realiza o escape estrito de caracteres reservados em payloads Wi-Fi para QR Code:
 * Conforme especificação ZXing / MeCard Wi-Fi, os caracteres `\`, `;`, `,`, `:`, `"`
 * devem ser precedidos por barra invertida `\` para leitura segura em câmeras iOS e Android.
 */
export function escapeWifiField(value: string): string {
  if (!value) return '';
  return value.replace(/([\\;,:"'])/g, '\\$1');
}

/**
 * Remove os escapes de um campo de payload Wi-Fi
 */
export function unescapeWifiField(value: string): string {
  if (!value) return '';
  return value.replace(/\\([\\;,:"'])/g, '$1');
}

/**
 * Constrói string padronizada para conexão Wi-Fi nativa via QR Code:
 * Formato padrão: `WIFI:T:WPA;S:MinhaRede;P:MinhaSenha;;`
 */
export function buildWifiPayload(options: WifiPayloadOptions | WifiFacilConfig): string {
  const ssid = (options.ssid || '').trim();
  if (!ssid) {
    throw new Error('O nome da rede Wi-Fi (SSID) é obrigatório.');
  }

  const encryption = options.encryption || 'WPA';
  const isNoPass = encryption === 'nopass';
  const password = isNoPass ? '' : (options.password || '').trim();

  if (!isNoPass && !password) {
    throw new Error(`A senha é obrigatória para redes com criptografia ${encryption}.`);
  }

  const parts: string[] = [
    `T:${encryption}`,
    `S:${escapeWifiField(ssid)}`
  ];

  if (!isNoPass && password) {
    parts.push(`P:${escapeWifiField(password)}`);
  }

  if ('hidden' in options && options.hidden) {
    parts.push('H:true');
  }

  return `WIFI:${parts.join(';')};;`;
}

/**
 * Faz o parse e validação de um payload Wi-Fi formatado
 */
export function parseWifiPayload(payload: string): WifiPayloadOptions | null {
  if (!payload || !payload.startsWith('WIFI:') || !payload.endsWith(';;')) {
    return null;
  }

  const body = payload.slice(5, -2);
  // Split considerando caracteres escapados
  const tokens = body.split(/(?<!\\);/);

  let ssid = '';
  let password: string | undefined;
  let encryption: 'WPA' | 'WEP' | 'nopass' = 'WPA';
  let hidden = false;

  for (const token of tokens) {
    if (token.startsWith('S:')) {
      ssid = unescapeWifiField(token.slice(2));
    } else if (token.startsWith('P:')) {
      password = unescapeWifiField(token.slice(2));
    } else if (token.startsWith('T:')) {
      const type = token.slice(2);
      if (type === 'WPA' || type === 'WEP' || type === 'nopass') {
        encryption = type;
      }
    } else if (token.startsWith('H:')) {
      hidden = token.slice(2).toLowerCase() === 'true';
    }
  }

  if (!ssid) return null;
  return { ssid, password, encryption, hidden };
}
