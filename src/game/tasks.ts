import type { TaskDef } from './sim/types';

/**
 * Tarefas do computador de bordo (inspiradas no AGC real), em português e curtas.
 * O jogador reconhece a classe pelo NOME e pelo EMOJI (a cor sozinha nunca é a pista).
 * Para adicionar uma tarefa, acrescente uma linha: o resto do jogo se adapta.
 */
export const TASKS: readonly TaskDef[] = [
  // Essenciais: sem elas o pouso não acontece.
  { kind: 'essential', emoji: '🚀', name: 'Guiar a descida' },
  { kind: 'essential', emoji: '🔥', name: 'Controlar o motor' },
  { kind: 'essential', emoji: '📏', name: 'Calcular a altitude' },
  { kind: 'essential', emoji: '🧭', name: 'Manter a atitude' },
  { kind: 'essential', emoji: '📡', name: 'Ler o radar de pouso' },
  { kind: 'essential', emoji: '⏱️', name: 'Medir a velocidade' },

  // Inúteis: podem ser ignoradas sem prejudicar a missão.
  { kind: 'useless', emoji: '🛰️', name: 'Rastrear o radar de encontro' },
  { kind: 'useless', emoji: '🖥️', name: 'Atualizar o painel' },
  { kind: 'useless', emoji: '📝', name: 'Registrar a telemetria' },
  { kind: 'useless', emoji: '💡', name: 'Testar as luzes' },
  { kind: 'useless', emoji: '🕒', name: 'Ajustar o relógio' },
  { kind: 'useless', emoji: '🔋', name: 'Checar a bateria extra' },
];
