// GERADO por tools/gerar-historia.mjs a partir de HISTORIA.md. Não edite à mão.
window.HISTORIA_SECOES = [
 {
  "id": "introducao",
  "titulo": "Introdução",
  "frames": [
   {
    "num": 1,
    "texto": "É 1968...",
    "notas": []
   },
   {
    "num": 2,
    "texto": "O Homem está prestes a chegar mais longe da Terra...",
    "notas": []
   },
   {
    "num": 3,
    "texto": "De repente, um erro!",
    "notas": []
   },
   {
    "num": 4,
    "texto": "Os dados de navegação da nave foram apagados! Como os astronautas vão voltar para a Terra!?",
    "notas": []
   },
   {
    "num": 5,
    "texto": "... É 1968, *Margaret Hamilton* acaba de ver sua filha falhar em uma simulação da missão **Apollo 8**.",
    "notas": []
   },
   {
    "num": 6,
    "texto": "Ela era a chefe do departamento de software e viu sua filha cometer um erro que \"não era para acontecer\"...",
    "notas": []
   },
   {
    "num": 7,
    "texto": "Enquanto a filha brincava com o simulador, ela — em sua inocência — ativou o programa de lançamento enquanto a nave já estava no meio do percurso.",
    "notas": []
   },
   {
    "num": 8,
    "texto": "Todos os dados que fariam a nave voltar para a Terra foram apagados...",
    "notas": []
   },
   {
    "num": 9,
    "texto": "Margaret ficou preocupada: \"E se esse erro acontecesse durante a missão?\"",
    "notas": []
   },
   {
    "num": 10,
    "texto": "Margaret levou seu receio aos chefões do projeto, no MIT. A resposta de um deles foi:",
    "notas": []
   },
   {
    "num": 11,
    "texto": "\"Bem, isso **nunca** vai acontecer porque os astronautas são bem treinados. Isso simplesmente **não vai acontecer**.\"",
    "notas": []
   },
   {
    "num": 12,
    "texto": "Mas aconteceu. Durante a missão real Apollo 8, um dos astronautas — em sua inocência — ativou a mesma sequência que a filha de Margaret.",
    "notas": []
   },
   {
    "num": 13,
    "texto": "Por sorte, foi possível recuperar os dados perdidos, e a missão foi um sucesso...",
    "notas": []
   },
   {
    "num": 14,
    "texto": "\"Sim, Margaret, você pode colocar aquela mudança lá\", foi o que um dos chefes de Margaret disse a ela.",
    "notas": []
   }
  ]
 },
 {
  "id": "contexto",
  "titulo": "Contexto",
  "frames": [
   {
    "num": 1,
    "texto": "Esse era o trabalho de Margaret e sua equipe: criar o software que manda o Homem ao espaço.",
    "notas": [
     "Foto da Margaret e sua equipe"
    ]
   },
   {
    "num": 2,
    "texto": "Não é uma tarefa fácil...",
    "notas": []
   },
   {
    "num": 3,
    "texto": "O erro que ocorreu na missão Apollo 8 é só **um dos possíveis**...",
    "notas": []
   },
   {
    "num": 4,
    "texto": "Existem dezenas, senão centenas, de possíveis *erros*, muitos deles extremamente improváveis.",
    "notas": []
   },
   {
    "num": 5,
    "texto": "Como criar um sistema que se adapta a situações inesperadas?",
    "notas": []
   }
  ]
 },
 {
  "id": "funcionamento-do-executive",
  "titulo": "Funcionamento do Executive",
  "frames": [
   {
    "num": 1,
    "texto": "A missão **Apollo 11** enfrentou o mesmo problema...",
    "notas": []
   },
   {
    "num": 2,
    "texto": "Só que, dessa vez, o Homem iria à Lua!",
    "notas": []
   },
   {
    "num": 3,
    "texto": "Para criar um sistema adaptável, Margaret e sua equipe dividiram a missão em **fases**.",
    "notas": []
   },
   {
    "num": 4,
    "texto": "Pense bem: para ir à Lua é necessário...",
    "notas": []
   },
   {
    "num": 5,
    "texto": "Sair da órbita da Terra;",
    "notas": []
   },
   {
    "num": 6,
    "texto": "Queimar combustível para ir em direção à Lua;",
    "notas": []
   },
   {
    "num": 7,
    "texto": "Entrar na órbita da Lua;",
    "notas": []
   },
   {
    "num": 8,
    "texto": "Pousar na Lua;",
    "notas": []
   },
   {
    "num": 9,
    "texto": "E voltar para casa.",
    "notas": []
   },
   {
    "num": 10,
    "texto": "Durante cada fase, **diversas** informações de diferentes tipos passam pelo computador.",
    "notas": []
   },
   {
    "num": 11,
    "texto": "Cada fase ainda era dividida em diversas **tarefas**.",
    "notas": []
   },
   {
    "num": 12,
    "texto": "E cada tarefa era dividida em programas que são executados pelo computador.",
    "notas": []
   },
   {
    "num": 13,
    "texto": "Mais de um programa rodava ao mesmo tempo. Esperar um programa terminar pode significar perder um dado muito importante para a missão.",
    "notas": []
   },
   {
    "num": 14,
    "texto": "Mas os computadores em 1969 só conseguiam trabalhar com uma tarefa de cada vez... E tinham pouco espaço na memória...",
    "notas": []
   },
   {
    "num": 15,
    "texto": "Como processar mais de uma tarefa ao mesmo tempo?",
    "notas": []
   },
   {
    "num": 16,
    "texto": "Para isso, foi desenvolvido o sistema Executive.",
    "notas": []
   },
   {
    "num": 17,
    "texto": "Os programas rodavam dependendo da sua **prioridade** para a missão, que era definida pela equipe de Margaret.",
    "notas": []
   },
   {
    "num": 18,
    "texto": "Por exemplo, qual desses três programas é essencial para o **lançamento** do foguete?",
    "notas": [
     "Primeiro tutorial do jogo. O usuário deve selecionar apenas um programa, aquele que tem a maior prioridade para o lançamento do foguete."
    ]
   },
   {
    "num": 19,
    "texto": "Essa era a missão do Executive: decidir o que era e o que não era importante.",
    "notas": []
   },
   {
    "num": 20,
    "texto": "Mas como esse sistema previne erros?",
    "notas": []
   },
   {
    "num": 21,
    "texto": "Vamos ver com o minigame a seguir!",
    "notas": []
   },
   {
    "num": 22,
    "texto": "Nesse jogo, você faz o papel do Executive...",
    "notas": []
   },
   {
    "num": 23,
    "texto": "Você deve jogar fora os programas desnecessários para o **pouso** da nave na Lua.",
    "notas": []
   },
   {
    "num": 24,
    "texto": "Mova esses programas para a lixeira, mas sem deixar que eles toquem a linha vermelha!",
    "notas": []
   },
   {
    "num": 25,
    "texto": "Os programas essenciais devem ser processados em um dos bancos disponíveis.",
    "notas": []
   },
   {
    "num": 26,
    "texto": "Caso a tarefa seja desnecessária, ela ocupará mais tempo do que deveria.",
    "notas": []
   },
   {
    "num": 27,
    "texto": "Tome cuidado! À medida que o tempo passa, um erro esquisito vai ocupando os bancos disponíveis, **impedindo seu uso**.",
    "notas": []
   },
   {
    "num": 28,
    "texto": "Boa sorte!",
    "notas": [
     "Começar o jogo"
    ]
   }
  ]
 },
 {
  "id": "conclusao",
  "titulo": "Conclusão",
  "frames": [
   {
    "num": 1,
    "texto": "Independentemente de você ter conseguido ou não pousar a nave, o erro 1202 foi real.",
    "notas": []
   },
   {
    "num": 2,
    "texto": "Armstrong recebeu esse erro a cerca de 10 quilômetros da superfície lunar.",
    "notas": []
   },
   {
    "num": 3,
    "texto": "Hoje, a causa do erro é conhecida, mas, na hora, a missão quase foi cancelada.",
    "notas": []
   },
   {
    "num": 4,
    "texto": "O culpado foi um radar que media informações relacionadas à fuga da nave, caso a missão fosse cancelada.",
    "notas": []
   },
   {
    "num": 5,
    "texto": "Por um deslize do pessoal do *hardware*, o radar consumia mais energia do que o esperado, fazendo com que o computador mandasse continuamente que ele parasse — consumindo tempo de processamento.",
    "notas": []
   },
   {
    "num": 6,
    "texto": "O radar não parou e, aos poucos, os blocos de memória disponíveis foram ficando lotados.",
    "notas": []
   },
   {
    "num": 7,
    "texto": "Não existia espaço para todos os programas rodarem...",
    "notas": []
   },
   {
    "num": 8,
    "texto": "Mas, graças ao Executive, os programas essenciais para o pouso continuaram rodando!",
    "notas": []
   },
   {
    "num": 12,
    "texto": "Mas o Executive sozinho não pousou a nave...",
    "notas": []
   },
   {
    "num": 13,
    "texto": "Na sala de controle, em Houston, o alarme 1202 apareceu uma, duas, várias vezes.",
    "notas": []
   },
   {
    "num": 14,
    "texto": "Ninguém ali sabia exatamente o que ele significava. A decisão precisava sair em **segundos**: continuar a descida ou abortar a missão?",
    "notas": []
   },
   {
    "num": 15,
    "texto": "Steve Bales, o controlador responsável, perguntou a um jovem engenheiro de apoio, Jack Garman, se era seguro continuar.",
    "notas": []
   },
   {
    "num": 16,
    "texto": "Garman conhecia aquele tipo de alarme e sabia que o computador estava se recuperando sozinho, descartando o que era menos importante.",
    "notas": []
   },
   {
    "num": 17,
    "texto": "\"Go!\" Pouso autorizado.",
    "notas": []
   },
   {
    "num": 18,
    "texto": "Em 20 de julho de 1969, o Homem pisou na Lua.",
    "notas": []
   },
   {
    "num": 19,
    "texto": "O erro 1202 não foi **evitado**. Ele foi **antecipado**.",
    "notas": []
   },
   {
    "num": 20,
    "texto": "Margaret não sabia que o problema viria de um radar. Mas sabia que *algum* problema viria.",
    "notas": []
   },
   {
    "num": 21,
    "texto": "Por isso, o sistema foi pensado para falhar com elegância: reiniciar, descartar o que não importa e manter o **essencial** funcionando.",
    "notas": []
   },
   {
    "num": 22,
    "texto": "Hoje, isso se chama *tolerância a falhas*. Está nos celulares, nos bancos, nos hospitais, nos aviões...",
    "notas": []
   },
   {
    "num": 23,
    "texto": "Engenharia da computação não é prever todos os erros. É construir sistemas capazes de **sobreviver a eles**.",
    "notas": []
   }
  ]
 },
 {
  "id": "protagonismo-feminino",
  "titulo": "Protagonismo feminino",
  "frames": [
   {
    "num": 1,
    "texto": "Essa pilha de papel é o código que levou o Homem à Lua. E quem liderou esse trabalho foi uma mulher.",
    "notas": [
     "Foto da Margaret ao lado da pilha de listagens do código da Apollo, tão alta quanto ela"
    ]
   },
   {
    "num": 2,
    "texto": "Nos anos 1960, a computação era um campo novo, e as mulheres eram minoria nas áreas de engenharia.",
    "notas": []
   },
   {
    "num": 3,
    "texto": "Naquela época, escrever software nem era visto como \"engenharia de verdade\".",
    "notas": []
   },
   {
    "num": 4,
    "texto": "Margaret defendeu o contrário e usou o termo ***engenharia de software*** para dar ao trabalho o respeito que ele merecia.",
    "notas": []
   },
   {
    "num": 5,
    "texto": "Hoje, essa é uma das profissões mais importantes do mundo.",
    "notas": []
   },
   {
    "num": 6,
    "texto": "E ela não estava sozinha: muitas mulheres trabalharam no programa Apollo, inclusive tecendo à mão, fio por fio, a memória do computador de bordo.",
    "notas": []
   },
   {
    "num": 7,
    "texto": "Em 2016, Margaret recebeu a **Medalha Presidencial da Liberdade**, a maior honraria civil dos Estados Unidos.",
    "notas": []
   },
   {
    "num": 8,
    "texto": "Ela não esperou permissão para imaginar o pior. Ela imaginou, preparou o sistema e salvou a missão.",
    "notas": []
   }
  ]
 },
 {
  "id": "encerramento",
  "titulo": "Encerramento",
  "frames": [
   {
    "num": 1,
    "texto": "Um erro de simulação, uma filha curiosa e uma ideia que ninguém queria ouvir...",
    "notas": []
   },
   {
    "num": 2,
    "texto": "Foi assim que começou a história de um dos softwares mais importantes já criados.",
    "notas": []
   },
   {
    "num": 3,
    "texto": "Margaret nos ensina que **antecipar falhas** é uma forma de cuidar das pessoas.",
    "notas": []
   },
   {
    "num": 4,
    "texto": "Que **equipes** resolvem o que ninguém resolve sozinho.",
    "notas": []
   },
   {
    "num": 5,
    "texto": "E que qualquer pessoa pode ocupar a ciência e a tecnologia.",
    "notas": []
   },
   {
    "num": 6,
    "texto": "Agora é a sua vez...",
    "notas": []
   },
   {
    "num": 7,
    "texto": "Que problema *improvável* você vai antecipar?",
    "notas": []
   }
  ]
 }
];
