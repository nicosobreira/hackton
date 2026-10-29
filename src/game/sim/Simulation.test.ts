import { describe, expect, it } from 'vitest';
import { defaultConfig, type GameConfig } from '../config';
import { TASKS } from '../tasks';
import { GOOD_PLAYER, SLOW_PLAYER, playBot } from './bot';
import { createRng } from './rng';
import { Simulation } from './Simulation';

const STEP = 1 / 60;

/** Config sem derrotas por distância/toques, para isolar a regra testada. */
const lenient: GameConfig = {
  ...defaultConfig,
  maxStrikes: 999,
  distance: { ...defaultConfig.distance, failUnits: 1e9 },
};

function create(config: GameConfig = defaultConfig, seed = 1): Simulation {
  return new Simulation(config, TASKS, createRng(seed));
}

function runFor(sim: Simulation, seconds: number): void {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps && !sim.result; i++) sim.update(STEP);
}

describe('aceite: 3 toques na linha = Missão Falhou', () => {
  it('com a config padrão, uma partida sem jogador termina em falha', () => {
    const sim = create();
    runFor(sim, 80);
    expect(sim.result?.outcome).toBe('failure');
  });

  it('o terceiro toque encerra por "strikes"', () => {
    const sim = create({ ...lenient, maxStrikes: 3 });
    runFor(sim, 80);
    expect(sim.strikes).toBe(3);
    expect(sim.result).toEqual({ outcome: 'failure', reason: 'strikes' });
  });
});

describe('aceite: blocos diminuem conforme a tabela', () => {
  it('seguindo o tempo (6, 5, 4, 3, 2) e nunca voltando', () => {
    const sim = create(lenient);
    const seen = new Map<number, number>();
    let previous = sim.blockCount;
    for (let t = 0; t < 70; t += STEP) {
      sim.update(STEP);
      expect(sim.blockCount).toBeLessThanOrEqual(previous);
      previous = sim.blockCount;
      for (const mark of [1, 16, 31, 46, 61]) if (!seen.has(mark) && sim.elapsedSeconds >= mark) seen.set(mark, sim.blockCount);
    }
    expect([...seen.values()]).toEqual([6, 5, 4, 3, 2]);
  });

  it('a distância também reduz os blocos, mas só quando a nave está bem adiantada', () => {
    const sim = create(lenient, 9);
    runFor(sim, 1);
    expect(sim.blockCount).toBe(6);
    sim.distance = 70; // 70% da distância inicial: já vale o degrau "Longe" pelo critério de distância
    runFor(sim, 0.1);
    expect(sim.blockCount).toBe(5);
    sim.distance = 100; // recuar não devolve blocos
    runFor(sim, 0.1);
    expect(sim.blockCount).toBe(5);
  });

  it('uma tarefa rodando num bloco que desliga termina antes de ele apagar', () => {
    // Sem congelamento, para o jogador poder agir em qualquer momento.
    const config: GameConfig = { ...lenient, penalties: { ...lenient.penalties, freezeAfterEssentialOnLineSeconds: 0 } };
    const sim = create(config, 3);
    let assigned = false;
    while (!assigned && sim.elapsedSeconds < 14.5) {
      sim.update(STEP);
      const useless = sim.tasks.find((task) => task.def.kind === 'useless');
      if (useless && sim.elapsedSeconds > 9) assigned = sim.assignToSlot(useless.id, 5);
    }
    expect(assigned).toBe(true);
    runFor(sim, 15.5 - sim.elapsedSeconds); // passou dos 15 s: o bloco 5 deve estar "fechando", não apagado
    expect(sim.slots[5]?.status).toBe('closing');
    runFor(sim, 13);
    expect(sim.slots[5]?.status).toBe('off');
  });
});

describe('penalidades', () => {
  it('essencial na lixeira ≤ inútil na linha < essencial na linha', () => {
    const { penalties } = defaultConfig;
    expect(penalties.essentialTrashedUnits).toBeLessThanOrEqual(penalties.uselessOnLineUnits);
    expect(penalties.uselessOnLineUnits).toBeLessThan(penalties.essentialOnLineUnits);
  });

  it('essencial que toca a linha congela os comandos pelo tempo configurado', () => {
    const sim = create(lenient, 5);
    let frozen = false;
    for (let i = 0; i < 60 * 60 && !frozen; i++) {
      sim.update(STEP);
      frozen = sim.drainEvents().some((event) => event.type === 'frozen');
    }
    expect(frozen).toBe(true);
    expect(sim.frozenRemainingSeconds).toBeCloseTo(lenient.penalties.freezeAfterEssentialOnLineSeconds, 1);

    // Durante o congelamento nenhum comando é aceito.
    const task = sim.tasks[0];
    if (task) {
      // expect(sim.trashTask(task.id)).toBe(false);
      expect(sim.assignToSlot(task.id, 0)).toBe(false);
    }

    // Quando termina ("unfrozen"), os comandos voltam; passou pelo menos o tempo configurado.
    const frozenAt = sim.elapsedSeconds;
    let unfrozen = false;
    while (!unfrozen) {
      sim.update(STEP);
      unfrozen = sim.drainEvents().some((event) => event.type === 'unfrozen');
    }
    expect(sim.isFrozen).toBe(false);
    expect(sim.elapsedSeconds - frozenAt).toBeGreaterThanOrEqual(lenient.penalties.freezeAfterEssentialOnLineSeconds - 0.05);
  });

  it('jogar uma essencial no lixo recua a nave pelo valor configurado', () => {
    const sim = create(lenient, 2);
    for (let i = 0; i < 60 * 6 && !sim.tasks.some((task) => task.def.kind === 'essential'); i++) sim.update(STEP);
    const essential = sim.tasks.find((task) => task.def.kind === 'essential');
    expect(essential).toBeDefined();
    const before = sim.distance;
    expect(sim.trashTask(essential!.id)).toBe(true);
    expect(sim.distance).toBe(before + lenient.penalties.essentialTrashedUnits);
  });
});

describe('regras de jogo', () => {
  it('uma tarefa inútil num bloco nunca aproxima a nave', () => {
    const sim = create(lenient, 4);
    for (let i = 0; i < 60 * 20; i++) {
      sim.update(STEP);
      const useless = sim.tasks.find((task) => task.def.kind === 'useless');
      const free = sim.slots.find((slot) => slot.status === 'free');
      if (useless && free) {
        sim.assignToSlot(useless.id, free.index);
        break;
      }
    }
    const before = sim.distance;
    runFor(sim, 13); // mais que o máximo de uma inútil (12 s)
    // Nenhuma essencial foi atribuída: a distância só pode ter aumentado (toques na linha), nunca diminuído.
    expect(sim.distance).toBeGreaterThanOrEqual(before);
  });

  it('um bloco não aceita duas tarefas ao mesmo tempo', () => {
    const sim = create(lenient, 6);
    for (let i = 0; i < 60 * 12 && sim.tasks.length < 2; i++) sim.update(STEP);
    const [a, b] = sim.tasks;
    expect(a && b).toBeTruthy();
    expect(sim.assignToSlot(a!.id, 0)).toBe(true);
    expect(sim.assignToSlot(b!.id, 0)).toBe(false);
  });

  it('o evento 1202 começa aos 30 s', () => {
    const sim = create(lenient, 7);
    runFor(sim, 29.5);
    expect(sim.alarmActive).toBe(false);
    runFor(sim, 1);
    expect(sim.alarmActive).toBe(true);
  });

  it('o tempo esgotado encerra a partida como falha', () => {
    const sim = create(lenient, 8);
    runFor(sim, 81);
    expect(sim.result).toEqual({ outcome: 'failure', reason: 'timeout' });
  });

  it('é determinística: mesma semente, mesmo resultado', () => {
    const trace = (seed: number) => {
      const sim = create(defaultConfig, seed);
      const result = playBot(sim, createRng(seed), GOOD_PLAYER);
      return JSON.stringify([result, sim.elapsedSeconds, sim.distance, sim.strikes]);
    };
    expect(trace(11)).toBe(trace(11));
  });

  it('recusa configuração incoerente com mensagem clara', () => {
    expect(() => create({ ...defaultConfig, penalties: { ...defaultConfig.penalties, essentialTrashedUnits: 99 } })).toThrow(/penalidades/);
    expect(() => create({ ...defaultConfig, distance: { ...defaultConfig.distance, failUnits: 50 } })).toThrow(/failUnits/);
  });
});

describe('aceite: com o config padrão, uma partida boa dura ~60 s', () => {
  const play = (style: typeof GOOD_PLAYER, runs: number) => {
    const times: number[] = [];
    let wins = 0;
    for (let seed = 1; seed <= runs; seed++) {
      const sim = create(defaultConfig, seed);
      if (playBot(sim, createRng(seed + 1000), style).outcome === 'success') {
        wins++;
        times.push(sim.elapsedSeconds);
      }
    }
    times.sort((a, b) => a - b);
    return { winRate: wins / runs, median: times[Math.floor(times.length / 2)] ?? Infinity };
  };

  it('jogador bom: vence quase sempre, em torno de 60 s (e dentro de 80 s)', () => {
    const { winRate, median } = play(GOOD_PLAYER, 100);
    expect(winRate).toBeGreaterThanOrEqual(0.9);
    expect(median).toBeGreaterThan(52);
    expect(median).toBeLessThan(68);
  });

  it('jogador lento perde mais que o bom, mas ainda consegue vencer', () => {
    const slow = play(SLOW_PLAYER, 100);
    const good = play(GOOD_PLAYER, 100);
    expect(slow.winRate).toBeLessThan(good.winRate);
    expect(slow.winRate).toBeGreaterThan(0.3);
  });
});
