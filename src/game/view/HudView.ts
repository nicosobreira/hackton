import type { GameConfig } from '../config';
import { LAYOUT } from '../layout';
import type { Simulation } from '../sim/Simulation';

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Tempo restante, alertas (toques na linha) e aviso do alarme 1202, sobre o painel da nave. */
export class HudView {
  private readonly root = el('div', 'game-hud');
  private readonly timeValue = el('span', 'game-hud-time-value');
  private readonly strikesElement = el('div', 'game-hud-strikes');
  private readonly strikeMarks: HTMLElement[] = [];
  private readonly alarmElement = el('div', 'game-hud-alarm', 'Alarme 1202');
  private readonly debugElement = el('pre', 'game-hud-debug');
  private lastTime = -1;
  private lastStrikes = -1;

  constructor(
    parent: HTMLElement,
    private readonly config: GameConfig,
    debug: boolean,
  ) {
    this.root.style.setProperty('--memory-width', `${LAYOUT.memoryWidthPercent}%`);
    const time = el('div', 'game-hud-time');
    time.append(el('span', 'game-hud-time-label', 'Tempo'), this.timeValue);

    this.strikesElement.setAttribute('role', 'img');
    for (let i = 0; i < config.maxStrikes; i++) {
      const mark = el('i', 'strike');
      this.strikeMarks.push(mark);
      this.strikesElement.append(mark);
    }
    this.alarmElement.hidden = true;
    this.debugElement.hidden = !debug;

    this.root.append(time, this.strikesElement, this.alarmElement, this.debugElement);
    parent.append(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  render(sim: Simulation): void {
    const seconds = Math.ceil(sim.remainingSeconds);
    if (seconds !== this.lastTime) {
      this.lastTime = seconds;
      this.timeValue.textContent = String(seconds);
    }
    if (sim.strikes !== this.lastStrikes) {
      this.lastStrikes = sim.strikes;
      this.strikeMarks.forEach((mark, i) => mark.classList.toggle('is-on', i < sim.strikes));
      this.strikesElement.setAttribute('aria-label', `Alertas: ${sim.strikes} de ${this.config.maxStrikes}`);
    }
    this.alarmElement.hidden = !sim.alarmActive || sim.result !== null;

    if (!this.debugElement.hidden) {
      this.debugElement.textContent =
        `t ${sim.elapsedSeconds.toFixed(1)}s  dist ${sim.distance.toFixed(1)}\n` +
        `blocos ${sim.blockCount}  tarefas ${sim.tasks.length}  alertas ${sim.strikes}`;
    }
  }
}
