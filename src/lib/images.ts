export const IDEAL_COVER_WIDTH = 1200;
export const IDEAL_COVER_HEIGHT = 675; // Proporção 16:9 ideal para o 1º quadro (460x258px @ ~2.6x Retina)

/**
 * Redimensiona e faz recorte central inteligente (Smart Center-Crop 16:9 - 1200x675px)
 * via HTML5 Canvas para que qualquer foto enviada encaixe perfeitamente no 1º quadro.
 */
export function cropAndResizeCoverImage(
  file: File,
  targetWidth = IDEAL_COVER_WIDTH,
  targetHeight = IDEAL_COVER_HEIGHT
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result);
      // Se for SVG vetorial, preserva o SVG diretamente
      if (file.type === 'image/svg+xml') {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        // Cálculo de Smart Center-Crop (object-cover 16:9)
        const targetRatio = targetWidth / targetHeight;
        const srcRatio = img.width / img.height;

        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        if (srcRatio > targetRatio) {
          // Imagem mais larga que 16:9 -> corta laterais mantendo o centro
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          // Imagem mais alta que 16:9 -> corta topo/base mantendo o centro
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
