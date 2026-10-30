# História da Margaret Hamilton

A história é dividida em **frames** — pequenos trechos de texto com imagens, gifs ou mecânicas customizáveis ao lado.

Os frames avançam ao **clicar** na tela ou aperte `ENTER` ou `ESPAÇO`.
Eles são descritos dessa maneira:

---

## Título

### Frame x

Conteúdo do frame x.

---

## Introdução

### Frame 1

É 1968...

### Frame 2

O Homem está prestes a chegar mais longe da Terra...

### Frame 3

De repente, um erro!

### Frame 4

Os dados de navegação da nave foram apagados!
Como os astronautas vão voltar para a Terra!?

### Frame 5

... É 1968, *Margaret Hamilton* acaba de ver sua filha falhar
em uma simulação da missão **Apollo 8**.

### Frame 6

Ela era a chefe do departamento de software e viu sua filha
cometer um erro que "não era para acontecer"...

### Frame 7

Enquanto a filha brincava com o simulador, ela — em sua inocência —
ativou o programa de lançamento enquanto a nave já estava no meio do percurso.

### Frame 8

Todos os dados que fariam a nave voltar para a Terra foram apagados...

### Frame 9

Margaret ficou preocupada: "E se esse erro acontecesse durante a missão?"

### Frame 10

Margaret levou seu receio aos chefões do projeto, no MIT. A resposta de um deles foi:

### Frame 11

"Bem, isso **nunca** vai acontecer porque os astronautas são bem treinados. Isso simplesmente **não vai acontecer**."

### Frame 12

Mas aconteceu. Durante a missão real Apollo 8, um dos astronautas — em sua inocência — ativou a mesma sequência
que a filha de Margaret.

### Frame 13

Por sorte, foi possível recuperar os dados perdidos, e a missão foi um sucesso...

### Frame 14

"Sim, Margaret, você pode colocar aquela mudança lá", foi o que um dos chefes
de Margaret disse a ela.

## Contexto

### Frame 1

> Foto da Margaret e sua equipe

Esse era o trabalho de Margaret e sua equipe: criar o software que manda o Homem ao espaço.

### Frame 2

Não é uma tarefa fácil...

### Frame 3

O erro que ocorreu na missão Apollo 8 é só **um dos possíveis**...

### Frame 4

Existem dezenas, senão centenas, de possíveis *erros*,
muitos deles extremamente improváveis.

### Frame 5

Como criar um sistema que se adapta a situações inesperadas?

## Funcionamento do Executive

### Frame 1

A missão **Apollo 11** enfrentou o mesmo problema...

### Frame 2

Só que, dessa vez, o Homem iria à Lua!

### Frame 3

Para criar um sistema adaptável, Margaret e sua equipe dividiram a missão em **fases**.

### Frame 4

Pense bem: para ir à Lua é necessário...

### Frame 5

Sair da órbita da Terra;

### Frame 6

Queimar combustível para ir em direção à Lua;

### Frame 7

Entrar na órbita da Lua;

### Frame 8

Pousar na Lua;

### Frame 9

E voltar para casa.

### Frame 10

Durante cada fase, **diversas** informações de diferentes tipos passam pelo computador.

### Frame 11

Cada fase ainda era dividida em diversas **tarefas**.

### Frame 12

E cada tarefa era dividida em programas que são executados pelo computador.

### Frame 13

Mais de um programa rodava ao mesmo tempo. Esperar um programa terminar pode significar
perder um dado muito importante para a missão.

### Frame 14

Mas os computadores em 1969 só conseguiam trabalhar com uma tarefa de cada vez...
E tinham pouco espaço na memória...

### Frame 15

Como processar mais de uma tarefa ao mesmo tempo?

### Frame 16

Para isso, foi desenvolvido o sistema Executive.

### Frame 17

Os programas rodavam dependendo da sua **prioridade** para a missão, que era definida pela
equipe de Margaret.

### Frame 18

> Primeiro tutorial do jogo. O usuário deve selecionar apenas um programa, aquele que tem a maior prioridade para o lançamento do foguete.

Por exemplo, qual desses três programas é essencial para o **lançamento** do foguete?

### Frame 19

Essa era a missão do Executive: decidir o que era e o que não era importante.

### Frame 20

Mas como esse sistema previne erros?

### Frame 21

Vamos ver com o minigame a seguir!

### Frame 22

Nesse jogo, você faz o papel do Executive...

### Frame 23

Você deve jogar fora os programas desnecessários para o **pouso** da nave na Lua.

### Frame 24

Mova esses programas para a lixeira, mas sem deixar que eles toquem a linha vermelha!

### Frame 25

Os programas essenciais devem ser processados em um dos bancos disponíveis.

### Frame 26

Caso a tarefa seja desnecessária, ela ocupará mais tempo do que deveria.

### Frame 27

Tome cuidado! À medida que o tempo passa, um erro esquisito vai ocupando os bancos disponíveis,
**impedindo seu uso**.

### Frame 28

> Começar o jogo

Boa sorte!

## Conclusão

### Frame 1

Independentemente de você ter conseguido ou não pousar a nave, o erro 1202 foi real.

### Frame 2

Armstrong recebeu esse erro a cerca de 10 quilômetros da superfície lunar.

### Frame 3

Hoje, a causa do erro é conhecida, mas, na hora, a missão quase foi cancelada.

### Frame 4

O culpado foi um radar que media informações relacionadas à fuga da nave, caso a missão fosse cancelada.

### Frame 5

Por um deslize do pessoal do *hardware*, o radar consumia mais energia do que o esperado, fazendo com que
o computador mandasse continuamente que ele parasse — consumindo tempo de processamento.

### Frame 6

O radar não parou e, aos poucos, os blocos de memória disponíveis foram ficando lotados.

### Frame 7

Não existia espaço para todos os programas rodarem...

### Frame 8

Mas, graças ao Executive, os programas essenciais para o pouso continuaram rodando!

### Frame 12

Mas o Executive sozinho não pousou a nave...

### Frame 13

Na sala de controle, em Houston, o alarme 1202 apareceu uma, duas, várias vezes.

### Frame 14

Ninguém ali sabia exatamente o que ele significava. A decisão precisava sair em **segundos**: continuar a descida ou abortar a missão?

### Frame 15

Steve Bales, o controlador responsável, perguntou a um jovem engenheiro de apoio, Jack Garman, se era seguro continuar.

### Frame 16

Garman conhecia aquele tipo de alarme e sabia que o computador estava se recuperando sozinho, descartando o que era menos importante.

### Frame 17

"Go!" Pouso autorizado.

### Frame 18

Em 20 de julho de 1969, o Homem pisou na Lua.

### Frame 19

O erro 1202 não foi **evitado**. Ele foi **antecipado**.

### Frame 20

Margaret não sabia que o problema viria de um radar. Mas sabia que *algum* problema viria.

### Frame 21

Por isso, o sistema foi pensado para falhar com elegância: reiniciar, descartar o que não importa e manter o **essencial** funcionando.

### Frame 22

Hoje, isso se chama *tolerância a falhas*. Está nos celulares, nos bancos, nos hospitais, nos aviões...

### Frame 23

Engenharia da computação não é prever todos os erros. É construir sistemas capazes de **sobreviver a eles**.

## Protagonismo feminino

### Frame 1

> Foto da Margaret ao lado da pilha de listagens do código da Apollo, tão alta quanto ela

Essa pilha de papel é o código que levou o Homem à Lua. E quem liderou esse trabalho foi uma mulher.

### Frame 2

Nos anos 1960, a computação era um campo novo, e as mulheres eram minoria nas áreas de engenharia.

### Frame 3

Naquela época, escrever software nem era visto como "engenharia de verdade".

### Frame 4

Margaret defendeu o contrário e usou o termo ***engenharia de software*** para dar ao trabalho o respeito que ele merecia.

### Frame 5

Hoje, essa é uma das profissões mais importantes do mundo.

### Frame 6

E ela não estava sozinha: muitas mulheres trabalharam no programa Apollo, inclusive tecendo à mão, fio por fio, a memória do computador de bordo.

### Frame 7

Em 2016, Margaret recebeu a **Medalha Presidencial da Liberdade**, a maior honraria civil dos Estados Unidos.

### Frame 8

Ela não esperou permissão para imaginar o pior. Ela imaginou, preparou o sistema e salvou a missão.

## Encerramento

### Frame 1

Um erro de simulação, uma filha curiosa e uma ideia que ninguém queria ouvir...

### Frame 2

Foi assim que começou a história de um dos softwares mais importantes já criados.

### Frame 3

Margaret nos ensina que **antecipar falhas** é uma forma de cuidar das pessoas.

### Frame 4

Que **equipes** resolvem o que ninguém resolve sozinho.

### Frame 5

E que qualquer pessoa pode ocupar a ciência e a tecnologia.

### Frame 6

Agora é a sua vez...

### Frame 7

Que problema *improvável* você vai antecipar?
