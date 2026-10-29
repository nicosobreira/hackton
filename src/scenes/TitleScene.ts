import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Display';
import { Scene } from '../engine/Scene';
import type { GameContext } from '../game/GameContext';

/** Tela inicial de DESENVOLVIMENTO: só abre o jogo. O menu real é da história. */
export class TitleScene extends Scene {
  private panel: HTMLElement | null = null;
  private time = 0;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(): void {
    const panel = document.createElement('div');
    panel.className = 'panel title-panel';

    const heading = document.createElement('h1');
    heading.textContent = 'Hamilton: o software da Apollo';

    const text = document.createElement('p');
    text.textContent = 'Em 1969, um computador com pouca memória precisou decidir o que era essencial.';

    const start = document.createElement('button');
    start.className = 'button';
    start.textContent = 'Jogar';
    start.addEventListener('click', () => this.start());

    panel.append(heading, text, start);
    this.game.ui.append(panel);
    this.panel = panel;
    start.focus();
  }

  override exit(): void {
    this.panel?.remove();
    this.panel = null;
  }

  /** O jogo foi empilhado por cima: esconde o painel (ele continua na pilha, por baixo). */
  override pause(): void {
    if (this.panel) this.panel.hidden = true;
  }

  override resume(): void {
    if (this.panel) this.panel.hidden = false;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.game.input.wasPressed('Enter')) this.start();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#101922';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Linha pulsante, só para mostrar que o canvas está sendo desenhado.
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    ctx.fillStyle = `rgba(232, 163, 61, ${0.25 + 0.5 * pulse})`;
    ctx.fillRect(0, LOGICAL_HEIGHT - 6, LOGICAL_WIDTH, 6);
  }

  private start(): void {
    this.game.scenes.push('game');
  }
}
