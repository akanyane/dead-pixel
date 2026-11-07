import type { Theme } from './map';

export type EnemyKind = 'walker' | 'bug' | 'runner' | 'leak' | 'leakSmall' | 'stack' | 'nullp' | 'segfault' | 'recruiter' | 'scrum' | 'kernel' | 'hydra' | 'monolith' | 'pixel';

export interface EnemyDef {
  hp: number;
  speed: number;
  dmg: number;
  r: number;
  hoff: number;
  score: number;
  ram: number;
  name: string;
  blood: 'red' | 'green' | 'purple' | 'cyan' | 'black' | 'none';
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  walker: { hp: 34, speed: 30, dmg: 9, r: 5, hoff: 8, score: 10, ram: 5, name: 'zumbi', blood: 'red' },
  bug: { hp: 8, speed: 78, dmg: 3, r: 3, hoff: 3, score: 4, ram: 1, name: 'bug', blood: 'green' },
  runner: { hp: 20, speed: 96, dmg: 7, r: 4, hoff: 5, score: 18, ram: 6, name: 'race_condition', blood: 'red' },
  leak: { hp: 80, speed: 20, dmg: 10, r: 7, hoff: 5, score: 30, ram: 10, name: 'memory_leak', blood: 'purple' },
  leakSmall: { hp: 22, speed: 42, dmg: 5, r: 4, hoff: 3, score: 8, ram: 3, name: 'leak_filho', blood: 'purple' },
  stack: { hp: 300, speed: 18, dmg: 20, r: 8, hoff: 11, score: 70, ram: 24, name: 'stack_overflow', blood: 'red' },
  nullp: { hp: 46, speed: 44, dmg: 8, r: 5, hoff: 6, score: 35, ram: 12, name: 'null_pointer', blood: 'cyan' },
  segfault: { hp: 26, speed: 64, dmg: 28, r: 5, hoff: 6, score: 24, ram: 8, name: 'segfault', blood: 'red' },
  recruiter: { hp: 42, speed: 34, dmg: 7, r: 5, hoff: 8, score: 28, ram: 10, name: 'recrutador', blood: 'red' },
  scrum: { hp: 2600, speed: 26, dmg: 20, r: 15, hoff: 22, score: 1500, ram: 120, name: 'SCRUM MASTER', blood: 'red' },
  kernel: { hp: 4200, speed: 16, dmg: 18, r: 20, hoff: 18, score: 3000, ram: 160, name: 'KERNEL PANIC', blood: 'cyan' },
  hydra: { hp: 2600, speed: 34, dmg: 15, r: 15, hoff: 10, score: 500, ram: 40, name: 'HIDRA DE MICROSSERVIÇOS', blood: 'green' },
  monolith: { hp: 9000, speed: 0, dmg: 25, r: 36, hoff: 40, score: 6000, ram: 200, name: 'O MONOLITO LEGADO', blood: 'red' },
  pixel: { hp: 22000, speed: 34, dmg: 25, r: 6, hoff: 0, score: 15000, ram: 200, name: 'O PIXEL MORTO', blood: 'black' },
};

export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rail' | 'flame' | 'rocket';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  desc: string;
  rate: number;
  dmg: number;
  speed: number;
  spread: number;
  pellets: number;
  ammoMax: number;
  ammoPickup: number;
  pierce: number;
  kick: number;
  shake: number;
  color: string;
  life: number;
  explode?: number;
  rail?: boolean;
  flame?: boolean;
  size: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: { id: 'pistol', name: 'printf()', desc: 'depuração clássica. nunca acaba.', rate: 0.2, dmg: 13, speed: 330, spread: 0.035, pellets: 1, ammoMax: Infinity, ammoPickup: 0, pierce: 0, kick: 1.2, shake: 1.2, color: '#ffe89a', life: 0.9, size: 1 },
  smg: { id: 'smg', name: 'for(;;)', desc: 'loop infinito de chumbo.', rate: 0.07, dmg: 9, speed: 380, spread: 0.1, pellets: 1, ammoMax: 640, ammoPickup: 130, pierce: 0, kick: 0.9, shake: 1, color: '#ffd23d', life: 0.75, size: 1 },
  shotgun: { id: 'shotgun', name: 'fork()', desc: 'um tiro vira nove processos.', rate: 0.62, dmg: 11, speed: 310, spread: 0.3, pellets: 9, ammoMax: 90, ammoPickup: 16, pierce: 0, kick: 5, shake: 5.5, color: '#ffae5c', life: 0.42, size: 1 },
  rail: { id: 'rail', name: 'kill -9', desc: 'atravessa tudo. sem tratamento de sinal.', rate: 0.85, dmg: 170, speed: 0, spread: 0, pellets: 1, ammoMax: 40, ammoPickup: 8, pierce: 99, kick: 6, shake: 7, color: '#39ffe5', life: 0.2, rail: true, size: 2 },
  flame: { id: 'flame', name: 'rm -rf', desc: 'apaga tudo no caminho. com fogo.', rate: 0.035, dmg: 5, speed: 170, spread: 0.22, pellets: 1, ammoMax: 800, ammoPickup: 170, pierce: 99, kick: 0.2, shake: 0.5, color: '#ff7a1a', life: 0.48, flame: true, size: 3 },
  rocket: { id: 'rocket', name: 'DROP TABLE', desc: 'sem WHERE. boa sorte.', rate: 0.95, dmg: 140, speed: 230, spread: 0, pellets: 1, ammoMax: 26, ammoPickup: 5, pierce: 0, kick: 7, shake: 5, color: '#ff4d4d', life: 2.2, explode: 52, size: 2 },
};

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'smg', 'shotgun', 'rail', 'flame', 'rocket'];

export interface PerkDef {
  id: string;
  tag: 'feat' | 'fix' | 'perf' | 'chore' | 'refactor';
  title: string;
  desc: string;
  max?: number;
}

export const PERKS: PerkDef[] = [
  { id: 'dmg', tag: 'feat', title: 'dano++', desc: '+25% de dano em todas as armas' },
  { id: 'rate', tag: 'perf', title: 'compilar com -O3', desc: '+18% de cadência de tiro' },
  { id: 'speed', tag: 'perf', title: 'remover o sleep(1000)', desc: '+12% de velocidade', max: 4 },
  { id: 'hp', tag: 'fix', title: 'tratar exceção', desc: '+30 de HP máximo e cura 30' },
  { id: 'pierce', tag: 'feat', title: 'passagem por referência', desc: 'balas atravessam +1 inimigo', max: 4 },
  { id: 'bounce', tag: 'feat', title: 'retry com backoff', desc: 'balas ricocheteiam +1 vez', max: 3 },
  { id: 'multi', tag: 'feat', title: 'paralelismo', desc: '+1 projétil por disparo', max: 3 },
  { id: 'crit', tag: 'feat', title: 'NaN', desc: '+15% de crítico, dano x2.5', max: 4 },
  { id: 'boom', tag: 'feat', title: 'exceção não tratada', desc: '+12% de chance de explodir ao matar', max: 4 },
  { id: 'ram', tag: 'chore', title: 'download more ram', desc: '+256MB de RAM máxima e +50% de ganho', max: 3 },
  { id: 'gc', tag: 'refactor', title: 'garbage collector', desc: '+1 HP por abate a cada 4 abates', max: 3 },
  { id: 'dash', tag: 'perf', title: 'cache de dash', desc: '-25% de recarga do dash', max: 3 },
  { id: 'dashdmg', tag: 'feat', title: 'merge conflict', desc: 'o dash mói quem estiver na frente', max: 2 },
  { id: 'magnet', tag: 'chore', title: 'npm install ímã', desc: 'atrai itens de muito mais longe', max: 2 },
  { id: 'burn', tag: 'feat', title: 'servidor em chamas', desc: 'tiros incendeiam o alvo', max: 2 },
  { id: 'ammo', tag: 'chore', title: 'aumentar o buffer', desc: '+50% de munição máxima e recarga total', max: 2 },
  { id: 'orbit', tag: 'feat', title: 'cron job', desc: 'um pixel afiado orbita e corta zumbis', max: 4 },
  { id: 'thorns', tag: 'feat', title: 'firewall', desc: 'quem te toca leva 40 de dano', max: 3 },
  { id: 'backup', tag: 'fix', title: 'backup da sexta', desc: 'revive uma vez com metade do HP', max: 1 },
  { id: 'melee', tag: 'feat', title: 'teclado mecânico', desc: 'golpe do teclado com +100% de dano', max: 2 },
];

export interface WaveDef {
  spawns: [EnemyKind, number][];
  rate: number;
  maxAlive: number;
  note: string;
}

export interface LevelDef {
  id: string;
  theme: Theme;
  title: string;
  dir: string;
  story: string[];
  music: string;
  ambient: string;
  waves: WaveDef[];
  boss: EnemyKind;
  bossLines: string[];
  reward: WeaponId | null;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'l1', theme: 'office', title: 'OPEN SPACE', dir: '~/startup', music: 'l1', ambient: '#3a3a4c',
    story: [
      'Sexta-feira, 17:58. Alguém fez deploy em produção.',
      'Um único pixel morreu no monitor de todo mundo.',
      'Quem olhou para ele parou de responder. Depois começou a morder.',
      'Você usa dark mode, por isso não viu nada. Ainda.',
    ],
    waves: [
      { spawns: [['walker', 22]], rate: 1.4, maxAlive: 16, note: 'processos zumbis detectados' },
      { spawns: [['walker', 26], ['bug', 22]], rate: 2.4, maxAlive: 28, note: 'bugs em produção!' },
      { spawns: [['walker', 34], ['bug', 24], ['recruiter', 6]], rate: 3, maxAlive: 34, note: 'recrutadores no LinkedIn!' },
    ],
    boss: 'scrum',
    bossLines: ['"Bom dia, time! Rapidinho: só 15 minutinhos."', 'Sprint nunca acaba. Ele também não.'],
    reward: 'shotgun',
  },
  {
    id: 'l2', theme: 'datacenter', title: 'DATA CENTER', dir: '/var/run', music: 'l2', ambient: '#3c4866',
    story: [
      'O pixel não estava nos monitores. Estava no sinal.',
      'Você desce até a sala fria, onde tudo começa.',
      'Os racks piscam em um padrão que parece... respiração.',
    ],
    waves: [
      { spawns: [['walker', 26], ['runner', 12]], rate: 2.6, maxAlive: 28, note: 'race conditions à solta' },
      { spawns: [['walker', 30], ['runner', 16], ['leak', 6]], rate: 3, maxAlive: 34, note: 'vazamento de memória!' },
      { spawns: [['runner', 26], ['leak', 8], ['bug', 34], ['recruiter', 6]], rate: 4, maxAlive: 44, note: 'load average: 666' },
    ],
    boss: 'kernel',
    bossLines: ['Not syncing: Attempted to kill init!', 'O kernel acordou com fome.'],
    reward: 'rail',
  },
  {
    id: 'l3', theme: 'undernet', title: 'UNDERNET', dir: '/dev/null', music: 'l3', ambient: '#46584a',
    story: [
      'Debaixo do data center existem cabos que ninguém documentou.',
      'Aqui embaixo, os microsserviços cresceram sozinhos.',
      'Não há logs. Não há observabilidade. Só dentes.',
    ],
    waves: [
      { spawns: [['walker', 30], ['nullp', 8], ['segfault', 8]], rate: 3, maxAlive: 34, note: 'ponteiros nulos no escuro' },
      { spawns: [['stack', 4], ['runner', 22], ['segfault', 12], ['bug', 26]], rate: 3.6, maxAlive: 42, note: 'stack overflow!' },
      { spawns: [['stack', 6], ['nullp', 14], ['leak', 10], ['segfault', 16], ['walker', 34]], rate: 4.2, maxAlive: 50, note: 'dependências circulares' },
    ],
    boss: 'hydra',
    bossLines: ['"Cada serviço tem uma única responsabilidade."', '"A minha é te devorar." Corte um, nascem dois.'],
    reward: 'flame',
  },
  {
    id: 'l4', theme: 'production', title: 'PRODUÇÃO', dir: '/prod', music: 'l4', ambient: '#4f2e2e',
    story: [
      'Todos os alertas estão vermelhos. O pager derreteu.',
      'Os pipelines disparam sozinhos: desvie das faixas de deploy.',
      'No fundo da sala, algo escrito em 1974 ainda está rodando.',
    ],
    waves: [
      { spawns: [['walker', 44], ['runner', 24], ['recruiter', 10], ['segfault', 14]], rate: 4.5, maxAlive: 52, note: 'deploy em cascata' },
      { spawns: [['stack', 8], ['leak', 12], ['nullp', 16], ['runner', 30]], rate: 4.5, maxAlive: 54, note: 'rollback falhou' },
      { spawns: [['stack', 10], ['segfault', 28], ['walker', 50], ['recruiter', 12], ['bug', 40]], rate: 6, maxAlive: 70, note: 'TUDO EM PRODUÇÃO' },
    ],
    boss: 'monolith',
    bossLines: ['IDENTIFICATION DIVISION. PROGRAM-ID. MORTE.', 'Ninguém sabe como ele funciona. Ninguém pode desligá-lo.'],
    reward: 'rocket',
  },
  {
    id: 'l5', theme: 'void', title: 'O PIXEL', dir: '/dev/pixel', music: 'l5', ambient: '#ffffff',
    story: [
      'A sala fica branca. Sem chão, sem teto, sem stack trace.',
      'Só uma tela em teste. E, no centro, um ponto.',
      'Você finalmente olha para ele.',
      'Ele olha de volta.',
    ],
    waves: [
      { spawns: [['walker', 34], ['runner', 22], ['nullp', 12], ['segfault', 14]], rate: 5, maxAlive: 56, note: 'a tela está morrendo' },
    ],
    boss: 'pixel',
    bossLines: ['1 x 1 px', 'é só isso. sempre foi só isso.'],
    reward: null,
  },
];

export const STREAKS: [number, string][] = [
  [5, 'HELLO WORLD'],
  [10, 'LOOP INFINITO'],
  [20, 'RECURSÃO'],
  [35, 'STACK OVERFLOW'],
  [50, 'KERNEL PANIC'],
  [75, 'P = NP'],
  [100, 'SINGULARIDADE'],
  [150, 'SUDO DEUS'],
  [250, 'ALGUÉM CHAMA O RH'],
];

export const KILL_WORDS = ['SIGKILL', 'exit(0)', 'core dumped', '404', 'null', 'segfault', 'rm', 'void', 'NaN', 'undefined', '0xDEAD', 'free()', 'EOF', '500'];
