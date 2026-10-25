import QRCode from 'qrcode';

export interface QrCodeGeneratorOptions {
  /** URL imutável que será codificada no QR Code (ex: https://dominio.app/r/slug?src=qr) */
  url: string;
  /** Cor primária dos módulos escuros em hexadecimal (default: #0F172A) */
  darkColor?: string;
  /** Cor de fundo em hexadecimal (default: #FFFFFF) */
  lightColor?: string;
  /** Largura/Altura em pixels para PNG. Mínimo forçado: 1200px (300 DPI) */
  sizePx?: number;
  /** Margem de segurança (Quiet Zone) em módulos do QR Code (default: 4 para leitura óptica rápida) */
  quietZoneModules?: number;
  /** Logo central opcional (DataURL ou URL pública com CORS) */
  centerLogoUrl?: string | null;
}

export interface AcrylicPlateRenderOptions extends QrCodeGeneratorOptions {
  tenantName: string;
  slug: string;
  includeAcrylicFrame?: boolean;
}

/**
 * 1. GERADOR DE SVG VETORIAL (NÍVEL H - 30% DE REDUNDÂNCIA)
 * Se `includeAcrylicFrame` for true (via generateAcrylicPlateSvg), gera a placa acrílica
 * completa idêntica ao preview da esquerda; caso contrário, gera o QR Code vetorial puro.
 */
export async function generateQrCodeSvg(options: QrCodeGeneratorOptions): Promise<string> {
  const {
    url,
    darkColor = '#0F172A',
    lightColor = '#FFFFFF',
    quietZoneModules = 4
  } = options;

  if (!url || !url.startsWith('http')) {
    throw new Error('URL inválida para geração do QR Code vetorial.');
  }

  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H', // 30% de tolerância a falhas físicas, riscos no acrílico ou logo central
    margin: Math.max(4, quietZoneModules),
    color: {
      dark: darkColor,
      light: lightColor
    }
  });
}

/**
 * Gera o SVG Vetorial Completo da Placa Acrílica (idêntico ao Mockup da esquerda)
 */
export async function generateAcrylicPlateSvg(
  options: AcrylicPlateRenderOptions
): Promise<string> {
  const {
    url,
    tenantName,
    darkColor = '#D97706',
    lightColor = '#FFFFFF',
    quietZoneModules = 4,
    includeAcrylicFrame = true,
    centerLogoUrl
  } = options;

  const rawQrSvg = await generateQrCodeSvg({
    url,
    darkColor,
    lightColor,
    quietZoneModules
  });

  if (!includeAcrylicFrame) {
    return rawQrSvg;
  }

  // Extrai o viewBox e conteúdo interno do SVG gerado pelo pacote qrcode
  const viewBoxMatch = rawQrSvg.match(/viewBox="([^"]+)"/);
  const qrViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 45 45';
  const innerSvgContent = rawQrSvg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');

  const safeName = escapeXml(tenantName);
  const initials = escapeXml(tenantName.slice(0, 2).toUpperCase());

  const centerLogoElement = centerLogoUrl
    ? `<image href="${escapeXml(centerLogoUrl)}" x="546" y="756" width="108" height="108" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)" />`
    : `<text x="600" y="823" text-anchor="middle" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="38" font-weight="900">${initials}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
  <defs>
    <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="55%" stop-color="#121215" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.09" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <clipPath id="plateClip">
      <rect x="20" y="20" width="1160" height="1560" rx="112" />
    </clipPath>
    <clipPath id="logoClip">
      <rect x="546" y="756" width="108" height="108" rx="24" />
    </clipPath>
  </defs>

  <!-- Corpo da Placa Acrílica Escura -->
  <rect x="20" y="20" width="1160" height="1560" rx="112" fill="url(#plateGrad)" stroke="#ffffff" stroke-opacity="0.16" stroke-width="6" />

  <!-- Reflexo Diagonal Acrílico -->
  <g clip-path="url(#plateClip)">
    <polygon points="-100,-100 680,-100 -100,680" fill="url(#sheenGrad)" />
  </g>

  <!-- Topo: KONNEXY TAG + Badge NFC ATIVO -->
  <text x="115" y="152" fill="#a1a1aa" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="800" letter-spacing="5">KONNEXY TAG</text>

  <rect x="800" y="104" width="290" height="72" rx="36" fill="#ffffff" fill-opacity="0.09" />
  <g transform="translate(834, 122)" stroke="${darkColor}" stroke-width="3.2" fill="none" stroke-linecap="round">
    <path d="M 6 10 A 14 14 0 0 1 6 26" />
    <path d="M 14 5 A 22 22 0 0 1 14 31" />
    <path d="M 22 0 A 30 30 0 0 1 22 36" />
  </g>
  <text x="968" y="151" text-anchor="middle" fill="#f4f4f5" font-family="Inter, system-ui, sans-serif" font-size="31" font-weight="800" letter-spacing="1">NFC ATIVO</text>

  <!-- Nome do Estabelecimento e Subtítulo -->
  <text x="600" y="295" text-anchor="middle" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="60" font-weight="800">${safeName}</text>
  <text x="600" y="355" text-anchor="middle" fill="#a1a1aa" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="500">Aproxime o celular ou aponte a câmera</text>

  <!-- Card Branco Central do QR Code -->
  <rect x="200" y="410" width="800" height="800" rx="64" fill="#ffffff" stroke="${darkColor}" stroke-opacity="0.35" stroke-width="6" />

  <!-- QR Code Vetorial Nível H -->
  <svg x="236" y="446" width="728" height="728" viewBox="${qrViewBox}">
    ${innerSvgContent}
  </svg>

  <!-- Emblema / Logo Centralizado sobreposto -->
  <rect x="538" y="748" width="124" height="124" rx="28" fill="${darkColor}" stroke="#ffffff" stroke-width="8" />
  ${centerLogoElement}

  <!-- 5 Estrelas Douradas + Call to Action -->
  <text x="600" y="1325" text-anchor="middle" fill="#fbbf24" font-family="Segoe UI Symbol, Arial, sans-serif" font-size="54" letter-spacing="14">★ ★ ★ ★ ★</text>
  <text x="600" y="1400" text-anchor="middle" fill="#d4d4d8" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="800" letter-spacing="3">AVALIE EM 10 SEGUNDOS NO GOOGLE</text>

  <!-- Barra de Base Chanfrada na Cor do Estabelecimento -->
  <rect x="420" y="1475" width="360" height="22" rx="11" fill="${darkColor}" fill-opacity="0.88" />
</svg>`;
}

/**
 * 2. GERADOR DE PNG DE ALTA RESOLUÇÃO (300 DPI + NÍVEL H)
 * Quando `includeAcrylicFrame` está marcado, desenha exatamente a Placa em Acrílico
 * idêntica ao Mockup 3D da esquerda no painel!
 */
export async function generateQrCodeHighResPngDataUrl(
  options: AcrylicPlateRenderOptions
): Promise<string> {
  const {
    url,
    tenantName,
    darkColor = '#D97706',
    lightColor = '#FFFFFF',
    sizePx = 2400, // 2400px de largura em 300 DPI
    quietZoneModules = 4,
    includeAcrylicFrame = false,
    centerLogoUrl
  } = options;

  const safeWidth = Math.max(1200, sizePx);

  // Modo apenas QR Code puro (sem moldura da placa acrílica)
  if (!includeAcrylicFrame) {
    const canvas = document.createElement('canvas');
    canvas.width = safeWidth;
    canvas.height = safeWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D indisponível.');

    await QRCode.toCanvas(canvas, url, {
      errorCorrectionLevel: 'H',
      width: safeWidth,
      margin: Math.max(4, quietZoneModules),
      color: { dark: darkColor, light: lightColor }
    });

    if (centerLogoUrl) {
      await drawCenterLogoBadge(ctx, centerLogoUrl, tenantName, darkColor, safeWidth / 2, safeWidth / 2, Math.round(safeWidth * 0.16));
    }

    return canvas.toDataURL('image/png', 1.0);
  }

  // =========================================================================
  // MODO PLACA EM ACRÍLICO COMPLETA (IDÊNTICA À IMAGEM DA ESQUERDA NO ESTÚDIO)
  // Proporção 3:4 (ex: 1800 x 2400px @ 300 DPI) com cantos arredondados e fundo escuro
  // =========================================================================
  const width = 1800;
  const height = 2400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto 2D do Canvas indisponível neste navegador.');
  }

  ctx.clearRect(0, 0, width, height);

  const plateMargin = 36;
  const plateX = plateMargin;
  const plateY = plateMargin;
  const plateW = width - plateMargin * 2;
  const plateH = height - plateMargin * 2;
  const plateRadius = 168;

  // 1. Corpo da Placa em Acrílico Escuro com Gradiente
  ctx.save();
  roundRectPath(ctx, plateX, plateY, plateW, plateH, plateRadius);
  const bgGrad = ctx.createLinearGradient(0, plateY, 0, plateY + plateH);
  bgGrad.addColorStop(0, '#18181b');
  bgGrad.addColorStop(0.55, '#121215');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Reflexo diagonal suave no topo esquerdo (efeito acrílico cristal)
  ctx.clip();
  const sheenGrad = ctx.createLinearGradient(0, 0, width * 0.55, height * 0.45);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width * 0.65, 0);
  ctx.lineTo(0, height * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Borda translúcida de acabamento acrílico
  ctx.save();
  roundRectPath(ctx, plateX, plateY, plateW, plateH, plateRadius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  // 2. Topo da Placa: "KONNEXY TAG" à esquerda + Badge "NFC ATIVO" à direita
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '800 48px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('KONNEXY TAG', 165, 225);

  // Pill Badge "NFC ATIVO"
  const badgeW = 420;
  const badgeH = 104;
  const badgeX = width - 165 - badgeW;
  const badgeY = 152;
  ctx.save();
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.fill();
  ctx.restore();

  // Ícone de ondas NFC dentro do Badge
  drawNfcWavesIcon(ctx, badgeX + 58, badgeY + badgeH / 2, darkColor);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = '800 44px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NFC ATIVO', badgeX + 128, badgeY + 68);

  // 3. Nome do Estabelecimento & Subtítulo
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 86px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tenantName, width / 2, 435);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 52px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Aproxime o celular ou aponte a câmera', width / 2, 520);

  // 4. Container Branco Central com Cantos Arredondados para o QR Code
  const qrBoxSize = 1180;
  const qrBoxX = Math.round((width - qrBoxSize) / 2);
  const qrBoxY = 610;
  const qrBoxRadius = 92;

  ctx.save();
  roundRectPath(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrBoxRadius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = `${darkColor}55`;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  // Renderiza o QR Code Nível H dentro do card branco
  const qrInnerPadding = 54;
  const qrRenderSize = qrBoxSize - qrInnerPadding * 2;
  const qrCanvas = document.createElement('canvas');

  await QRCode.toCanvas(qrCanvas, url, {
    errorCorrectionLevel: 'H',
    width: qrRenderSize,
    margin: Math.max(4, quietZoneModules),
    color: {
      dark: darkColor,
      light: '#FFFFFF'
    }
  });

  ctx.drawImage(qrCanvas, qrBoxX + qrInnerPadding, qrBoxY + qrInnerPadding);

  // 5. Emblema / Logo Centralizado sobre o QR Code (idêntico ao preview)
  const centerX = qrBoxX + qrBoxSize / 2;
  const centerY = qrBoxY + qrBoxSize / 2;
  const logoBadgeSize = 210;
  await drawCenterLogoBadge(ctx, centerLogoUrl, tenantName, darkColor, centerX, centerY, logoBadgeSize);

  // 6. 5 Estrelas Douradas + Call to Action na Base
  ctx.fillStyle = '#fbbf24';
  ctx.font = '78px "Segoe UI Symbol", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★  ★  ★  ★  ★', width / 2, 1965);

  ctx.fillStyle = '#d4d4d8';
  ctx.font = '800 52px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AVALIE EM 10 SEGUNDOS NO GOOGLE', width / 2, 2075);

  // 7. Barra Chanfrada Inferior da Placa Acrílica
  const barW = 520;
  const barH = 30;
  const barX = Math.round((width - barW) / 2);
  const barY = 2180;
  ctx.save();
  roundRectPath(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = darkColor;
  ctx.globalAlpha = 0.88;
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/png', 1.0);
}

async function drawCenterLogoBadge(
  ctx: CanvasRenderingContext2D,
  centerLogoUrl: string | null | undefined,
  tenantName: string,
  darkColor: string,
  centerX: number,
  centerY: number,
  badgeSize: number
) {
  const x = Math.round(centerX - badgeSize / 2);
  const y = Math.round(centerY - badgeSize / 2);
  const radius = Math.round(badgeSize * 0.24);

  // Fundo colorido + borda branca protetora
  ctx.save();
  roundRectPath(ctx, x, y, badgeSize, badgeSize, radius);
  ctx.fillStyle = darkColor;
  ctx.fill();
  ctx.lineWidth = Math.max(8, Math.round(badgeSize * 0.06));
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();

  if (centerLogoUrl) {
    try {
      const logoImg = await loadImageSafe(centerLogoUrl);
      const innerPad = Math.round(badgeSize * 0.06);
      ctx.save();
      roundRectPath(
        ctx,
        x + innerPad,
        y + innerPad,
        badgeSize - innerPad * 2,
        badgeSize - innerPad * 2,
        Math.max(8, radius - innerPad)
      );
      ctx.clip();
      ctx.drawImage(
        logoImg,
        x + innerPad,
        y + innerPad,
        badgeSize - innerPad * 2,
        badgeSize - innerPad * 2
      );
      ctx.restore();
      return;
    } catch {
      // Fallback para as iniciais se falhar
    }
  }

  // Fallback: Iniciais centralizadas
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(badgeSize * 0.38)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tenantName.slice(0, 2).toUpperCase(), centerX, centerY);
  ctx.textBaseline = 'alphabetic';
}

function drawNfcWavesIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const radii = [12, 22, 32];
  for (const r of radii) {
    ctx.beginPath();
    ctx.arc(cx - 10, cy, r, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function loadImageSafe(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
