import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './Display';

/**
 * Entrada de teclado e ponteiro (mouse/toque).
 *
 * Eventos "aconteceu neste passo" (`wasPressed`, `pointer.pressed`...) valem até o
 * `endStep()`, que o loop chama DEPOIS de cada passo de simulação — e não depois de
 * cada quadro. Assim, um clique nunca se perde se um quadro rodar zero passos.
 */
export class Input {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();

  /** Posição do ponteiro em coordenadas lógicas do jogo. */
  readonly pointer = { x: 0, y: 0, down: false, pressed: false, released: false };

  constructor(private readonly target: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  /** Tecla está pressionada agora. Use `event.code`: "Space", "Enter", "KeyP"... */
  isDown(code: string): boolean {
    return this.down.has(code);
  }

  /** Tecla foi pressionada neste passo. */
  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  /** Tecla foi solta neste passo. */
  wasReleased(code: string): boolean {
    return this.released.has(code);
  }

  /** Limpa os eventos "deste passo". Chamado pelo loop após cada `update`. */
  endStep(): void {
    this.pressed.clear();
    this.released.clear();
    this.pointer.pressed = false;
    this.pointer.released = false;
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
      // Evita rolar a página, mas preserva botões e campos focados.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
    }
    if (e.repeat) return;
    this.down.add(e.code);
    this.pressed.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    this.released.add(e.code);
  };

  /** Ao perder o foco da janela, soltamos tudo para não "travar" teclas. */
  private readonly onBlur = (): void => {
    this.down.clear();
    this.pointer.down = false;
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.updatePointer(e);
    this.pointer.down = true;
    this.pointer.pressed = true;
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    this.updatePointer(e);
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    this.updatePointer(e);
    if (this.pointer.down) this.pointer.released = true;
    this.pointer.down = false;
  };

  private updatePointer(e: PointerEvent): void {
    const rect = this.target.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    this.pointer.y = ((e.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT;
  }
}
