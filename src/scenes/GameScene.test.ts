// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../engine/Input';
import { Scene } from '../engine/Scene';
import { SceneManager } from '../engine/SceneManager';
import { defaultConfig, type GameConfig } from '../game/config';
import type { GameContext } from '../game/GameContext';
import type { SceneMap } from '../game/SceneMap';
import type { Simulation } from '../game/sim/Simulation';
import { GameScene } from './GameScene';

const STEP = 1 / 60;

/** Contexto 2D falso: aceita qualquer chamada de desenho (o jsdom não tem canvas). */
const ctx = new Proxy({}, { get: () => () => undefined, set: () => true }) as unknown as CanvasRenderingContext2D;

const lenient: GameConfig = { ...defaultConfig, seed: 1, maxStrikes: 999, distance: { ...defaultConfig.distance, failUnits: 1e9 } };

function setup(config: GameConfig = { ...defaultConfig, seed: 1 }) {
  document.body.innerHTML = '<canvas id="game"></canvas><div id="ui"></div>';
  const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
  const ui = document.querySelector<HTMLElement>('#ui')!;
  const scenes = new SceneManager<SceneMap>();
  const game: GameContext = { canvas, ui, input: new Input(canvas), scenes };

  const ended: Array<SceneMap['ending']> = [];
  class EndingStub extends Scene<SceneMap['ending']> {
    override enter(params: SceneMap['ending']): void {
      ended.push(params);
    }
    update(): void {}
    render(): void {}
  }
  scenes.register('game', () => new GameScene(game, config)).register('ending', () => new EndingStub());
  scenes.push('game');

  const scene = scenes.current as GameScene;
  const sim = scene.simulation as Simulation;
  const frame = (): void => {
    scenes.update(STEP);
    scenes.render(ctx, 0.5);
  };
  const runSeconds = (seconds: number, onFrame?: () => void): void => {
    for (let i = 0; i < Math.round(seconds / STEP); i++) {
      frame();
      onFrame?.();
    }
  };
  return { ui, scenes, sim, ended, frame, runSeconds };
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) };
}

function fire(target: Element, type: string, x: number, y: number): void {
  const event = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

/** Espera aparecer uma tarefa na tela e devolve seu elemento e id. */
function waitForTask(t: ReturnType<typeof setup>): { element: HTMLElement; id: number } {
  for (let i = 0; i < 60 * 10 && t.sim.tasks.length === 0; i++) t.frame();
  const task = t.sim.tasks[0];
  const element = t.ui.querySelector<HTMLElement>(`[data-task-id="${task?.id}"]`);
  if (!task || !element) throw new Error('nenhuma tarefa apareceu');
  return { element, id: task.id };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.className = '';
});

describe('GameScene: partida completa', () => {
  it('mostra a mensagem final e entrega o resultado à cena "ending"', () => {
    const t = setup();
    let nextAction = 0;
    t.runSeconds(120, () => {
      if (t.sim.result || t.sim.elapsedSeconds < nextAction || t.sim.isFrozen) return;
      const task = [...t.sim.tasks].sort((a, b) => b.progress - a.progress)[0];
      if (!task) return;
      const free = t.sim.slots.find((slot) => slot.status === 'free');
      const done = task.def.kind === 'useless' ? t.sim.trashTask(task.id) : free ? t.sim.assignToSlot(task.id, free.index) : t.sim.trashTask(task.id);
      if (done) nextAction = t.sim.elapsedSeconds + 0.8;
    });

    expect(t.sim.result).not.toBeNull();
    expect(t.ended).toHaveLength(1);
    expect(t.ended[0]?.result).toBe(t.sim.result?.outcome);
    // A cena do jogo foi desmontada: nada do jogo sobra no DOM.
    expect(t.ui.querySelector('.memory, .game-hud, .result-banner')).toBeNull();
    expect(document.body.classList.contains('in-game')).toBe(false);
  });

  it('mostra "Missão Falhou" quando 3 tarefas tocam a linha', () => {
    const t = setup();
    for (let i = 0; i < 60 * 80 && !t.sim.result; i++) t.frame();
    expect(t.sim.result).toEqual({ outcome: 'failure', reason: 'strikes' });
    expect(t.sim.strikes).toBe(3);
    expect(t.ui.querySelector('.result-banner')?.textContent).toBe('Missão Falhou');
    expect(t.ended).toHaveLength(0); // a mensagem fica um tempo na tela antes de passar para a história
  });
});

describe('GameScene: interação com mouse e toque', () => {
  it('arrastar uma tarefa até um bloco livre a coloca no bloco', () => {
    const t = setup();
    const { element, id } = waitForTask(t);
    const slot = t.ui.querySelector<HTMLElement>('[data-slot="0"]')!;
    slot.getBoundingClientRect = () => rect(100, 10, 60, 80);

    fire(element, 'pointerdown', 50, 300);
    expect(t.sim.heldTaskId).toBe(id); // a tarefa para de subir enquanto é segurada
    fire(element, 'pointermove', 130, 50);
    fire(element, 'pointerup', 130, 50);

    expect(t.sim.slots[0]?.status).toBe('busy');
    expect(t.sim.tasks.some((task) => task.id === id)).toBe(false);
    expect(t.sim.heldTaskId).toBeNull();
  });

  it('arrastar até a lixeira descarta a tarefa', () => {
    const t = setup();
    const { element, id } = waitForTask(t);
    t.ui.querySelector<HTMLElement>('.trash')!.getBoundingClientRect = () => rect(400, 10, 80, 80);

    fire(element, 'pointerdown', 50, 300);
    fire(element, 'pointermove', 440, 50);
    fire(element, 'pointerup', 440, 50);
    expect(t.sim.tasks.some((task) => task.id === id)).toBe(false);
  });

  it('soltar fora de qualquer alvo devolve a tarefa ao jogo (ela volta a subir)', () => {
    const t = setup();
    const { element, id } = waitForTask(t);
    fire(element, 'pointerdown', 50, 300);
    fire(element, 'pointermove', 500, 500);
    fire(element, 'pointerup', 500, 500);
    expect(t.sim.tasks.some((task) => task.id === id)).toBe(true);
    expect(t.sim.heldTaskId).toBeNull();
  });

  it('tocar na tarefa a seleciona; tocar num bloco a coloca lá (celular)', () => {
    const t = setup();
    const { element, id } = waitForTask(t);

    fire(element, 'pointerdown', 50, 300);
    fire(element, 'pointerup', 50, 300); // sem mover = toque
    t.frame();
    expect(t.sim.heldTaskId).toBe(id);
    expect(element.classList.contains('is-selected')).toBe(true);

    t.ui.querySelector<HTMLElement>('[data-slot="1"]')!.click();
    expect(t.sim.slots[1]?.status).toBe('busy');
  });

  it('tocar de novo na tarefa selecionada a solta', () => {
    const t = setup();
    const { element } = waitForTask(t);
    for (let i = 0; i < 2; i++) {
      fire(element, 'pointerdown', 50, 300);
      fire(element, 'pointerup', 50, 300);
    }
    expect(t.sim.heldTaskId).toBeNull();
  });

  it('com o sistema travado, a seleção é cancelada e nada se mexe', () => {
    const t = setup();
    const { element } = waitForTask(t);
    fire(element, 'pointerdown', 50, 300);
    fire(element, 'pointerup', 50, 300);
    t.sim.frozenRemainingSeconds = 1; // como se uma essencial tivesse tocado a linha
    t.frame();
    expect(t.sim.heldTaskId).toBeNull();
    expect(t.ui.querySelector('.memory')?.classList.contains('is-frozen')).toBe(true);
    expect(t.ui.querySelector('.memory-lock')).not.toBeNull();
  });
});

describe('GameScene: alarme 1202, orientação e interface', () => {
  it('a tela do Executive pisca a cada 4 s depois que o alarme começa', () => {
    const t = setup(lenient);
    const memory = (): Element => t.ui.querySelector('.memory')!;
    t.runSeconds(29);
    expect(memory().classList.contains('is-alarm')).toBe(false);

    t.runSeconds(1.2); // alarme começa aos 30 s
    expect(memory().classList.contains('is-alarm')).toBe(true);
    expect(memory().classList.contains('is-flashing')).toBe(true);

    t.runSeconds(1.5);
    expect(memory().classList.contains('is-flashing')).toBe(false);
    t.runSeconds(2.6); // próxima piscada: 4 s depois do início
    expect(memory().classList.contains('is-flashing')).toBe(true);
  });

  it('em celular na vertical o jogo pausa (o tempo não corre)', () => {
    const t = setup(lenient);
    t.runSeconds(2);
    const before = t.sim.elapsedSeconds;
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    t.runSeconds(2);
    expect(t.sim.elapsedSeconds).toBe(before);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    t.runSeconds(1);
    expect(t.sim.elapsedSeconds).toBeGreaterThan(before);
  });

  it('o HUD mostra o tempo restante e os alertas; blocos desligados aparecem indisponíveis', () => {
    const t = setup({ ...lenient, maxStrikes: 50 });
    t.runSeconds(16);
    expect(t.ui.querySelector('.game-hud-time-value')?.textContent).toBe(String(Math.ceil(80 - t.sim.elapsedSeconds)));
    expect(t.ui.querySelectorAll('.slot--off')).toHaveLength(1); // aos 15 s sobram 5 blocos
    expect(t.ui.querySelectorAll('.strike')).toHaveLength(50);
    expect(t.ui.querySelectorAll('.strike.is-on')).toHaveLength(t.sim.strikes);
  });

  it('as tarefas têm nome e emoji (a cor sozinha não é a pista)', () => {
    const t = setup();
    const { element } = waitForTask(t);
    expect(element.querySelector('.task-emoji')?.textContent).toBeTruthy();
    expect(element.querySelector('.task-name')?.textContent).toBeTruthy();
  });
});
