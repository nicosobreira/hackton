/**
 * Mapa "nome da cena → tipo dos parâmetros de `enter`".
 * `undefined` = a cena não recebe parâmetros.
 * Ao criar uma cena nova, registre o nome aqui e em `main.ts`.
 */
export interface SceneMap {
  title: undefined;
  /** O jogo: abra com `scenes.push('game')`. Ao terminar, ele chama `scenes.replace('ending', ...)`. */
  game: undefined;
  /** Contrato com a história: recebe o resultado da partida. */
  ending: { result: 'success' | 'failure' };
}
