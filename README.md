# Hamilton: o software da Apollo

Jogo web (HTML + CSS + TypeScript) sobre Margaret Hamilton, para o hackathon de valorização da mulher na ciência e tecnologia. Nome de trabalho: troque `title` no `index.html` e `name` no `package.json` quando definirem o nome final.

## Rodar

```bash
npm install
npm run dev        # servidor local com recarga automática
npm test           # testes da simulação e da cena do jogo
npm run build      # confere os tipos e gera a pasta dist/
npm run preview    # abre o resultado de dist/
```

## Publicar no GitHub Pages

1. Suba o projeto para um repositório com a branch `main`.
2. No GitHub: **Settings → Pages → Source: GitHub Actions**.
3. A cada push na `main`, o workflow `.github/workflows/deploy.yml` compila e publica.

O `vite.config.ts` usa `base: './'`, então o site funciona em `https://usuario.github.io/repositorio/`.

## Estrutura

```
src/
├─ engine/          Núcleo reutilizável, sem nada específico do jogo
│  ├─ GameLoop.ts       Loop com passo de simulação fixo
│  ├─ Scene.ts          Classe base das cenas
│  ├─ SceneManager.ts   Pilha de cenas (push, pop, replace, reset)
│  ├─ Input.ts          Teclado e ponteiro
│  └─ Display.ts        Canvas 16:9 lógico (960×540), nítido em telas HiDPI
├─ game/            O jogo em si
│  ├─ config.ts         TODO o balanceamento (números, tempos, tabela de blocos)
│  ├─ tasks.ts          Nomes, emojis e tipo (essencial/inútil) das tarefas
│  ├─ layout.ts         Proporções da tela (memória × nave)
│  ├─ GameContext.ts    O que as cenas recebem (canvas, ui, input, scenes)
│  ├─ SceneMap.ts       Nome de cada cena → tipo dos seus parâmetros
│  ├─ sim/              REGRAS puras, sem DOM nem canvas (e seus testes)
│  └─ view/             Interface: MemoryView (DOM), LanderView (canvas), HudView (DOM)
├─ scenes/          GameScene (o jogo), TitleScene e EndingScene (placeholders de dev)
├─ styles/          main.css (base) e game.css (tela do jogo)
└─ main.ts          Monta tudo e inicia o loop
```

## Como o loop funciona

- `update(dt)` roda a 60 passos por segundo, sempre com o mesmo `dt` (1/60 s), em qualquer monitor. A simulação é determinística.
- `render(alpha)` roda uma vez por quadro. `alpha` ∈ [0, 1) é a fração do próximo passo que já passou, usada para interpolar o desenho entre o estado anterior e o atual (veja `LevelScene`).
- Se o jogo travar ou a aba ficar em segundo plano, o tempo perdido é cortado (máx. 0,25 s por quadro e 5 passos por quadro) para não gerar uma "espiral da morte".

## Como o gerenciador de cenas funciona

- As cenas ficam numa pilha. Só a do topo recebe `update`.
- Uma cena com `transparent = true` (como a pausa) deixa a de baixo ser desenhada.
- Trocas pedidas durante um `update` só acontecem no fim dele.
- Ciclo de vida: `enter` → (`pause` ⇄ `resume`) → `exit`. Crie elementos de interface no `enter` e remova no `exit`.

## Criar uma cena nova

1. Crie `src/scenes/MinhaCena.ts` com `class MinhaCena extends Scene<Params>`.
2. Adicione `minhaCena: Params | undefined` em `src/game/SceneMap.ts`.
3. Registre em `src/main.ts`: `.register('minhaCena', () => new MinhaCena(game))`.
4. Navegue com `game.scenes.push('minhaCena', params)`.

## O jogo (cena `game`)

- Abra com `scenes.push('game')`. Ao terminar, mostra "Missão Concluída" ou "Missão Falhou" e chama
  `scenes.replace('ending', { result: 'success' | 'failure' })`. A cena `ending` do projeto é um
  **placeholder**: substitua `src/scenes/EndingScene.ts` pela da história.
- **Regras** ficam em `src/game/sim/` (sem DOM nem canvas, testáveis). **Interface** em `src/game/view/`.
- Em desenvolvimento, atalhos na URL: `?scene=game` (abre direto no jogo), `?seed=123` (mesma partida de novo) e `?debug` (números na tela).

### Ajustar o balanceamento

Tudo está em `src/game/config.ts`, com comentários e unidade no nome (`...Seconds`, `...Units`, `...Ratio`):

| Quero mudar… | Mexa em |
|---|---|
| duração da partida / prazo | `timeLimitSeconds` |
| quantas tarefas na linha derrotam | `maxStrikes` |
| velocidade e frequência das tarefas ao longo do tempo | `tasks.travelSeconds`, `tasks.spawnIntervalSeconds` |
| proporção de inúteis | `tasks.uselessRatio` |
| quanto a nave se aproxima por tarefa | `distance.approachPerEssentialUnits` |
| tamanho das penalidades e o tempo de travamento | `penalties` |
| tabela de blocos ("perto", "longe"…) | `memory.schedule` (tempo **e** distância de cada degrau) |
| tempo de execução das tarefas | `memory.essentialRunSeconds`, `memory.uselessRunSeconds` |
| alarme 1202 | `alarm1202` |
| nomes e emojis das tarefas | `src/game/tasks.ts` |

Se os números ficarem incoerentes (por exemplo, penalidades fora da ordem), o jogo recusa a config com uma mensagem explicando o problema.
O teste "uma partida boa dura ~60 s" joga com jogadores automáticos (`sim/bot.ts`): se você mudar o balanceamento e ele falhar, a partida ficou mais fácil ou mais difícil do que o combinado.
