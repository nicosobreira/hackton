import type { Input } from '../engine/Input';
import type { SceneManager } from '../engine/SceneManager';
import type { SceneMap } from './SceneMap';

/** Tudo o que uma cena precisa para funcionar. Passado ao construtor de cada cena. */
export interface GameContext {
  readonly canvas: HTMLCanvasElement;
  /** Camada DOM sobre o canvas: botões, textos e arrastar-e-soltar acessíveis. */
  readonly ui: HTMLElement;
  readonly input: Input;
  readonly scenes: SceneManager<SceneMap>;
}
