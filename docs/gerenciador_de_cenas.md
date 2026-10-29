# Como o gerenciador de cenas funciona

- As cenas ficam numa pilha. Só a do topo recebe `update`.
- Uma cena com `transparent = true` (como a pausa) deixa a de baixo ser desenhada.
- Trocas pedidas durante um `update` só acontecem no fim dele.
- Ciclo de vida: `enter` → (`pause` ⇄ `resume`) → `exit`. Crie elementos de interface no `enter` e remova no `exit`.

## Criar uma cena nova

1. Crie `src/scenes/MinhaCena.ts` com `class MinhaCena extends Scene<Params>`.
2. Adicione `minhaCena: Params | undefined` em `src/game/SceneMap.ts`.
3. Registre em `src/main.ts`: `.register('minhaCena', () => new MinhaCena(game))`.
4. Navegue com `game.scenes.push('minhaCena', params)`.
