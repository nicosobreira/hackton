import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/Display";
import { Scene } from "../engine/Scene";
import type { GameContext } from "../game/GameContext";
import type { SceneMap } from "../game/SceneMap";

const SPEED = 240; // unidades lógicas por segundo
const SIZE = 36;

/**
 * Fase de demonstração do passo fixo.
 *
 * O quadrado anda a `SPEED` px/s. A simulação guarda a posição ANTERIOR e a ATUAL;
 * o `render` interpola entre as duas com `alpha`, então o movimento fica suave
 * mesmo quando o monitor não roda a 60 Hz. Troque pelo escalonador do jogo.
 */
export class LevelScene extends Scene<SceneMap["level"]> {
  private hud: HTMLElement | null = null;
  private levelId = "";
  private ticks = 0;
  private prevX = 0;
  private currX = 0;
  private direction = 1;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(params: SceneMap["level"]): void {
    this.levelId = params.levelId;
    this.prevX = this.currX = LOGICAL_WIDTH / 2 - SIZE / 2;

    const hud = document.createElement("div");
    hud.className = "hud";
    this.game.ui.append(hud);
    this.hud = hud;
  }

  override exit(): void {
    this.hud?.remove();
    this.hud = null;
  }

  update(dt: number): void {
    if (this.game.input.wasPressed("Escape")) {
      this.game.scenes.push("pause");
      return;
    }

    this.ticks++;
    this.prevX = this.currX;
    this.currX += this.direction * SPEED * dt;

    const max = LOGICAL_WIDTH - SIZE;
    if (this.currX <= 0 || this.currX >= max) {
      this.currX = Math.min(Math.max(this.currX, 0), max);
      this.direction *= -1;
    }

    if (this.hud) {
      this.hud.textContent = `fase: ${this.levelId} · passos: ${this.ticks} · Esc pausa`;
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    ctx.fillStyle = "#14202b";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const x = this.prevX + (this.currX - this.prevX) * alpha;
    ctx.fillStyle = "#e8a33d";
    ctx.fillRect(x, LOGICAL_HEIGHT / 2 - SIZE / 2, SIZE, SIZE);
  }
}
