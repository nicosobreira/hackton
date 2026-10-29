/**
 * Loop principal com passo de simulação FIXO ("Fix Your Timestep").
 *
 * - `update(dt)` roda sempre com o mesmo `dt` (1 / updatesPerSecond), não importa
 *   a taxa de quadros do monitor. A simulação fica determinística: os mesmos
 *   inputs produzem sempre os mesmos resultados (bom para o escalonador do jogo).
 * - `render(alpha)` roda uma vez por quadro. `alpha` (0..1) diz quanto do próximo
 *   passo já "passou", para interpolar posições entre o estado anterior e o atual.
 */

export interface GameLoopCallbacks {
  /** Avança a simulação. `dt` é fixo, em segundos. */
  update(dt: number): void;
  /** Desenha. `alpha` está em [0, 1): fração entre o passo anterior e o próximo. */
  render(alpha: number): void;
}

export interface GameLoopOptions {
  /** Passos de simulação por segundo. Padrão: 60. */
  updatesPerSecond?: number;
  /**
   * Maior duração (s) de quadro aceita. Quadros mais longos (aba em segundo plano,
   * travamento) são cortados para evitar a "espiral da morte". Padrão: 0,25 s.
   */
  maxFrameTime?: number;
  /** Máximo de passos de simulação por quadro. Padrão: 5. */
  maxStepsPerFrame?: number;
}

export class GameLoop {
  /** Duração de cada passo de simulação, em segundos. */
  readonly step: number;
  /** Tempo simulado acumulado, em segundos (só avança em múltiplos de `step`). */
  simTime = 0;
  /** Número de passos de simulação executados desde o início. */
  ticks = 0;

  private readonly maxFrameTime: number;
  private readonly maxStepsPerFrame: number;
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly callbacks: GameLoopCallbacks,
    options: GameLoopOptions = {},
  ) {
    this.step = 1 / (options.updatesPerSecond ?? 60);
    this.maxFrameTime = options.maxFrameTime ?? 0.25;
    this.maxStepsPerFrame = options.maxStepsPerFrame ?? 5;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resetClock();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private resetClock(): void {
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  /** Ao voltar para a aba, descarta o tempo em que o jogo ficou parado. */
  private readonly onVisibilityChange = (): void => {
    if (!document.hidden) this.resetClock();
  };

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    // Tempo real desde o último quadro, limitado a [0, maxFrameTime].
    const frameTime = Math.min(Math.max((now - this.lastTime) / 1000, 0), this.maxFrameTime);
    this.lastTime = now;
    this.accumulator += frameTime;

    let steps = 0;
    while (this.accumulator >= this.step && steps < this.maxStepsPerFrame) {
      this.callbacks.update(this.step);
      this.simTime += this.step;
      this.ticks++;
      this.accumulator -= this.step;
      steps++;
    }

    // Se não deu para alcançar o tempo real, descarta o atraso em vez de acumulá-lo.
    if (this.accumulator >= this.step) this.accumulator = 0;

    this.callbacks.render(this.accumulator / this.step);
  };
}
