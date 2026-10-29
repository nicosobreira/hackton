import './styles/main.css';
import './styles/game.css';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, setupCanvas } from './engine/Display';
import { GameLoop } from './engine/GameLoop';
import { Input } from './engine/Input';
import { SceneManager } from './engine/SceneManager';
import type { GameContext } from './game/GameContext';
import type { SceneMap } from './game/SceneMap';
import { EndingScene } from './scenes/EndingScene';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento não encontrado: ${selector}`);
  return element;
}

const canvas = getElement<HTMLCanvasElement>('#game');
const ui = getElement<HTMLElement>('#ui');
const ctx = setupCanvas(canvas);

const game: GameContext = {
  canvas,
  ui,
  input: new Input(canvas),
  scenes: new SceneManager<SceneMap>(),
};

// Registro das cenas. Cada fábrica recebe o contexto por fechamento.
game.scenes
  .register('title', () => new TitleScene(game))
  .register('game', () => new GameScene(game))
  .register('ending', () => new EndingScene(game));

game.scenes.reset('title');
// Atalho de desenvolvimento: abrir direto no jogo com `?scene=game`.
if (new URLSearchParams(window.location.search).get('scene') === 'game') game.scenes.push('game');

const loop = new GameLoop(
  {
    update(dt) {
      game.scenes.update(dt);
      game.input.endStep(); // eventos "deste passo" acabam aqui
    },
    render(alpha) {
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      game.scenes.render(ctx, alpha);
    },
  },
  { updatesPerSecond: 60 },
);

loop.start();
