import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/Display";
import { Scene } from "../engine/Scene";
import type { GameContext } from "../game/GameContext";

/** Tela inicial. Mostra o uso conjunto de canvas (fundo) e DOM (botão acessível). */
export class TitleScene extends Scene {
  private panel: HTMLElement | null = null;
  private time = 0;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(): void {
    const panel = document.createElement("div");
    panel.className = "panel title-panel";

    const heading = document.createElement("h1");
    heading.textContent = "Hamilton: o software da Apollo";
    heading.align = "center";

    const start = document.createElement("button");
    start.className = "button";
    start.textContent = "Começar o jogo";
    start.addEventListener("click", () => this.start());

    panel.append(heading, start);
    this.game.ui.append(panel);
    this.panel = panel;
    start.focus();
  }

  override exit(): void {
    this.panel?.remove();
    this.panel = null;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.game.input.wasPressed("Enter")) this.start();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#101922";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Linha pulsante, só para mostrar que o canvas está sendo desenhado.
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    ctx.fillStyle = `rgba(232, 163, 61, ${0.25 + 0.5 * pulse})`;
    ctx.fillRect(0, LOGICAL_HEIGHT - 6, LOGICAL_WIDTH, 6);
  }

  private start(): void {
    this.game.scenes.replace("level", { levelId: "tutorial" });
  }
}
