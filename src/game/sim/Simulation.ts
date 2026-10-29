import { assertValidConfig, type BlockStage, type GameConfig } from '../config';
import { sampleCurve } from './curves';
import { pickRandom, randomBetween, type Rng } from './rng';
import type { GameResult, SimEvent, Slot, Task, TaskDef, TaskKind } from './types';

/**
 * Regras do jogo, SEM DOM e SEM canvas. Avança com `update(dt)` (dt fixo) e recebe
 * comandos do jogador (`assignToSlot`, `trashTask`, `hold`). Tudo o que acontece é
 * registrado em `drainEvents()` para a interface tocar efeitos.
 */
export class Simulation {
  elapsedSeconds = 0;
  /** Distância atual até a Lua (veja `config.distance`). */
  distance: number;
  /** Quantas tarefas já tocaram a linha da morte. */
  strikes = 0;
  /** Blocos disponíveis agora. Nunca aumenta durante a partida. */
  blockCount: number;
  frozenRemainingSeconds = 0;
  alarmActive = false;
  alarmStartedAtSeconds = 0;
  result: GameResult | null = null;
  readonly tasks: Task[] = [];
  readonly slots: Slot[] = [];

  private heldId: number | null = null;
  private nextTaskId = 1;
  private spawnTimerSeconds: number;
  private readonly events: SimEvent[] = [];
  private readonly lastDefByKind = new Map<TaskKind, TaskDef>();

  constructor(
    private readonly config: GameConfig,
    private readonly pool: readonly TaskDef[],
    private readonly rng: Rng,
  ) {
    assertValidConfig(config);
    for (const kind of ['essential', 'useless'] as const) {
      if (!pool.some((def) => def.kind === kind)) throw new Error(`Faltam tarefas do tipo "${kind}" em tasks.ts`);
    }
    this.distance = config.distance.startUnits;
    this.blockCount = config.memory.totalBlocks;
    this.spawnTimerSeconds = config.tasks.firstSpawnSeconds;
    for (let index = 0; index < config.memory.totalBlocks; index++) {
      this.slots.push({ index, status: 'free', def: null, remainingSeconds: 0, totalSeconds: 0 });
    }
  }

  get remainingSeconds(): number {
    return Math.max(0, this.config.timeLimitSeconds - this.elapsedSeconds);
  }

  /** 1 na largada, 0 no pouso (pode passar de 1 se a nave recuar além da largada). */
  get distanceRatio(): number {
    const { startUnits, landingUnits } = this.config.distance;
    return (this.distance - landingUnits) / (startUnits - landingUnits);
  }

  get isFrozen(): boolean {
    return this.frozenRemainingSeconds > 0;
  }

  get heldTaskId(): number | null {
    return this.heldId;
  }

  /** Um passo de simulação. */
  update(dt: number): void {
    if (this.result) return;
    this.elapsedSeconds += dt;

    this.updateFreeze(dt);
    this.updateSlots(dt);
    if (!this.result) this.moveTasks(dt);
    if (!this.result) this.spawn(dt);
    if (!this.result) {
      this.updateBlockCount();
      this.updateAlarm();
    }
    if (!this.result && this.elapsedSeconds >= this.config.timeLimitSeconds) {
      this.finish({ outcome: 'failure', reason: 'timeout' });
    }
  }

  // ───────────── comandos do jogador ─────────────

  /** Segura uma tarefa (ela para de subir) enquanto o jogador a arrasta ou a seleciona. `null` solta. */
  hold(taskId: number | null): void {
    const valid = taskId !== null && !this.result && !this.isFrozen && this.tasks.some((task) => task.id === taskId);
    this.heldId = valid ? taskId : null;
  }

  /** Coloca a tarefa num bloco livre. Devolve `false` se não foi possível. */
  assignToSlot(taskId: number, slotIndex: number): boolean {
    const task = this.findActionableTask(taskId);
    const slot = this.slots[slotIndex];
    if (!task || !slot || slot.status !== 'free') return false;

    const [min, max] =
      task.def.kind === 'essential' ? this.config.memory.essentialRunSeconds : this.config.memory.uselessRunSeconds;
    const duration = randomBetween(this.rng, min, max);

    this.removeTask(task);
    slot.status = 'busy';
    slot.def = task.def;
    slot.remainingSeconds = duration;
    slot.totalSeconds = duration;
    this.events.push({ type: 'assigned', taskId, slot: slotIndex });
    return true;
  }

  /** Joga a tarefa na lixeira. Descartar uma essencial recua a nave "um pouco". */
  trashTask(taskId: number): boolean {
    const task = this.findActionableTask(taskId);
    if (!task) return false;

    this.removeTask(task);
    this.events.push({ type: 'trashed', taskId, kind: task.def.kind });
    if (task.def.kind === 'essential') this.retreat(this.config.penalties.essentialTrashedUnits);
    return true;
  }

  /** Entrega (e esvazia) a lista de eventos desde a última chamada. */
  drainEvents(): SimEvent[] {
    return this.events.splice(0);
  }

  // ───────────── passos internos ─────────────

  private updateFreeze(dt: number): void {
    if (this.frozenRemainingSeconds <= 0) return;
    this.frozenRemainingSeconds -= dt;
    if (this.frozenRemainingSeconds <= 0) {
      this.frozenRemainingSeconds = 0;
      this.events.push({ type: 'unfrozen' });
    }
  }

  private updateSlots(dt: number): void {
    for (const slot of this.slots) {
      if (slot.status !== 'busy' && slot.status !== 'closing') continue;
      slot.remainingSeconds -= dt;
      if (slot.remainingSeconds > 0) continue;

      const kind = slot.def?.kind ?? 'useless';
      this.events.push({ type: 'completed', slot: slot.index, kind });
      slot.def = null;
      slot.remainingSeconds = 0;
      slot.totalSeconds = 0;
      slot.status = slot.index >= this.blockCount ? 'off' : 'free';
      if (kind === 'essential') this.approach();
    }
  }

  private moveTasks(dt: number): void {
    const travelSeconds = sampleCurve(this.config.tasks.travelSeconds, this.elapsedSeconds);
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const task = this.tasks[i];
      if (!task) continue;
      task.prevProgress = task.progress;
      if (task.id === this.heldId) continue;

      task.progress += dt / travelSeconds;
      if (task.progress >= 1) {
        this.tasks.splice(i, 1);
        this.hitLine(task);
        if (this.result) return;
      }
    }
  }

  private hitLine(task: Task): void {
    const { penalties, maxStrikes } = this.config;
    this.strikes++;
    this.events.push({ type: 'lineHit', taskId: task.id, kind: task.def.kind });

    if (task.def.kind === 'essential') {
      this.retreat(penalties.essentialOnLineUnits);
      this.freeze();
    } else {
      this.retreat(penalties.uselessOnLineUnits);
    }
    if (this.strikes >= maxStrikes) this.finish({ outcome: 'failure', reason: 'strikes' });
  }

  private freeze(): void {
    if (!this.isFrozen) this.events.push({ type: 'frozen' });
    this.frozenRemainingSeconds = Math.max(this.frozenRemainingSeconds, this.config.penalties.freezeAfterEssentialOnLineSeconds);
    this.heldId = null;
  }

  private spawn(dt: number): void {
    this.spawnTimerSeconds -= dt;
    if (this.spawnTimerSeconds > 0) return;

    const lane = this.pickLane();
    if (lane === null) return; // todas as pistas ocupadas: tenta de novo no próximo passo

    const cfg = this.config.tasks;
    const t = this.elapsedSeconds;
    const kind: TaskKind = this.rng() < sampleCurve(cfg.uselessRatio, t) ? 'useless' : 'essential';
    const def = this.pickDef(kind);
    const task: Task = { id: this.nextTaskId++, def, lane, progress: 0, prevProgress: 0 };
    this.tasks.push(task);
    this.events.push({ type: 'spawned', taskId: task.id });

    const jitter = 1 + cfg.spawnJitterRatio * (this.rng() * 2 - 1);
    this.spawnTimerSeconds = sampleCurve(cfg.spawnIntervalSeconds, t) * jitter;
  }

  private pickLane(): number | null {
    const { lanes, minLaneGapProgress } = this.config.tasks;
    const free: number[] = [];
    for (let lane = 0; lane < lanes; lane++) {
      const blocked = this.tasks.some((task) => task.lane === lane && task.progress < minLaneGapProgress);
      if (!blocked) free.push(lane);
    }
    return pickRandom(this.rng, free) ?? null;
  }

  private pickDef(kind: TaskKind): TaskDef {
    const candidates = this.pool.filter((def) => def.kind === kind);
    const last = this.lastDefByKind.get(kind);
    const fresh = candidates.filter((def) => def !== last);
    const def = pickRandom(this.rng, fresh.length > 0 ? fresh : candidates) ?? candidates[0];
    if (!def) throw new Error('Sem tarefas disponíveis');
    this.lastDefByKind.set(kind, def);
    return def;
  }

  private updateBlockCount(): void {
    const byTime = this.stageBlocks((stage) => this.elapsedSeconds >= stage.afterSeconds);
    const byDistance = this.stageBlocks((stage) => this.distanceRatio <= stage.withinDistanceRatio);
    const allowed = Math.min(byTime, byDistance, this.blockCount);
    if (allowed === this.blockCount) return;

    this.blockCount = allowed;
    for (const slot of this.slots) {
      if (slot.index < allowed) continue;
      if (slot.status === 'free') slot.status = 'off';
      else if (slot.status === 'busy') slot.status = 'closing';
    }
    this.events.push({ type: 'blocksChanged', blocks: allowed });
  }

  /** Blocos do último degrau da tabela que satisfaz o critério. */
  private stageBlocks(applies: (stage: BlockStage) => boolean): number {
    let blocks = this.config.memory.totalBlocks;
    for (const stage of this.config.memory.schedule) if (applies(stage)) blocks = stage.blocks;
    return blocks;
  }

  private updateAlarm(): void {
    if (this.alarmActive) return;
    const alarm = this.config.alarm1202;
    if (this.elapsedSeconds >= alarm.afterSeconds || this.distanceRatio <= alarm.withinDistanceRatio) {
      this.alarmActive = true;
      this.alarmStartedAtSeconds = this.elapsedSeconds;
      this.events.push({ type: 'alarmStarted' });
    }
  }

  private approach(): void {
    const { landingUnits, approachPerEssentialUnits } = this.config.distance;
    this.distance = Math.max(landingUnits, this.distance - approachPerEssentialUnits);
    if (this.distance <= landingUnits) this.finish({ outcome: 'success' });
  }

  private retreat(units: number): void {
    this.distance += units;
    if (this.distance >= this.config.distance.failUnits) this.finish({ outcome: 'failure', reason: 'tooFar' });
  }

  private finish(result: GameResult): void {
    if (this.result) return;
    this.result = result;
    this.heldId = null;
    this.events.push({ type: 'finished', result });
  }

  private findActionableTask(taskId: number): Task | undefined {
    if (this.result || this.isFrozen) return undefined;
    return this.tasks.find((task) => task.id === taskId);
  }

  private removeTask(task: Task): void {
    const index = this.tasks.indexOf(task);
    if (index >= 0) this.tasks.splice(index, 1);
    if (this.heldId === task.id) this.heldId = null;
  }
}
