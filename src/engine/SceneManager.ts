import type { Scene } from './Scene';

// Cena com qualquer tipo de parâmetro (uso interno). Os métodos de `Scene` são bivariantes,
// então `Scene<{...}>` é aceito como `Scene<unknown>` sem precisar de `any`.
type AnyScene = Scene<unknown>;

/** Se a cena não recebe parâmetros, o argumento é opcional; senão, é obrigatório. */
export type SceneArgs<M, K extends keyof M> = M[K] extends undefined
  ? [params?: undefined]
  : [params: M[K]];

/**
 * Gerenciador de cenas em PILHA.
 *
 *  - `push`    empilha uma cena (a de baixo recebe `pause`).      Ex.: abrir a pausa.
 *  - `pop`     remove a do topo (a de baixo recebe `resume`).     Ex.: fechar a pausa.
 *  - `replace` troca a cena do topo.                              Ex.: título → fase.
 *  - `reset`   esvazia a pilha e começa de novo com uma cena.     Ex.: voltar ao menu.
 *
 * Trocas pedidas DURANTE um `update` são adiadas para o fim dele, para que a cena
 * nunca seja destruída enquanto ainda está executando.
 *
 * `M` mapeia o nome de cada cena ao tipo dos seus parâmetros (veja `SceneMap`).
 */
export class SceneManager<M extends object> {
  private readonly stack: AnyScene[] = [];
  private readonly factories = new Map<keyof M, () => AnyScene>();
  private queue: Array<() => void> = [];
  private locked = false;

  register<K extends keyof M>(name: K, factory: () => Scene<M[K]>): this {
    this.factories.set(name, factory);
    return this;
  }

  get current(): AnyScene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  push<K extends keyof M>(name: K, ...args: SceneArgs<M, K>): void {
    this.run(() => {
      const scene = this.create(name);
      this.current?.pause();
      this.stack.push(scene);
      scene.enter(args[0]);
    });
  }

  pop(): void {
    this.run(() => {
      this.stack.pop()?.exit();
      this.current?.resume();
    });
  }

  replace<K extends keyof M>(name: K, ...args: SceneArgs<M, K>): void {
    this.run(() => {
      this.stack.pop()?.exit();
      const scene = this.create(name);
      this.stack.push(scene);
      scene.enter(args[0]);
    });
  }

  reset<K extends keyof M>(name: K, ...args: SceneArgs<M, K>): void {
    this.run(() => {
      while (this.stack.length > 0) this.stack.pop()?.exit();
      const scene = this.create(name);
      this.stack.push(scene);
      scene.enter(args[0]);
    });
  }

  /** Um passo de simulação: só a cena do topo é atualizada. */
  update(dt: number): void {
    const top = this.current;
    if (!top) return;

    this.locked = true;
    try {
      top.update(dt);
    } finally {
      this.locked = false;
    }
    this.flush();
  }

  /** Desenha a cena do topo e, antes dela, as cenas abaixo enquanto forem transparentes. */
  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    if (this.stack.length === 0) return;

    let first = this.stack.length - 1;
    while (first > 0 && this.stack[first]?.transparent) first--;

    for (let i = first; i < this.stack.length; i++) {
      this.stack[i]?.render(ctx, alpha);
    }
  }

  private run(op: () => void): void {
    if (this.locked) this.queue.push(op);
    else op();
  }

  private flush(): void {
    for (const op of this.queue.splice(0)) op();
  }

  private create(name: keyof M): AnyScene {
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Cena não registrada: "${String(name)}"`);
    return factory();
  }
}
