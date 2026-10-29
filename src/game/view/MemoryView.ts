import type { GameConfig } from '../config';
import { LAYOUT } from '../layout';
import type { Simulation } from '../sim/Simulation';
import type { SimEvent, Slot, Task } from '../sim/types';

/** O que a interface pode pedir à simulação. */
export interface MemoryActions {
  hold(taskId: number | null): void;
  assign(taskId: number, slotIndex: number): boolean;
  trash(taskId: number): boolean;
}

type Target = { readonly kind: 'slot'; readonly index: number } | { readonly kind: 'trash' };

/** Quanto o ponteiro pode andar (px) e ainda contar como "toque" em vez de arrastar. */
const TAP_TOLERANCE_PX = 8;
/** Folga (px) ao redor de blocos e lixeira para facilitar soltar a tarefa. */
const DROP_MARGIN_PX = 10;

interface Interaction {
  readonly taskId: number;
  readonly element: HTMLElement;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  moved: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Painel da memória do Executive, em DOM: blocos, lixeira, linha da morte e tarefas.
 * Funciona com mouse e toque: ARRASTAR uma tarefa até um bloco/lixeira, ou TOCAR na tarefa
 * (ela fica selecionada e parada) e depois tocar no destino.
 */
export class MemoryView {
  private readonly root = el('section', 'memory');
  private readonly layer = el('div', 'task-layer');
  private readonly trashElement = el('div', 'trash');
  private readonly slotElements: HTMLElement[] = [];
  private readonly slotKeys: string[] = [];
  private readonly slotBars: HTMLElement[] = [];
  private readonly lockElement = el('div', 'memory-lock', 'Travado');
  private readonly lineElement = el('div', 'deathline');
  private readonly taskElements = new Map<number, HTMLElement>();

  private interaction: Interaction | null = null;
  private selectedId: number | null = null;
  private enabled = true;

  constructor(
    parent: HTMLElement,
    private readonly config: GameConfig,
    private readonly actions: MemoryActions,
  ) {
    this.root.setAttribute('aria-label', 'Memória do Executive');
    this.root.style.setProperty('--line-y', `${LAYOUT.lineYPercent}%`);
    this.root.style.setProperty('--memory-width', `${LAYOUT.memoryWidthPercent}%`);

    const top = el('div', 'memory-top');
    const slots = el('div', 'slots');
    for (let index = 0; index < config.memory.totalBlocks; index++) {
      const slot = el('div', 'slot slot--free');
      slot.dataset.slot = String(index);
      const emoji = el('span', 'slot-emoji');
      const bar = el('span', 'slot-bar');
      const fill = el('i', 'slot-fill');
      bar.append(fill);
      slot.append(emoji, bar);
      slot.addEventListener('click', () => this.tapTarget({ kind: 'slot', index }));
      slots.append(slot);
      this.slotElements.push(slot);
      this.slotBars.push(fill);
      this.slotKeys.push('');
    }

    this.trashElement.append(el('span', 'trash-emoji', '🗑️'), el('span', 'trash-label', 'Lixeira'));
    this.trashElement.addEventListener('click', () => this.tapTarget({ kind: 'trash' }));
    top.append(slots, this.trashElement);

    this.root.append(top, this.lineElement, this.layer, this.lockElement);
    parent.append(this.root);
  }

  destroy(): void {
    this.root.remove();
    this.taskElements.clear();
  }

  /** Efeitos visuais curtos a partir dos eventos da simulação. */
  handleEvents(events: readonly SimEvent[]): void {
    for (const event of events) {
      if (event.type === 'lineHit') this.pulse(this.lineElement, 'is-hit');
      else if (event.type === 'completed') this.pulse(this.slotElements[event.slot], event.kind === 'essential' ? 'is-done' : 'is-wasted');
      else if (event.type === 'trashed') this.pulse(this.trashElement, 'is-used');
    }
  }

  render(sim: Simulation, alpha: number): void {
    const over = sim.result !== null;
    this.enabled = !over && !sim.isFrozen;
    if (!this.enabled && (this.interaction || this.selectedId !== null)) this.cancelInteraction();

    const alarm = this.config.alarm1202;
    const flashing = sim.alarmActive && (sim.elapsedSeconds - sim.alarmStartedAtSeconds) % alarm.flashIntervalSeconds < alarm.flashSeconds;
    this.root.classList.toggle('is-frozen', sim.isFrozen);
    this.root.classList.toggle('is-over', over);
    this.root.classList.toggle('is-alarm', sim.alarmActive && !over);
    this.root.classList.toggle('is-flashing', flashing && !over);

    this.syncTasks(sim.tasks, alpha);
    this.renderSlots(sim.slots);
  }

  // ───────────── desenho ─────────────

  private syncTasks(tasks: readonly Task[], alpha: number): void {
    const alive = new Set<number>();
    const heldId = this.heldId();

    for (const task of tasks) {
      alive.add(task.id);
      let element = this.taskElements.get(task.id);
      if (!element) {
        element = this.createTask(task);
        this.taskElements.set(task.id, element);
        this.layer.append(element);
      }
      element.classList.toggle('is-held', task.id === heldId);
      element.classList.toggle('is-selected', task.id === this.selectedId);
      if (this.interaction?.taskId === task.id && this.interaction.moved) continue; // quem arrasta manda na posição

      const progress = task.prevProgress + (task.progress - task.prevProgress) * alpha;
      element.style.left = `${((task.lane + 0.5) / this.config.tasks.lanes) * 100}%`;
      element.style.top = `${LAYOUT.lineYPercent + (1 - progress) * (100 - LAYOUT.lineYPercent)}%`;
    }

    for (const [id, element] of this.taskElements) {
      if (alive.has(id)) continue;
      element.remove();
      this.taskElements.delete(id);
      if (this.selectedId === id) this.selectedId = null;
      if (this.interaction?.taskId === id) this.interaction = null;
    }
  }

  private renderSlots(slots: readonly Slot[]): void {
    const holding = this.heldId() !== null;
    for (const slot of slots) {
      const element = this.slotElements[slot.index];
      const bar = this.slotBars[slot.index];
      if (!element || !bar) continue;

      const canDrop = holding && slot.status === 'free';
      const key = `${slot.status}|${slot.def?.emoji ?? ''}|${canDrop}`;
      if (this.slotKeys[slot.index] !== key) {
        this.slotKeys[slot.index] = key;
        element.className = `slot slot--${slot.status}${canDrop ? ' can-drop' : ''}`;
        const emoji = element.firstElementChild;
        if (emoji) emoji.textContent = slot.def?.emoji ?? (slot.status === 'off' ? '✕' : '');
        element.setAttribute('aria-label', `Bloco ${slot.index + 1}: ${slot.def?.name ?? labelOf(slot.status)}`);
      }
      const ratio = slot.totalSeconds > 0 ? slot.remainingSeconds / slot.totalSeconds : 0;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
    }
    this.trashElement.classList.toggle('can-drop', holding);
  }

  private createTask(task: Task): HTMLElement {
    const card = el('div', 'task');
    card.dataset.taskId = String(task.id);
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', task.def.name);
    card.append(el('span', 'task-emoji', task.def.emoji), el('span', 'task-name', task.def.name));
    card.addEventListener('pointerdown', (event) => this.onPointerDown(event, task.id, card));
    card.addEventListener('pointermove', (event) => this.onPointerMove(event));
    card.addEventListener('pointerup', (event) => this.onPointerUp(event));
    card.addEventListener('pointercancel', () => this.cancelInteraction());
    return card;
  }

  private pulse(element: HTMLElement | undefined, className: string): void {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth; // reinicia a animação CSS
    element.classList.add(className);
    element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
  }

  // ───────────── interação (mouse e toque) ─────────────

  private heldId(): number | null {
    return this.interaction?.taskId ?? this.selectedId;
  }

  private syncHold(): void {
    this.actions.hold(this.heldId());
  }

  private onPointerDown(event: PointerEvent, taskId: number, element: HTMLElement): void {
    if (!this.enabled || this.interaction || event.button > 0) return;
    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    this.interaction = { taskId, element, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    this.syncHold();
  }

  private onPointerMove(event: PointerEvent): void {
    const it = this.interaction;
    if (!it || event.pointerId !== it.pointerId) return;

    if (!it.moved && Math.hypot(event.clientX - it.startX, event.clientY - it.startY) > TAP_TOLERANCE_PX) {
      it.moved = true;
      it.element.classList.add('is-dragging');
    }
    if (it.moved) {
      const rect = this.root.getBoundingClientRect();
      it.element.style.left = `${event.clientX - rect.left}px`;
      it.element.style.top = `${event.clientY - rect.top}px`;
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const it = this.interaction;
    if (!it || event.pointerId !== it.pointerId) return;
    this.interaction = null;
    it.element.classList.remove('is-dragging');
    it.element.releasePointerCapture?.(it.pointerId);

    if (!it.moved) {
      // Toque: seleciona (a tarefa fica parada) ou, tocando de novo, solta.
      this.selectedId = this.selectedId === it.taskId ? null : it.taskId;
      this.syncHold();
      return;
    }

    // Arrasto: tenta soltar no destino sob o ponteiro; se não der, a tarefa volta a subir.
    const target = this.targetAt(event.clientX, event.clientY);
    this.selectedId = null;
    if (!target || !this.perform(it.taskId, target)) {
      it.element.classList.add('is-rejected');
      it.element.addEventListener('animationend', () => it.element.classList.remove('is-rejected'), { once: true });
    }
    this.syncHold();
  }

  /** Toque num bloco ou na lixeira com uma tarefa selecionada. */
  private tapTarget(target: Target): void {
    if (!this.enabled || this.interaction || this.selectedId === null) return;
    if (this.perform(this.selectedId, target)) this.selectedId = null;
    this.syncHold();
  }

  private perform(taskId: number, target: Target): boolean {
    return target.kind === 'slot' ? this.actions.assign(taskId, target.index) : this.actions.trash(taskId);
  }

  private cancelInteraction(): void {
    this.interaction?.element.classList.remove('is-dragging');
    this.interaction = null;
    this.selectedId = null;
    this.syncHold();
  }

  private targetAt(clientX: number, clientY: number): Target | null {
    const inside = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      return (
        clientX >= rect.left - DROP_MARGIN_PX &&
        clientX <= rect.right + DROP_MARGIN_PX &&
        clientY >= rect.top - DROP_MARGIN_PX &&
        clientY <= rect.bottom + DROP_MARGIN_PX
      );
    };
    if (inside(this.trashElement)) return { kind: 'trash' };
    const index = this.slotElements.findIndex(inside);
    return index >= 0 ? { kind: 'slot', index } : null;
  }
}

function labelOf(status: Slot['status']): string {
  if (status === 'free') return 'livre';
  if (status === 'off') return 'indisponível';
  return 'ocupado';
}
