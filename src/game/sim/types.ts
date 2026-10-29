export type TaskKind = 'essential' | 'useless';

/** Descrição de um tipo de tarefa (nome e emoji mostrados ao jogador). */
export interface TaskDef {
  readonly name: string;
  readonly emoji: string;
  readonly kind: TaskKind;
}

/** Uma tarefa subindo em direção à linha da morte. */
export interface Task {
  readonly id: number;
  readonly def: TaskDef;
  /** Pista vertical (0 .. lanes-1). */
  readonly lane: number;
  /** 0 = acabou de nascer no fundo da tela, 1 = tocou a linha. */
  progress: number;
  /** `progress` do passo anterior; a interface interpola entre os dois. */
  prevProgress: number;
}

/** free = livre · busy = executando · closing = executando e vai desligar ao terminar · off = indisponível */
export type SlotStatus = 'free' | 'busy' | 'closing' | 'off';

export interface Slot {
  readonly index: number;
  status: SlotStatus;
  def: TaskDef | null;
  remainingSeconds: number;
  totalSeconds: number;
}

export type FailReason = 'strikes' | 'tooFar' | 'timeout';

export type GameResult = { readonly outcome: 'success' } | { readonly outcome: 'failure'; readonly reason: FailReason };

/** Fatos que aconteceram na simulação. A interface os lê para tocar efeitos. */
export type SimEvent =
  | { readonly type: 'spawned'; readonly taskId: number }
  | { readonly type: 'assigned'; readonly taskId: number; readonly slot: number }
  | { readonly type: 'trashed'; readonly taskId: number; readonly kind: TaskKind }
  | { readonly type: 'completed'; readonly slot: number; readonly kind: TaskKind }
  | { readonly type: 'lineHit'; readonly taskId: number; readonly kind: TaskKind }
  | { readonly type: 'frozen' }
  | { readonly type: 'unfrozen' }
  | { readonly type: 'blocksChanged'; readonly blocks: number }
  | { readonly type: 'alarmStarted' }
  | { readonly type: 'finished'; readonly result: GameResult };
