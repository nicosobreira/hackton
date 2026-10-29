/**
 * Contrato de uma cena. Cada cena é uma tela/estado do jogo (título, fase, pausa...).
 *
 * `P` é o tipo dos parâmetros recebidos em `enter` (veja `SceneMap`).
 * Todos os métodos de ciclo de vida têm implementação vazia por padrão.
 */
export abstract class Scene<P = undefined> {
  /**
   * Se verdadeiro, a cena logo abaixo na pilha continua sendo DESENHADA
   * (ex.: menu de pausa sobre a fase). Só a cena do topo recebe `update`.
   */
  readonly transparent: boolean = false;

  /** Chamado quando a cena entra na pilha. Crie aqui elementos de UI e estado. */
  enter(_params: P): void {}

  /** Chamado quando a cena sai da pilha. Remova aqui listeners e elementos de UI. */
  exit(): void {}

  /** Outra cena foi empilhada por cima desta. */
  pause(): void {}

  /** A cena que estava por cima saiu; esta volta a ser a do topo. */
  resume(): void {}

  /** Um passo de simulação, com `dt` fixo em segundos. */
  abstract update(dt: number): void;

  /** Desenha no canvas. `alpha` ∈ [0, 1) permite interpolar entre dois passos. */
  abstract render(ctx: CanvasRenderingContext2D, alpha: number): void;
}
