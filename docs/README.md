# Jogo para o Hackton

A programação, nos primórdios, tinha forte presença feminina, e isso foi mudando quando a área ganhou prestígio. Acreditamos que os jovens não tem referenciais fortes de "mulheres na computação", quais os desafios e conquistas enfrentados para desenvolverem tecnologias que impactaram o mundo? Nossa missão é contar histórias de mulheres que enfrentaram desafios técnicos e sociais para criar referenciais fortes de cientistas da computação, e com isso, entender "o que uma cientista da computação faz".

## Menu inicial

- Explicação da missão do projeto.
- Seletor horizontal de "Histórias". Cada uma é um cartão com uma foto, título e descrição (20 a 40 palavras). Vamos fazer apenas da **Margaret Hamilton**. Adicionar uma mensagem "Mais histórias em breve".

## História e Tutorial

A história da Hamilton será contada em páginas estilo Slide, com textos **grandes**, com suporte para: fotos, gifs e explicação dinâmica do jogo (ex.: mover um bloco para a memória para continuar).

## Jogo

Existem duas partes principais: o gerenciamento da memória do Executive e ao lado o módulo de pouso (nave) e a Lua, com indicador de tempo restante. A missão do jogador é gerenciar a memória do computador para a nave **se aproximar** da Lua, até pousar, em um prazo de 80 segundos.

No Mobile, avisar que o celular deve ficar em paisagem, com aviso “gire o aparelho” em retrato.

### Mecânicas

No topo há 6 blocos de memória que trabalham uma tarefa cada, ao lado uma lixeira para o jogar as tarefas e abaixo uma linha da morte. As tarefas são classificadas em **inúteis** e **essenciais**; elas saem debaixo da tela e vão em direção a linha da morte. Cada tarefa tem nome inspirado no AGC real (ex.: "Guiar a descida" × "Rastrear o radar de encontro") e um emoji. A cor sozinha não pode ser a pista, por acessibilidade. Quando as inúteis tocam a linha da morte, o módulo de pouso retrocede, mas se for uma essencial, o módulo volta mais ainda e por 3 segundos o jogador não consegue mover as tarefas, mantendo a linha da morte ativa. O jogador deve mover as inúteis para a lixeira, caso for uma essencial, o módulo volta um **pouco**. Ele ainda deve mover as essenciais para um dos blocos de memória disponíveis - ocupando um tempo aleatório entre 2 e 4 segundos - é apenas nesse caso que o módulo da nave se aproxima da Lua, mas caso a tarefa seja inútil, ela ocupará um tempo aleatório de 5 a 12 segundos.

### Progressão

O jogo não terá níveis de dificuldade. Cada partida dura aproximadamente 60 segundos, no máximo 80 segundos.
À medida que a nave chega perto da Lua e o jogo roda por um tempo, alguns blocos de memória ficam indisponíveis. O tempo de jogo é o fator principal que torna os blocos indisponíveis, a distância entre a nave e Lua tem menos prioridade:

- **Muito longe** ou início do jogo: 6 blocos;
- **Longe** ou 15 segundos: 5 blocos;
- **Perto** ou 30 segundos: 4 blocos;
- **Muito perto** ou 45 segundos: 3 blocos;
- **Bastante perto** ou 60 segundos: 2 blocos;

À medida do tempo, a intensidade das tarefas aumenta. Quando o módulo está **perto** ou já se passaram 30 segundos, um evento do erro 1202 vai começar; a tela do Executive vai piscar vermelho em intervalos de 4 segundos. A intensidade das tarefas começa a aumentar e o jogador vai ter que começar a jogar algumas tarefas essenciais no lixo.

### Módulo de Pouso (Nave)

Em uma tela ao lado, temos uma visão da Lua, fixada no centro, e o módulo de pouso **orbitando de maneira circular** a Lua. Dependendo da distância entre os dois, a câmera vai se distanciar, quando a Lua e módulo estão distantes, ou se aproximar, quando estão perto; isso faz com que a rotação do módulo não atravesse a tela.

### Jogador perdeu ou ganhou

A missão falha quando:

1. 3 tarefas tocam a linha da morte, ou
2. A nave se afasta muito da Lua, ou
3. O tempo máximo de 80 segundos acaba.

Já o sucesso se dá quando o pouso da Lua é bem sucedido. Mostrar a mensagem "Missão Falhou" e "Missão Concluída".
Depois, vai aparecer uma dessas mensagens, estilo slide:

- **Sucesso**: parabeniza o jogador.
- **Falha**: perder faz parte do jogo, continuar a história.

Em ambos os casos, a história continuar. Não tem outra tentativa.

## Requisitos técnicos

**Escopo:** só a cena `game` e as mensagens "Missão Falhou / Concluída".
Fora do escopo: menu, tutorial, história, som.

**Base:** projeto `hamilton-game` (Vite + TypeScript estrito, sem bibliotecas
de jogo), usando GameLoop, SceneManager e Input existentes.

**Arquitetura:**
- Regras (tarefas, blocos, distância, penalidades) em módulos puros,
  sem DOM nem canvas.
- Render separado: DOM para tarefas, blocos, lixeira e HUD;
  canvas para a Lua e o módulo.

**Contrato com a história:** a cena `game` é aberta com
`scenes.push('game')` e, ao terminar, chama
`scenes.replace('ending', { result: 'success' | 'failure' })`.
A cena `ending` é minha.

**Config:** tudo em `src/game/config.ts`, tipado e comentado, com unidade no
nome (`...Seconds`, `...Px`). Nenhum número mágico no código.
- Nomes e tipos das tarefas em `src/game/tasks.ts`.
- Defina valores iniciais de velocidade e frequência das tarefas em relação ao tempo, proporção de inúteis, passo de aproximação, penalidade, distância total, em um `config.ts`. Eu vou ajustando enquanto jogo.
- **Tamanho das penalidades**: essencial na lixeira ≤ inútil na linha < essencial na linha. Tudo em números no `config.ts`
- Todos os tempos devem ser configuráveis.

**Renderização** utilizando formas geométricas simples.

**Convenções:** identificadores em inglês; comentários e textos em português;
sem `any`; arquivos curtos.

**Qualidade:** `npm run build` sem erros; testes da simulação.

**Aceite:**
- [ ] 3 toques na linha = "Missão Falhou"
- [ ] Os blocos diminuem conforme a tabela
- [ ] Com o config padrão, uma partida boa dura ~60 s
- [ ] Funciona com mouse e com toque

**Entrega:** zip atualizado + lista das suposições que você fez.
