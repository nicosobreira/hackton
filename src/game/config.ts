/**
 * TODA a configuração de balanceamento do jogo está aqui.
 * Ajuste os números, salve e jogue de novo: nenhum valor "mágico" fica espalhado no código.
 *
 * Convenção de nomes: a unidade vem no final.
 *   ...Seconds = segundos · ...Units = unidades de distância do jogo
 *   ...Ratio   = proporção (0 a 1) · ...Progress = fração do caminho até a linha (0 a 1)
 */

/** Ponto de uma curva: o valor vale `value` no instante `atSeconds`, com interpolação linear entre os pontos. */
export interface Keyframe {
  readonly atSeconds: number;
  readonly value: number;
}

/** Um degrau da tabela "quantos blocos de memória estão disponíveis". */
export interface BlockStage {
  /** Nome da noção (só documentação). */
  readonly label: string;
  /** Critério de TEMPO: a partir de quantos segundos de jogo o degrau vale. */
  readonly afterSeconds: number;
  /** Critério de DISTÂNCIA: vale quando a distância restante cai a esta proporção da inicial (1 = largada, 0 = pouso). */
  readonly withinDistanceRatio: number;
  /** Quantos blocos ficam disponíveis. */
  readonly blocks: number;
}

export interface GameConfig {
  /** Prazo da partida. Se acabar sem pousar, a missão falha. */
  readonly timeLimitSeconds: number;
  /** Quantas tarefas podem tocar a linha da morte antes de a missão falhar. */
  readonly maxStrikes: number;
  /** Semente do sorteio. `null` = diferente a cada partida. Na URL: `?seed=123`. */
  readonly seed: number | null;

  readonly distance: {
    /** Distância da nave até a Lua na largada. */
    readonly startUnits: number;
    /** Distância em que o pouso acontece (vitória). */
    readonly landingUnits: number;
    /** Se a nave chegar a esta distância, a missão falha ("afastou-se demais"). Deve ser maior que `startUnits`. */
    readonly failUnits: number;
    /** Quanto a nave se aproxima cada vez que uma tarefa ESSENCIAL termina num bloco. */
    readonly approachPerEssentialUnits: number;
  };

  /** Tamanho das penalidades. Regra: essencial na lixeira ≤ inútil na linha < essencial na linha. */
  readonly penalties: {
    readonly essentialTrashedUnits: number;
    readonly uselessOnLineUnits: number;
    readonly essentialOnLineUnits: number;
    /** Tempo em que o jogador não consegue mover tarefas depois de uma essencial tocar a linha. */
    readonly freezeAfterEssentialOnLineSeconds: number;
  };

  readonly memory: {
    /** Total de blocos na largada. Deve ser igual ao primeiro degrau de `schedule`. */
    readonly totalBlocks: number;
    /** Tempo que uma tarefa essencial ocupa o bloco: sorteado entre [mínimo, máximo]. */
    readonly essentialRunSeconds: readonly [number, number];
    /** Tempo que uma tarefa inútil ocupa o bloco (desperdício): sorteado entre [mínimo, máximo]. */
    readonly uselessRunSeconds: readonly [number, number];
    /** Tabela de blocos disponíveis. Em ordem crescente de tempo e decrescente de distância. */
    readonly schedule: readonly BlockStage[];
  };

  readonly tasks: {
    /** Quantas "pistas" verticais as tarefas usam para subir. */
    readonly lanes: number;
    /** Espaço mínimo (fração do caminho) entre duas tarefas da mesma pista. */
    readonly minLaneGapProgress: number;
    /** Quando nasce a primeira tarefa. */
    readonly firstSpawnSeconds: number;
    /** Variação aleatória do intervalo entre tarefas (0,25 = ±25%). */
    readonly spawnJitterRatio: number;
    /** Intervalo médio entre tarefas ao longo do tempo (menor = mais intenso). */
    readonly spawnIntervalSeconds: readonly Keyframe[];
    /** Tempo que uma tarefa leva para ir do fundo da tela até a linha (menor = mais rápido). */
    readonly travelSeconds: readonly Keyframe[];
    /** Proporção de tarefas inúteis ao longo do tempo (0 a 1). */
    readonly uselessRatio: readonly Keyframe[];
  };

  /** Evento do erro 1202: a tela do Executive pisca em vermelho. Começa por tempo OU por proximidade. */
  readonly alarm1202: {
    readonly afterSeconds: number;
    readonly withinDistanceRatio: number;
    /** Intervalo entre piscadas. */
    readonly flashIntervalSeconds: number;
    /** Duração de cada piscada. */
    readonly flashSeconds: number;
  };

  readonly lander: {
    /** Raio da Lua no "mundo" do jogo (mesma unidade da distância). */
    readonly moonRadiusUnits: number;
    /** Velocidade da órbita. */
    readonly orbitSpeedRadPerSecond: number;
    /** Rapidez com que a câmera acompanha a distância (maior = mais rápido). */
    readonly cameraResponsePerSecond: number;
  };

  readonly ui: {
    /** Quanto tempo a mensagem "Missão Concluída / Falhou" fica na tela antes de passar para a história. */
    readonly resultBannerSeconds: number;
  };
}

export const defaultConfig: GameConfig = {
  timeLimitSeconds: 80,
  maxStrikes: 3,
  seed: null,

  distance: {
    startUnits: 100,
    landingUnits: 0,
    failUnits: 130,
    approachPerEssentialUnits: 5,
  },

  penalties: {
    essentialTrashedUnits: 2,
    uselessOnLineUnits: 4,
    essentialOnLineUnits: 10,
    freezeAfterEssentialOnLineSeconds: 0,
  },

  memory: {
    totalBlocks: 6,
    essentialRunSeconds: [2, 4],
    uselessRunSeconds: [5, 12],
    schedule: [
      {
        label: "Muito longe",
        afterSeconds: 0,
        withinDistanceRatio: 1.0,
        blocks: 6,
      },
      { label: "Longe", afterSeconds: 15, withinDistanceRatio: 0.8, blocks: 5 },
      {
        label: "Perto",
        afterSeconds: 30,
        withinDistanceRatio: 0.55,
        blocks: 4,
      },
      {
        label: "Muito perto",
        afterSeconds: 45,
        withinDistanceRatio: 0.3,
        blocks: 3,
      },
      {
        label: "Bastante perto",
        afterSeconds: 60,
        withinDistanceRatio: 0.12,
        blocks: 2,
      },
    ],
  },

  tasks: {
    lanes: 4,
    minLaneGapProgress: 0.22,
    firstSpawnSeconds: 0.8,
    spawnJitterRatio: 0.25,
    spawnIntervalSeconds: [
      { atSeconds: 0, value: 2.2 },
      { atSeconds: 30, value: 1.5 },
      { atSeconds: 60, value: 1.1 },
    ],
    travelSeconds: [
      { atSeconds: 0, value: 7.5 },
      { atSeconds: 30, value: 6.5 },
      { atSeconds: 60, value: 5.5 },
    ],
    uselessRatio: [
      { atSeconds: 0, value: 0.4 },
      { atSeconds: 30, value: 0.45 },
      { atSeconds: 60, value: 0.5 },
    ],
  },

  alarm1202: {
    afterSeconds: 30,
    withinDistanceRatio: 0.55,
    flashIntervalSeconds: 4,
    flashSeconds: 0.2,
  },

  lander: {
    moonRadiusUnits: 30,
    orbitSpeedRadPerSecond: 0.9,
    cameraResponsePerSecond: 3,
  },

  ui: {
    resultBannerSeconds: 2.5,
  },
};

/** Confere se os números fazem sentido juntos. Lança um erro com a explicação em português. */
export function assertValidConfig(config: GameConfig): void {
  const problems: string[] = [];
  const { distance, penalties, memory, tasks } = config;

  if (config.timeLimitSeconds <= 0)
    problems.push("timeLimitSeconds deve ser maior que 0");
  if (config.maxStrikes < 1) problems.push("maxStrikes deve ser pelo menos 1");
  if (!(distance.landingUnits < distance.startUnits))
    problems.push("landingUnits deve ser menor que startUnits");
  if (!(distance.startUnits < distance.failUnits))
    problems.push("failUnits deve ser maior que startUnits");
  if (distance.approachPerEssentialUnits <= 0)
    problems.push("approachPerEssentialUnits deve ser maior que 0");
  if (
    !(
      penalties.essentialTrashedUnits <= penalties.uselessOnLineUnits &&
      penalties.uselessOnLineUnits < penalties.essentialOnLineUnits
    )
  ) {
    problems.push(
      "penalidades: essencial na lixeira ≤ inútil na linha < essencial na linha",
    );
  }
  if (tasks.lanes < 1) problems.push("tasks.lanes deve ser pelo menos 1");
  for (const [name, [min, max]] of [
    ["essentialRunSeconds", memory.essentialRunSeconds],
    ["uselessRunSeconds", memory.uselessRunSeconds],
  ] as const) {
    if (min <= 0 || min > max)
      problems.push(
        `memory.${name} deve ser [mínimo, máximo] com 0 < mínimo ≤ máximo`,
      );
  }

  const first = memory.schedule[0];
  if (
    !first ||
    first.afterSeconds !== 0 ||
    first.blocks !== memory.totalBlocks
  ) {
    problems.push("memory.schedule deve começar em 0 s com totalBlocks blocos");
  }
  memory.schedule.forEach((stage, i) => {
    const previous = memory.schedule[i - 1];
    if (stage.blocks < 1 || stage.blocks > memory.totalBlocks)
      problems.push(`degrau "${stage.label}": blocks fora de 1..totalBlocks`);
    if (
      previous &&
      (stage.afterSeconds <= previous.afterSeconds ||
        stage.withinDistanceRatio >= previous.withinDistanceRatio ||
        stage.blocks > previous.blocks)
    ) {
      problems.push(
        `degrau "${stage.label}": tempo deve crescer, distância e blocos devem diminuir`,
      );
    }
  });

  for (const [name, curve] of [
    ["spawnIntervalSeconds", tasks.spawnIntervalSeconds],
    ["travelSeconds", tasks.travelSeconds],
    ["uselessRatio", tasks.uselessRatio],
  ] as const) {
    if (curve.length === 0)
      problems.push(`tasks.${name} precisa de pelo menos 1 ponto`);
    curve.forEach((key, i) => {
      const previous = curve[i - 1];
      if (previous && key.atSeconds <= previous.atSeconds)
        problems.push(
          `tasks.${name}: pontos devem estar em ordem crescente de tempo`,
        );
    });
  }

  if (problems.length > 0)
    throw new Error(`Config inválida:\n- ${problems.join("\n- ")}`);
}
