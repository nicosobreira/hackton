# Hamilton: o software da Apollo

Jogo web (HTML + CSS + TypeScript) sobre Margaret Hamilton, para o hackathon de valorização da mulher na ciência e tecnologia. Nome de trabalho: troque `title` no `index.html` e `name` no `package.json` quando definirem o nome final.

## Rodar

```bash
npm install
npm run dev        # servidor local com recarga automática
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
├─ game/            Ligação entre engine e jogo
│  ├─ GameContext.ts    O que as cenas recebem (canvas, ui, input, scenes)
│  └─ SceneMap.ts       Nome de cada cena → tipo dos seus parâmetros
├─ scenes/          Telas do jogo (hoje, exemplos)
├─ styles/main.css
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
