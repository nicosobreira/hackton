/**
 * Mapa "nome da cena → tipo dos parâmetros de `enter`".
 * `undefined` = a cena não recebe parâmetros.
 * Ao criar uma cena nova, registre o nome aqui e em `main.ts`.
 */
export interface SceneMap {
  title: undefined;
  level: { levelId: string };
  pause: undefined;
  history: undefined;
}
