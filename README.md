<div align="center">

# 🩸 DEAD PIXEL

**Sexta-feira, 17:58. Um pixel se apagou. Ninguém mais respondeu.**

Shooter 2D top-down de terror e mistério tecnológico, para navegador.
5 fases, 5 chefes, 6 armas e um terminal de verdade para digitar `rm -rf` em câmera lenta.

### [![▶ Jogar agora](https://img.shields.io/badge/%E2%96%B6%20JOGAR%20AGORA-e8222a?style=for-the-badge&logoColor=white)](https://akanyane.github.io/dead-pixel/)

<sub>De graça, no navegador, sem instalar nada. Precisa de teclado e mouse.</sub>

[![Release](https://img.shields.io/github/v/release/akanyane/dead-pixel?style=flat-square&color=39ff88&label=release)](https://github.com/akanyane/dead-pixel/releases)
[![release-please](https://img.shields.io/github/actions/workflow/status/akanyane/dead-pixel/release-please.yml?style=flat-square&label=release-please)](https://github.com/akanyane/dead-pixel/actions/workflows/release-please.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-ff2a2a?style=flat-square)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-2bb8c9?style=flat-square&logo=typescript&logoColor=white)
![Dependências em runtime: 0](https://img.shields.io/badge/depend%C3%AAncias%20em%20runtime-0-a8ff3e?style=flat-square)

<img src="docs/screenshots/gameplay.gif" alt="Gameplay do DEAD PIXEL: o jogador atira em uma horda de zumbis no data center, e o chão fica coberto de sangue" width="720">

</div>

> [!WARNING]
> Contém violência pixelada, desmembramento e sangue digital. O menu tem uma opção para reduzir o gore.

---

## Índice

- [A história](#a-história)
- [Como jogar agora](#como-jogar-agora)
- [Controles](#controles)
- [O que torna o jogo diferente](#o-que-torna-o-jogo-diferente)
- [O terminal](#o-terminal)
- [Arsenal](#arsenal)
- [Bestiário](#bestiário)
- [Fases e chefes](#fases-e-chefes)
- [Patches (melhorias)](#patches-melhorias)
- [Skins](#skins)
- [Conquistas](#conquistas)
- [Idiomas](#idiomas)
- [Manual e dicas no jogo](#manual-e-dicas-no-jogo)
- [Pontuação e sequências](#pontuação-e-sequências)
- [Dicas de sobrevivência](#dicas-de-sobrevivência)
- [Como foi feito](#como-foi-feito)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Publicando o jogo](#publicando-o-jogo)
- [Como as releases funcionam](#como-as-releases-funcionam)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## A história

> Sexta-feira, 17:58. Todos os monitores da Vesper Systems mostram a mesma tela.
>
> Cinza, uniforme. No centro exato, um único pixel apagado.
>
> Ninguém pisca. Depois, todos se levantam ao mesmo tempo.
>
> No seu terminal, alguém que você não conhece escreve: *"Desça."*

Você é o `root`. Guiado por um operador anônimo, você desce andar por andar, do escritório ao data center, depois aos cabos que ninguém documentou, e ao que está rodando no fundo de tudo isso.

A cada chefe vencido, um log recuperado revela mais uma parte do que aconteceu. Nem tudo o que o operador diz merece confiança, e o jogo guarda pistas para quem presta atenção: no log de abates, nos tiros inimigos e no próprio terminal.

> [!TIP]
> A história funciona melhor sem spoilers. Vá até o final, e depois olhe o boot do jogo de novo.

## Como jogar agora

### No navegador

Abra **[akanyane.github.io/dead-pixel](https://akanyane.github.io/dead-pixel/)** e pronto. O site é atualizado sozinho a cada mudança na `main`.

### Rodando o código

Você precisa do [Node.js](https://nodejs.org/) 20 ou mais recente.

```bash
git clone https://github.com/akanyane/dead-pixel.git
cd dead-pixel
npm install
npm run dev
```

Depois, abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

### Usando uma release pronta

1. Baixe o `dead-pixel-vX.Y.Z.zip` na página de [releases](https://github.com/akanyane/dead-pixel/releases).
2. Extraia o arquivo e sirva a pasta com qualquer servidor estático:

   ```bash
   npx serve caminho/da/pasta
   ```

> [!NOTE]
> Abrir o `index.html` com dois cliques não funciona: navegadores bloqueiam módulos JavaScript em `file://`. É preciso usar um servidor, mesmo que local.

**Requisitos:** um navegador de desktop atual, teclado e mouse. O jogo não tem controles para celular. WebGL é recomendado para o efeito CRT, mas, sem ele, o jogo roda em Canvas 2D sem o efeito.

## Controles

| Ação | Tecla |
| --- | --- |
| Mover | `W` `A` `S` `D` ou setas |
| Mirar e atirar | Mouse (segure o botão esquerdo) |
| Dash, com invencibilidade | `Espaço` ou `Shift` |
| Golpe de pé de cabra | `F` ou botão direito |
| Trocar de arma | `1` a `6` ou scroll |
| Abrir o terminal | `Q` ou `Enter` |
| Pausar | `Esc` ou `P` |
| Escolher um patch | Clique, ou `1` `2` `3` |
| Reiniciar a fase depois de morrer | `R` |

Não existe recarga.

<div align="center">
  <img src="docs/screenshots/menu.jpg" alt="Menu principal, com o título DEAD PIXEL pingando sangue" width="720">
</div>

## O que torna o jogo diferente

- 🕵️ **Um mistério contado pelo próprio sistema.** Mensagens do operador, logs recuperados e um final que muda o sentido de tudo o que você fez.
- ⌨️ **Um terminal de verdade como poder especial.** O tempo quase para enquanto você digita comandos, com autocompletar e histórico.
- 🩸 **O chão guarda tudo.** Cada gota, tripa e explosão fica pintada no mapa até o fim da fase, e você deixa pegadas ao pisar no sangue.
- 🦴 **Gore com física.** Cabeças, braços, pernas, costelas e olhos voam, quicam, sangram no caminho e ficam onde caíram. Zumbis feridos perdem um braço e continuam vindo.
- 💥 **Peso em cada tiro.** Tremor de tela, congelamento nos abates pesados, recuo da câmera, cápsulas ejetadas, baterias que explodem em cadeia.
- 🖥️ **Cara de monitor velho.** Pós-processamento em WebGL com curvatura, scanlines, aberração cromática e glitches quando você apanha.
- 🎵 **Nenhum arquivo de mídia.** Sprites, efeitos e música são gerados por código. O jogo inteiro cabe em cerca de 75 KB comprimidos.

## O terminal

Aperte `Q` a qualquer momento. O mundo fica em câmera lenta (8% da velocidade) e a música abafa enquanto você digita. Os comandos custam **RAM**, que você ganha matando inimigos e coletando pentes de memória.

- `Tab` completa o comando.
- `↑` e `↓` navegam pelo histórico.
- `Esc` fecha o terminal.

| Comando | Também aceita | Custo | Efeito |
| --- | --- | --- | --- |
| `ping` | `ping -c 1`, `ping localhost` | 60 MB | Atordoa os inimigos e apaga os tiros deles |
| `fork` | `fork()`, `./fork` | 150 MB | Cria um clone que atira por 20 s (até 4 ao mesmo tempo) |
| `overclock` | `oc`, `overclock --force` | 180 MB | 8 s com tiro e movimento acelerados |
| `revert` | `git revert`, `git revert head` | 200 MB | Recupera 50 de HP |
| `kill` | `kill -9`, `killall`, `pkill zumbi` | 250 MB | Raio em até 14 alvos próximos, com 240 de dano |
| `sudo` | `sudo su`, `sudo -i` | 300 MB | 6 s invencível, com dano em dobro |
| `rm` | `rm -rf`, `rm -rf /`, `rm -rf *` | 450 MB | Causa 500 de dano em tudo que está na tela |

<div align="center">
  <img src="docs/screenshots/terminal.jpg" alt="Terminal aberto em bullet time com a lista de comandos e seus custos em RAM" width="720">
</div>

> [!TIP]
> O terminal aceita mais do que os comandos da lista. Tente o que você digitaria para investigar um servidor: as respostas contam parte da história.

## Arsenal

Você começa só com a `printf()`. As outras armas aparecem ao longo do jogo, cada uma batizada com o que o comando faz.

| # | Arma | Tipo | Dano | Intervalo | Munição máx. | Como conseguir |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `printf()` | Pistola | 13 | 0,20 s | Infinita | Inicial |
| 2 | `for(;;)` | Submetralhadora | 9 | 0,07 s | 640 | Caixa após a 1ª wave da fase 1 |
| 3 | `fork()` | Escopeta (9 projéteis) | 11 cada | 0,62 s | 90 | Vencer o Supervisor |
| 4 | `kill -9` | Railgun que atravessa tudo | 170 | 0,85 s | 40 | Vencer o Kernel Panic |
| 5 | `rm -rf` | Lança-chamas | 5 + fogo | 0,035 s | 800 | Vencer a Hidra |
| 6 | `DROP TABLE` | Lança-foguetes em área | 140 | 0,95 s | 26 | Vencer o Monolito |

O **pé de cabra** (`F`) é o seu ataque corpo a corpo. Ele causa 70 de dano em arco, empurra forte e cura 3 de HP a cada abate. É a melhor saída quando uma horda encurrala você.

## Bestiário

| Inimigo | HP | Velocidade | O que faz |
| --- | --- | --- | --- |
| **zumbi** (`<defunct>`) | 34 | 30 | Anda e morde. Perde um braço quando ferido |
| **bug** | 8 | 78 | Enxame rápido em ziguezague |
| **race condition** | 20 | 96 | Corre de forma errática e nunca chega na hora certa |
| **broadcast** | 42 | 34 | Mantém distância e dispara pacotes de dados por trás da horda |
| **memory leak** | 80 | 20 | Deixa poças que ferem e atrasam; ao morrer, vira 3 filhotes |
| **null pointer** | 46 | 44 | Fica intangível, teleporta para perto de você e atira `null` |
| **segfault** | 26 | 64 | Corre até você, acende o pavio e explode. Morto antes disso, fere os vizinhos |
| **stack overflow** | 300 | 18 | Torre de caixas; ao morrer, libera 4 zumbis |

O HP cresce 16% e a velocidade cresce 4% a cada fase. As baterias de nobreak amarelas explodem quando atingidas: use-as a seu favor.

## Fases e chefes

Cada fase tem waves de inimigos e termina em um chefe. Depois de cada wave, você aplica um patch. Ao morrer, recomeça do início da fase, com tudo o que tinha quando entrou nela.

### 1. Open Space, `~/startup`

O andar da Vesper depois do expediente: mesas, monitores ainda ligados e ninguém respondendo.

**Chefe: O Supervisor.** Lança leques de alertas e convoca os outros ao redor de si. Antes de cada **avanço**, marca uma linha vermelha e dispara nela. Se bater na parede, fica atordoado e vulnerável.

<div align="center"><img src="docs/screenshots/gameplay-open-space.jpg" alt="Fase Open Space com poças de sangue entre as mesas" width="720"></div>

### 2. Data Center, `/var/run`

Corredores estreitos entre racks, LEDs piscando e luz azul fria. A sala não deveria estar quente.

**Chefe: Kernel Panic.** Um processador gigante que alterna espirais de tiros, anéis de projéteis, invocações e um laser que varre a sala.

<div align="center"><img src="docs/screenshots/boss-kernel-panic.jpg" alt="Chefe Kernel Panic no data center" width="720"></div>

### 3. Undernet, `/dev/null`

Um andar que não está na planta: cavernas geradas proceduralmente, cabos sem documentação e poças tóxicas brilhando no escuro.

**Chefe: Hidra de Microsserviços.** Corte um nó e nascem dois menores e mais rápidos, em três gerações. No total, são 7 nós para destruir.

<div align="center"><img src="docs/screenshots/boss-hidra.jpg" alt="Hidra de Microsserviços em uma caverna verde" width="720"></div>

### 4. Produção, `/prod`

Tudo vermelho. **Faixas de deploy** cruzam o mapa: quando a área pisca, saia dali. Elas queimam você, mas também queimam os inimigos.

**Chefe: O Monolito Legado.** Imóvel e blindado, recebe só 30% do dano até disparar seus lasers e abrir as portas. Ataque com tudo quando o núcleo vermelho aparecer.

<div align="center"><img src="docs/screenshots/boss-monolito.jpg" alt="O Monolito Legado no fim da sala de produção" width="720"></div>

### 5. O Pixel, `/dev/pixel`

A sala fica branca, e o sangue ganha um contraste absurdo.

**Chefe: O Pixel Morto.** Começa minúsculo, teleportando pela sala, e cresce em três fases, enquanto corrompe o chão e dispara lasers giratórios.

<div align="center"><img src="docs/screenshots/boss-pixel.jpg" alt="Fase final toda branca com o Pixel Morto" width="720"></div>

## Patches (melhorias)

Depois de cada wave, o operador envia três patches, e você aplica um. A combinação muda a cada partida.

<div align="center"><img src="docs/screenshots/pull-requests.jpg" alt="Tela de escolha entre três patches" width="720"></div>

| Tipo | Título | Efeito | Máx. |
| --- | --- | --- | --- |
| `feat` | privilégios elevados | +25% de dano em todas as armas | — |
| `perf` | compilar com -O3 | +18% de cadência de tiro | — |
| `perf` | latência reduzida | +12% de velocidade | 4 |
| `fix` | redundância | +30 de HP máximo e cura 30 | — |
| `feat` | passagem por referência | Balas atravessam +1 inimigo | 4 |
| `feat` | retry com backoff | Balas ricocheteiam +1 vez | 3 |
| `feat` | paralelismo | +1 projétil por disparo | 3 |
| `feat` | ponto fraco | +15% de crítico, com dano x2,5 | 4 |
| `feat` | exceção não tratada | +12% de chance de explodir ao matar | 4 |
| `chore` | alocação extra | +256 MB de RAM máxima e +50% de ganho | 3 |
| `refactor` | garbage collector | +1 HP a cada 4 abates | 3 |
| `perf` | resposta imediata | -25% de recarga do dash | 3 |
| `feat` | colisão | O dash mói quem estiver na frente | 2 |
| `chore` | coleta automática | Atrai itens de muito mais longe | 2 |
| `feat` | superaquecimento | Tiros incendeiam o alvo | 2 |
| `chore` | buffer ampliado | +50% de munição máxima e recarga total | 2 |
| `feat` | cron job | Um pixel afiado orbita e corta inimigos | 4 |
| `feat` | firewall | Quem te toca leva 40 de dano | 3 |
| `fix` | ponto de restauração | Revive uma vez com metade do HP | 1 |
| `feat` | força bruta | Golpe de pé de cabra com +100% de dano | 2 |

## Skins

Escolha a roupa do seu `root` em **SKINS**, no menu principal. Quatro já vêm liberadas e seis são conquistadas jogando. O desbloqueio fica salvo, mesmo se você recomeçar o jogo.

<div align="center"><img src="docs/screenshots/skins.jpg" alt="Tela de seleção de skins, com dez personagens e os bloqueados como silhuetas" width="720"></div>

| Skin | Como liberar |
| --- | --- |
| root, estagiário, invasor, plantonista | Já vêm liberadas |
| supervisor | Vencer o Supervisor |
| espectro (troca de cor o tempo todo) | Vencer o Kernel Panic |
| infectado | Vencer a Hidra de Microsserviços |
| mainframe | Vencer o Monolito Legado |
| pixel morto | Vencer o Pixel Morto |
| açougueiro | Fazer uma sequência de 100 abates |

As skins são só visuais, e cada uma tem o próprio rastro de dash.

## Conquistas

São 26 conquistas, disponíveis no menu e na pausa, com barra de progresso nas que dependem de contagem. Elas ficam salvas no navegador. Algumas são ocultas e só revelam o que são depois de conquistadas, para não entregar a história.

<div align="center"><img src="docs/screenshots/achievements.jpg" alt="Tela de conquistas, com a lista à esquerda e os detalhes da conquista selecionada à direita" width="720"></div>

Elas premiam combate (sequências, abates somados, um único `rm -rf` encerrando 20 processos), desafios (vencer um chefe sem levar dano, terminar uma fase só com a `printf()`) e investigação no terminal.

## Idiomas

O jogo inteiro está em **português**, **inglês** e **espanhol**, incluindo história, logs, manual, respostas do terminal e até o texto pintado no chão. Na primeira vez, o idioma segue o do navegador. Para trocar, use `IDIOMA / LANGUAGE` no menu principal ou nas opções.

Os comandos do terminal (`rm -rf`, `kill -9`...) são os mesmos em todos os idiomas.

## Manual e dicas no jogo

O jogo explica a si mesmo, e você pode desligar os cartões e as dicas em **OPÇÕES**:

- **Manual:** disponível no menu e na pausa, traz fichas com stats e estratégia de cada inimigo, chefe, arma e comando, além de uma aba de dicas.
- **Cartão de inimigo novo:** na primeira vez que um inimigo ou chefe aparece, o jogo pausa e mostra o que ele faz e como lidar com ele.
- **Tela de morte:** mostra quem matou você e como evitar isso da próxima vez.
- **Dicas de contexto:** avisam, por exemplo, para digitar `revert` quando o HP está baixo.
- **Tela de fase:** cada fase começa com uma dica sobre o jogo.

<div align="center"><img src="docs/screenshots/manual.jpg" alt="Manual do jogo mostrando a ficha do segfault, com stats e como lidar com ele" width="720"></div>

## Pontuação e sequências

Cada abate em sequência renova um timer de 3,5 segundos, e levar dano encurta esse tempo. O multiplicador de pontos sobe +1 a cada 10 abates seguidos.

| Abates | Anúncio |
| --- | --- |
| 5 | ENCERRADO |
| 10 | EM CADEIA |
| 20 | RECURSÃO |
| 35 | STACK OVERFLOW |
| 50 | KERNEL PANIC |
| 75 | MEMÓRIA LIBERADA |
| 100 | NENHUMA RESPOSTA |
| 150 | ELES SENTEM ISSO? |
| 250 | QUEM É VOCÊ? |

O progresso, o recorde, as skins, as conquistas e as opções ficam salvos no `localStorage` do navegador. Não há servidor nem conta.

## Dicas de sobrevivência

1. **Use o dash para atravessar, não só para fugir.** Você fica invencível durante os 0,17 s do movimento.
2. **Não guarde RAM demais.** Um `ping` de 60 MB limpa a tela de tiros em um momento de desespero.
3. **Decore comandos curtos.** `rm` + `Enter` é mais rápido que `rm -rf /`, e `↑` + `Enter` repete o último.
4. **Atire nas baterias quando a horda passar por elas.** As explosões causam reação em cadeia.
5. **Mate os segfaults de longe.** Explodindo perto dos outros zumbis, eles trabalham para você.
6. **Na fase 4, faça os zumbis passarem pelas faixas de deploy.** Quem está nelas leva 400 de dano.
7. **Contra o Monolito, economize a munição boa** para quando o núcleo estiver exposto.

## Como foi feito

O jogo é TypeScript puro sobre Canvas 2D, sem engine e sem dependências em runtime. O Vite e o TypeScript são usados só em desenvolvimento e no build.

```mermaid
flowchart LR
    I[Teclado e mouse] --> U[Update]
    subgraph Jogo
        U --> C[Combate e projéteis]
        U --> E[IA de inimigos]
        U --> D[Waves e chefes]
        U --> F[Partículas e gore]
    end
    F -- mancha permanente --> M[(Canvas do chão)]
    Jogo --> R[Render 480x270]
    M --> R
    R --> L[Luz em multiply]
    L --> H[HUD]
    H --> W[Shader CRT em WebGL]
    W --> S[Tela]
```

| Sistema | Como funciona |
| --- | --- |
| **Resolução** | Tudo é desenhado em 480x270 e ampliado com pixels nítidos, o que garante a aparência de pixel art. |
| **Gore persistente** | O chão é um canvas único e cada mancha é pintada nele de vez. O sangue acumulado não custa nada por frame, então o mapa pode ficar coberto sem perder desempenho. |
| **Sprites** | São matrizes de texto convertidas em canvas ao iniciar. A fonte também é um bitmap 5x7 no código, com acentos do português compostos a partir da letra base. |
| **Caminho até o jogador** | Um único campo de fluxo (BFS sobre os tiles) é recalculado cerca de 4 vezes por segundo e compartilhado por toda a horda. |
| **Colisões** | Um hash espacial limita as comparações entre balas e inimigos, e entre os próprios inimigos, aos vizinhos próximos. |
| **Luz** | Luzes aditivas são somadas em um canvas separado, aplicado em `multiply` sobre o mundo. Tiros e olhos dos zumbis são desenhados depois, para brilhar no escuro. |
| **Idiomas** | Os textos ficam em `i18n.ts`, e os demais idiomas são tipados a partir do português: uma tradução faltando quebra o build. |
| **Áudio** | Web Audio do início ao fim: efeitos com osciladores e ruído filtrado, mais um sequenciador com trilhas diferentes por fase. |
| **CRT** | Um fragment shader aplica curvatura, scanlines, bloom, aberração cromática e glitches. Sem WebGL, o jogo continua funcionando sem esse efeito. |
| **Arenas** | O layout é gerado a cada partida: mesas e salas, corredores de racks, cavernas com autômato celular. Uma checagem de conectividade evita bolsões isolados. |

## Estrutura do projeto

```text
dead-pixel/
├── index.html
├── src/
│   ├── main.ts             # Loop principal, menu e máquina de estados das telas
│   ├── core/
│   │   ├── audio.ts        # Efeitos e música sintetizados
│   │   ├── crt.ts          # Pós-processamento WebGL
│   │   ├── font.ts         # Fonte bitmap com acentos
│   │   ├── input.ts        # Teclado e mouse
│   │   └── util.ts         # Matemática e helpers
│   └── game/
│       ├── data.ts         # ⭐ Inimigos, armas, perks, skins e fases: balanceie aqui
│       ├── achievements.ts # Lista de conquistas e regras de progresso
│       ├── i18n.ts         # Todos os textos, em português, inglês e espanhol
│       ├── screens.ts      # Manual, cartões de inimigo e seleção de skin
│       ├── game.ts         # Estado, waves, save e progressão
│       ├── combat.ts       # Jogador, projéteis, dano e explosões
│       ├── enemies.ts      # IA de inimigos e chefes
│       ├── terminal.ts     # Comandos do terminal
│       ├── fx.ts           # Gore, partículas e manchas
│       ├── map.ts          # Geração e pintura das arenas
│       ├── render.ts       # Mundo e iluminação
│       ├── hud.ts          # Interface e telas
│       └── sprites.ts      # Pixel art em texto
├── docs/screenshots/       # Imagens deste README
├── .github/workflows/      # Automação de releases
└── release-please-config.json
```

## Desenvolvimento

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Typecheck e build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Só o typecheck |

Em modo de desenvolvimento, o jogo fica em `window.__g`, e `?god` na URL liga a invencibilidade. Nada disso existe no build de produção.

```js
__g.startLevel(4);     // vai para a fase final (0 a 4)
__g.beginPlay();       // pula a história
__g.player.ram = 512;  // enche a RAM
```

O projeto ainda não tem testes automatizados.

## Publicando o jogo

`npm run build` gera um site estático em `dist/`, com caminhos relativos. Ele funciona em qualquer hospedagem estática, inclusive em subpastas, como Vercel, Netlify, Cloudflare Pages ou GitHub Pages.

A versão oficial está no GitHub Pages: o workflow `deploy-pages.yml` compila e publica o jogo a cada push na `main`. Em um fork, ative **Settings > Pages > Source: GitHub Actions** para usar o mesmo fluxo.

## Como as releases funcionam

As versões são automatizadas pelo [release-please](https://github.com/googleapis/release-please):

```mermaid
flowchart LR
    A[Commit em main] --> B[release-please abre ou atualiza o PR de release]
    B --> C{Merge do PR?}
    C -- ainda não --> A
    C -- sim --> D[Tag, GitHub Release e CHANGELOG]
    D --> E[Build anexado como .zip]
```

1. Os commits em `main` seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/). `feat:` sobe a versão minor, `fix:` sobe a patch, e `feat!:` sobe a major.
2. A action mantém um PR aberto com a próxima versão e o changelog.
3. Quando esse PR é mergeado, a release é publicada e o jogo compilado é anexado a ela.

## Contribuindo

Ideias, bugs e pull requests são bem-vindos. Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para preparar o ambiente e saber onde mexer em cada coisa.

## Licença

[MIT](LICENSE).

<div align="center">
  <br>
  <sub>Não olhe para o pixel.</sub>
</div>
