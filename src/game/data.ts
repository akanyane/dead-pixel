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
  blood: 'red' | 'green' | 'purple' | 'cyan' | 'black' | 'none';
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  walker: { hp: 34, speed: 30, dmg: 9, r: 5, hoff: 8, score: 10, ram: 5, blood: 'red' },
  bug: { hp: 8, speed: 78, dmg: 3, r: 3, hoff: 3, score: 4, ram: 1, blood: 'green' },
  runner: { hp: 20, speed: 96, dmg: 7, r: 4, hoff: 5, score: 18, ram: 6, blood: 'red' },
  leak: { hp: 80, speed: 20, dmg: 10, r: 7, hoff: 5, score: 30, ram: 10, blood: 'purple' },
  leakSmall: { hp: 22, speed: 42, dmg: 5, r: 4, hoff: 3, score: 8, ram: 3, blood: 'purple' },
  stack: { hp: 300, speed: 18, dmg: 20, r: 8, hoff: 11, score: 70, ram: 24, blood: 'red' },
  nullp: { hp: 46, speed: 44, dmg: 8, r: 5, hoff: 6, score: 35, ram: 12, blood: 'cyan' },
  segfault: { hp: 26, speed: 64, dmg: 28, r: 5, hoff: 6, score: 24, ram: 8, blood: 'red' },
  recruiter: { hp: 42, speed: 34, dmg: 7, r: 5, hoff: 8, score: 28, ram: 10, blood: 'red' },
  scrum: { hp: 2600, speed: 26, dmg: 20, r: 15, hoff: 22, score: 1500, ram: 120, blood: 'red' },
  kernel: { hp: 4200, speed: 16, dmg: 18, r: 20, hoff: 18, score: 3000, ram: 160, blood: 'cyan' },
  hydra: { hp: 2600, speed: 34, dmg: 15, r: 15, hoff: 10, score: 500, ram: 40, blood: 'green' },
  monolith: { hp: 9000, speed: 0, dmg: 25, r: 36, hoff: 40, score: 6000, ram: 200, blood: 'red' },
  pixel: { hp: 22000, speed: 34, dmg: 25, r: 6, hoff: 0, score: 15000, ram: 200, blood: 'black' },
};

export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rail' | 'flame' | 'rocket';

export interface WeaponDef {
  id: WeaponId;
  name: string;
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
  pistol: { id: 'pistol', name: 'printf()', rate: 0.2, dmg: 13, speed: 330, spread: 0.035, pellets: 1, ammoMax: Infinity, ammoPickup: 0, pierce: 0, kick: 1.2, shake: 1.2, color: '#ffe89a', life: 0.9, size: 1 },
  smg: { id: 'smg', name: 'for(;;)', rate: 0.07, dmg: 9, speed: 380, spread: 0.1, pellets: 1, ammoMax: 640, ammoPickup: 130, pierce: 0, kick: 0.9, shake: 1, color: '#ffd23d', life: 0.75, size: 1 },
  shotgun: { id: 'shotgun', name: 'fork()', rate: 0.62, dmg: 11, speed: 310, spread: 0.3, pellets: 9, ammoMax: 90, ammoPickup: 16, pierce: 0, kick: 5, shake: 5.5, color: '#ffae5c', life: 0.42, size: 1 },
  rail: { id: 'rail', name: 'kill -9', rate: 0.85, dmg: 170, speed: 0, spread: 0, pellets: 1, ammoMax: 40, ammoPickup: 8, pierce: 99, kick: 6, shake: 7, color: '#39ffe5', life: 0.2, rail: true, size: 2 },
  flame: { id: 'flame', name: 'rm -rf', rate: 0.035, dmg: 5, speed: 170, spread: 0.22, pellets: 1, ammoMax: 800, ammoPickup: 170, pierce: 99, kick: 0.2, shake: 0.5, color: '#ff7a1a', life: 0.48, flame: true, size: 3 },
  rocket: { id: 'rocket', name: 'DROP TABLE', rate: 0.95, dmg: 140, speed: 230, spread: 0, pellets: 1, ammoMax: 26, ammoPickup: 5, pierce: 0, kick: 7, shake: 5, color: '#ff4d4d', life: 2.2, explode: 52, size: 2 },
};

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'smg', 'shotgun', 'rail', 'flame', 'rocket'];

export interface PerkDef {
  id: string;
  tag: 'feat' | 'fix' | 'perf' | 'chore' | 'refactor';
  max?: number;
}

export const PERKS: PerkDef[] = [
  { id: 'dmg', tag: 'feat' },
  { id: 'rate', tag: 'perf' },
  { id: 'speed', tag: 'perf', max: 4 },
  { id: 'hp', tag: 'fix' },
  { id: 'pierce', tag: 'feat', max: 4 },
  { id: 'bounce', tag: 'feat', max: 3 },
  { id: 'multi', tag: 'feat', max: 3 },
  { id: 'crit', tag: 'feat', max: 4 },
  { id: 'boom', tag: 'feat', max: 4 },
  { id: 'ram', tag: 'chore', max: 3 },
  { id: 'gc', tag: 'refactor', max: 3 },
  { id: 'dash', tag: 'perf', max: 3 },
  { id: 'dashdmg', tag: 'feat', max: 2 },
  { id: 'magnet', tag: 'chore', max: 2 },
  { id: 'burn', tag: 'feat', max: 2 },
  { id: 'ammo', tag: 'chore', max: 2 },
  { id: 'orbit', tag: 'feat', max: 4 },
  { id: 'thorns', tag: 'feat', max: 3 },
  { id: 'backup', tag: 'fix', max: 1 },
  { id: 'melee', tag: 'feat', max: 2 },
];

export interface WaveDef {
  spawns: [EnemyKind, number][];
  rate: number;
  maxAlive: number;
}

export interface LevelDef {
  id: string;
  theme: Theme;
  dir: string;
  music: string;
  ambient: string;
  waves: WaveDef[];
  boss: EnemyKind;
  reward: WeaponId | null;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'l1', theme: 'office', dir: '~/startup', music: 'l1', ambient: '#3a3a4c',
    waves: [
      { spawns: [['walker', 22]], rate: 1.4, maxAlive: 16 },
      { spawns: [['walker', 26], ['bug', 22]], rate: 2.4, maxAlive: 28 },
      { spawns: [['walker', 34], ['bug', 24], ['recruiter', 6]], rate: 3, maxAlive: 34 },
    ],
    boss: 'scrum',
    reward: 'shotgun',
  },
  {
    id: 'l2', theme: 'datacenter', dir: '/var/run', music: 'l2', ambient: '#3c4866',
    waves: [
      { spawns: [['walker', 26], ['runner', 12]], rate: 2.6, maxAlive: 28 },
      { spawns: [['walker', 30], ['runner', 16], ['leak', 6]], rate: 3, maxAlive: 34 },
      { spawns: [['runner', 26], ['leak', 8], ['bug', 34], ['recruiter', 6]], rate: 4, maxAlive: 44 },
    ],
    boss: 'kernel',
    reward: 'rail',
  },
  {
    id: 'l3', theme: 'undernet', dir: '/dev/null', music: 'l3', ambient: '#46584a',
    waves: [
      { spawns: [['walker', 30], ['nullp', 8], ['segfault', 8]], rate: 3, maxAlive: 34 },
      { spawns: [['stack', 4], ['runner', 22], ['segfault', 12], ['bug', 26]], rate: 3.6, maxAlive: 42 },
      { spawns: [['stack', 6], ['nullp', 14], ['leak', 10], ['segfault', 16], ['walker', 34]], rate: 4.2, maxAlive: 50 },
    ],
    boss: 'hydra',
    reward: 'flame',
  },
  {
    id: 'l4', theme: 'production', dir: '/prod', music: 'l4', ambient: '#4f2e2e',
    waves: [
      { spawns: [['walker', 44], ['runner', 24], ['recruiter', 10], ['segfault', 14]], rate: 4.5, maxAlive: 52 },
      { spawns: [['stack', 8], ['leak', 12], ['nullp', 16], ['runner', 30]], rate: 4.5, maxAlive: 54 },
      { spawns: [['stack', 10], ['segfault', 28], ['walker', 50], ['recruiter', 12], ['bug', 40]], rate: 6, maxAlive: 70 },
    ],
    boss: 'monolith',
    reward: 'rocket',
  },
  {
    id: 'l5', theme: 'void', dir: '/dev/pixel', music: 'l5', ambient: '#ffffff',
    waves: [
      { spawns: [['walker', 34], ['runner', 22], ['nullp', 12], ['segfault', 14]], rate: 5, maxAlive: 56 },
    ],
    boss: 'pixel',
    reward: null,
  },
];

export type Difficulty = 'easy' | 'normal' | 'hard' | 'hardcore';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'hardcore'];

/** Per-difficulty multipliers: enemy HP, damage they deal, wave size and score. */
export const DIFFICULTY: Record<Difficulty, { hp: number; dmg: number; count: number; score: number }> = {
  easy: { hp: 0.75, dmg: 0.6, count: 0.8, score: 0.5 },
  normal: { hp: 1, dmg: 1, count: 1, score: 1 },
  hard: { hp: 1.25, dmg: 1.35, count: 1.2, score: 1.5 },
  hardcore: { hp: 1.25, dmg: 1.35, count: 1.2, score: 2 },
};

/** Arcade mode (endless and daily): 4 waves and a boss per arena, cycling through the bosses. */
export const ARCADE_WAVES = 4;
export const ARCADE_BOSSES: EnemyKind[] = ['scrum', 'kernel', 'hydra', 'monolith', 'pixel'];

/** Enemies that can appear in arcade mode, from which arena on, and their draw weight. */
export const ARCADE_POOL: { kind: EnemyKind; from: number; weight: number }[] = [
  { kind: 'walker', from: 0, weight: 10 },
  { kind: 'bug', from: 0, weight: 6 },
  { kind: 'recruiter', from: 0, weight: 2 },
  { kind: 'runner', from: 1, weight: 5 },
  { kind: 'leak', from: 1, weight: 2 },
  { kind: 'segfault', from: 2, weight: 3 },
  { kind: 'nullp', from: 2, weight: 2 },
  { kind: 'stack', from: 2, weight: 0.6 },
];

/** Streak thresholds. The announcement names live in i18n.ts, in the same order. */
export const STREAKS = [5, 10, 20, 35, 50, 75, 100, 150, 250];

export const KILL_WORDS = ['SIGKILL', 'exit(0)', 'core dumped', 'free()', 'EOF', '0xDEAD'];

/** How many runs happened before the player's first game. */
export const RUN_BASE = 37;

/** Names that show up in the kill feed as the truth comes out. */
export const VICTIM_NAMES = ['M. Duarte', 'T. Almeida', 'R. Okafor', 'L. Santos', 'J. Novak', 'A. Ferreira', 'C. Ito', 'P. Moreau', 'D. Nunes', 'S. Haddad', 'I. Rocha', 'B. Lund', 'E. Vidal', 'K. Mendes', 'N. Castro', 'O. Pereira'];

export type SkinUnlock = { boss: EnemyKind } | { streak: number };

export interface SkinDef {
  id: string;
  /** Overrides the player sprite colors: hood, skin, glasses, top, details, trousers and shoes. */
  pal: Partial<Record<'H' | 'S' | 'C' | 'T' | 'L' | 'W' | 'B' | 'K', string>>;
  trail: [string, string, string];
  unlock?: SkinUnlock;
  rgb?: boolean;
}

export const SKINS: SkinDef[] = [
  { id: 'root', pal: {}, trail: ['#39ffe5', '#ff2bd6', '#14505c'] },
  { id: 'intern', pal: { H: '#6b3a12', T: '#e8c62e', W: '#2d6cdf', L: '#2d6cdf', B: '#3a4e7a', K: '#e8e8e8' }, trail: ['#ffe14d', '#ffffff', '#6b3a12'] },
  { id: 'hacker', pal: { H: '#23272f', S: '#c9a184', C: '#39ff88', T: '#1f232c', W: '#39ff88', L: '#39ff88', B: '#171a21', K: '#000000' }, trail: ['#39ff88', '#a8ff3e', '#0c3d20'] },
  { id: 'oncall', pal: { H: '#3a2a1c', C: '#ffe9c0', T: '#f0701c', W: '#fff27a', L: '#fff27a', B: '#2a3550', K: '#14141c' }, trail: ['#ff9a1a', '#fff27a', '#a84a10'] },
  { id: 'manager', pal: { H: '#2c2c32', C: '#dfe6ee', T: '#1b2238', W: '#f0f0f0', L: '#c1121f', B: '#141a2c', K: '#050505' }, trail: ['#ffe14d', '#ff8ad1', '#6fe3ff'], unlock: { boss: 'scrum' } },
  { id: 'rgb', pal: { C: '#ffffff', B: '#1a1a24', K: '#000000' }, trail: ['#ff004c', '#39ff88', '#00a2ff'], unlock: { boss: 'kernel' }, rgb: true },
  { id: 'undead', pal: { H: '#2a1d14', S: '#7fa66a', C: '#ff2a2a', T: '#4f5d75', W: '#a3101a', L: '#a3101a', B: '#2b3248', K: '#111111' }, trail: ['#59ff3a', '#a3101a', '#2b8f18'], unlock: { boss: 'hydra' } },
  { id: 'cobol', pal: { H: '#4b515e', S: '#c9cfdb', C: '#49ff6e', T: '#3a3f4a', W: '#49ff6e', L: '#c9b458', B: '#2a2e38', K: '#14161c' }, trail: ['#49ff6e', '#7dff7d', '#16502a'], unlock: { boss: 'monolith' } },
  { id: 'deadpixel', pal: { H: '#101014', S: '#2e2e3a', C: '#ff004c', T: '#16161c', W: '#00e5ff', L: '#ff004c', B: '#101014', K: '#000000' }, trail: ['#ff004c', '#00e5ff', '#000000'], unlock: { boss: 'pixel' } },
  { id: 'butcher', pal: { H: '#e8e4d8', C: '#39ffe5', T: '#e8e4d8', W: '#b3101a', L: '#b3101a', B: '#7a1016', K: '#3a0a0e' }, trail: ['#e8222a', '#8f0c16', '#6d0a12'], unlock: { streak: 100 } },
];
