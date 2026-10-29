import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../engine/Display';
import type { GameConfig } from '../config';
import { LAYOUT } from '../layout';
import { createRng } from '../sim/rng';
import type { SimEvent } from '../sim/types';

const SPACE = '#0b1118';
const MOON = '#c9d1d9';
const CRATER = '#aab4be';
const MODULE_BODY = '#e8a33d';
const MODULE_DETAIL = '#1a1204';
const GOOD_FLASH = '94, 177, 191';
const BAD_FLASH = '229, 72, 77';

/** Raio (px) da órbita na tela: constante, quem muda é o zoom da câmera. */
const ORBIT_SCREEN_RADIUS_PX = 150;
const FLASH_SECONDS = 0.5;
const STAR_COUNT = 50;

/**
 * Painel da nave e da Lua, em canvas, só com formas geométricas.
 * O módulo orbita a Lua em círculo. A câmera se aproxima conforme a distância diminui:
 * a órbita fica sempre do mesmo tamanho na tela, e a Lua cresce, então o módulo nunca sai do painel.
 */
export class LanderView {
  private readonly left = (LOGICAL_WIDTH * LAYOUT.memoryWidthPercent) / 100;
  private readonly width = LOGICAL_WIDTH - this.left;
  private readonly centerX = this.left + this.width / 2;
  private readonly centerY = LOGICAL_HEIGHT * 0.56;
  private readonly stars: Array<{ x: number; y: number; size: number }> = [];

  private distance: number;
  private prevDistance: number;
  private angle = 0;
  private prevAngle = 0;
  private flashRemaining = 0;
  private flashColor = GOOD_FLASH;

  constructor(
    private readonly config: GameConfig,
    startDistance: number,
  ) {
    this.distance = this.prevDistance = startDistance;
    const rng = createRng(7);
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({ x: this.left + rng() * this.width, y: rng() * LOGICAL_HEIGHT, size: 1 + rng() * 1.5 });
    }
  }

  /** Um passo: a câmera "persegue" a distância real, suavemente. */
  update(dt: number, targetDistance: number): void {
    this.prevDistance = this.distance;
    this.prevAngle = this.angle;
    const follow = 1 - Math.exp(-dt * this.config.lander.cameraResponsePerSecond);
    this.distance += (targetDistance - this.distance) * follow;
    this.angle += this.config.lander.orbitSpeedRadPerSecond * dt;
    this.flashRemaining = Math.max(0, this.flashRemaining - dt);
  }

  handleEvents(events: readonly SimEvent[]): void {
    for (const event of events) {
      if (event.type === 'completed' && event.kind === 'essential') this.flash(GOOD_FLASH);
      else if (event.type === 'lineHit' || (event.type === 'trashed' && event.kind === 'essential')) this.flash(BAD_FLASH);
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const distance = this.prevDistance + (this.distance - this.prevDistance) * alpha;
    const angle = this.prevAngle + (this.angle - this.prevAngle) * alpha;
    const { moonRadiusUnits } = this.config.lander;

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.left, 0, this.width, LOGICAL_HEIGHT);
    ctx.clip();

    ctx.fillStyle = SPACE;
    ctx.fillRect(this.left, 0, this.width, LOGICAL_HEIGHT);
    ctx.fillStyle = 'rgba(233, 238, 243, 0.55)';
    for (const star of this.stars) ctx.fillRect(star.x, star.y, star.size, star.size);

    // Zoom: a órbita (Lua + distância) sempre ocupa ORBIT_SCREEN_RADIUS_PX na tela.
    const orbitWorldRadius = moonRadiusUnits + Math.max(0, distance);
    const scale = ORBIT_SCREEN_RADIUS_PX / orbitWorldRadius;
    const moonRadius = moonRadiusUnits * scale;

    this.drawOrbit(ctx);
    this.drawMoon(ctx, moonRadius, angle);
    this.drawModule(ctx, angle);
    this.drawFlash(ctx);
    ctx.restore();
  }

  private flash(color: string): void {
    this.flashColor = color;
    this.flashRemaining = FLASH_SECONDS;
  }

  private drawOrbit(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(159, 176, 191, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, ORBIT_SCREEN_RADIUS_PX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawMoon(ctx: CanvasRenderingContext2D, radius: number, angle: number): void {
    ctx.fillStyle = MOON;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crateras: círculos que giram devagar com a Lua.
    ctx.fillStyle = CRATER;
    const spin = angle * 0.15;
    for (const [dx, dy, size] of [[0.35, -0.25, 0.22], [-0.3, 0.2, 0.3], [0.1, 0.45, 0.14]] as const) {
      const x = dx * Math.cos(spin) - dy * Math.sin(spin);
      const y = dx * Math.sin(spin) + dy * Math.cos(spin);
      ctx.beginPath();
      ctx.arc(this.centerX + x * radius, this.centerY + y * radius, size * radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Módulo de pouso: corpo, janela e duas pernas, com os "pés" voltados para a Lua. */
  private drawModule(ctx: CanvasRenderingContext2D, angle: number): void {
    ctx.save();
    ctx.translate(this.centerX + Math.cos(angle) * ORBIT_SCREEN_RADIUS_PX, this.centerY + Math.sin(angle) * ORBIT_SCREEN_RADIUS_PX);
    ctx.rotate(angle + Math.PI / 2);

    ctx.strokeStyle = MODULE_BODY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    ctx.lineTo(-13, 11);
    ctx.moveTo(7, 4);
    ctx.lineTo(13, 11);
    ctx.stroke();

    ctx.fillStyle = MODULE_BODY;
    ctx.fillRect(-8, -9, 16, 14);
    ctx.fillStyle = MODULE_DETAIL;
    ctx.fillRect(-3, -6, 6, 5);
    ctx.restore();
  }

  private drawFlash(ctx: CanvasRenderingContext2D): void {
    if (this.flashRemaining <= 0) return;
    ctx.strokeStyle = `rgba(${this.flashColor}, ${this.flashRemaining / FLASH_SECONDS})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(this.left + 3, 3, this.width - 6, LOGICAL_HEIGHT - 6);
  }
}
