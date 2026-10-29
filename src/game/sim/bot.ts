import type { Simulation } from './Simulation';
import { randomBetween, type Rng } from './rng';
import type { GameResult } from './types';

/** Jogador automático, usado só nos testes e na calibração do balanceamento. */
export interface BotStyle {
  /** Tempo de reação entre uma ação e a próxima: sorteado em [mínimo, máximo]. */
  readonly reactionSeconds: readonly [number, number];
  /** Se não há bloco livre, joga uma essencial no lixo quando ela já passou desta fração do caminho. */
  readonly trashEssentialAtProgress: number;
}

export const GOOD_PLAYER: BotStyle = { reactionSeconds: [0.6, 1.0], trashEssentialAtProgress: 0.6 };
export const SLOW_PLAYER: BotStyle = { reactionSeconds: [1.1, 1.8], trashEssentialAtProgress: 0.6 };

const STEP_SECONDS = 1 / 60;

/** Joga uma partida inteira e devolve o resultado. `onStep` permite observar cada passo. */
export function playBot(sim: Simulation, rng: Rng, style: BotStyle, onStep?: (sim: Simulation) => void): GameResult {
  let nextActionAt = 0;
  while (!sim.result) {
    sim.update(STEP_SECONDS);
    sim.drainEvents();
    onStep?.(sim);
    if (sim.result || sim.elapsedSeconds < nextActionAt || sim.isFrozen) continue;
    if (act(sim, style)) nextActionAt = sim.elapsedSeconds + randomBetween(rng, ...style.reactionSeconds);
  }
  return sim.result;
}

/** Tenta uma ação: trata primeiro a tarefa mais perto da linha. */
function act(sim: Simulation, style: BotStyle): boolean {
  const byUrgency = [...sim.tasks].sort((a, b) => b.progress - a.progress);
  const freeSlot = sim.slots.find((slot) => slot.status === 'free');

  for (const task of byUrgency) {
    if (task.def.kind === 'useless') return sim.trashTask(task.id);
    if (freeSlot) return sim.assignToSlot(task.id, freeSlot.index);
    if (task.progress >= style.trashEssentialAtProgress) return sim.trashTask(task.id);
  }
  return false;
}
