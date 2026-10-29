import { Scene } from "../engine/Scene";
import type { GameContext } from "../game/GameContext";
import type { SceneMap } from "../game/SceneMap";

export class HistoryScene extends Scene<SceneMap["history"]> {
  constructor(private readonly game: GameContext) {
    super();
  }

  override enter(params: SceneMap["history"]): void {}

  override exit(): void {}

  update(dt: number): void {}

  render(ctx: CanvasRenderingContext2D, alpha: number): void {}
}
