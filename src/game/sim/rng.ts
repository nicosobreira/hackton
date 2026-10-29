/** Gerador de números aleatórios: devolve valores em [0, 1). */
export type Rng = () => number;

/** mulberry32: pequeno e determinístico. A mesma semente gera sempre a mesma partida. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomBetween(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function pickRandom<T>(rng: Rng, items: readonly T[]): T | undefined {
  return items[Math.floor(rng() * items.length)];
}
