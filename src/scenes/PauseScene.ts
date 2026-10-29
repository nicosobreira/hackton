import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Display';
import { Scene } from '../engine/Scene';
import type { GameContext } from '../game/GameContext';

/** Menu de pausa: cena TRANSPARENTE empilhada sobre a fase, que fica congelada. */
export class PauseScene extends Scene {
  override readonly transparent = true;
  private panel: HTMLElement | null = null;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(): void {
    const panel = document.createElement('div');
    panel.className = 'panel pause-panel';

    const heading = document.createElement('h2');
    heading.textContent = 'Jogo pausado';

    const resume = document.createElement('button');
    resume.className = 'button';
    resume.textContent = 'Continuar';
    resume.addEventListener('click', () => this.game.scenes.pop());

    const quit = document.createElement('button');
    quit.className = 'button button-secondary';
    quit.textContent = 'Voltar ao início';
    quit.addEventListener('click', () => this.game.scenes.reset('title'));

    panel.append(heading, resume, quit);
    this.game.ui.append(panel);
    this.panel = panel;
    resume.focus();
  }

  override exit(): void {
    this.panel?.remove();
    this.panel = null;
  }

  update(): void {
    if (this.game.input.wasPressed('Escape')) this.game.scenes.pop();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(8, 12, 18, 0.7)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }
}
