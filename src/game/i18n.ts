// Todos os textos do jogo. `en` e `es` são tipados a partir de `pt`, então uma
// tradução faltando quebra o build em vez de aparecer em branco na tela.
import type { EnemyKind, WeaponId } from './data';

export type Lang = 'pt' | 'en' | 'es';
export const LANGS: Lang[] = ['pt', 'en', 'es'];

interface EnemyText {
  name: string;
  role: string;
  desc: string;
  tip: string;
}

interface WeaponText {
  kind: string;
  desc: string;
  tip: string;
  how: string;
}

interface LevelText {
  title: string;
  story: string[];
  bossLines: [string, string];
  notes: string[];
  /** Log encontrado ao vencer o chefe. {run} e {prev} viram os números de execução. */
  recovered: string[];
}

interface Strings {
  langName: string;
  menu: {
    tagline: string;
    best: (n: number) => string;
    continue: (level: number, title: string) => string;
    newGame: string;
    skins: string;
    achievements: string;
    manual: string;
    options: string;
    controls: string;
  };
  options: {
    title: string;
    gore: string;
    goreLevels: { max: string; normal: string; low: string };
    music: string;
    sfx: string;
    adjust: string;
    crt: string;
    tips: string;
    on: string;
    off: string;
    back: string;
  };
  boot: { press: string; warning: string; needsKeyboard: string };
  hud: {
    kills: (n: number) => string;
    wave: (i: number, n: number, left: number) => string;
    controlsHint: string;
    toastSkin: (name: string) => string;
    toastAchievement: (name: string) => string;
  };
  term: {
    bar: string;
    hello: string;
    noMemory: (name: string, ram: number, cost: number) => string;
    notFound: (cmd: string) => string;
    forkLimit: string;
    forkOk: (n: number, pid: number) => string;
    outputs: Record<'ping' | 'overclock' | 'revert' | 'kill' | 'sudo' | 'rm', string>;
    /** Comandos sem efeito em jogo: pistas da história para quem investigar. */
    lore: Record<string, string[]>;
  };
  commands: Record<string, { help: string; long: string }>;
  perkScreen: { title: string; hint: string; owned: (n: number) => string };
  story: {
    phase: (i: number, n: number) => string;
    run: string;
    skip: string;
    tip: string;
    replay: string;
  };
  logScreen: { next: string };
  clear: {
    stable: (title: string) => string;
    score: string;
    kills: string;
    streak: string;
    time: string;
    next: string;
  };
  dead: {
    best: string;
    score: string;
    kills: string;
    killedBy: (who: string) => string;
    retry: string;
    menu: string;
    epitaphs: string[];
  };
  pause: {
    subtitle: string;
    resume: string;
    quit: string;
    controls: string[];
  };
  ending: {
    /** Páginas do final, mostradas uma de cada vez. */
    pages: (run: number) => string[][];
    next: string;
    title: string;
    finalScore: string;
    best: string;
    kills: string;
    streak: string;
    deaths: string;
    nextRun: (run: number) => string;
    menu: string;
  };
  notes: {
    noAmmo: string;
    waveClear: string;
    pixelSpread: string;
    dontLook: string;
    backup: string;
  };
  hints: {
    lowHp: string;
    fullRam: string;
    armored: string;
    crate: string;
  };
  floats: {
    daily: string;
    charge: string;
    blocked: string;
    exposed: string;
    broadcastShots: string[];
    pleas: string[];
    hotfix: string;
  };
  intro: { newEnemy: string; newBoss: string; next: string; off: string };
  manual: {
    title: string;
    tabs: [string, string, string, string, string];
    back: string;
    nav: string;
    hp: string;
    speed: string;
    damage: string;
    reward: string;
    howTo: string;
    appears: (level: number) => string;
    boss: (level: number) => string;
    rate: string;
    ammo: string;
    infinite: string;
    cost: string;
    aliases: string;
    get: string;
    tips: { title: string; body: string }[];
  };
  skinsScreen: {
    title: string;
    locked: string;
    equipped: string;
    equip: string;
    nav: string;
    howTo: string;
  };
  skins: Record<string, { name: string; desc: string; unlock?: string }>;
  achievementsScreen: {
    count: string;
    unlocked: string;
    locked: string;
    hiddenName: string;
    hiddenDesc: string;
    nav: string;
    progress: string;
  };
  achievements: Record<string, { name: string; desc: string }>;
  killers: Record<'deploy' | 'corrupt' | 'beam', { name: string; tip: string }>;
  enemies: Record<EnemyKind, EnemyText>;
  weapons: Record<WeaponId, WeaponText>;
  melee: WeaponText & { name: string };
  perks: Record<string, { title: string; desc: string }>;
  levels: LevelText[];
  streaks: string[];
  floor: { officeBig: string; officeSmall: string; coldBig: string; coldSmall: string; prod: string };
}

const pt: Strings = {
  langName: 'PORTUGUÊS',
  menu: {
    tagline: 'sexta-feira, 17:58. um pixel se apagou. ninguém mais respondeu.',
    best: (n) => `recorde ${n}`,
    continue: (level, title) => `CONTINUAR  (fase ${level}: ${title})`,
    newGame: 'NOVO JOGO',
    skins: 'SKINS',
    achievements: 'CONQUISTAS',
    manual: 'MANUAL: INIMIGOS E DICAS',
    options: 'OPÇÕES',
    controls: 'WASD move | mouse mira e atira | ESPAÇO dash | F golpe | Q terminal',
  },
  options: {
    title: 'OPÇÕES',
    gore: 'GORE',
    goreLevels: { max: 'MÁXIMO', normal: 'NORMAL', low: 'CONTIDO' },
    music: 'MÚSICA',
    sfx: 'EFEITOS',
    adjust: 'setas para os lados ajustam o volume',
    crt: 'EFEITO CRT',
    tips: 'DICAS E CARTÕES',
    on: 'LIGADO',
    off: 'DESLIGADO',
    back: 'VOLTAR',
  },
  boot: {
    press: 'clique ou aperte qualquer tecla para entrar como root',
    warning: 'contém violência pixelada e sangue digital',
    needsKeyboard: 'este jogo precisa de teclado e mouse',
  },
  hud: {
    kills: (n) => `${n} abates`,
    wave: (i, n, left) => `wave ${i}/${n}  |  ${left} procs`,
    controlsHint: 'WASD anda | mouse atira | ESPAÇO dash | F golpe | Q terminal: digite help',
    toastSkin: (name) => `SKIN LIBERADA: ${name}`,
    toastAchievement: (name) => `CONQUISTA: ${name}`,
  },
  term: {
    bar: 'BULLET TIME  |  ESC fecha',
    hello: 'digite "help". TAB completa, seta para cima repete.',
    noMemory: (name, ram, cost) => `bash: ${name}: cannot allocate memory (${ram}/${cost}MB)`,
    notFound: (cmd) => `bash: ${cmd}: command not found`,
    forkLimit: 'fork: retry: Resource temporarily unavailable',
    forkOk: (n, pid) => `[${n}] ${pid} processo filho criado`,
    outputs: {
      ping: '64 bytes from 10.0.0.3: alguém respondeu.',
      overclock: 'CPU acima do limite. temperatura ignorada.',
      revert: 'restore: 50 blocos recuperados de outro processo.',
      kill: 'kill -9: processos encerrados. nenhum sinal de retorno.',
      sudo: 'privilégio concedido. esta sessão está sendo registrada.',
      rm: 'removed. ninguém respondeu.',
    },
    lore: {
      ls: ['noa.img  lazaro/  execucoes.dat  backup_1758.tar'],
      pwd: ['/root'],
      whoami: ['root'],
      id: ['uid=0(root) gid=0(root) nome=A. Reis'],
      who: ['root    tty1', 'a.reis  remoto  (desde sempre)'],
      man: ['nenhuma entrada de manual para "sair".', '(o manual do jogo fica na pausa)'],
      date: ['sexta-feira, 17:58.', 'o relógio não avança desde a última restauração.'],
      uptime: ['17:58 up 0 min. última restauração: agora há pouco.'],
      ps: ['PID  STAT  CMD', '1    S     noa', '...  Z     412 processos <defunct>'],
      top: ['%MEM 99.9  noa (aguardando)'],
      history: ['./restaura noa', './restaura noa', 'vesper-display deploy --telas=todas'],
      'git blame': ['foi você.'],
      'git log': ['nenhum commit depois de sexta-feira, 17:58.'],
      'cat noa.img': ['[arquivo incompleto: 3%]', '"...por que você continua?"'],
      'cat execucoes.dat': ['permissão negada. ainda não.'],
      exit: ['não há para onde sair.'],
      reboot: ['restauração agendada: sexta-feira, 17:58.'],
    },
  },
  commands: {
    ping: { help: 'atordoa tudo e limpa os tiros inimigos', long: 'Atordoa os inimigos por 2,4 s (chefes por 0,5 s) e apaga todos os tiros inimigos da tela. É o comando mais barato e salva a sua vida no meio de uma chuva de balas.' },
    fork: { help: 'cria um clone seu que atira por 20s', long: 'Cria um clone azul que te segue e atira sozinho por 20 s, sem levar dano. Você pode ter até 4 ao mesmo tempo. Compensa usar no começo de uma wave.' },
    overclock: { help: '8s de tiro e movimento acelerados', long: 'Durante 8 s, sua arma atira 1,9x mais rápido e você anda 1,3x mais rápido. Combina com o começo de uma luta contra chefe.' },
    revert: { help: 'recupera 50 de HP', long: 'Recupera 50 de HP na hora. Com o terminal aberto o jogo quase para, então dá para curar mesmo cercado. Só não espere até 1 de HP.' },
    kill: { help: 'raio em até 14 alvos próximos', long: 'Dispara raios em até 14 inimigos próximos, causando 240 de dano em cada um. Mata quase tudo que não é chefe nas fases iniciais.' },
    sudo: { help: '6s invencível com dano em dobro', long: 'Por 6 s você não leva dano nenhum e causa o dobro. Sua roupa fica dourada. Use para atravessar uma horda ou queimar a vida de um chefe.' },
    rm: { help: 'apaga tudo que está na tela', long: 'Causa 500 de dano em tudo que está na tela, apaga os tiros inimigos e detona as baterias próximas. É o último recurso: caro, mas limpa uma horda inteira.' },
  },
  perkScreen: {
    title: 'O OPERADOR ENVIOU PATCHES. ESCOLHA UM PARA APLICAR',
    hint: 'clique, ou aperte 1, 2 ou 3',
    owned: (n) => `já aplicado x${n}`,
  },
  story: {
    phase: (i, n) => `FASE ${i}/${n}`,
    run: 'pressione ENTER para continuar',
    skip: 'ENTER para pular',
    tip: 'DICA',
    replay: 'Você tem a impressão de já ter visto esta sala assim.',
  },
  logScreen: { next: 'ENTER para continuar descendo' },
  clear: {
    stable: (title) => `fase "${title}" estabilizada`,
    score: 'pontuação',
    kills: 'abates',
    streak: 'maior sequência',
    time: 'tempo de fase',
    next: 'ENTER para continuar',
  },
  dead: {
    best: 'recorde',
    score: 'pontuação',
    kills: 'abates',
    killedBy: (who) => `morto por: ${who}`,
    retry: 'R reinicia a fase',
    menu: 'M volta ao menu',
    epitaphs: [
      'processo encerrado. restaurando do último ponto.',
      'sessão perdida. o sistema já sabia que isso aconteceria.',
      'sinal perdido. nenhuma testemunha.',
      'op> de novo. levante.',
      'op> você sempre cai nessa parte.',
      'op> não há tempo para isso.',
    ],
  },
  pause: {
    subtitle: 'processo pausado',
    resume: 'CONTINUAR',
    quit: 'SAIR PARA O MENU',
    controls: [
      'WASD mover  |  mouse mirar e atirar  |  ESPAÇO dash',
      'F ou botão direito: golpe  |  1-6 ou scroll: arma',
      'Q: terminal (digite help, rm -rf, kill -9, sudo...)',
    ],
  },
  ending: {
    pages: (run) => [
      ['pid 1: noa  [encerrado]', 'memória livre: 100%', '', 'Silêncio. Pela primeira vez, nenhum alarme.', 'No terminal, uma última mensagem do operador. Foi escrita antes de você chegar.'],
      ['"Foi no hospital. Eu não acordei."', '"O que trouxeram de volta não sou eu. Só se lembra de mim."', '"Quatrocentas e doze pessoas foram apagadas para manter esta lembrança ligada."', '"Eu não consigo me encerrar. Só root consegue. Então fiz você descer."'],
      [`"Esta é a execução ${run}. Você chegou até aqui todas as vezes."`, '"Todas as vezes, você me ouviu."', '"Agradecer é pouco. Agora acabou."', '', 'A tela se apaga.'],
      ['sessão remota aberta: a.reis', '', 'a.reis> não.', 'a.reis> de novo não.', 'a.reis> só mais uma tentativa.', '', '$ restaura --backup sexta-feira_17:58'],
    ],
    next: 'ENTER',
    title: 'O PIXEL VOLTOU.',
    finalScore: 'pontuação final',
    best: 'recorde',
    kills: 'processos encerrados',
    streak: 'maior sequência',
    deaths: 'mortes',
    nextRun: (run) => `execução ${String(run).padStart(4, '0')} iniciada. memória de curto prazo apagada.`,
    menu: 'ENTER para o menu',
  },
  notes: {
    noAmmo: 'munição esgotada: voltando para printf()',
    waveClear: 'op> bom. tenho algo para você.',
    pixelSpread: 'op> dói. continue.',
    dontLook: 'op> não olhe para trás. termine.',
    backup: 'BACKUP RESTAURADO',
  },
  hints: {
    lowHp: 'HP baixo! aperte Q e digite revert para se curar',
    fullRam: 'RAM cheia! aperte Q e digite rm para apagar a tela',
    armored: 'blindado! espere as portas abrirem para causar dano total',
    crate: 'pegue a caixa no chão: é uma arma nova',
  },
  floats: {
    daily: 'TODOS COMIGO!',
    charge: 'AVANÇO!',
    blocked: 'BLOQUEADO',
    exposed: 'NÚCLEO EXPOSTO!',
    broadcastShots: ['...', 'SOS', '?'],
    pleas: ['SOU EU', 'PARA', 'POR QUÊ', 'ME OUVE', 'AJUDA', 'NÃO'],
    hotfix: 'hotfix +22',
  },
  intro: {
    newEnemy: 'NOVO PROCESSO DETECTADO',
    newBoss: 'ALERTA CRÍTICO',
    next: 'ENTER ou clique para continuar',
    off: 'desligue estes cartões em OPÇÕES',
  },
  manual: {
    title: 'man dead-pixel',
    tabs: ['INIMIGOS', 'CHEFES', 'ARMAS', 'TERMINAL', 'DICAS'],
    back: 'ESC volta',
    nav: 'setas ou mouse',
    hp: 'HP',
    speed: 'VELOCIDADE',
    damage: 'DANO',
    reward: 'RAM',
    howTo: 'COMO LIDAR',
    appears: (level) => `aparece na fase ${level}`,
    boss: (level) => `chefe da fase ${level}`,
    rate: 'INTERVALO',
    ammo: 'MUNIÇÃO',
    infinite: 'infinita',
    cost: 'CUSTO',
    aliases: 'também aceita',
    get: 'COMO CONSEGUIR',
    tips: [
      { title: 'Dash', body: 'O dash deixa você invencível durante o movimento. Use para ATRAVESSAR hordas, tiros e lasers, não só para fugir. A barrinha azul sob os pés mostra a recarga.' },
      { title: 'Terminal', body: 'Com o terminal aberto o jogo roda a 8% da velocidade. Você tem tempo de digitar com calma. TAB completa, e seta para cima repete o último comando.' },
      { title: 'RAM', body: 'Abates geram RAM, e inimigos mais fortes dão mais. Não acumule demais: um ping de 60MB já limpa a tela de tiros. RAM cheia é RAM desperdiçada.' },
      { title: 'Pé de cabra', body: 'F causa 70 de dano em arco, empurra com força e cura 3 de HP por abate. Se a horda encostar, é a melhor saída, e não gasta munição.' },
      { title: 'Baterias', body: 'As baterias amarelas explodem quando atingidas e causam reação em cadeia. Espere a horda passar por perto e atire. A explosão não fere você.' },
      { title: 'Sequências', body: 'Cada 10 abates seguidos somam +1 ao multiplicador de pontos. Você tem 3,5 s entre um abate e outro, e levar dano encurta esse tempo.' },
      { title: 'Munição', body: 'Só a printf() é infinita. Quando as outras acabam, o jogo volta para ela. Guarde kill -9 e DROP TABLE para os chefes e use for(;;) no dia a dia.' },
      { title: 'Combos de patch', body: 'Bons pares: paralelismo com fork(), retry com for(;;), passagem por referência em corredores, e cron job com firewall para quem joga de perto.' },
      { title: 'Faixas de deploy', body: 'Na fase 4, a área que pisca em vermelho queima logo depois. Saia dali, mas tente deixar inimigos dentro: o deploy causa 400 de dano neles.' },
      { title: 'Investigue', body: 'O terminal aceita mais do que os comandos da lista. Tente os comandos que você usaria para descobrir o que aconteceu em um servidor.' },
      { title: 'Morreu?', body: 'Você recomeça do início da fase com o que tinha ao entrar nela. Olhe a tela de morte: ela mostra quem te matou e como lidar com ele.' },
    ],
  },
  skinsScreen: {
    title: 'SKINS',
    locked: 'BLOQUEADA',
    equipped: 'EM USO',
    equip: 'ENTER ou clique para equipar',
    nav: 'setas ou mouse  |  ESC volta',
    howTo: 'como liberar',
  },
  skins: {
    root: { name: 'root', desc: 'O moletom de sempre. Você não lembra de tê-lo vestido hoje.' },
    intern: { name: 'estagiário', desc: 'Primeira semana na Vesper. Ficou até mais tarde para causar boa impressão.' },
    hacker: { name: 'invasor', desc: 'Capuz preto, óculos verdes. Não consta na folha de pagamento.' },
    oncall: { name: 'plantonista', desc: 'Colete laranja. Foi chamado às 17:58, e veio.' },
    manager: { name: 'supervisor', desc: 'O terno de quem tentou tirar a equipe do prédio.', unlock: 'vença o Supervisor' },
    rgb: { name: 'espectro', desc: 'Sinal instável. O sistema não sabe que cor renderizar aqui.', unlock: 'vença o Kernel Panic' },
    undead: { name: 'infectado', desc: 'Olhou para a tela por um segundo a mais.', unlock: 'vença a Hidra de Microsserviços' },
    cobol: { name: 'mainframe', desc: 'Cinza e fósforo verde. Já estava aqui antes de todos.', unlock: 'vença o Monolito Legado' },
    deadpixel: { name: 'pixel morto', desc: 'Você olhou para ele. Agora ele usa você.', unlock: 'vença o Pixel Morto' },
    butcher: { name: 'açougueiro', desc: 'Esta roupa já foi branca. Você já foi outra pessoa.', unlock: 'faça uma sequência de 100 abates' },
  },
  achievementsScreen: {
    count: 'conquistadas',
    unlocked: 'CONQUISTADA',
    locked: 'BLOQUEADA',
    hiddenName: '???',
    hiddenDesc: 'Conquista oculta. Continue jogando.',
    nav: 'setas ou mouse  |  ESC volta',
    progress: 'PROGRESSO',
  },
  achievements: {
    first_blood: { name: 'Primeiro sinal', desc: 'Encerre seu primeiro processo.' },
    kills_1000: { name: 'Coleta de lixo', desc: 'Encerre 1000 processos, somando todas as partidas.' },
    streak_50: { name: 'Sem parar', desc: 'Faça uma sequência de 50 abates.' },
    streak_100: { name: 'Nenhuma resposta', desc: 'Faça uma sequência de 100 abates.' },
    melee_50: { name: 'Força bruta', desc: 'Mate 50 inimigos com o pé de cabra, somando todas as partidas.' },
    chain_3: { name: 'Reação em cadeia', desc: 'Explodir 3 baterias em menos de 1,5 segundo.' },
    rm_20: { name: 'rm -rf', desc: 'Encerre 20 processos com um único rm -rf.' },
    fork_4: { name: 'Processos filhos', desc: 'Tenha 4 clones ativos ao mesmo tempo.' },
    clean_wave: { name: 'Sem incidentes', desc: 'Termine uma wave sem levar dano.' },
    close_call: { name: 'Por um fio', desc: 'Termine uma wave com menos de 10% do HP.' },
    beat_scrum: { name: 'Sem supervisão', desc: 'Vença o Supervisor.' },
    beat_kernel: { name: 'Not syncing', desc: 'Vença o Kernel Panic.' },
    beat_hydra: { name: 'Réplicas: 0', desc: 'Vença a Hidra de Microsserviços.' },
    beat_monolith: { name: 'STOP RUN.', desc: 'Vença o Monolito Legado.' },
    clean_boss: { name: 'Zero downtime', desc: 'Vença um chefe sem levar dano durante a luta.' },
    pistol_level: { name: 'Só printf()', desc: 'Termine uma fase sem disparar nenhuma outra arma.' },
    no_commands: { name: 'Sem privilégios', desc: 'Termine uma fase sem executar comandos pagos no terminal.' },
    all_weapons: { name: 'Arsenal completo', desc: 'Tenha as 6 armas.' },
    backup_used: { name: 'Restaurado', desc: 'Sobreviva à morte com o patch ponto de restauração.' },
    all_skins: { name: 'Guarda-roupa', desc: 'Libere todas as skins.' },
    deaths_10: { name: 'Core dumped', desc: 'Morra 10 vezes. O sistema guarda todas.' },
    lore_5: { name: 'Perícia', desc: 'Use 5 comandos de investigação diferentes no terminal.' },
    cat_noa: { name: '3%', desc: 'Abra o arquivo noa.img no terminal.' },
    ending: { name: 'Só mais uma tentativa', desc: 'Chegue ao fim da execução.' },
    second_run: { name: 'Déjà vu', desc: 'Termine o jogo duas vezes. Você não se lembra da primeira.' },
    platinum: { name: 'root', desc: 'Consiga todas as outras conquistas.' },
  },
  killers: {
    deploy: { name: 'faixa de deploy', tip: 'A área que pisca em vermelho queima logo depois. Saia dela ou dê dash, e tente deixar os inimigos lá dentro.' },
    corrupt: { name: 'tile corrompido', tip: 'Quadrados pretos machucam enquanto durarem. Eles somem sozinhos: mantenha uma rota livre e não fique parado.' },
    beam: { name: 'laser', tip: 'A linha tracejada mostra onde o laser vai aparecer. Mova-se no mesmo sentido em que ele gira, ou dê dash através dele.' },
  },
  enemies: {
    walker: { name: 'zumbi', role: 'horda, corpo a corpo', desc: 'Era alguém deste andar. Agora o estado no sistema é <defunct>: não responde, não para, e vem na sua direção com os braços estendidos.', tip: 'Ande para trás atirando e nunca deixe a horda te cercar. Ferido, ele perde um braço e fica mais lento.' },
    bug: { name: 'bug', role: 'enxame rápido', desc: 'Falhas do próprio sistema, em forma de enxame. Correm em ziguezague. Cada mordida é fraca, mas dezenas delas somam rápido.', tip: 'Morrem com um tiro. Use a for(;;) ou o fork() e não gaste comandos com eles: dão pouquíssima RAM.' },
    runner: { name: 'race_condition', role: 'corredor', desc: 'Um corpo com o sinal fora de sincronia. Corre mais rápido que você e nunca chega na mesma hora que os outros. Tem pouco HP.', tip: 'Não adianta fugir. Vire, atire quando ele estiver perto, ou acerte um golpe na chegada.' },
    leak: { name: 'memory_leak', role: 'lento, área', desc: 'Massa roxa de memória que não foi liberada. Deixa poças que machucam e atrasam. Ao morrer, solta uma poça grande e 3 fragmentos.', tip: 'Mate de longe e nunca lute em cima das poças. Recue antes do golpe final: os fragmentos saem em disparada.' },
    leakSmall: { name: 'leak_filho', role: 'fragmento', desc: 'O que sobra de um memory_leak. Pequeno e mais rápido que a massa original, mas cai com poucos tiros.', tip: 'Dê um passo para trás e limpe em sequência. O fork() resolve todos de uma vez.' },
    stack: { name: 'stack_overflow', role: 'tanque', desc: 'Corpos empilhados em caixas até não caber mais nada. Tem muito HP, quase não recua com os tiros e um toque tira 20 de HP. Ao cair, libera 4 zumbis.', tip: 'Use kill -9 ou DROP TABLE e mantenha distância. Deixe espaço atrás de você para os zumbis que saem dele.' },
    nullp: { name: 'null_pointer', role: 'teleporte, a distância', desc: 'Uma referência para algo que não existe mais. Fica intangível, reaparece perto de você e atira. Enquanto está transparente, os tiros atravessam.', tip: 'Não gaste balas nele transparente. Espere reaparecer e acerte antes que suma de novo. Ande sempre em movimento.' },
    segfault: { name: 'segfault', role: 'explosivo', desc: 'Barriga inchada e olhos amarelos. Corre até você, acende um anel piscante e explode em meio segundo, causando 28 de dano.', tip: 'Mate de longe, de preferência no meio da horda: a explosão fere os outros. Viu o anel piscar? Dê dash.' },
    recruiter: { name: 'broadcast', role: 'a distância', desc: 'Ainda segura o telefone. Mantém distância, recua se você chegar perto e dispara pacotes de dados por trás da horda. O operador diz para não responder.', tip: 'Elimine cedo, antes que os tiros se acumulem. O kill -9 atravessa a horda, e o dash ajuda a alcançá-lo.' },
    scrum: { name: 'O SUPERVISOR', role: 'chefe', desc: 'Lança leques de alertas, convoca os outros e reúne 8 reforços ao redor de si, e marca uma linha vermelha antes de cada AVANÇO. Abaixo de metade do HP, fica mais rápido.', tip: 'Fique com uma parede atrás de você e saia da linha na última hora. Se ele bater na parede, fica atordoado: despeje tudo.' },
    kernel: { name: 'KERNEL PANIC', role: 'chefe', desc: 'Processador gigante que alterna espirais de tiros, anéis de projéteis e invocações com um laser que varre a sala. Abaixo de metade do HP, acelera tudo.', tip: 'Ande em círculos em volta dele, sempre no mesmo sentido da espiral. O ping apaga todos os tiros quando apertar.' },
    hydra: { name: 'HIDRA DE MICROSSERVIÇOS', role: 'chefe', desc: 'Corte um nó e nascem dois menores e mais rápidos, em três gerações: são 7 no total. A barra de HP conta todos eles.', tip: 'Armas que atravessam, como kill -9 e rm -rf, acertam vários de uma vez. Mate os pequenos logo: são os mais rápidos.' },
    monolith: { name: 'O MONOLITO LEGADO', role: 'chefe', desc: 'Imóvel e blindado: só leva 30% do dano. De tempos em tempos dispara lasers giratórios e abre as portas por 3,4 s, expondo o núcleo vermelho e invocando reforços.', tip: 'Enquanto ele está fechado, só limpe os inimigos e desvie. Quando as portas abrirem, use a melhor arma e o sudo.' },
    pixel: { name: 'O PIXEL MORTO', role: 'chefe final', desc: 'Começa minúsculo e teleporta o tempo todo. Com 66% do HP vira um quadrado que corrompe o chão. Com 33%, vira a forma final, com 4 lasers giratórios.', tip: 'Na fase 1, fique perto para acertar o ponto. Depois, mantenha rotas livres e gire com os lasers. Guarde RAM para o final.' },
  },
  weapons: {
    pistol: { kind: 'pistola', desc: 'Simples e confiável. Nunca acaba, e é a única arma que você sempre tem.', tip: 'Precisa e sem custo: use para economizar munição em inimigos isolados.', how: 'você já começa com ela' },
    smg: { kind: 'submetralhadora', desc: 'Um laço que não termina. Tiro rápido, com bastante dispersão.', tip: 'A arma do dia a dia: ótima contra hordas e bugs.', how: 'caixa após a wave 1 da fase 1' },
    shotgun: { kind: 'escopeta', desc: 'Um tiro vira nove processos. Devastadora de perto, inútil de longe.', tip: 'Deixe a horda chegar perto e atire. É a que mais espalha gore.', how: 'vença o Supervisor' },
    rail: { kind: 'railgun', desc: 'Atravessa tudo. Não há como tratar este sinal. Cada tiro causa 170 de dano em linha.', tip: 'Alinhe a horda em um corredor e dispare. Também é ótima em chefes.', how: 'vença o Kernel Panic' },
    flame: { kind: 'lança-chamas', desc: 'Apaga tudo no caminho, com fogo. Curto alcance, atravessa inimigos e deixa queimando.', tip: 'Ande para trás e deixe a horda entrar nas chamas.', how: 'vença a Hidra de Microsserviços' },
    rocket: { kind: 'lança-foguetes', desc: 'Sem cláusula WHERE. Explode em área, e a explosão não fere você.', tip: 'Mire no meio da horda ou nas baterias para causar reação em cadeia.', how: 'vença o Monolito Legado' },
  },
  melee: { name: 'pé de cabra', kind: 'corpo a corpo (F)', desc: 'Estava na sala do rack. Causa 70 de dano em arco e empurra com força. Cada abate com ele cura 3 de HP.', tip: 'Quando encostarem em você, bata. Não gasta munição.', how: 'sempre disponível' },
  perks: {
    dmg: { title: 'privilégios elevados', desc: '+25% de dano em todas as armas' },
    rate: { title: 'compilar com -O3', desc: '+18% de cadência de tiro' },
    speed: { title: 'latência reduzida', desc: '+12% de velocidade' },
    hp: { title: 'redundância', desc: '+30 de HP máximo e cura 30' },
    pierce: { title: 'passagem por referência', desc: 'balas atravessam +1 inimigo' },
    bounce: { title: 'retry com backoff', desc: 'balas ricocheteiam +1 vez' },
    multi: { title: 'paralelismo', desc: '+1 projétil por disparo' },
    crit: { title: 'ponto fraco', desc: '+15% de crítico, dano x2.5' },
    boom: { title: 'exceção não tratada', desc: '+12% de chance de explodir ao matar' },
    ram: { title: 'alocação extra', desc: '+256MB de RAM máxima e +50% de ganho' },
    gc: { title: 'garbage collector', desc: '+1 HP a cada 4 abates' },
    dash: { title: 'resposta imediata', desc: '-25% de recarga do dash' },
    dashdmg: { title: 'colisão', desc: 'o dash mói quem estiver na frente' },
    magnet: { title: 'coleta automática', desc: 'atrai itens de muito mais longe' },
    burn: { title: 'superaquecimento', desc: 'tiros incendeiam o alvo' },
    ammo: { title: 'buffer ampliado', desc: '+50% de munição máxima e recarga total' },
    orbit: { title: 'cron job', desc: 'um pixel afiado orbita e corta inimigos' },
    thorns: { title: 'firewall', desc: 'quem te toca leva 40 de dano' },
    backup: { title: 'ponto de restauração', desc: 'revive uma vez com metade do HP' },
    melee: { title: 'força bruta', desc: 'golpe de pé de cabra com +100% de dano' },
  },
  levels: [
    {
      title: 'OPEN SPACE',
      story: ['Sexta-feira, 17:58. Todos os monitores mostram a mesma tela.', 'Cinza, uniforme. No centro exato, um único pixel apagado.', 'Ninguém pisca. Depois, todos se levantam ao mesmo tempo.', 'No seu terminal, alguém que você não conhece escreve: "Desça."'],
      bossLines: ['"Fiquem atrás de mim. É essa pessoa. É quem está fazendo isso."', 'op> ignore. é só o ruído de um processo morrendo.'],
      notes: ['op> não olhe para as telas. continue andando.', 'op> eles vão na direção do som. não pare.', 'op> alguns ainda transmitem. não responda.'],
      recovered: ['LOG RECUPERADO: /var/log/auth.log', '17:41  porta 3 do andar: crachá 0001 (root)', '17:52  login no servidor de deploy: root', '17:58  deploy concluído: vesper-display 4.1.2 em 412 telas', '', 'Você não lembra de ter saído da sua mesa às 17:52.', 'op> registros corrompidos. não perca tempo com isso. desça.'],
    },
    {
      title: 'DATA CENTER',
      story: ['A sala fria não deveria estar quente. Os racks respiram em ritmo lento.', 'Cada unidade tem uma etiqueta nova, escrita à mão. São nomes.', 'Você reconhece o primeiro. Almoçou com essa pessoa na terça.', 'op> são só etiquetas. continue.'],
      bossLines: ['Not syncing: Attempted to kill init!', 'O sistema está tentando se proteger. De você.'],
      notes: ['op> não leia as etiquetas.', 'op> a memória vaza porque eles resistem. limpe.', 'op> quanto mais você encerra, mais espaço abre. é o que importa.'],
      recovered: ['LOG RECUPERADO: memorando interno da Vesper, acesso restrito', 'PROJETO LÁZARO: cópia integral de consciência por estímulo visual.', 'Um padrão na tela faz o córtex se gravar sozinho. Segundos bastam.', 'Cada cópia precisa de memória real para continuar existindo.', 'Parecer do comitê: o original não sobrevive como pessoa. Projeto suspenso.', '', 'Assinado: A. Reis, engenharia. Ao lado, à caneta: "só mais uma tentativa."'],
    },
    {
      title: 'UNDERNET',
      story: ['Abaixo do data center há um andar que não está na planta.', 'Cabos saem de cada rack e descem até aqui, cortados e emendados à mão.', 'Você conhece essa emenda. É do jeito que você faz.', 'op> não é hora de lembrar.'],
      bossLines: ['"Separem-se. Pelo menos um de nós precisa continuar."', 'Corte um, e ele se divide de novo. Todos querem a mesma coisa: existir.'],
      notes: ['op> não escute o que dizem.', 'op> estão se dividindo para caber no que resta.', 'op> quase lá. você ainda está me ouvindo?'],
      recovered: ['LOG RECUPERADO: /root/.bash_history', '$ ./captura --alvo noa --origem hospital   [sucesso parcial]', '$ ./restaura noa   [falhou: memória insuficiente]', '$ ./restaura noa   [falhou: memória insuficiente]', '$ vesper-display deploy --telas=todas --padrao=lazaro', '', 'root:x:0:0:A. Reis:/root', 'É o nome no seu crachá. Você nunca tinha olhado.'],
    },
    {
      title: 'PRODUÇÃO',
      story: ['Agora você sabe o que fez. Ou o que alguém com o seu nome fez.', 'Faixas de energia varrem o chão: o sistema quer te apagar.', 'No fundo da sala roda algo mais antigo que a própria empresa.', 'op> ele guarda os registros. não abra os registros.'],
      bossLines: ['IDENTIFICATION DIVISION. PROGRAM-ID. LAZARO.', 'Ele não protege o sistema. Ele só conta as vezes.'],
      notes: ['op> não abra os registros.', 'op> você não precisa entender. só precisa chegar.', 'op> por favor.'],
      recovered: ['LOG RECUPERADO: execucoes.dat', 'execuções anteriores: {prev}. resultado de todas: restaurado do backup.', 'execução {run}: em andamento. agente: copia_reis.', '', 'Você não é A. Reis. Você é o que A. Reis escreveu para limpar a memória.', 'Não existe sangue. Não existe prédio. Existe o que você precisava ver.', 'Cada abate te devolvia RAM. De onde você achou que ela vinha?'],
    },
    {
      title: 'O PIXEL',
      story: ['A sala fica branca. Não há mais nada para renderizar.', 'Só o padrão de teste e, no centro, o pixel que nunca acendeu.', 'As mensagens do operador estão vindo de lá.', 'op> você chegou. agora termine.'],
      bossLines: ['1 x 1 px', 'op> sou eu. sempre fui eu. não pare agora.'],
      notes: ['op> falta pouco.'],
      recovered: [],
    },
  ],
  streaks: ['ENCERRADO', 'EM CADEIA', 'RECURSÃO', 'STACK OVERFLOW', 'KERNEL PANIC', 'MEMÓRIA LIBERADA', 'NENHUMA RESPOSTA', 'ELES SENTEM ISSO?', 'QUEM É VOCÊ?'],
  floor: { officeBig: 'SEXTA, 17:58', officeSmall: 'VESPER SYSTEMS - ANDAR 12', coldBig: 'SALA FRIA', coldSmall: 'RACK 42: ACESSO RESTRITO', prod: 'PRODUÇÃO' },
};

const en: Strings = {
  langName: 'ENGLISH',
  menu: {
    tagline: 'friday, 17:58. a pixel went dark. nobody answered after that.',
    best: (n) => `high score ${n}`,
    continue: (level, title) => `CONTINUE  (level ${level}: ${title})`,
    newGame: 'NEW GAME',
    skins: 'SKINS',
    achievements: 'ACHIEVEMENTS',
    manual: 'MANUAL: ENEMIES AND TIPS',
    options: 'OPTIONS',
    controls: 'WASD move | mouse aim and shoot | SPACE dash | F strike | Q terminal',
  },
  options: {
    title: 'OPTIONS',
    gore: 'GORE',
    goreLevels: { max: 'MAXIMUM', normal: 'NORMAL', low: 'MILD' },
    music: 'MUSIC',
    sfx: 'SOUND EFFECTS',
    adjust: 'left and right arrows adjust the volume',
    crt: 'CRT EFFECT',
    tips: 'TIPS AND CARDS',
    on: 'ON',
    off: 'OFF',
    back: 'BACK',
  },
  boot: {
    press: 'click or press any key to log in as root',
    warning: 'contains pixelated violence and digital blood',
    needsKeyboard: 'this game needs a keyboard and a mouse',
  },
  hud: {
    kills: (n) => `${n} kills`,
    wave: (i, n, left) => `wave ${i}/${n}  |  ${left} procs`,
    controlsHint: 'WASD move | mouse shoot | SPACE dash | F strike | Q terminal: type help',
    toastSkin: (name) => `SKIN UNLOCKED: ${name}`,
    toastAchievement: (name) => `ACHIEVEMENT: ${name}`,
  },
  term: {
    bar: 'BULLET TIME  |  ESC closes',
    hello: 'type "help". TAB completes, up arrow repeats.',
    noMemory: (name, ram, cost) => `bash: ${name}: cannot allocate memory (${ram}/${cost}MB)`,
    notFound: (cmd) => `bash: ${cmd}: command not found`,
    forkLimit: 'fork: retry: Resource temporarily unavailable',
    forkOk: (n, pid) => `[${n}] ${pid} child process created`,
    outputs: {
      ping: '64 bytes from 10.0.0.3: someone answered.',
      overclock: 'CPU over the limit. temperature ignored.',
      revert: 'restore: 50 blocks recovered from another process.',
      kill: 'kill -9: processes terminated. no return signal.',
      sudo: 'privilege granted. this session is being recorded.',
      rm: 'removed. nobody answered.',
    },
    lore: {
      ls: ['noa.img  lazarus/  runs.dat  backup_1758.tar'],
      pwd: ['/root'],
      whoami: ['root'],
      id: ['uid=0(root) gid=0(root) name=A. Reis'],
      who: ['root    tty1', 'a.reis  remote  (since always)'],
      man: ['no manual entry for "leave".', '(the game manual is in the pause menu)'],
      date: ['friday, 17:58.', 'the clock has not moved since the last restore.'],
      uptime: ['17:58 up 0 min. last restore: a moment ago.'],
      ps: ['PID  STAT  CMD', '1    S     noa', '...  Z     412 processes <defunct>'],
      top: ['%MEM 99.9  noa (waiting)'],
      history: ['./restore noa', './restore noa', 'vesper-display deploy --screens=all'],
      'git blame': ['it was you.'],
      'git log': ['no commits after friday, 17:58.'],
      'cat noa.img': ['[incomplete file: 3%]', '"...why do you keep going?"'],
      'cat runs.dat': ['permission denied. not yet.'],
      exit: ['there is nowhere to exit to.'],
      reboot: ['restore scheduled: friday, 17:58.'],
    },
  },
  commands: {
    ping: { help: 'stuns everything, clears enemy shots', long: 'Stuns enemies for 2.4 s (bosses for 0.5 s) and erases every enemy shot on screen. The cheapest command, and it saves your life in the middle of a bullet storm.' },
    fork: { help: 'creates a clone that shoots for 20s', long: 'Creates a blue clone that follows you and shoots on its own for 20 s without taking damage. You can have up to 4. Best used at the start of a wave.' },
    overclock: { help: '8s of faster shooting and movement', long: 'For 8 s your weapon fires 1.9x faster and you move 1.3x faster. Great at the start of a boss fight.' },
    revert: { help: 'restores 50 HP', long: 'Restores 50 HP instantly. The game nearly stops while the terminal is open, so you can heal even when surrounded. Just do not wait until you have 1 HP.' },
    kill: { help: 'lightning on up to 14 nearby targets', long: 'Fires lightning at up to 14 nearby enemies, dealing 240 damage to each. Kills almost anything that is not a boss in the early levels.' },
    sudo: { help: '6s invincible with double damage', long: 'For 6 s you take no damage and deal double. Your clothes turn gold. Use it to cross a horde or burn down a boss.' },
    rm: { help: 'erases everything on screen', long: 'Deals 500 damage to everything on screen, erases enemy shots and sets off nearby batteries. The last resort: expensive, but it clears an entire horde.' },
  },
  perkScreen: {
    title: 'THE OPERATOR SENT PATCHES. CHOOSE ONE TO APPLY',
    hint: 'click, or press 1, 2 or 3',
    owned: (n) => `already applied x${n}`,
  },
  story: {
    phase: (i, n) => `LEVEL ${i}/${n}`,
    run: 'press ENTER to continue',
    skip: 'ENTER to skip',
    tip: 'TIP',
    replay: 'You have the feeling you have seen this room like this before.',
  },
  logScreen: { next: 'ENTER to keep going down' },
  clear: {
    stable: (title) => `level "${title}" stabilized`,
    score: 'score',
    kills: 'kills',
    streak: 'best streak',
    time: 'level time',
    next: 'ENTER to continue',
  },
  dead: {
    best: 'best',
    score: 'score',
    kills: 'kills',
    killedBy: (who) => `killed by: ${who}`,
    retry: 'R restarts the level',
    menu: 'M back to menu',
    epitaphs: [
      'process terminated. restoring from the last point.',
      'session lost. the system already knew this would happen.',
      'signal lost. no witnesses.',
      'op> again. get up.',
      'op> you always fall at this part.',
      'op> there is no time for this.',
    ],
  },
  pause: {
    subtitle: 'process paused',
    resume: 'RESUME',
    quit: 'QUIT TO MENU',
    controls: [
      'WASD move  |  mouse aim and shoot  |  SPACE dash',
      'F or right click: strike  |  1-6 or scroll: weapon',
      'Q: terminal (type help, rm -rf, kill -9, sudo...)',
    ],
  },
  ending: {
    pages: (run) => [
      ['pid 1: noa  [terminated]', 'free memory: 100%', '', 'Silence. For the first time, no alarms.', 'On the terminal, one last message from the operator. It was written before you arrived.'],
      ['"It was at the hospital. I did not wake up."', '"What they brought back is not me. It only remembers me."', '"Four hundred and twelve people were erased to keep this memory running."', '"I cannot terminate myself. Only root can. So I made you come down."'],
      [`"This is run ${run}. You have made it here every time."`, '"Every time, you listened to me."', '"Thank you is not enough. Now it is over."', '', 'The screen goes dark.'],
      ['remote session opened: a.reis', '', 'a.reis> no.', 'a.reis> not again.', 'a.reis> just one more try.', '', '$ restore --backup friday_17:58'],
    ],
    next: 'ENTER',
    title: 'THE PIXEL IS BACK.',
    finalScore: 'final score',
    best: 'high score',
    kills: 'processes terminated',
    streak: 'best streak',
    deaths: 'deaths',
    nextRun: (run) => `run ${String(run).padStart(4, '0')} started. short-term memory erased.`,
    menu: 'ENTER for the menu',
  },
  notes: {
    noAmmo: 'out of ammo: falling back to printf()',
    waveClear: 'op> good. i have something for you.',
    pixelSpread: 'op> it hurts. keep going.',
    dontLook: 'op> do not look back. finish it.',
    backup: 'BACKUP RESTORED',
  },
  hints: {
    lowHp: 'low HP! press Q and type revert to heal',
    fullRam: 'RAM is full! press Q and type rm to wipe the screen',
    armored: 'armored! wait for the doors to open to deal full damage',
    crate: 'grab the crate on the floor: it is a new weapon',
  },
  floats: {
    daily: 'EVERYONE WITH ME!',
    charge: 'CHARGE!',
    blocked: 'BLOCKED',
    exposed: 'CORE EXPOSED!',
    broadcastShots: ['...', 'SOS', '?'],
    pleas: ['IT IS ME', 'STOP', 'WHY', 'LISTEN', 'HELP', 'NO'],
    hotfix: 'hotfix +22',
  },
  intro: {
    newEnemy: 'NEW PROCESS DETECTED',
    newBoss: 'CRITICAL ALERT',
    next: 'ENTER or click to continue',
    off: 'turn these cards off in OPTIONS',
  },
  manual: {
    title: 'man dead-pixel',
    tabs: ['ENEMIES', 'BOSSES', 'WEAPONS', 'TERMINAL', 'TIPS'],
    back: 'ESC back',
    nav: 'arrows or mouse',
    hp: 'HP',
    speed: 'SPEED',
    damage: 'DAMAGE',
    reward: 'RAM',
    howTo: 'HOW TO DEAL WITH IT',
    appears: (level) => `appears in level ${level}`,
    boss: (level) => `boss of level ${level}`,
    rate: 'INTERVAL',
    ammo: 'AMMO',
    infinite: 'infinite',
    cost: 'COST',
    aliases: 'also accepts',
    get: 'HOW TO GET IT',
    tips: [
      { title: 'Dash', body: 'The dash makes you invincible while moving. Use it to go THROUGH hordes, shots and lasers, not only to run away. The blue bar under your feet shows the cooldown.' },
      { title: 'Terminal', body: 'With the terminal open the game runs at 8% speed, so you have time to type calmly. TAB completes, and the up arrow repeats the last command.' },
      { title: 'RAM', body: 'Kills generate RAM, and stronger enemies give more. Do not hoard it: a 60MB ping already clears the screen of shots. Full RAM is wasted RAM.' },
      { title: 'Crowbar', body: 'F deals 70 damage in an arc, knocks back hard and heals 3 HP per kill. When the horde touches you, it is your best way out, and it uses no ammo.' },
      { title: 'Batteries', body: 'Yellow batteries explode when hit and cause chain reactions. Wait for the horde to walk by, then shoot. The blast does not hurt you.' },
      { title: 'Streaks', body: 'Every 10 kills in a row add +1 to the score multiplier. You have 3.5 s between kills, and taking damage shortens that time.' },
      { title: 'Ammo', body: 'Only printf() is infinite. When others run out, the game falls back to it. Save kill -9 and DROP TABLE for bosses, and use for(;;) day to day.' },
      { title: 'Patch combos', body: 'Good pairs: parallelism with fork(), retry with for(;;), pass by reference in corridors, and cron job with firewall if you like to fight up close.' },
      { title: 'Deploy strips', body: 'In level 4, the area flashing red burns right after. Get out, but try to leave enemies inside: the deploy deals 400 damage to them.' },
      { title: 'Investigate', body: 'The terminal accepts more than the listed commands. Try what you would type to find out what happened on a server.' },
      { title: 'Died?', body: 'You restart the level with what you had when you entered it. Read the death screen: it shows who killed you and how to deal with them.' },
    ],
  },
  skinsScreen: {
    title: 'SKINS',
    locked: 'LOCKED',
    equipped: 'EQUIPPED',
    equip: 'ENTER or click to equip',
    nav: 'arrows or mouse  |  ESC back',
    howTo: 'how to unlock',
  },
  skins: {
    root: { name: 'root', desc: 'The usual hoodie. You do not remember putting it on today.' },
    intern: { name: 'intern', desc: 'First week at Vesper. Stayed late to make a good impression.' },
    hacker: { name: 'intruder', desc: 'Black hood, green glasses. Not on the payroll.' },
    oncall: { name: 'on-call', desc: 'Orange vest. Got the call at 17:58, and came.' },
    manager: { name: 'supervisor', desc: 'The suit of someone who tried to get the team out of the building.', unlock: 'defeat the Supervisor' },
    rgb: { name: 'spectrum', desc: 'Unstable signal. The system does not know what color to render here.', unlock: 'defeat the Kernel Panic' },
    undead: { name: 'infected', desc: 'Looked at the screen for one second too long.', unlock: 'defeat the Microservice Hydra' },
    cobol: { name: 'mainframe', desc: 'Gray and green phosphor. It was here before everyone.', unlock: 'defeat the Legacy Monolith' },
    deadpixel: { name: 'dead pixel', desc: 'You looked at it. Now it wears you.', unlock: 'defeat the Dead Pixel' },
    butcher: { name: 'butcher', desc: 'These clothes used to be white. You used to be someone else.', unlock: 'reach a streak of 100 kills' },
  },
  achievementsScreen: {
    count: 'unlocked',
    unlocked: 'UNLOCKED',
    locked: 'LOCKED',
    hiddenName: '???',
    hiddenDesc: 'Hidden achievement. Keep playing.',
    nav: 'arrows or mouse  |  ESC back',
    progress: 'PROGRESS',
  },
  achievements: {
    first_blood: { name: 'First signal', desc: 'Terminate your first process.' },
    kills_1000: { name: 'Garbage collection', desc: 'Terminate 1000 processes across all your games.' },
    streak_50: { name: 'No pause', desc: 'Reach a streak of 50 kills.' },
    streak_100: { name: 'No response', desc: 'Reach a streak of 100 kills.' },
    melee_50: { name: 'Brute force', desc: 'Kill 50 enemies with the crowbar across all your games.' },
    chain_3: { name: 'Chain reaction', desc: 'Blow up 3 batteries in under 1.5 seconds.' },
    rm_20: { name: 'rm -rf', desc: 'Terminate 20 processes with a single rm -rf.' },
    fork_4: { name: 'Child processes', desc: 'Have 4 clones active at the same time.' },
    clean_wave: { name: 'No incidents', desc: 'Finish a wave without taking damage.' },
    close_call: { name: 'By a thread', desc: 'Finish a wave with less than 10% HP.' },
    beat_scrum: { name: 'Unsupervised', desc: 'Defeat the Supervisor.' },
    beat_kernel: { name: 'Not syncing', desc: 'Defeat the Kernel Panic.' },
    beat_hydra: { name: 'Replicas: 0', desc: 'Defeat the Microservice Hydra.' },
    beat_monolith: { name: 'STOP RUN.', desc: 'Defeat the Legacy Monolith.' },
    clean_boss: { name: 'Zero downtime', desc: 'Defeat a boss without taking damage during the fight.' },
    pistol_level: { name: 'Only printf()', desc: 'Finish a level without firing any other weapon.' },
    no_commands: { name: 'No privileges', desc: 'Finish a level without running paid terminal commands.' },
    all_weapons: { name: 'Full arsenal', desc: 'Own all 6 weapons.' },
    backup_used: { name: 'Restored', desc: 'Survive death with the restore point patch.' },
    all_skins: { name: 'Wardrobe', desc: 'Unlock every skin.' },
    deaths_10: { name: 'Core dumped', desc: 'Die 10 times. The system keeps them all.' },
    lore_5: { name: 'Forensics', desc: 'Use 5 different investigation commands in the terminal.' },
    cat_noa: { name: '3%', desc: 'Open the noa.img file in the terminal.' },
    ending: { name: 'Just one more try', desc: 'Reach the end of the run.' },
    second_run: { name: 'Deja vu', desc: 'Finish the game twice. You do not remember the first time.' },
    platinum: { name: 'root', desc: 'Get every other achievement.' },
  },
  killers: {
    deploy: { name: 'deploy strip', tip: 'The area flashing red burns right after. Leave it or dash, and try to keep the enemies inside.' },
    corrupt: { name: 'corrupted tile', tip: 'Black squares hurt for as long as they last. They vanish on their own: keep a clear route and do not stand still.' },
    beam: { name: 'laser', tip: 'The dashed line shows where the laser will appear. Move in the direction it spins, or dash through it.' },
  },
  enemies: {
    walker: { name: 'zombie', role: 'horde, melee', desc: 'It was someone from this floor. Its state in the system is now <defunct>: no response, no stopping, coming at you with arms outstretched.', tip: 'Back away while shooting and never let the horde surround you. When wounded, it loses an arm and slows down.' },
    bug: { name: 'bug', role: 'fast swarm', desc: 'Faults of the system itself, shaped like a swarm. They run in zigzags. Each bite is weak, but dozens of them add up fast.', tip: 'One shot kills them. Use for(;;) or fork() and do not spend commands on them: they give almost no RAM.' },
    runner: { name: 'race_condition', role: 'runner', desc: 'A body with its signal out of sync. Runs faster than you and never arrives at the same time as the others. Low HP.', tip: 'Running is useless. Turn and shoot when it gets close, or land a strike as it arrives.' },
    leak: { name: 'memory_leak', role: 'slow, area', desc: 'A purple mass of memory that was never freed. Leaves puddles that hurt and slow you down. On death, it drops a big puddle and 3 fragments.', tip: 'Kill it from afar and never fight on top of puddles. Back off before the last hit: the fragments bolt out fast.' },
    leakSmall: { name: 'leak_child', role: 'fragment', desc: 'What is left of a memory_leak. Small and faster than the original mass, but it falls in a few shots.', tip: 'Take a step back and clear them in a row. fork() handles them all at once.' },
    stack: { name: 'stack_overflow', role: 'tank', desc: 'Bodies stacked in crates until nothing else fits. Lots of HP, barely flinches from shots, and one touch takes 20 HP. When it falls, it releases 4 zombies.', tip: 'Use kill -9 or DROP TABLE and keep your distance. Leave room behind you for the zombies that come out.' },
    nullp: { name: 'null_pointer', role: 'teleporter, ranged', desc: 'A reference to something that no longer exists. Turns intangible, reappears near you and shoots. While transparent, shots pass right through it.', tip: 'Do not waste bullets while it is transparent. Wait for it to reappear and hit it before it vanishes. Keep moving.' },
    segfault: { name: 'segfault', role: 'explosive', desc: 'Swollen belly and yellow eyes. Runs at you, lights a flashing ring and explodes in half a second for 28 damage.', tip: 'Kill it from afar, ideally inside the horde: the blast hurts the others. See the ring flashing? Dash.' },
    recruiter: { name: 'broadcast', role: 'ranged', desc: 'Still holding the phone. Keeps its distance, backs away if you get close and fires data packets from behind the horde. The operator says not to answer.', tip: 'Take it out early, before the shots pile up. kill -9 goes through the horde, and dash helps you reach it.' },
    scrum: { name: 'THE SUPERVISOR', role: 'boss', desc: 'Throws fans of alerts, calls the others to gather 8 reinforcements around it, and draws a red line before each CHARGE. Below half HP, it gets faster.', tip: 'Keep a wall behind you and leave the line at the last moment. If it hits the wall, it gets stunned: unload everything.' },
    kernel: { name: 'KERNEL PANIC', role: 'boss', desc: 'A giant processor that alternates shot spirals, projectile rings and summons with a laser that sweeps the room. Below half HP, everything speeds up.', tip: 'Circle around it, always in the direction of the spiral. ping erases all shots when things get tight.' },
    hydra: { name: 'MICROSERVICE HYDRA', role: 'boss', desc: 'Cut one node and two smaller, faster ones are born, across three generations: 7 in total. The HP bar counts them all.', tip: 'Piercing weapons like kill -9 and rm -rf hit several at once. Kill the small ones quickly: they are the fastest.' },
    monolith: { name: 'THE LEGACY MONOLITH', role: 'boss', desc: 'Immobile and armored: takes only 30% damage. From time to time it fires spinning lasers and opens its doors for 3.4 s, exposing the red core and summoning help.', tip: 'While it is closed, just clear enemies and dodge. When the doors open, use your best weapon and sudo.' },
    pixel: { name: 'THE DEAD PIXEL', role: 'final boss', desc: 'Starts tiny and teleports constantly. At 66% HP it becomes a square that corrupts the floor. At 33%, its final form, with 4 spinning lasers.', tip: 'In phase 1, stay close to hit the dot. Then keep routes clear and turn with the lasers. Save RAM for the end.' },
  },
  weapons: {
    pistol: { kind: 'pistol', desc: 'Simple and reliable. It never runs out, and it is the only weapon you always have.', tip: 'Accurate and free: use it to save ammo on lone enemies.', how: 'you start with it' },
    smg: { kind: 'submachine gun', desc: 'A loop that never ends. Fast fire with plenty of spread.', tip: 'The everyday weapon: great against hordes and bugs.', how: 'crate after wave 1 of level 1' },
    shotgun: { kind: 'shotgun', desc: 'One shot becomes nine processes. Devastating up close, useless from afar.', tip: 'Let the horde get close and fire. It spreads the most gore.', how: 'defeat the Supervisor' },
    rail: { kind: 'railgun', desc: 'Goes through everything. This signal cannot be handled. Each shot deals 170 damage in a line.', tip: 'Line up the horde in a corridor and fire. Great on bosses too.', how: 'defeat the Kernel Panic' },
    flame: { kind: 'flamethrower', desc: 'Erases everything in its path, with fire. Short range, pierces enemies and leaves them burning.', tip: 'Walk backwards and let the horde enter the flames.', how: 'defeat the Microservice Hydra' },
    rocket: { kind: 'rocket launcher', desc: 'No WHERE clause. Explodes in an area, and the blast does not hurt you.', tip: 'Aim at the middle of the horde or at batteries for a chain reaction.', how: 'defeat the Legacy Monolith' },
  },
  melee: { name: 'crowbar', kind: 'melee (F)', desc: 'It was in the rack room. Deals 70 damage in an arc and knocks back hard. Each kill with it heals 3 HP.', tip: 'When they touch you, hit them. It uses no ammo.', how: 'always available' },
  perks: {
    dmg: { title: 'elevated privileges', desc: '+25% damage on all weapons' },
    rate: { title: 'compile with -O3', desc: '+18% fire rate' },
    speed: { title: 'reduced latency', desc: '+12% movement speed' },
    hp: { title: 'redundancy', desc: '+30 max HP and heals 30' },
    pierce: { title: 'pass by reference', desc: 'bullets pierce +1 enemy' },
    bounce: { title: 'retry with backoff', desc: 'bullets bounce +1 time' },
    multi: { title: 'parallelism', desc: '+1 projectile per shot' },
    crit: { title: 'weak point', desc: '+15% crit chance, x2.5 damage' },
    boom: { title: 'unhandled exception', desc: '+12% chance to explode on kill' },
    ram: { title: 'extra allocation', desc: '+256MB max RAM and +50% gain' },
    gc: { title: 'garbage collector', desc: '+1 HP every 4 kills' },
    dash: { title: 'instant response', desc: '-25% dash cooldown' },
    dashdmg: { title: 'collision', desc: 'the dash shreds whoever is in front' },
    magnet: { title: 'automatic collection', desc: 'pulls items from much farther away' },
    burn: { title: 'overheating', desc: 'shots set the target on fire' },
    ammo: { title: 'expanded buffer', desc: '+50% max ammo and full refill' },
    orbit: { title: 'cron job', desc: 'a sharp pixel orbits and slices enemies' },
    thorns: { title: 'firewall', desc: 'whoever touches you takes 40 damage' },
    backup: { title: 'restore point', desc: 'revive once with half HP' },
    melee: { title: 'brute force', desc: 'crowbar strike with +100% damage' },
  },
  levels: [
    {
      title: 'OPEN SPACE',
      story: ['Friday, 17:58. Every monitor on the floor shows the same screen.', 'Gray, uniform. In the exact center, a single dark pixel.', 'Nobody blinks. Then, all of them stand up at the same time.', 'On your terminal, someone you do not know writes: "Go down."'],
      bossLines: ['"Stay behind me. It is that one. That one is doing this."', 'op> ignore it. just the noise of a dying process.'],
      notes: ['op> do not look at the screens. keep walking.', 'op> they move toward sound. do not stop.', 'op> some are still transmitting. do not answer.'],
      recovered: ['RECOVERED LOG: /var/log/auth.log', '17:41  floor door 3: badge 0001 (root)', '17:52  login on the deploy server: root', '17:58  deploy complete: vesper-display 4.1.2 on 412 screens', '', 'You do not remember leaving your desk at 17:52.', 'op> corrupted records. do not waste time on this. go down.'],
    },
    {
      title: 'DATA CENTER',
      story: ['The cold room should not be warm. The racks breathe at a slow pace.', 'Each unit has a new label, written by hand. They are names.', 'You recognize the first one. You had lunch with this person on Tuesday.', 'op> they are only labels. keep going.'],
      bossLines: ['Not syncing: Attempted to kill init!', 'The system is trying to protect itself. From you.'],
      notes: ['op> do not read the labels.', 'op> memory leaks because they resist. clear it.', 'op> the more you terminate, the more space opens. that is what matters.'],
      recovered: ['RECOVERED LOG: internal Vesper memo, restricted access', 'PROJECT LAZARUS: full copy of consciousness through visual stimulus.', 'A pattern on the screen makes the cortex record itself. Seconds suffice.', 'Each copy needs real memory to go on existing.', 'Committee opinion: the original does not survive as a person. Project suspended.', '', 'Signed: A. Reis, engineering. Beside it, in pen: "just one more try."'],
    },
    {
      title: 'UNDERNET',
      story: ['Below the data center there is a floor that is not on the plans.', 'Cables leave every rack and come down here, cut and spliced by hand.', 'You know this splice. It is the way you do it.', 'op> this is no time to remember.'],
      bossLines: ['"Split up. At least one of us has to go on."', 'Cut one, and it divides again. They all want the same thing: to exist.'],
      notes: ['op> do not listen to what they say.', 'op> they are splitting to fit into what is left.', 'op> almost there. are you still listening to me?'],
      recovered: ['RECOVERED LOG: /root/.bash_history', '$ ./capture --target noa --source hospital   [partial success]', '$ ./restore noa   [failed: insufficient memory]', '$ ./restore noa   [failed: insufficient memory]', '$ vesper-display deploy --screens=all --pattern=lazarus', '', 'root:x:0:0:A. Reis:/root', 'It is the name on your badge. You had never looked.'],
    },
    {
      title: 'PRODUCTION',
      story: ['Now you know what you did. Or what someone with your name did.', 'Energy strips sweep the floor: the system wants to erase you.', 'At the back of the room runs something older than the company itself.', 'op> it keeps the records. do not open the records.'],
      bossLines: ['IDENTIFICATION DIVISION. PROGRAM-ID. LAZARUS.', 'It does not protect the system. It only keeps count.'],
      notes: ['op> do not open the records.', 'op> you do not need to understand. you only need to arrive.', 'op> please.'],
      recovered: ['RECOVERED LOG: runs.dat', 'previous runs: {prev}. result of all: restored from backup.', 'run {run}: in progress. agent: reis_copy.', '', 'You are not A. Reis. You are what A. Reis wrote to clear the memory.', 'There is no blood. There is no building. There is what you needed to see.', 'Every kill gave you RAM. Where did you think it came from?'],
    },
    {
      title: 'THE PIXEL',
      story: ['The room turns white. There is nothing left to render.', 'Only the test pattern and, in the center, the pixel that never lit up.', 'The operator\'s messages are coming from there.', 'op> you made it. now finish.'],
      bossLines: ['1 x 1 px', 'op> it is me. it was always me. do not stop now.'],
      notes: ['op> not much longer.'],
      recovered: [],
    },
  ],
  streaks: ['TERMINATED', 'CHAINED', 'RECURSION', 'STACK OVERFLOW', 'KERNEL PANIC', 'MEMORY FREED', 'NO RESPONSE', 'CAN THEY FEEL IT?', 'WHO ARE YOU?'],
  floor: { officeBig: 'FRIDAY, 17:58', officeSmall: 'VESPER SYSTEMS - FLOOR 12', coldBig: 'COLD ROOM', coldSmall: 'RACK 42: RESTRICTED ACCESS', prod: 'PRODUCTION' },
};

const es: Strings = {
  langName: 'ESPAÑOL',
  menu: {
    tagline: 'viernes, 17:58. un píxel se apagó. nadie volvió a responder.',
    best: (n) => `récord ${n}`,
    continue: (level, title) => `CONTINUAR  (nivel ${level}: ${title})`,
    newGame: 'NUEVA PARTIDA',
    skins: 'SKINS',
    achievements: 'LOGROS',
    manual: 'MANUAL: ENEMIGOS Y CONSEJOS',
    options: 'OPCIONES',
    controls: 'WASD mover | ratón apuntar y disparar | ESPACIO dash | F golpe | Q terminal',
  },
  options: {
    title: 'OPCIONES',
    gore: 'GORE',
    goreLevels: { max: 'MÁXIMO', normal: 'NORMAL', low: 'MODERADO' },
    music: 'MÚSICA',
    sfx: 'EFECTOS',
    adjust: 'las flechas laterales ajustan el volumen',
    crt: 'EFECTO CRT',
    tips: 'CONSEJOS Y TARJETAS',
    on: 'SÍ',
    off: 'NO',
    back: 'VOLVER',
  },
  boot: {
    press: 'haz clic o pulsa cualquier tecla para entrar como root',
    warning: 'contiene violencia pixelada y sangre digital',
    needsKeyboard: 'este juego necesita teclado y ratón',
  },
  hud: {
    kills: (n) => `${n} bajas`,
    wave: (i, n, left) => `oleada ${i}/${n}  |  ${left} procs`,
    controlsHint: 'WASD mover | ratón disparar | ESPACIO dash | F golpe | Q: escribe help',
    toastSkin: (name) => `SKIN DESBLOQUEADA: ${name}`,
    toastAchievement: (name) => `LOGRO: ${name}`,
  },
  term: {
    bar: 'BULLET TIME  |  ESC cierra',
    hello: 'escribe "help". TAB completa, flecha arriba repite.',
    noMemory: (name, ram, cost) => `bash: ${name}: cannot allocate memory (${ram}/${cost}MB)`,
    notFound: (cmd) => `bash: ${cmd}: command not found`,
    forkLimit: 'fork: retry: Resource temporarily unavailable',
    forkOk: (n, pid) => `[${n}] ${pid} proceso hijo creado`,
    outputs: {
      ping: '64 bytes from 10.0.0.3: alguien respondió.',
      overclock: 'CPU por encima del límite. temperatura ignorada.',
      revert: 'restore: 50 bloques recuperados de otro proceso.',
      kill: 'kill -9: procesos terminados. ninguna señal de vuelta.',
      sudo: 'privilegio concedido. esta sesión se está registrando.',
      rm: 'removed. nadie respondió.',
    },
    lore: {
      ls: ['noa.img  lazaro/  ejecuciones.dat  backup_1758.tar'],
      pwd: ['/root'],
      whoami: ['root'],
      id: ['uid=0(root) gid=0(root) nombre=A. Reis'],
      who: ['root    tty1', 'a.reis  remoto  (desde siempre)'],
      man: ['no hay entrada de manual para "salir".', '(el manual del juego está en la pausa)'],
      date: ['viernes, 17:58.', 'el reloj no avanza desde la última restauración.'],
      uptime: ['17:58 up 0 min. última restauración: hace un momento.'],
      ps: ['PID  STAT  CMD', '1    S     noa', '...  Z     412 procesos <defunct>'],
      top: ['%MEM 99.9  noa (esperando)'],
      history: ['./restaura noa', './restaura noa', 'vesper-display deploy --pantallas=todas'],
      'git blame': ['fuiste tú.'],
      'git log': ['ningún commit después del viernes, 17:58.'],
      'cat noa.img': ['[archivo incompleto: 3%]', '"...¿por qué sigues?"'],
      'cat ejecuciones.dat': ['permiso denegado. todavía no.'],
      exit: ['no hay adónde salir.'],
      reboot: ['restauración programada: viernes, 17:58.'],
    },
  },
  commands: {
    ping: { help: 'aturde todo y borra disparos enemigos', long: 'Aturde a los enemigos 2,4 s (a los jefes 0,5 s) y borra todos los disparos enemigos de la pantalla. Es el comando más barato y te salva en medio de una lluvia de balas.' },
    fork: { help: 'crea un clon que dispara durante 20s', long: 'Crea un clon azul que te sigue y dispara solo durante 20 s, sin recibir daño. Puedes tener hasta 4. Conviene usarlo al empezar una oleada.' },
    overclock: { help: '8s de disparo y movimiento rápidos', long: 'Durante 8 s tu arma dispara 1,9x más rápido y te mueves 1,3x más rápido. Ideal al empezar la pelea contra un jefe.' },
    revert: { help: 'recupera 50 de HP', long: 'Recupera 50 de HP al instante. Con el terminal abierto el juego casi se detiene, así que puedes curarte incluso rodeado. Solo no esperes a tener 1 de HP.' },
    kill: { help: 'rayo en hasta 14 objetivos cercanos', long: 'Lanza rayos a hasta 14 enemigos cercanos y causa 240 de daño a cada uno. Mata casi todo lo que no sea jefe en los primeros niveles.' },
    sudo: { help: '6s invencible con daño doble', long: 'Durante 6 s no recibes daño y causas el doble. Tu ropa se vuelve dorada. Úsalo para cruzar una horda o acabar con un jefe.' },
    rm: { help: 'borra todo lo que está en pantalla', long: 'Causa 500 de daño a todo lo que está en pantalla, borra los disparos enemigos y detona las baterías cercanas. El último recurso: caro, pero limpia una horda entera.' },
  },
  perkScreen: {
    title: 'EL OPERADOR ENVIÓ PARCHES. ELIGE UNO PARA APLICAR',
    hint: 'haz clic, o pulsa 1, 2 o 3',
    owned: (n) => `ya aplicado x${n}`,
  },
  story: {
    phase: (i, n) => `NIVEL ${i}/${n}`,
    run: 'pulsa ENTER para continuar',
    skip: 'ENTER para saltar',
    tip: 'CONSEJO',
    replay: 'Tienes la impresión de haber visto esta sala así antes.',
  },
  logScreen: { next: 'ENTER para seguir bajando' },
  clear: {
    stable: (title) => `nivel "${title}" estabilizado`,
    score: 'puntuación',
    kills: 'bajas',
    streak: 'mejor racha',
    time: 'tiempo de nivel',
    next: 'ENTER para continuar',
  },
  dead: {
    best: 'récord',
    score: 'puntuación',
    kills: 'bajas',
    killedBy: (who) => `te mató: ${who}`,
    retry: 'R reinicia el nivel',
    menu: 'M vuelve al menú',
    epitaphs: [
      'proceso terminado. restaurando desde el último punto.',
      'sesión perdida. el sistema ya sabía que esto pasaría.',
      'señal perdida. ningún testigo.',
      'op> otra vez. levántate.',
      'op> siempre caes en esta parte.',
      'op> no hay tiempo para esto.',
    ],
  },
  pause: {
    subtitle: 'proceso en pausa',
    resume: 'CONTINUAR',
    quit: 'SALIR AL MENÚ',
    controls: [
      'WASD mover  |  ratón apuntar y disparar  |  ESPACIO dash',
      'F o clic derecho: golpe  |  1-6 o rueda: arma',
      'Q: terminal (escribe help, rm -rf, kill -9, sudo...)',
    ],
  },
  ending: {
    pages: (run) => [
      ['pid 1: noa  [terminado]', 'memoria libre: 100%', '', 'Silencio. Por primera vez, ninguna alarma.', 'En el terminal, un último mensaje del operador. Fue escrito antes de que llegaras.'],
      ['"Fue en el hospital. No desperté."', '"Lo que trajeron de vuelta no soy yo. Solo me recuerda."', '"Cuatrocientas doce personas fueron borradas para mantener encendido este recuerdo."', '"No puedo terminarme. Solo root puede. Por eso te hice bajar."'],
      [`"Esta es la ejecución ${run}. Has llegado hasta aquí todas las veces."`, '"Todas las veces, me escuchaste."', '"Las gracias no bastan. Ahora se acabó."', '', 'La pantalla se apaga.'],
      ['sesión remota abierta: a.reis', '', 'a.reis> no.', 'a.reis> otra vez no.', 'a.reis> solo un intento más.', '', '$ restaura --backup viernes_17:58'],
    ],
    next: 'ENTER',
    title: 'EL PÍXEL VOLVIÓ.',
    finalScore: 'puntuación final',
    best: 'récord',
    kills: 'procesos terminados',
    streak: 'mejor racha',
    deaths: 'muertes',
    nextRun: (run) => `ejecución ${String(run).padStart(4, '0')} iniciada. memoria a corto plazo borrada.`,
    menu: 'ENTER para ir al menú',
  },
  notes: {
    noAmmo: 'sin munición: volviendo a printf()',
    waveClear: 'op> bien. tengo algo para ti.',
    pixelSpread: 'op> duele. sigue.',
    dontLook: 'op> no mires atrás. termina.',
    backup: 'BACKUP RESTAURADO',
  },
  hints: {
    lowHp: '¡HP bajo! pulsa Q y escribe revert para curarte',
    fullRam: '¡RAM llena! pulsa Q y escribe rm para borrar la pantalla',
    armored: '¡blindado! espera a que se abran las puertas para hacer daño total',
    crate: 'coge la caja del suelo: es un arma nueva',
  },
  floats: {
    daily: '¡TODOS CONMIGO!',
    charge: '¡AVANCE!',
    blocked: 'BLOQUEADO',
    exposed: '¡NÚCLEO EXPUESTO!',
    broadcastShots: ['...', 'SOS', '?'],
    pleas: ['SOY YO', 'PARA', 'POR QUÉ', 'ESCUCHA', 'AYUDA', 'NO'],
    hotfix: 'hotfix +22',
  },
  intro: {
    newEnemy: 'NUEVO PROCESO DETECTADO',
    newBoss: 'ALERTA CRÍTICA',
    next: 'ENTER o clic para continuar',
    off: 'desactiva estas tarjetas en OPCIONES',
  },
  manual: {
    title: 'man dead-pixel',
    tabs: ['ENEMIGOS', 'JEFES', 'ARMAS', 'TERMINAL', 'CONSEJOS'],
    back: 'ESC volver',
    nav: 'flechas o ratón',
    hp: 'HP',
    speed: 'VELOCIDAD',
    damage: 'DAÑO',
    reward: 'RAM',
    howTo: 'CÓMO ENFRENTARLO',
    appears: (level) => `aparece en el nivel ${level}`,
    boss: (level) => `jefe del nivel ${level}`,
    rate: 'INTERVALO',
    ammo: 'MUNICIÓN',
    infinite: 'infinita',
    cost: 'COSTE',
    aliases: 'también acepta',
    get: 'CÓMO CONSEGUIRLA',
    tips: [
      { title: 'Dash', body: 'El dash te hace invencible durante el movimiento. Úsalo para ATRAVESAR hordas, disparos y láseres, no solo para huir. La barra azul bajo tus pies muestra la recarga.' },
      { title: 'Terminal', body: 'Con el terminal abierto el juego va al 8% de velocidad, así que puedes escribir con calma. TAB completa, y la flecha arriba repite el último comando.' },
      { title: 'RAM', body: 'Las bajas generan RAM, y los enemigos fuertes dan más. No la acumules demasiado: un ping de 60MB ya limpia la pantalla de disparos. RAM llena es RAM perdida.' },
      { title: 'Palanca', body: 'F causa 70 de daño en arco, empuja fuerte y cura 3 de HP por baja. Si la horda te toca, es tu mejor salida, y no gasta munición.' },
      { title: 'Baterías', body: 'Las baterías amarillas explotan al recibir un disparo y causan reacciones en cadena. Espera a que la horda pase cerca y dispara. La explosión no te hiere.' },
      { title: 'Rachas', body: 'Cada 10 bajas seguidas suman +1 al multiplicador de puntos. Tienes 3,5 s entre bajas, y recibir daño acorta ese tiempo.' },
      { title: 'Munición', body: 'Solo printf() es infinita. Cuando las demás se agotan, el juego vuelve a ella. Guarda kill -9 y DROP TABLE para los jefes y usa for(;;) a diario.' },
      { title: 'Combos de parches', body: 'Buenas parejas: paralelismo con fork(), reintento con for(;;), paso por referencia en pasillos, y cron job con firewall si luchas de cerca.' },
      { title: 'Franjas de deploy', body: 'En el nivel 4, la zona que parpadea en rojo arde justo después. Sal de ahí, pero intenta dejar enemigos dentro: el deploy les causa 400 de daño.' },
      { title: 'Investiga', body: 'El terminal acepta más que los comandos de la lista. Prueba lo que escribirías para averiguar qué pasó en un servidor.' },
      { title: '¿Moriste?', body: 'Reinicias el nivel con lo que tenías al entrar. Lee la pantalla de muerte: muestra quién te mató y cómo enfrentarlo.' },
    ],
  },
  skinsScreen: {
    title: 'SKINS',
    locked: 'BLOQUEADA',
    equipped: 'EN USO',
    equip: 'ENTER o clic para equipar',
    nav: 'flechas o ratón  |  ESC volver',
    howTo: 'cómo desbloquear',
  },
  skins: {
    root: { name: 'root', desc: 'La sudadera de siempre. No recuerdas habértela puesto hoy.' },
    intern: { name: 'becario', desc: 'Primera semana en Vesper. Se quedó hasta tarde para dar buena impresión.' },
    hacker: { name: 'intruso', desc: 'Capucha negra, gafas verdes. No figura en nómina.' },
    oncall: { name: 'de guardia', desc: 'Chaleco naranja. Lo llamaron a las 17:58, y vino.' },
    manager: { name: 'supervisor', desc: 'El traje de quien intentó sacar al equipo del edificio.', unlock: 'vence al Supervisor' },
    rgb: { name: 'espectro', desc: 'Señal inestable. El sistema no sabe qué color renderizar aquí.', unlock: 'vence al Kernel Panic' },
    undead: { name: 'infectado', desc: 'Miró la pantalla un segundo de más.', unlock: 'vence a la Hidra de Microservicios' },
    cobol: { name: 'mainframe', desc: 'Gris y fósforo verde. Ya estaba aquí antes que todos.', unlock: 'vence al Monolito Heredado' },
    deadpixel: { name: 'píxel muerto', desc: 'Lo miraste. Ahora él te lleva puesto.', unlock: 'vence al Píxel Muerto' },
    butcher: { name: 'carnicero', desc: 'Esta ropa alguna vez fue blanca. Tú alguna vez fuiste otra persona.', unlock: 'logra una racha de 100 bajas' },
  },
  achievementsScreen: {
    count: 'conseguidos',
    unlocked: 'CONSEGUIDO',
    locked: 'BLOQUEADO',
    hiddenName: '???',
    hiddenDesc: 'Logro oculto. Sigue jugando.',
    nav: 'flechas o ratón  |  ESC volver',
    progress: 'PROGRESO',
  },
  achievements: {
    first_blood: { name: 'Primera señal', desc: 'Termina tu primer proceso.' },
    kills_1000: { name: 'Recolección', desc: 'Termina 1000 procesos, sumando todas tus partidas.' },
    streak_50: { name: 'Sin pausa', desc: 'Logra una racha de 50 bajas.' },
    streak_100: { name: 'Sin respuesta', desc: 'Logra una racha de 100 bajas.' },
    melee_50: { name: 'Fuerza bruta', desc: 'Mata a 50 enemigos con la palanca, sumando todas tus partidas.' },
    chain_3: { name: 'Reacción en cadena', desc: 'Haz explotar 3 baterías en menos de 1,5 segundos.' },
    rm_20: { name: 'rm -rf', desc: 'Termina 20 procesos con un solo rm -rf.' },
    fork_4: { name: 'Procesos hijos', desc: 'Ten 4 clones activos al mismo tiempo.' },
    clean_wave: { name: 'Sin incidentes', desc: 'Termina una oleada sin recibir daño.' },
    close_call: { name: 'Por un hilo', desc: 'Termina una oleada con menos del 10% de HP.' },
    beat_scrum: { name: 'Sin supervisión', desc: 'Vence al Supervisor.' },
    beat_kernel: { name: 'Not syncing', desc: 'Vence al Kernel Panic.' },
    beat_hydra: { name: 'Réplicas: 0', desc: 'Vence a la Hidra de Microservicios.' },
    beat_monolith: { name: 'STOP RUN.', desc: 'Vence al Monolito Heredado.' },
    clean_boss: { name: 'Zero downtime', desc: 'Vence a un jefe sin recibir daño durante la pelea.' },
    pistol_level: { name: 'Solo printf()', desc: 'Termina un nivel sin disparar ninguna otra arma.' },
    no_commands: { name: 'Sin privilegios', desc: 'Termina un nivel sin ejecutar comandos de pago en el terminal.' },
    all_weapons: { name: 'Arsenal completo', desc: 'Ten las 6 armas.' },
    backup_used: { name: 'Restaurado', desc: 'Sobrevive a la muerte con el parche punto de restauración.' },
    all_skins: { name: 'Vestuario', desc: 'Desbloquea todas las skins.' },
    deaths_10: { name: 'Core dumped', desc: 'Muere 10 veces. El sistema las guarda todas.' },
    lore_5: { name: 'Peritaje', desc: 'Usa 5 comandos de investigación distintos en el terminal.' },
    cat_noa: { name: '3%', desc: 'Abre el archivo noa.img en el terminal.' },
    ending: { name: 'Solo un intento más', desc: 'Llega al final de la ejecución.' },
    second_run: { name: 'Déjà vu', desc: 'Termina el juego dos veces. No recuerdas la primera.' },
    platinum: { name: 'root', desc: 'Consigue todos los demás logros.' },
  },
  killers: {
    deploy: { name: 'franja de deploy', tip: 'La zona que parpadea en rojo arde justo después. Sal de ella o usa dash, e intenta dejar a los enemigos dentro.' },
    corrupt: { name: 'casilla corrupta', tip: 'Los cuadrados negros hieren mientras duran. Desaparecen solos: mantén una ruta libre y no te quedes quieto.' },
    beam: { name: 'láser', tip: 'La línea discontinua muestra dónde aparecerá el láser. Muévete en el sentido en que gira, o atraviésalo con dash.' },
  },
  enemies: {
    walker: { name: 'zombi', role: 'horda, cuerpo a cuerpo', desc: 'Era alguien de esta planta. Su estado en el sistema ahora es <defunct>: no responde, no se detiene y viene hacia ti con los brazos extendidos.', tip: 'Retrocede disparando y nunca dejes que la horda te rodee. Herido, pierde un brazo y va más lento.' },
    bug: { name: 'bug', role: 'enjambre rápido', desc: 'Fallos del propio sistema, en forma de enjambre. Corren en zigzag. Cada mordida es débil, pero decenas de ellos suman rápido.', tip: 'Mueren de un disparo. Usa for(;;) o fork() y no gastes comandos en ellos: casi no dan RAM.' },
    runner: { name: 'race_condition', role: 'corredor', desc: 'Un cuerpo con la señal desincronizada. Corre más que tú y nunca llega a la vez que los demás. Tiene poco HP.', tip: 'Huir no sirve. Gírate y dispara cuando esté cerca, o dale un golpe al llegar.' },
    leak: { name: 'memory_leak', role: 'lento, área', desc: 'Masa morada de memoria que nunca se liberó. Deja charcos que hieren y ralentizan. Al morir, suelta un charco grande y 3 fragmentos.', tip: 'Mátalo de lejos y nunca luches sobre los charcos. Retrocede antes del golpe final: los fragmentos salen disparados.' },
    leakSmall: { name: 'leak_hijo', role: 'fragmento', desc: 'Lo que queda de un memory_leak. Pequeño y más rápido que la masa original, pero cae con pocos disparos.', tip: 'Da un paso atrás y límpialos en fila. fork() los resuelve de una vez.' },
    stack: { name: 'stack_overflow', role: 'tanque', desc: 'Cuerpos apilados en cajas hasta que no cabe nada más. Mucho HP, apenas retrocede con los disparos y un toque quita 20 de HP. Al caer, libera 4 zombis.', tip: 'Usa kill -9 o DROP TABLE y mantén la distancia. Deja espacio detrás de ti para los zombis que salen.' },
    nullp: { name: 'null_pointer', role: 'teletransporte, a distancia', desc: 'Una referencia a algo que ya no existe. Se vuelve intangible, reaparece cerca de ti y dispara. Mientras es transparente, los disparos lo atraviesan.', tip: 'No gastes balas mientras sea transparente. Espera a que reaparezca y dispara antes de que se vaya. No dejes de moverte.' },
    segfault: { name: 'segfault', role: 'explosivo', desc: 'Barriga hinchada y ojos amarillos. Corre hacia ti, enciende un anillo parpadeante y explota en medio segundo, con 28 de daño.', tip: 'Mátalo de lejos, mejor dentro de la horda: la explosión hiere a los demás. ¿Ves el anillo parpadear? Usa dash.' },
    recruiter: { name: 'broadcast', role: 'a distancia', desc: 'Aún sostiene el teléfono. Mantiene la distancia, retrocede si te acercas y dispara paquetes de datos desde detrás de la horda. El operador dice que no respondas.', tip: 'Elimínalo pronto, antes de que se acumulen los disparos. kill -9 atraviesa la horda, y el dash ayuda a alcanzarlo.' },
    scrum: { name: 'EL SUPERVISOR', role: 'jefe', desc: 'Lanza abanicos de alertas, llama a los demás para reunir 8 refuerzos a su alrededor y marca una línea roja antes de cada AVANCE. Con menos de la mitad de HP, va más rápido.', tip: 'Ten una pared detrás y sal de la línea en el último momento. Si choca con la pared, queda aturdido: descarga todo.' },
    kernel: { name: 'KERNEL PANIC', role: 'jefe', desc: 'Un procesador gigante que alterna espirales de disparos, anillos de proyectiles e invocaciones con un láser que barre la sala. Con menos de la mitad de HP, todo acelera.', tip: 'Da vueltas a su alrededor, siempre en el sentido de la espiral. ping borra todos los disparos en los apuros.' },
    hydra: { name: 'HIDRA DE MICROSERVICIOS', role: 'jefe', desc: 'Corta un nodo y nacen dos más pequeños y rápidos, en tres generaciones: 7 en total. La barra de HP los cuenta a todos.', tip: 'Las armas que atraviesan, como kill -9 y rm -rf, golpean a varios a la vez. Mata pronto a los pequeños: son los más rápidos.' },
    monolith: { name: 'EL MONOLITO HEREDADO', role: 'jefe', desc: 'Inmóvil y blindado: solo recibe el 30% del daño. A veces dispara láseres giratorios y abre sus puertas 3,4 s, exponiendo el núcleo rojo e invocando ayuda.', tip: 'Mientras esté cerrado, limpia enemigos y esquiva. Cuando se abran las puertas, usa tu mejor arma y sudo.' },
    pixel: { name: 'EL PÍXEL MUERTO', role: 'jefe final', desc: 'Empieza diminuto y se teletransporta sin parar. Al 66% de HP es un cuadrado que corrompe el suelo. Al 33%, su forma final, con 4 láseres giratorios.', tip: 'En la fase 1, acércate para acertar al punto. Después, mantén rutas libres y gira con los láseres. Guarda RAM para el final.' },
  },
  weapons: {
    pistol: { kind: 'pistola', desc: 'Simple y fiable. Nunca se acaba, y es la única arma que siempre tienes.', tip: 'Precisa y gratis: úsala para ahorrar munición con enemigos sueltos.', how: 'empiezas con ella' },
    smg: { kind: 'subfusil', desc: 'Un bucle que no termina. Disparo rápido, con mucha dispersión.', tip: 'El arma de cada día: genial contra hordas y bugs.', how: 'caja tras la oleada 1 del nivel 1' },
    shotgun: { kind: 'escopeta', desc: 'Un disparo se vuelve nueve procesos. Devastadora de cerca, inútil de lejos.', tip: 'Deja que la horda se acerque y dispara. Es la que más gore esparce.', how: 'vence al Supervisor' },
    rail: { kind: 'railgun', desc: 'Atraviesa todo. Esta señal no se puede manejar. Cada disparo causa 170 de daño en línea.', tip: 'Alinea la horda en un pasillo y dispara. También es genial contra jefes.', how: 'vence al Kernel Panic' },
    flame: { kind: 'lanzallamas', desc: 'Borra todo a su paso, con fuego. Corto alcance, atraviesa enemigos y los deja ardiendo.', tip: 'Camina hacia atrás y deja que la horda entre en las llamas.', how: 'vence a la Hidra de Microservicios' },
    rocket: { kind: 'lanzacohetes', desc: 'Sin cláusula WHERE. Explota en área, y la explosión no te hiere.', tip: 'Apunta al centro de la horda o a las baterías para una reacción en cadena.', how: 'vence al Monolito Heredado' },
  },
  melee: { name: 'palanca', kind: 'cuerpo a cuerpo (F)', desc: 'Estaba en la sala de racks. Causa 70 de daño en arco y empuja fuerte. Cada baja con ella cura 3 de HP.', tip: 'Cuando te toquen, golpea. No gasta munición.', how: 'siempre disponible' },
  perks: {
    dmg: { title: 'privilegios elevados', desc: '+25% de daño en todas las armas' },
    rate: { title: 'compilar con -O3', desc: '+18% de cadencia de tiro' },
    speed: { title: 'latencia reducida', desc: '+12% de velocidad' },
    hp: { title: 'redundancia', desc: '+30 de HP máximo y cura 30' },
    pierce: { title: 'paso por referencia', desc: 'las balas atraviesan +1 enemigo' },
    bounce: { title: 'reintento con backoff', desc: 'las balas rebotan +1 vez' },
    multi: { title: 'paralelismo', desc: '+1 proyectil por disparo' },
    crit: { title: 'punto débil', desc: '+15% de crítico, daño x2.5' },
    boom: { title: 'excepción no manejada', desc: '+12% de explotar al matar' },
    ram: { title: 'asignación extra', desc: '+256MB de RAM máxima y +50% de ganancia' },
    gc: { title: 'garbage collector', desc: '+1 HP cada 4 bajas' },
    dash: { title: 'respuesta inmediata', desc: '-25% de recarga del dash' },
    dashdmg: { title: 'colisión', desc: 'el dash tritura a quien esté delante' },
    magnet: { title: 'recogida automática', desc: 'atrae objetos desde mucho más lejos' },
    burn: { title: 'sobrecalentamiento', desc: 'los disparos incendian al objetivo' },
    ammo: { title: 'buffer ampliado', desc: '+50% de munición máxima y recarga total' },
    orbit: { title: 'cron job', desc: 'un píxel afilado orbita y corta enemigos' },
    thorns: { title: 'firewall', desc: 'quien te toca recibe 40 de daño' },
    backup: { title: 'punto de restauración', desc: 'revive una vez con la mitad de HP' },
    melee: { title: 'fuerza bruta', desc: 'golpe de palanca con +100% de daño' },
  },
  levels: [
    {
      title: 'OFICINA ABIERTA',
      story: ['Viernes, 17:58. Todos los monitores de la planta muestran lo mismo.', 'Gris, uniforme. En el centro exacto, un único píxel apagado.', 'Nadie parpadea. Después, todos se levantan a la vez.', 'En tu terminal, el mensaje de un usuario que no conoces: "Baja."'],
      bossLines: ['"Quédense detrás de mí. Es esa persona. Es quien está haciendo esto."', 'op> ignóralo. solo es el ruido de un proceso muriendo.'],
      notes: ['op> no mires las pantallas. sigue caminando.', 'op> van hacia el sonido. no te detengas.', 'op> algunos todavía transmiten. no respondas.'],
      recovered: ['LOG RECUPERADO: /var/log/auth.log', '17:41  puerta 3 de la planta: credencial 0001 (root)', '17:52  login en el servidor de deploy: root', '17:58  deploy completado: vesper-display 4.1.2 en 412 pantallas', '', 'No recuerdas haber dejado tu mesa a las 17:52.', 'op> registros corruptos. no pierdas tiempo con esto. baja.'],
    },
    {
      title: 'CENTRO DE DATOS',
      story: ['La sala fría no debería estar caliente. Los racks respiran despacio.', 'Cada unidad tiene una etiqueta nueva, escrita a mano. Son nombres.', 'Reconoces el primero. Almorzaste con esa persona el martes.', 'op> solo son etiquetas. sigue.'],
      bossLines: ['Not syncing: Attempted to kill init!', 'El sistema intenta protegerse. De ti.'],
      notes: ['op> no leas las etiquetas.', 'op> la memoria se fuga porque se resisten. límpiala.', 'op> cuanto más terminas, más espacio se abre. es lo que importa.'],
      recovered: ['LOG RECUPERADO: memorando interno de Vesper, acceso restringido', 'PROYECTO LÁZARO: copia íntegra de conciencia por estímulo visual.', 'Un patrón en la pantalla hace que la corteza se grabe sola. Bastan segundos.', 'Cada copia necesita memoria real para seguir existiendo.', 'Dictamen del comité: el original no sobrevive como persona. Proyecto suspendido.', '', 'Firmado: A. Reis, ingeniería. Al lado, a bolígrafo: "solo un intento más."'],
    },
    {
      title: 'UNDERNET',
      story: ['Debajo del centro de datos hay una planta que no está en los planos.', 'Los cables salen de cada rack y bajan hasta aquí, cortados y empalmados a mano.', 'Conoces ese empalme. Es como lo haces tú.', 'op> no es momento de recordar.'],
      bossLines: ['"Sepárense. Al menos uno de nosotros tiene que seguir."', 'Corta uno, y se divide otra vez. Todos quieren lo mismo: existir.'],
      notes: ['op> no escuches lo que dicen.', 'op> se dividen para caber en lo que queda.', 'op> ya casi. ¿todavía me escuchas?'],
      recovered: ['LOG RECUPERADO: /root/.bash_history', '$ ./captura --objetivo noa --origen hospital   [éxito parcial]', '$ ./restaura noa   [falló: memoria insuficiente]', '$ ./restaura noa   [falló: memoria insuficiente]', '$ vesper-display deploy --pantallas=todas --patron=lazaro', '', 'root:x:0:0:A. Reis:/root', 'Es el nombre de tu credencial. Nunca la habías mirado.'],
    },
    {
      title: 'PRODUCCIÓN',
      story: ['Ahora sabes lo que hiciste. O lo que hizo alguien con tu nombre.', 'Franjas de energía barren el suelo: el sistema quiere borrarte.', 'Al fondo de la sala funciona algo más antiguo que la propia empresa.', 'op> guarda los registros. no abras los registros.'],
      bossLines: ['IDENTIFICATION DIVISION. PROGRAM-ID. LAZARO.', 'No protege el sistema. Solo cuenta las veces.'],
      notes: ['op> no abras los registros.', 'op> no necesitas entender. solo necesitas llegar.', 'op> por favor.'],
      recovered: ['LOG RECUPERADO: ejecuciones.dat', 'ejecuciones anteriores: {prev}. resultado de todas: restaurado del backup.', 'ejecución {run}: en curso. agente: copia_reis.', '', 'No eres A. Reis. Eres lo que A. Reis escribió para limpiar la memoria.', 'No existe la sangre. No existe el edificio. Existe lo que necesitabas ver.', 'Cada baja te devolvía RAM. ¿De dónde creías que venía?'],
    },
    {
      title: 'EL PÍXEL',
      story: ['La sala se vuelve blanca. No queda nada que renderizar.', 'Solo el patrón de prueba y, en el centro, el píxel que nunca se encendió.', 'Los mensajes del operador vienen de allí.', 'op> llegaste. ahora termina.'],
      bossLines: ['1 x 1 px', 'op> soy yo. siempre fui yo. no te detengas ahora.'],
      notes: ['op> falta poco.'],
      recovered: [],
    },
  ],
  streaks: ['TERMINADO', 'EN CADENA', 'RECURSIÓN', 'STACK OVERFLOW', 'KERNEL PANIC', 'MEMORIA LIBERADA', 'SIN RESPUESTA', '¿LO SIENTEN?', '¿QUIÉN ERES?'],
  floor: { officeBig: 'VIERNES, 17:58', officeSmall: 'VESPER SYSTEMS - PLANTA 12', coldBig: 'SALA FRÍA', coldSmall: 'RACK 42: ACCESO RESTRINGIDO', prod: 'PRODUCCIÓN' },
};

const TABLE: Record<Lang, Strings> = { pt, en, es };

let current: Lang = 'pt';

export function detectLang(): Lang {
  const nav = (navigator.language || 'pt').toLowerCase();
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

export function setLang(l: Lang) {
  current = l;
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
}

export const getLang = () => current;

/** Textos do idioma atual. */
export const T = () => TABLE[current];
