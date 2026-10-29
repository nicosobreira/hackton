# Jogo para o Hackton

No passado, a área que iria se chamar "Ciência da Computação" era dominada por mulheres, que muita das vezes eram matemáticas. Com o passar do tempo esta área foi se masculinizando, mas porque? Eu acredito que
As histórias das mulheres na Computação focam demais nas lutas sociais, enquanto deixam de lado as contribuições tecnológicos. Isso faz sentido, explicar conceitos técnicos para alguém fora da área é difícil, mas essa abordagem causa dois problemas. 

## Menu inicial



## História e Tutorial

Primeiro, diversas telas com apenas texto explicam a história, ideia e como o jogo funciona. Estilo slide, pode avançar e retroceder. Textos **grandes**.

## Jogo

Existem duas partes principais: o gerenciamento da memória do Executive e ao lado o módulo de pouso (nave) e a Lua, com indicador de tempo restante. A missão do jogador é gerenciar a memória do computador para a nave **se aproximar** da Lua, até pousar, em um prazo de 80 segundos.

### Mecânicas

No topo há 6 blocos de memória que trabalham uma tarefa cada, ao lado uma lixeira para o jogar as tarefas e abaixo uma linha da morte. As tarefas são classificadas em **inúteis** e **essenciais**; elas saem debaixo da tela em direção e vão em direção a linha da morte. Cada tarefa tem nome inspirado no AGC real (ex.: "Guiar a descida" × "Rastrear o radar de encontro") e um ícone. A cor sozinha não pode ser a pista, por acessibilidade. Quando as inúteis tocam a linha da morte, o módulo de pouso retrocede, mas se for uma essencial, o módulo volta mais ainda e por 3 segundos o jogador não consegue mover as tarefas, mantendo a linha da morte ativa. O jogador deve mover as inúteis para a lixeira, caso for uma essencial, o módulo volta um **pouco**. Ele ainda deve mover as essenciais para um dos blocos de memória disponíveis - ocupando um tempo aleatório entre 2 e 4 segundos - é apenas nesse caso que o módulo da nave se aproxima da Lua, mas caso a tarefa seja inútil, ela ocupará um tempo aleatório de 5 a 12 segundos.

### Progressão

O jogo não terá níveis de dificuldade. Cada partida dura aproximadamente 60 segundos, no máximo 80 segundos.
A medida que a nave chega perto da Lua e o jogo roda por um tempo, alguns blocos de memória ficam indisponíveis, seguindo a seguinte lógica em relação a proximidade do módulo com a Lua e tempo do jogo:

- **Muito longe** ou início do jogo: 6 blocos;
- **Longe** ou 15 segundos: 5 blocos;
- **Perto** ou 30 segundos: 4 blocos;
- **Muito perto** ou 45 segundos: 3 blocos;
- **Bastante perto** ou 60 segundos: 2 blocos;

A medida do tempo, a intensidade das tarefas aumenta. Quando o módulo está **Perto** e já se passaram 30 segundos, um evento do erro 1202 vai começar; a tela do Executive vai piscar vermelho em intervalos de 2 segundos. A intensidade das tarefas começa a aumentar é o jogador vai ter que começar a jogar algumas tarefas essenciais no lixo.

### Módulo de Pouso (Nave)

Em uma tela ao lado, temos uma visão da Lua, fixada no centro, e o módulo de pouso **orbitando de maneira circular** a Lua. Dependendo da distância entre os dois, a câmera vai se distanciar, quando a Lua e módulo estão distantes, ou se aproximar, quando estão perto; isso faz com que a rotação do módulo não atravesse a tela.

### Jogador perdeu ou ganhou

A missão falha quando:

1. 3 tarefas tocam a linha da morte, ou
2. A nave se afasta muito da Lua.

Já o sucesso se dá quando o pouso da Lua é bem sucedido. Mostrar a mensagem "Missão Falhou" e "Missão Concluída".
Depois, vai aparecer uma desses mensagens, estilo slide:

- **Sucesso**: parabeniza o jogador.
- **Falha**: perder faz parte do jogo, continuar a história.

Em ambos os casos, a história continuar. Não tem outra tentativa.

## *Notas para IA*

**Eu vou fazer o tutorial/história faça apenas o jogo**.

- Defina valores iniciais de velocidade e frequência das tarefas em relação ao tempo, proporção de inúteis, passo de aproximação, penalidade, distância total, em um `config.ts`. Eu vou ajustando enquanto jogo.
- Todos os tempos devem ser configuráveis.
- Utilize formas geométricas simples para a renderização.
- Crie mensagens de tarefas reais, mas não muito compridas e complicadas.
- Utilize poucas palavras para textos placeholders, como "Título" para algum título.
