/** Geometria da tela do jogo, em porcentagem do palco 16:9. Compartilhada entre o DOM e o canvas. */
export const LAYOUT = {
  /** Largura do painel da memória (esquerda). O restante é o painel da nave e da Lua. */
  memoryWidthPercent: 60,
  /** Altura da "linha da morte" a partir do topo. Acima dela ficam os blocos e a lixeira. */
  lineYPercent: 31,
} as const;
