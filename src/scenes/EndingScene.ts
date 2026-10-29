import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Display';
import { Scene } from '../engine/Scene';
import type { GameContext } from '../game/GameContext';
import type { SceneMap } from '../game/SceneMap';

/**
 * PLACEHOLDER: a cena `ending` é da história (não faz parte do jogo).
 * Substitua este arquivo pela sua; o contrato é receber `{ result: 'success' | 'failure' }`.
 */
export class EndingScene extends Scene<SceneMap['ending']> {
  private panel: HTMLElement | null = null;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(params: SceneMap['ending']): void {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const heading = document.createElement('h2');
    heading.textContent = params.result === 'success' ? 'Título (sucesso)' : 'Título (falha)';
    const text = document.createElement('p');
    text.textContent = 'Texto';
    panel.append(heading, text);

    // Só no modo de desenvolvimento: o jogo real não tem outra tentativa.
    if (import.meta.env.DEV) {
      const again = document.createElement('button');
      again.className = 'button button-secondary';
      again.textContent = 'Jogar de novo (só em dev)';
      again.addEventListener('click', () => this.game.scenes.reset('title'));
      panel.append(again);
    }

    this.game.ui.append(panel);
    this.panel = panel;
  }

  override exit(): void {
    this.panel?.remove();
    this.panel = null;
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#101922';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }
}
