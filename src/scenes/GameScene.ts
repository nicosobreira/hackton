import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Display';
import { Scene } from '../engine/Scene';
import { defaultConfig, type GameConfig } from '../game/config';
import type { GameContext } from '../game/GameContext';
import { createRng } from '../game/sim/rng';
import { Simulation } from '../game/sim/Simulation';
import { TASKS } from '../game/tasks';
import { HudView } from '../game/view/HudView';
import { LanderView } from '../game/view/LanderView';
import { MemoryView } from '../game/view/MemoryView';

const BACKGROUND = '#0b1118';
/** Em celular na vertical o jogo pausa e aparece o aviso "gire o aparelho". */
const PORTRAIT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)';

/** Tudo o que existe só durante uma partida. */
interface Run {
  readonly sim: Simulation;
  readonly memory: MemoryView;
  readonly lander: LanderView;
  readonly hud: HudView;
  readonly banner: HTMLElement;
  /** Contagem regressiva da mensagem final; `null` enquanto a partida está em andamento. */
  bannerRemainingSeconds: number | null;
}

/**
 * Cena do jogo: gerenciamento da memória do Executive + módulo de pouso e Lua.
 * Abra com `scenes.push('game')`. Ao terminar, mostra "Missão Concluída" ou "Missão Falhou"
 * e chama `scenes.replace('ending', { result })`.
 *
 * Parâmetros de URL úteis para ajustar o jogo: `?seed=123` (mesma partida) e `?debug` (números na tela).
 */
export class GameScene extends Scene {
  private run: Run | null = null;

  constructor(
    private readonly game: GameContext,
    private readonly config: GameConfig = defaultConfig,
  ) {
    super();
  }

  /** Só para testes e depuração. */
  get simulation(): Simulation | null {
    return this.run?.sim ?? null;
  }

  override enter(): void {
    const params = new URLSearchParams(window.location.search);
    const seedParam = Number(params.get('seed'));
    const seed = params.has('seed') && Number.isFinite(seedParam) ? seedParam : (this.config.seed ?? Math.floor(Math.random() * 2 ** 32));

    const sim = new Simulation(this.config, TASKS, createRng(seed));
    const memory = new MemoryView(this.game.ui, this.config, {
      hold: (id) => sim.hold(id),
      assign: (id, slot) => sim.assignToSlot(id, slot),
      trash: (id) => sim.trashTask(id),
    });
    const hud = new HudView(this.game.ui, this.config, params.has('debug'));
    const lander = new LanderView(this.config, this.config.distance.startUnits);

    const banner = document.createElement('div');
    banner.className = 'result-banner';
    banner.setAttribute('role', 'status');
    banner.hidden = true;
    this.game.ui.append(banner);

    document.body.classList.add('in-game');
    this.run = { sim, memory, lander, hud, banner, bannerRemainingSeconds: null };
  }

  override exit(): void {
    this.run?.memory.destroy();
    this.run?.hud.destroy();
    this.run?.banner.remove();
    this.run = null;
    document.body.classList.remove('in-game');
  }

  update(dt: number): void {
    const run = this.run;
    if (!run) return;

    if (run.bannerRemainingSeconds !== null) {
      run.lander.update(dt, run.sim.distance);
      run.bannerRemainingSeconds -= dt;
      if (run.bannerRemainingSeconds <= 0) this.finish(run);
      return;
    }
    if (this.isRotateHintShowing()) return; // sem jogar (e sem o tempo correr) com o aviso na tela

    run.sim.update(dt);
    run.lander.update(dt, run.sim.distance);

    const events = run.sim.drainEvents();
    run.memory.handleEvents(events);
    run.lander.handleEvents(events);

    if (run.sim.result) {
      run.banner.hidden = false;
      run.banner.classList.add(run.sim.result.outcome === 'success' ? 'is-success' : 'is-failure');
      run.banner.textContent = run.sim.result.outcome === 'success' ? 'Missão Concluída' : 'Missão Falhou';
      run.bannerRemainingSeconds = this.config.ui.resultBannerSeconds;
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const run = this.run;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (!run) return;

    run.lander.render(ctx, alpha);
    run.memory.render(run.sim, alpha);
    run.hud.render(run.sim);
  }

  private finish(run: Run): void {
    const result = run.sim.result;
    if (!result) return;
    run.bannerRemainingSeconds = Number.POSITIVE_INFINITY; // evita chamar duas vezes
    this.game.scenes.replace('ending', { result: result.outcome });
  }

  private isRotateHintShowing(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia(PORTRAIT_TOUCH_QUERY).matches;
  }
}
