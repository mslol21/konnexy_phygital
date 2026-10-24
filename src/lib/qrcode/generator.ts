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
 * Ideal para envio direto à gráfica (CorelDRAW, Illustrator, Corte a Laser e Impressão UV em Acrílico).
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
    margin: Math.max(2, quietZoneModules),
    color: {
      dark: darkColor,
      light: lightColor
    }
  });
}

/**
 * 2. GERADOR DE PNG DE ALTA RESOLUÇÃO (MÍNIMO 1200x1200px @ 300 DPI + NÍVEL H)
 * Pode ser executado no Browser (HTMLCanvasElement) para exportação gráfica imediata.
 */
export async function generateQrCodeHighResPngDataUrl(
  options: AcrylicPlateRenderOptions
): Promise<string> {
  const {
    url,
    tenantName,
    slug,
    darkColor = '#0F172A',
    lightColor = '#FFFFFF',
    sizePx = 2400, // 2400px = 20cm reais em 300 DPI (mínimo garantido >= 1200px)
    quietZoneModules = 4,
    includeAcrylicFrame = false,
    centerLogoUrl
  } = options;

  // Garante resolução mínima estrita de 1200x1200px (300 DPI)
  const safeQrSize = Math.max(1200, sizePx);

  const canvas = document.createElement('canvas');
  const width = safeQrSize;
  const height = includeAcrylicFrame ? Math.round(safeQrSize * 1.25) : safeQrSize;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto 2D do Canvas indisponível neste navegador.');
  }

  // Fundo sólido de alto contraste para leitura óptica
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, width, height);

  const qrRenderSize = includeAcrylicFrame ? Math.round(safeQrSize * 0.75) : safeQrSize;
  const qrCanvas = document.createElement('canvas');

  await QRCode.toCanvas(qrCanvas, url, {
    errorCorrectionLevel: 'H', // Redundância máxima (30%)
    width: qrRenderSize,
    margin: Math.max(2, quietZoneModules),
    color: {
      dark: darkColor,
      light: lightColor
    }
  });

  const qrOffsetX = Math.round((width - qrRenderSize) / 2);
  const qrOffsetY = includeAcrylicFrame ? Math.round(safeQrSize * 0.23) : 0;

  if (includeAcrylicFrame) {
    // Borda guia para corte a laser em chapa de acrílico
    const borderOffset = Math.round(width * 0.033);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = Math.round(width * 0.015);
    ctx.strokeRect(
      borderOffset,
      borderOffset,
      width - borderOffset * 2,
      height - borderOffset * 2
    );

    // Título do Estabelecimento
    ctx.fillStyle = darkColor;
    ctx.font = `bold ${Math.round(width * 0.045)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tenantName.toUpperCase(), width / 2, Math.round(width * 0.13));

    // Subtítulo de Instrução Phygital (NFC + Câmera)
    ctx.fillStyle = '#475569';
    ctx.font = `600 ${Math.round(width * 0.028)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(
      'APROXIME O CELULAR (NFC) OU APONTE A CÂMERA',
      width / 2,
      Math.round(width * 0.18)
    );
  }

  // Desenha o QR Code Nível H no Canvas principal
  ctx.drawImage(qrCanvas, qrOffsetX, qrOffsetY);

  // Se houver logotipo central, aplica sobreposição segura (máx 18% da área do QR Code, suportado pelo nível H)
  if (centerLogoUrl) {
    try {
      const logoImg = await loadImageSafe(centerLogoUrl);
      const logoBoxSize = Math.round(qrRenderSize * 0.18);
      const logoX = qrOffsetX + Math.round((qrRenderSize - logoBoxSize) / 2);
      const logoY = qrOffsetY + Math.round((qrRenderSize - logoBoxSize) / 2);
      const pad = Math.round(logoBoxSize * 0.12);

      // Almofada branca protetora sob o logo
      ctx.fillStyle = lightColor;
      ctx.fillRect(logoX - pad, logoY - pad, logoBoxSize + pad * 2, logoBoxSize + pad * 2);
      ctx.drawImage(logoImg, logoX, logoY, logoBoxSize, logoBoxSize);
    } catch {
      // Se o logo externo falhar por CORS, mantém o QR Code íntegro sem interromper a exportação
    }
  }

  if (includeAcrylicFrame) {
    ctx.fillStyle = darkColor;
    ctx.font = `bold ${Math.round(width * 0.031)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(
      '⭐ AVALIE NOSSA EXPERIÊNCIA EM 10 SEGUNDOS',
      width / 2,
      Math.round(height * 0.87)
    );

    ctx.fillStyle = '#64748B';
    ctx.font = `500 ${Math.round(width * 0.022)}px monospace`;
    ctx.fillText(`/r/${slug}`, width / 2, Math.round(height * 0.92));
  }

  return canvas.toDataURL('image/png', 1.0);
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
