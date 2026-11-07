# Contribuindo com o DEAD PIXEL

Toda ajuda é bem-vinda: balanceamento, novos inimigos, comandos de terminal, traduções ou correção de bugs.

## Preparando o ambiente

```bash
git clone https://github.com/akanyane/dead-pixel.git
cd dead-pixel
npm install
npm run dev
```

Em `npm run dev`, o objeto do jogo fica em `window.__g`, o que facilita testar pelo console do navegador:

```js
__g.god = true;        // invencibilidade (o mesmo que abrir com ?god na URL)
__g.startLevel(3);     // vai para uma fase (de 0 a 4)
__g.beginPlay();       // pula a tela de história
__g.player.ram = 512;  // RAM cheia para testar o terminal
```

Antes de abrir um PR, rode o build, que também faz o typecheck:

```bash
npm run build
```

O projeto ainda não tem testes automatizados, então jogue a parte que você mudou.

## Mensagens de commit

As versões e o `CHANGELOG.md` são gerados pelo [release-please](https://github.com/googleapis/release-please) a partir dos commits. Por isso, as mensagens precisam seguir o [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

| Prefixo | Quando usar | Efeito na versão |
| --- | --- | --- |
| `feat:` | Algo novo para o jogador | Minor (`1.1.0`) |
| `fix:` | Correção de bug | Patch (`1.0.1`) |
| `perf:` | Melhoria de desempenho | Patch (`1.0.1`) |
| `feat!:` ou rodapé `BREAKING CHANGE:` | Mudança incompatível, como quebrar saves antigos | Major (`2.0.0`) |
| `docs:`, `chore:`, `refactor:` | O resto | Nenhum |

Exemplos:

```text
feat: adiciona o comando traceroute ao terminal
fix: impede item de nascer dentro de parede
```

## Onde mexer

| Quero... | Arquivo |
| --- | --- |
| Balancear inimigos, armas, perks ou waves | `src/game/data.ts` |
| Criar uma skin | `SKINS` em `src/game/data.ts` e o texto em `src/game/i18n.ts` |
| Mudar ou traduzir textos | `src/game/i18n.ts` |
| Criar um comando de terminal | `src/game/terminal.ts` |
| Mudar a IA de inimigos e chefes | `src/game/enemies.ts` |
| Mudar dano, projéteis e controles | `src/game/combat.ts` |
| Mexer em gore e partículas | `src/game/fx.ts` |
| Criar ou mudar uma arena | `src/game/map.ts` |
| Desenhar sprites | `src/game/sprites.ts` |
| Mexer em efeitos sonoros e música | `src/core/audio.ts` |

Todo texto visível fica em `src/game/i18n.ts`, nos três idiomas. A fonte é um bitmap próprio: além de ASCII, ela só tem os acentos usados em português e espanhol, mais `¡` e `¿`.

O projeto não usa assets externos: toda arte e todo som nascem de código. Mantenha essa regra em novas contribuições.

Ao criar conteúdo, faça algo original. Não recrie personagens, fases ou arte de jogos existentes.
