import type { Story } from "./types";

/**
 * Conteúdo narrativo separado da cena para facilitar revisões.
 * Imagens são opcionais: adicione image e imageAlt quando os arquivos estiverem prontos.
 */
export const margaretHamilton: Story = {
  id: "margaret-hamilton",
  title: "Margaret Hamilton",
  description: "A engenheira de software por trás do software Apollo.",
  slides: [
    {
      eyebrow: "APOLLO 11",
      title: "Uma missão, milhares de decisões",
      text: "Quem escreveu o software que ajudou a levar seres humanos à Lua?",
      buttonText: "Descobrir",
      action: "next",
    },
    {
      eyebrow: "QUEM ERA ELA?",
      title: "Margaret Hamilton",
      text: "Uma cientista da computação que liderou trabalhos importantes no software de orientação das missões Apollo.",
      buttonText: "Conhecer o desafio",
      action: "next",
    },
    {
      eyebrow: "O CONTEXTO",
      title: "Software também é engenharia",
      text: "Nos anos 1960, criar software confiável para missões espaciais era um desafio técnico novo e decisivo.",
      buttonText: "Ver o problema",
      action: "next",
    },
    {
      eyebrow: "O DESAFIO",
      title: "Pouca memória. Uma missão enorme.",
      text: "O computador tinha recursos limitados. O software precisava organizar tarefas e manter as funções mais importantes ativas.",
      buttonText: "Avançar",
      action: "next",
    },
    {
      eyebrow: "UM MOMENTO CRÍTICO",
      title: "O computador estava sobrecarregado",
      text: "Durante a descida da Apollo 11, alarmes indicaram sobrecarga. O projeto do software permitiu priorizar tarefas importantes.",
      buttonText: "Continuar",
      action: "next",
    },
    {
      eyebrow: "O LEGADO",
      title: "Código também pode mudar a história",
      text: "O trabalho de Hamilton ajudou a mostrar a importância da engenharia de software — e merece ser lembrado entre as histórias que construíram a computação.",
      buttonText: "Sua vez",
      action: "next",
    },
    {
      eyebrow: "HORA DE JOGAR",
      title: "O que deve continuar funcionando?",
      text: "Gerencie a memória do computador e ajude o módulo lunar a chegar à Lua.",
      buttonText: "Iniciar missão",
      action: "start-game",
    },
  ],
};
