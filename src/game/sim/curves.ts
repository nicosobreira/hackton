import type { Keyframe } from '../config';

/** Valor da curva no instante `atSeconds`: interpolação linear entre pontos; antes/depois dos extremos, repete o valor do extremo. */
export function sampleCurve(keyframes: readonly Keyframe[], atSeconds: number): number {
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (!first || !last) throw new Error('Curva sem pontos-chave');
  if (atSeconds <= first.atSeconds) return first.value;
  if (atSeconds >= last.atSeconds) return last.value;

  for (let i = 1; i < keyframes.length; i++) {
    const a = keyframes[i - 1];
    const b = keyframes[i];
    if (!a || !b || atSeconds > b.atSeconds) continue;
    const span = b.atSeconds - a.atSeconds;
    const k = span === 0 ? 1 : (atSeconds - a.atSeconds) / span;
    return a.value + (b.value - a.value) * k;
  }
  return last.value;
}
