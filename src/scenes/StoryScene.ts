import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/Display";
import { Scene } from "../engine/Scene";
import type { GameContext } from "../game/GameContext";
import type { SceneMap } from "../game/SceneMap";
import { getStory } from "../stories";
import type { Story, StorySlide } from "../stories/types";

/** Apresenta uma história declarativa, sem misturar conteúdo e navegação. */
export class StoryScene extends Scene<SceneMap["story"]> {
  private panel: HTMLElement | null = null;
  private story: Story | undefined;
  private slideIndex = 0;

  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(params: SceneMap["story"]): void {
    this.story = getStory(params.storyId);
    this.slideIndex = 0;

    if (!this.story) {
      this.showMissingStory();
      return;
    }

    this.renderSlide();
  }

  override exit(): void {
    this.panel?.remove();
    this.panel = null;
  }

  update(): void {
    if (!this.story) return;

    if (this.game.input.wasPressed("ArrowLeft")) {
      this.goBack();
    } else if (this.game.input.wasPressed("ArrowRight")) {
      // Enter e Espaço já ativam o botão focado de forma nativa.
      this.advance();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Linhas discretas inspiradas em interfaces de computadores da época.
    ctx.strokeStyle = "#1b2733";
    ctx.lineWidth = 1;
    for (let x = 32; x < LOGICAL_WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    ctx.fillStyle = "#e8a33d";
    ctx.fillRect(0, LOGICAL_HEIGHT - 5, LOGICAL_WIDTH, 5);
  }

  private renderSlide(): void {
    const story = this.story;
    const slide = story?.slides[this.slideIndex];
    if (!story || !slide) return;

    this.panel?.remove();

    const panel = document.createElement("section");
    panel.className = "story-slide";
    panel.setAttribute("aria-labelledby", "story-slide-title");

    const top = document.createElement("div");
    top.className = "story-slide-top";

    const brand = document.createElement("p");
    brand.className = "story-brand";
    brand.textContent = "HISTÓRIAS DE MULHERES NA COMPUTAÇÃO";

    const progress = document.createElement("p");
    progress.className = "story-progress";
    progress.textContent = `${this.slideIndex + 1} / ${story.slides.length}`;
    progress.setAttribute("aria-label", `Slide ${this.slideIndex + 1} de ${story.slides.length}`);
    top.append(brand, progress);

    const content = document.createElement("div");
    content.className = slide.image ? "story-content has-image" : "story-content";

    const copy = document.createElement("div");
    copy.className = "story-copy";

    if (slide.eyebrow) {
      const eyebrow = document.createElement("p");
      eyebrow.className = "story-eyebrow";
      eyebrow.textContent = slide.eyebrow;
      copy.append(eyebrow);
    }

    const heading = document.createElement("h1");
    heading.id = "story-slide-title";
    heading.textContent = slide.title;
    copy.append(heading);

    if (slide.text) {
      const text = document.createElement("p");
      text.className = "story-text";
      text.textContent = slide.text;
      copy.append(text);
    }

    content.append(copy);

    if (slide.image) {
      const image = document.createElement("img");
      image.className = "story-image";
      image.src = slide.image;
      image.alt = slide.imageAlt ?? "";
      content.append(image);
    }

    const footer = document.createElement("footer");
    footer.className = "story-slide-footer";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "button button-secondary";
    back.textContent = this.slideIndex === 0 ? "Voltar ao menu" : "← Voltar";
    back.addEventListener("click", () => this.goBack());

    const next = document.createElement("button");
    next.type = "button";
    next.className = "button";
    next.textContent = slide.buttonText ?? "Continuar →";
    next.addEventListener("click", () => this.activateSlide(slide));

    footer.append(back, next);
    panel.append(top, content, footer);
    this.game.ui.append(panel);
    this.panel = panel;
    next.focus();
  }

  private activateSlide(slide: StorySlide): void {
    if (slide.action === "start-game") {
      this.game.scenes.replace("level", { levelId: "tutorial" });
      return;
    }
    this.advance();
  }

  private advance(): void {
    if (!this.story) return;
    if (this.slideIndex < this.story.slides.length - 1) {
      this.slideIndex += 1;
      this.renderSlide();
    }
  }

  private goBack(): void {
    if (this.slideIndex > 0) {
      this.slideIndex -= 1;
      this.renderSlide();
      return;
    }
    this.game.scenes.replace("title");
  }

  private showMissingStory(): void {
    const panel = document.createElement("section");
    panel.className = "panel";
    const heading = document.createElement("h1");
    heading.textContent = "História não encontrada";
    const text = document.createElement("p");
    text.textContent = "Esta história ainda não está disponível.";
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = "Voltar ao menu";
    button.addEventListener("click", () => this.game.scenes.replace("title"));
    panel.append(heading, text, button);
    this.game.ui.append(panel);
    this.panel = panel;
  }
}
