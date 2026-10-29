/** Resolução LÓGICA do jogo. O canvas é escalado por CSS mantendo a proporção 16:9. */
export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

/**
 * Prepara o canvas: tamanho lógico fixo, nitidez em telas de alta densidade (DPR)
 * e coordenadas de desenho sempre em unidades lógicas (0..960 × 0..540).
 */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não é suportado neste navegador.');

  const apply = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(LOGICAL_WIDTH * dpr);
    canvas.height = Math.round(LOGICAL_HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // redimensionar o canvas zera a transformação
  };

  apply();
  window.addEventListener('resize', apply);
  return ctx;
}
