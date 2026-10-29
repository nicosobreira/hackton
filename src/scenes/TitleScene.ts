import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/Display";
import { Scene } from "../engine/Scene";
import type { GameContext } from "../game/GameContext";

/** Tela inicial do projeto sobre histórias de mulheres na computação. */
export class TitleScene extends Scene {
  private panel: HTMLElement | null = null;
  private time = 0;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(): void {
    const panel = document.createElement("div");
    panel.className = "panel title-panel";

    const eyebrow = document.createElement("p");
    eyebrow.className = "title-eyebrow";
    eyebrow.textContent = "HISTÓRIAS DE MULHERES NA COMPUTAÇÃO";

    const heading = document.createElement("h1");
    heading.textContent = "Código que mudou o mundo";

    const text = document.createElement("p");
    text.textContent =
      "Conheça a história de Margaret Hamilton e descubra como o software ajudou a levar seres humanos à Lua.";

    const start = document.createElement("button");
    start.className = "button";
    start.textContent = "Conhecer Margaret Hamilton";
    start.addEventListener("click", () => this.start());

    const more = document.createElement("p");
    more.className = "title-coming-soon";
    more.textContent = "Mais histórias em breve.";

    panel.append(eyebrow, heading, text, start, more);
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
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    ctx.fillStyle = `rgba(232, 163, 61, ${0.25 + 0.5 * pulse})`;
    ctx.fillRect(0, LOGICAL_HEIGHT - 5, LOGICAL_WIDTH, 5);
  }

  private start(): void {
    this.game.scenes.replace("story", { storyId: "margaret-hamilton" });
  }
}
