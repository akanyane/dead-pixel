import { Sound } from '../core/audio';
import { Input } from '../core/input';
import { DEFAULT_BINDINGS, type Action } from '../core/input';
import { H, TILE, W, chance, clamp, dist, hashSeed, lerp, pick, shuffle, storageDel, storageGet, storageSet, withSeed } from '../core/util';
import { ACHIEVEMENTS, PLATINUM } from './achievements';
import { updateCombat, spawnPickupsForWaveClear, giveWeapon } from './combat';
import { ARCADE_BOSSES, ARCADE_POOL, ARCADE_WAVES, DIFFICULTY, MODIFIERS, type ModifierId, ENEMIES, KILL_WORDS, LEVELS, PERKS, RUN_BASE, SKINS, STREAKS, VICTIM_NAMES, WEAPONS, type Difficulty, type EnemyDef, type EnemyKind, type LevelDef, type PerkDef, type SkinDef, type WaveDef, type WeaponId } from './data';
import { LANGS, T, detectLang, getLang, setLang, type Lang } from './i18n';
import { spawnEnemy, updateEnemies, spawnBoss } from './enemies';
import { updateFx, type Gib, type Particle } from './fx';
import { GameMap, buildMap } from './map';
import { Terminal } from './terminal';

/** What last hurt the player, so the death screen can explain how to avoid it. */
export type KillerId = EnemyKind | 'deploy' | 'corrupt' | 'beam';

export interface Progress {
  beaten: EnemyKind[];
  bestStreak: number;
  deaths: number;
  seen: EnemyKind[];
  skin: string;
  notified: string[];
  runs: number;
  achievements: string[];
  kills: number;
  meleeKills: number;
  lore: string[];
  /** Seconds spent actually playing. */
  playTime: number;
  /** Shots fired per weapon. */
  shots: Record<string, number>;
  /** Deaths per killer. */
  deathsBy: Record<string, number>;
  /** Bosses defeated per boss, in any mode. */
  bossKills: Record<string, number>;
  /** Paid terminal commands run. */
  commands: number;
}

export interface Enemy {
  kind: EnemyKind;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  r: number;
  hoff: number;
  flash: number;
  t: number;
  flip: boolean;
  state: number;
  stateT: number;
  a: number;
  b: number;
  wounded: boolean;
  burn: number;
  stun: number;
  skin: number;
  speedMul: number;
  boss: boolean;
  tier: number;
  dead: boolean;
  atkCd: number;
  orbitCd: number;
  spawnT: number;
  lastX: number;
  lastY: number;
  stuckT: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
  pierce: number;
  bounce: number;
  color: string;
  size: number;
  explode: number;
  flame: boolean;
  crit: boolean;
  burn: number;
  hit: Set<Enemy> | null;
  trail: boolean;
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  dmg: number;
  color: string;
  text: string | null;
  turn: number;
  by: KillerId;
}

export interface Pickup {
  kind: 'hp' | 'ammo' | 'ram' | 'weapon';
  x: number;
  y: number;
  z: number;
  vz: number;
  life: number;
  weapon?: WeaponId;
  t: number;
}

export interface Barrel {
  x: number;
  y: number;
  hp: number;
  flash: number;
}

export interface Beam {
  x: number;
  y: number;
  a: number;
  len: number;
  w: number;
  warn: number;
  life: number;
  omega: number;
  dmg: number;
  color: string;
}

export interface Hazard {
  x: number;
  y: number;
  w: number;
  h: number;
  warn: number;
  life: number;
  dmg: number;
  style: 'deploy' | 'corrupt';
  stained: boolean;
}

export interface Puddle {
  x: number;
  y: number;
  r: number;
  life: number;
}

export interface Tracer {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  life: number;
  max: number;
  color: string;
  w: number;
}

export interface Ally {
  x: number;
  y: number;
  life: number;
  cd: number;
  walk: number;
  flip: boolean;
  aim: number;
}

export interface FloatText {
  x: number;
  y: number;
  vy: number;
  life: number;
  str: string;
  color: string;
  scale: number;
}

export interface Stats {
  dmg: number;
  rate: number;
  speed: number;
  pierce: number;
  bounce: number;
  multi: number;
  crit: number;
  boom: number;
  ramGain: number;
  gc: number;
  dashCd: number;
  dashDmg: number;
  magnet: number;
  burn: number;
  ammoMul: number;
  orbit: number;
  thorns: number;
  backup: number;
  melee: number;
}

const baseStats = (): Stats => ({ dmg: 1, rate: 1, speed: 1, pierce: 0, bounce: 0, multi: 0, crit: 0.05, boom: 0, ramGain: 1, gc: 0, dashCd: 1, dashDmg: 0, magnet: 1, burn: 0, ammoMul: 1, orbit: 0, thorns: 0, backup: 0, melee: 1 });

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  ram: number;
  maxRam: number;
  aim: number;
  flip: boolean;
  dashT: number;
  dashCd: number;
  dashX: number;
  dashY: number;
  invuln: number;
  walk: number;
  moving: boolean;
  weapon: WeaponId;
  weapons: WeaponId[];
  ammo: Record<WeaponId, number>;
  cd: number;
  meleeCd: number;
  meleeT: number;
  sudoT: number;
  overclockT: number;
  wetSteps: number;
  footAcc: number;
  footSide: boolean;
  gunKick: number;
  muzzle: number;
  slowT: number;
  orbitA: number;
  gcAcc: number;
  dead: boolean;
}

export type State = 'boot' | 'menu' | 'story' | 'play' | 'perk' | 'pause' | 'dead' | 'clear' | 'victory' | 'intro' | 'manual' | 'skins' | 'options' | 'log' | 'achievements' | 'controls' | 'stats';

/** Story, endless or daily run. The last two are "arcade": no story and a single life. */
export type Mode = 'story' | 'endless' | 'daily';

interface ArcadeBest {
  endless: { wave: number; score: number };
  daily: { date: string; wave: number; score: number };
}
type Phase = 'wave' | 'waveClear' | 'bossIntro' | 'boss' | 'bossDeath';

interface Snapshot {
  level: number;
  stats: Stats;
  perks: Record<string, number>;
  weapons: WeaponId[];
  ammo: Record<WeaponId, number>;
  maxHp: number;
  maxRam: number;
  ram: number;
  score: number;
  kills: number;
  deaths: number;
  difficulty?: Difficulty;
}

const SAVE_KEY = 'dead-pixel-save-v1';
const BEST_KEY = 'dead-pixel-best-v1';
const OPTS_KEY = 'dead-pixel-opts-v1';
const PROGRESS_KEY = 'dead-pixel-progress-v1';
const ARCADE_KEY = 'dead-pixel-arcade-v1';

/** Today's date in UTC: the daily run is the same worldwide. */
export const todayUTC = () => new Date().toISOString().slice(0, 10);

export class Game {
  input: Input;
  audio = new Sound();
  state: State = 'boot';
  time = 0;
  stateT = 0;

  map!: GameMap;
  levelIdx = 0;
  level!: LevelDef;
  mode: Mode = 'story';
  difficulty: Difficulty = 'normal';
  arcadeSeed = 0;
  arcadeStage = 0;
  /** Current arcade wave number, counted from the start of the run. */
  arcadeWave = 0;
  dailyDate = '';
  arcadeBest: ArcadeBest = { endless: { wave: 0, score: 0 }, daily: { date: '', wave: 0, score: 0 } };
  newBest = false;
  copiedT = 0;
  /** Rule of the current arcade arena, or null. */
  modifier: ModifierId | null = null;
  player!: Player;
  stats: Stats = baseStats();
  perks: Record<string, number> = {};

  enemies: Enemy[] = [];
  bosses: Enemy[] = [];
  bullets: Bullet[] = [];
  ebullets: EnemyBullet[] = [];
  parts: Particle[] = [];
  gibs: Gib[] = [];
  texts: FloatText[] = [];
  pickups: Pickup[] = [];
  barrels: Barrel[] = [];
  beams: Beam[] = [];
  hazards: Hazard[] = [];
  puddles: Puddle[] = [];
  tracers: Tracer[] = [];
  allies: Ally[] = [];
  bolts: Tracer[] = [];
  hash = new Map<number, Enemy[]>();
  wet!: Uint8Array;
  dynLights: { x: number; y: number; r: number; color: string }[] = [];

  camX = 0;
  camY = 0;
  shake = 0;
  kickX = 0;
  kickY = 0;
  hitstop = 0;
  slowmo = 0;
  timeScale = 1;
  glitch = 0;
  hurtFlash = 0;
  whiteFlash = 0;
  invert = 0;

  waveIdx = 0;
  phase: Phase = 'wave';
  phaseT = 0;
  queue: EnemyKind[] = [];
  spawnAcc = 0;
  stripT = 4;
  bossTotal = 0;
  bossDeathX = 0;
  bossDeathY = 0;
  bossBoomT = 0;

  score = 0;
  shownScore = 0;
  best = 0;
  kills = 0;
  deaths = 0;
  streak = 0;
  streakT = 0;
  maxStreak = 0;
  nextStreak = 0;
  announce: { text: string; t: number; color: string } | null = null;
  note: { text: string; t: number } | null = null;
  killLog: { text: string; t: number; color: string }[] = [];
  pid = 3000;

  perkChoices: PerkDef[] = [];
  perkHover = -1;
  afterPerk: 'wave' | 'boss' | 'level' = 'wave';
  menuIdx = 0;
  pauseIdx = 0;
  storyT = 0;
  term: Terminal;
  snapshot: Snapshot | null = null;
  rewardMsg = '';
  levelStartT = 0;
  deathT = 0;
  flowT = 0;

  goreLevel = 1.2;
  crtOn = true;
  /** Volumes in steps from 0 to 10. */
  musicVol = 7;
  sfxVol = 10;
  tipsOn = true;
  highContrast = false;
  /** Less shake, flashing and glitching, for light sensitivity or motion sickness. */
  reducedFx = false;
  /** Fewer particles and lights, for slow machines. */
  lightMode = false;
  god = false;
  bindings: Record<Action, string[]> = structuredClone(DEFAULT_BINDINGS);

  progress: Progress = { beaten: [], bestStreak: 0, deaths: 0, seen: [], skin: 'root', notified: [], runs: 0, achievements: [], kills: 0, meleeKills: 0, lore: [], playTime: 0, shots: {}, deathsBy: {}, bossKills: {}, commands: 0 };
  achievementIdx = 0;
  tookDamage = false;
  usedWeapon = false;
  usedCommand = false;
  barrelBooms: number[] = [];
  logT = 0;
  endPage = 0;
  endT = 0;
  endRun = 0;
  introQueue: EnemyKind[] = [];
  returnTo: State = 'menu';
  manualTab = 0;
  manualIdx = 0;
  skinIdx = 0;
  optionsIdx = 0;
  controlsIdx = 0;
  rebinding: Action | null = null;
  menuPage: 'main' | 'play' = 'main';
  playIdx = 1;
  lastKiller: KillerId = 'walker';
  storyTip = 0;
  toasts: { text: string; t: number }[] = [];
  private hintsShown = new Set<string>();

  constructor(input: Input) {
    this.input = input;
    input.bindings = this.bindings;
    this.term = new Terminal(this);
    this.best = Number(storageGet(BEST_KEY) ?? 0) || 0;
    const raw = storageGet(SAVE_KEY);
    if (raw) {
      try {
        this.snapshot = JSON.parse(raw, (_k, v) => (v === 'Infinity' ? Infinity : v)) as Snapshot;
      } catch {
        this.snapshot = null;
      }
    }
    try {
      const o = JSON.parse(storageGet(OPTS_KEY) ?? '{}') as { gore?: number; crt?: boolean; music?: boolean; musicVol?: number; sfxVol?: number; tips?: boolean; lang?: Lang; highContrast?: boolean; reducedFx?: boolean; lightMode?: boolean; bindings?: Partial<Record<Action, string[]>> };
      if (o.tips !== undefined) this.tipsOn = o.tips;
      if (o.highContrast !== undefined) this.highContrast = o.highContrast;
      if (o.reducedFx !== undefined) this.reducedFx = o.reducedFx;
      if (o.lightMode !== undefined) this.lightMode = o.lightMode;
      if (o.bindings) for (const a of Object.keys(DEFAULT_BINDINGS) as Action[]) if (Array.isArray(o.bindings[a]) && o.bindings[a].length) this.bindings[a] = o.bindings[a];
      setLang(o.lang && LANGS.includes(o.lang) ? o.lang : detectLang());
      if (o.gore !== undefined) this.goreLevel = o.gore;
      if (o.crt !== undefined) this.crtOn = o.crt;
      // old saves only had music on or off
      if (o.music === false) this.musicVol = 0;
      if (o.musicVol !== undefined) this.musicVol = clamp(Math.round(o.musicVol), 0, 10);
      if (o.sfxVol !== undefined) this.sfxVol = clamp(Math.round(o.sfxVol), 0, 10);
    } catch {
      setLang(detectLang());
    }
    try {
      this.arcadeBest = { ...this.arcadeBest, ...(JSON.parse(storageGet(ARCADE_KEY) ?? '{}') as Partial<ArcadeBest>) };
    } catch {
      /* no arcade records yet */
    }
    try {
      this.progress = { ...this.progress, ...(JSON.parse(storageGet(PROGRESS_KEY) ?? '{}') as Partial<Progress>) };
    } catch {
      /* fresh progress */
    }
    // returning players get what they already earned, without a flood of notices
    this.checkAchievements(true);
    this.audio.setVolumes(this.musicVol / 10, this.sfxVol / 10);
    this.map = buildMap('office');
    this.wet = new Uint8Array(this.map.w * this.map.h);
    this.player = this.newPlayer();
  }

  saveOptions() {
    this.bindings = this.input.bindings;
    storageSet(OPTS_KEY, JSON.stringify({ gore: this.goreLevel, crt: this.crtOn, musicVol: this.musicVol, sfxVol: this.sfxVol, tips: this.tipsOn, highContrast: this.highContrast, reducedFx: this.reducedFx, lightMode: this.lightMode, bindings: this.bindings, lang: getLang() }));
    this.audio.setVolumes(this.musicVol / 10, this.sfxVol / 10);
  }

  private newPlayer(): Player {
    return {
      x: 0, y: 0, hp: 100, maxHp: 100, ram: 200, maxRam: 512, aim: 0, flip: false, dashT: 0, dashCd: 0, dashX: 0, dashY: 0, invuln: 0, walk: 0, moving: false,
      weapon: 'pistol', weapons: ['pistol'],
      ammo: { pistol: Infinity, smg: 0, shotgun: 0, rail: 0, flame: 0, rocket: 0 },
      cd: 0, meleeCd: 0, meleeT: 0, sudoT: 0, overclockT: 0, wetSteps: 0, footAcc: 0, footSide: false, gunKick: 0, muzzle: 0, slowT: 0, orbitA: 0, gcAcc: 0, dead: false,
    };
  }

  /** Current run number: the first game already starts after several earlier runs. */
  run() {
    return RUN_BASE + 1 + this.progress.runs;
  }

  inEndingPages() {
    return this.state === 'victory' && this.endPage < T().ending.pages(0).length;
  }

  saveProgress() {
    storageSet(PROGRESS_KEY, JSON.stringify(this.progress));
  }

  isSkinUnlocked(s: SkinDef) {
    const u = s.unlock;
    if (!u) return true;
    return 'boss' in u ? this.progress.beaten.includes(u.boss) : this.progress.bestStreak >= u.streak;
  }

  unlock(id: string, silent = false) {
    const list = this.progress.achievements;
    if (list.includes(id)) return;
    list.push(id);
    if (!silent) {
      this.toasts.push({ text: T().hud.toastAchievement(T().achievements[id].name), t: 3.5 });
      this.audio.announce();
    }
    if (id !== PLATINUM && list.filter((a) => a !== PLATINUM).length === ACHIEVEMENTS.length - 1) this.unlock(PLATINUM, silent);
    this.saveProgress();
  }

  /** Checks the achievements that depend only on saved numbers. */
  checkAchievements(silent = false) {
    for (const a of ACHIEVEMENTS) {
      if (a.stat && a.id !== PLATINUM && !this.progress.achievements.includes(a.id)) {
        const [cur, max] = a.stat(this);
        if (cur >= max) this.unlock(a.id, silent);
      }
    }
  }

  /** Announces each newly unlocked skin exactly once. */
  private checkUnlocks() {
    for (const s of SKINS) {
      if (s.unlock && this.isSkinUnlocked(s) && !this.progress.notified.includes(s.id)) {
        this.progress.notified.push(s.id);
        this.toasts.push({ text: T().hud.toastSkin(T().skins[s.id].name), t: 3.5 });
        this.audio.command();
      }
    }
    this.saveProgress();
  }

  /** Context hint: at most once per level, and only with tips turned on. */
  hint(id: string, text: string) {
    if (!this.tipsOn || this.hintsShown.has(id)) return;
    this.hintsShown.add(id);
    this.note = { text, t: 4.5 };
  }

  private queueIntro(kinds: EnemyKind[]) {
    if (!this.tipsOn) return;
    this.introQueue = kinds.filter((k) => !this.progress.seen.includes(k));
    if (this.introQueue.length) this.setState('intro');
  }

  /** Closes the current card. When the queue is empty, the game resumes where it was. */
  nextIntro() {
    const k = this.introQueue.shift();
    if (k && !this.progress.seen.includes(k)) this.progress.seen.push(k);
    this.saveProgress();
    this.audio.ui();
    if (!this.introQueue.length) this.setState('play');
    else this.stateT = 0;
  }

  setState(s: State) {
    this.state = s;
    this.stateT = 0;
  }

  isArcade() {
    return this.mode !== 'story';
  }

  /** Current difficulty multipliers. Arcade always uses normal, so records stay comparable. */
  diff() {
    return DIFFICULTY[this.mode === 'story' ? this.difficulty : 'normal'];
  }

  /** Regular enemy HP: grows per level in the story and per wave in arcade mode. */
  enemyHpScale() {
    const base = this.isArcade() ? 1 + (this.arcadeWave - 1) * 0.06 : 1 + this.levelIdx * 0.16;
    return base * this.diff().hp * (this.modifier === 'armored' ? 1.4 : 1);
  }

  /** Boss HP: in arcade mode, every full loop through the 5 bosses makes them much stronger. */
  bossHpMul() {
    const loop = this.isArcade() ? Math.floor(this.arcadeStage / ARCADE_BOSSES.length) : 0;
    return (1 + loop * 0.8) * this.diff().hp;
  }

  enemySpeedScale() {
    const base = this.isArcade() ? 1 + Math.min(this.arcadeWave, 30) * 0.008 : 1 + this.levelIdx * 0.04;
    return base * (this.modifier === 'fast' ? 1.25 : 1);
  }

  /** Damage the player takes, after difficulty and the glass modifier. */
  damageTakenMul() {
    return this.diff().dmg * (this.modifier === 'glass' ? 2 : 1);
  }

  /** Damage enemies take: the glass modifier hits harder both ways. */
  damageDealtMul() {
    return this.modifier === 'glass' ? 1.5 : 1;
  }

  /** Picks the arena rule from the run seed, never the same twice in a row. */
  private pickModifier(stage: number): ModifierId | null {
    if (stage === 0) return null;
    // the white final arena has no lighting, so a blackout would do nothing there
    const options = (Object.keys(MODIFIERS) as ModifierId[]).filter((m) => m !== this.modifier && !(m === 'blackout' && stage % LEVELS.length === LEVELS.length - 1));
    return withSeed(this.arcadeSeed + stage * 31337, () => pick(options));
  }

  private resetRun() {
    this.modifier = null;
    this.stats = baseStats();
    this.perks = {};
    this.player = this.newPlayer();
    this.score = 0;
    this.shownScore = 0;
    this.kills = 0;
    this.deaths = 0;
    this.maxStreak = 0;
  }

  newGame(difficulty: Difficulty = this.difficulty) {
    this.mode = 'story';
    this.difficulty = difficulty;
    this.resetRun();
    this.startLevel(0);
  }

  /** Starts an arcade run. The daily run seeds from the date; endless uses a new seed each time. */
  startArcade(mode: 'endless' | 'daily') {
    this.mode = mode;
    this.dailyDate = todayUTC();
    this.arcadeSeed = mode === 'daily' ? hashSeed(`dead-pixel:${this.dailyDate}`) : Math.floor(Math.random() * 2 ** 32);
    this.arcadeStage = 0;
    this.arcadeWave = 0;
    this.newBest = false;
    this.resetRun();
    this.startStage(0);
  }

  /** An arcade arena: theme and boss cycle, with waves generated from the seed. */
  private startStage(stage: number) {
    this.arcadeStage = stage;
    this.modifier = this.pickModifier(stage);
    const i = stage % LEVELS.length;
    this.levelIdx = i;
    const boss = ARCADE_BOSSES[stage % ARCADE_BOSSES.length];
    this.level = { ...LEVELS[i], boss, reward: LEVELS[i].reward, waves: withSeed(this.arcadeSeed + stage * 7919, () => this.arcadeWaves(stage)) };
    withSeed(this.arcadeSeed + stage * 104729, () => this.prepareArena());
    this.audio.playMusic(this.level.music);
    this.setState('play');
    this.levelStartT = this.time;
    this.startWave();
    if (this.modifier) {
      const m = T().modifiers[this.modifier];
      this.note = { text: T().arcade.modifierNote(m.name, Math.round((MODIFIERS[this.modifier].score - 1) * 100), m.desc), t: 4.5 };
      this.audio.warn();
    }
  }

  private arcadeWaves(stage: number): WaveDef[] {
    const pool = ARCADE_POOL.filter((p) => p.from <= stage);
    const total = pool.reduce((n, p) => n + p.weight, 0);
    const waves: WaveDef[] = [];
    for (let w = 0; w < ARCADE_WAVES; w++) {
      const n = stage * ARCADE_WAVES + w + 1;
      const count = Math.round(16 + n * 5.5);
      const tally = new Map<EnemyKind, number>();
      for (let k = 0; k < count; k++) {
        let r = Math.random() * total;
        const pickd = pool.find((p) => (r -= p.weight) < 0) ?? pool[0];
        tally.set(pickd.kind, (tally.get(pickd.kind) ?? 0) + 1);
      }
      waves.push({ spawns: [...tally.entries()], rate: Math.min(6.5, 1.6 + n * 0.22), maxAlive: Math.min(72, Math.round(20 + n * 2.2)) });
    }
    return waves;
  }

  /** Result text to paste anywhere. */
  shareText() {
    const t = T().arcade;
    const label = this.mode === 'daily' ? t.dailyLabel(this.dailyDate) : t.endlessLabel;
    return `${t.share(label, this.arcadeWave, this.score, this.kills)}\nhttps://akanyane.github.io/dead-pixel/`;
  }

  /** Called when the player dies for good: saves arcade records and erases the save on hardcore. */
  onPlayerDeath() {
    if (this.isArcade()) {
      const b = this.arcadeBest;
      if (this.mode === 'endless') {
        if (this.arcadeWave > b.endless.wave || (this.arcadeWave === b.endless.wave && this.score > b.endless.score)) {
          b.endless = { wave: this.arcadeWave, score: this.score };
          this.newBest = true;
        }
      } else {
        if (b.daily.date !== this.dailyDate) b.daily = { date: this.dailyDate, wave: 0, score: 0 };
        if (this.arcadeWave > b.daily.wave || (this.arcadeWave === b.daily.wave && this.score > b.daily.score)) {
          b.daily = { date: this.dailyDate, wave: this.arcadeWave, score: this.score };
          this.newBest = true;
        }
      }
      storageSet(ARCADE_KEY, JSON.stringify(b));
    } else if (this.difficulty === 'hardcore') {
      this.clearSave();
    }
  }

  continueGame() {
    if (!this.snapshot) return this.newGame();
    this.mode = 'story';
    this.restore(this.snapshot);
    this.startLevel(this.snapshot.level);
  }

  private restore(s: Snapshot) {
    this.difficulty = s.difficulty ?? 'normal';
    this.stats = JSON.parse(JSON.stringify(s.stats)) as Stats;
    this.perks = { ...s.perks };
    this.player = this.newPlayer();
    this.player.weapons = [...s.weapons];
    this.player.ammo = { ...s.ammo, pistol: Infinity };
    this.player.weapon = s.weapons[s.weapons.length - 1];
    this.player.maxHp = s.maxHp;
    this.player.hp = s.maxHp;
    this.player.maxRam = s.maxRam;
    this.player.ram = s.ram;
    this.score = s.score;
    this.shownScore = s.score;
    this.kills = s.kills;
    this.deaths = s.deaths;
  }

  private takeSnapshot(level: number) {
    const p = this.player;
    this.snapshot = {
      level,
      stats: JSON.parse(JSON.stringify(this.stats)) as Stats,
      perks: { ...this.perks },
      weapons: [...p.weapons],
      ammo: { ...p.ammo },
      maxHp: p.maxHp,
      maxRam: p.maxRam,
      ram: p.ram,
      score: this.score,
      kills: this.kills,
      deaths: this.deaths,
      difficulty: this.difficulty,
    };
    storageSet(SAVE_KEY, JSON.stringify(this.snapshot, (_k, v) => (v === Infinity ? 'Infinity' : v)));
  }

  startLevel(idx: number) {
    this.levelIdx = idx;
    this.level = LEVELS[idx];
    this.takeSnapshot(idx);
    this.prepareArena();
    this.storyTip = Math.floor(Math.random() * T().manual.tips.length);
    this.setState('story');
    this.audio.playMusic(this.level.music);
  }

  /** Builds the current level's arena and clears everything from the previous one. */
  private prepareArena() {
    this.map = buildMap(this.level.theme);
    this.wet = new Uint8Array(this.map.w * this.map.h);
    this.enemies = [];
    this.bosses = [];
    this.bullets = [];
    this.ebullets = [];
    this.parts = [];
    this.gibs = [];
    this.texts = [];
    this.pickups = [];
    this.beams = [];
    this.hazards = [];
    this.puddles = [];
    this.tracers = [];
    this.bolts = [];
    this.allies = [];
    this.killLog = [];
    this.barrels = this.map.barrelSpots.map((b) => ({ x: b.x * TILE + 8, y: b.y * TILE + 12, hp: 18, flash: 0 }));
    const p = this.player;
    p.x = this.map.pxW / 2;
    p.y = this.map.pxH / 2 + 24;
    p.hp = p.maxHp;
    p.dead = false;
    p.invuln = 1.5;
    p.sudoT = 0;
    p.overclockT = 0;
    p.wetSteps = 0;
    this.camX = p.x - W / 2;
    this.camY = p.y - H / 2;
    this.streak = 0;
    this.streakT = 0;
    this.nextStreak = 0;
    this.shake = 0;
    this.hitstop = 0;
    this.slowmo = 0;
    this.timeScale = 1;
    this.glitch = 0.6;
    this.invert = 0;
    this.term.reset();
    this.map.computeFlow(p.x, p.y);
    this.waveIdx = 0;
    this.storyT = 0;
    this.hintsShown.clear();
    this.usedWeapon = false;
    this.usedCommand = false;
    this.barrelBooms = [];
  }

  beginPlay() {
    this.setState('play');
    this.levelStartT = this.time;
    this.startWave();
  }

  startWave() {
    const w = this.level.waves[this.waveIdx];
    const q: EnemyKind[] = [];
    const mul = this.diff().count * (this.modifier === 'swarm' ? 1.4 : 1);
    for (const [k, n] of w.spawns) for (let i = 0; i < Math.round(n * mul); i++) q.push(k);
    this.queue = shuffle(q);
    this.phase = 'wave';
    this.spawnAcc = 0;
    this.tookDamage = false;
    if (this.isArcade()) {
      this.arcadeWave++;
      if (this.arcadeWave >= 25) this.unlock('endless_25');
      this.note = { text: T().arcade.waveNote(this.arcadeWave), t: 2.4 };
    } else this.note = { text: `${this.waveIdx + 1}/${this.level.waves.length}: ${T().levels[this.levelIdx].notes[this.waveIdx]}`, t: 3.2 };
    this.audio.warn();
    this.queueIntro(w.spawns.map(([k]) => k));
  }

  startBoss() {
    this.phase = 'bossIntro';
    this.tookDamage = false;
    this.phaseT = 3;
    this.queue = [];
    spawnBoss(this, this.level.boss);
    this.bossTotal = this.bossHpSum();
    this.audio.bossRoar();
    this.audio.playMusic(this.level.theme === 'void' ? 'l5' : 'boss');
    this.glitch = 1;
    this.shake = 10;
    this.queueIntro([this.level.boss]);
  }

  bossHpSum() {
    return this.bosses.reduce((s, b) => s + Math.max(0, b.hp), 0) + (this.level.boss === 'hydra' ? this.hydraReserve() : 0);
  }

  /** HP still "stored" in the Hydra's future splits. */
  hydraReserve() {
    let total = 0;
    const hp = ENEMIES.hydra.hp * this.bossHpMul();
    for (const b of this.bosses) {
      if (b.tier === 3) total += 2 * hp * 0.45 + 4 * hp * 0.18;
      else if (b.tier === 2) total += 2 * hp * 0.18;
    }
    return total;
  }

  openPerks(after: 'wave' | 'boss' | 'level') {
    this.afterPerk = after;
    const avail = PERKS.filter((p) => !p.max || (this.perks[p.id] ?? 0) < p.max);
    const deal = () => shuffle([...avail]).slice(0, 3);
    // in the daily run, the same wave offers the same patches to everyone
    this.perkChoices = this.mode === 'daily' ? withSeed(this.arcadeSeed + this.arcadeWave * 131 + Object.keys(this.perks).length, deal) : deal();
    this.perkHover = 0;
    this.setState('perk');
    this.audio.ui();
  }

  applyPerk(p: PerkDef) {
    this.perks[p.id] = (this.perks[p.id] ?? 0) + 1;
    const s = this.stats;
    const pl = this.player;
    switch (p.id) {
      case 'dmg': s.dmg *= 1.25; break;
      case 'rate': s.rate *= 1.18; break;
      case 'speed': s.speed *= 1.12; break;
      case 'hp': pl.maxHp += 30; pl.hp = Math.min(pl.maxHp, pl.hp + 30); break;
      case 'pierce': s.pierce++; break;
      case 'bounce': s.bounce++; break;
      case 'multi': s.multi++; break;
      case 'crit': s.crit += 0.15; break;
      case 'boom': s.boom += 0.12; break;
      case 'ram': pl.maxRam += 256; s.ramGain *= 1.5; break;
      case 'gc': s.gc++; break;
      case 'dash': s.dashCd *= 0.75; break;
      case 'dashdmg': s.dashDmg++; break;
      case 'magnet': s.magnet *= 2.2; break;
      case 'burn': s.burn++; break;
      case 'ammo':
        s.ammoMul *= 1.5;
        for (const w of pl.weapons) if (w !== 'pistol') pl.ammo[w] = Math.floor(WEAPONS[w].ammoMax * s.ammoMul);
        break;
      case 'orbit': s.orbit++; break;
      case 'thorns': s.thorns++; break;
      case 'backup': s.backup = 1; break;
      case 'melee': s.melee *= 2; break;
    }
    this.audio.command();
    this.continueAfterPerk();
  }

  private continueAfterPerk() {
    this.setState('play');
    const after = this.afterPerk;
    if (after === 'wave') {
      this.waveIdx++;
      if (this.waveIdx < this.level.waves.length) this.startWave();
      else this.startBoss();
    } else if (after === 'level') {
      if (this.isArcade()) this.startStage(this.arcadeStage + 1);
      else if (this.levelIdx + 1 < LEVELS.length) this.startLevel(this.levelIdx + 1);
    }
  }

  nextFromClear() {
    // arcade mode has no story logs: go straight to the patches
    if (this.isArcade()) return this.openPerks('level');
    this.logT = 0;
    this.setState('log');
  }

  retry() {
    if (this.isArcade()) return this.startArcade(this.mode === 'daily' ? 'daily' : 'endless');
    if (this.difficulty === 'hardcore') return this.newGame('hardcore');
    this.deaths++;
    const d = this.deaths;
    if (this.snapshot) {
      this.restore(this.snapshot);
      this.deaths = d;
      this.startLevel(this.snapshot.level);
    } else this.newGame();
  }

  quitToMenu() {
    this.saveProgress();
    this.setState('menu');
    this.audio.playMusic('menu');
    this.audio.setMuffled(false);
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      storageSet(BEST_KEY, String(this.best));
    }
  }

  clearSave() {
    this.snapshot = null;
    storageDel(SAVE_KEY);
  }

  // ---- Game helpers ----

  addLight(x: number, y: number, r: number, color: string) {
    if (this.dynLights.length < (this.lightMode ? 10 : 48)) this.dynLights.push({ x, y, r, color });
  }

  addShake(v: number) {
    if (this.reducedFx) v *= 0.25;
    this.shake = Math.min(18, Math.max(this.shake, v));
  }

  addText(x: number, y: number, str: string, color: string, scale = 1, life = 0.7) {
    if (this.texts.length > 80) return;
    this.texts.push({ x, y, vy: -46, life, str, color, scale });
  }

  markWet(x: number, y: number, spread: number) {
    const m = this.map;
    const r = Math.ceil(spread / TILE);
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        const tx = cx + ox;
        const ty = cy + oy;
        if (tx >= 0 && ty >= 0 && tx < m.w && ty < m.h) this.wet[ty * m.w + tx] = 1;
      }
    }
  }

  registerKill(e: Enemy) {
    this.kills++;
    this.progress.kills++;
    this.streak++;
    this.streakT = 3.5;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    if (this.streak > this.progress.bestStreak) {
      this.progress.bestStreak = this.streak;
      if (this.streak === 100) this.checkUnlocks();
    }
    this.checkAchievements();
    const mult = this.multiplier();
    this.score += Math.round(e.def.score * mult * this.diff().score * (this.modifier ? MODIFIERS[this.modifier].score : 1));
    const p = this.player;
    p.ram = Math.min(p.maxRam, p.ram + e.def.ram * this.stats.ramGain);
    const next = STREAKS[this.nextStreak];
    if (next && this.streak >= next) {
      this.announce = { text: T().streaks[this.nextStreak], t: 1.6, color: pick(['#ff2a2a', '#39ffe5', '#ffd23d', '#ff2bd6']) };
      this.nextStreak++;
      this.glitch = Math.max(this.glitch, 0.5);
      this.audio.announce();
    }
    this.pid += 1 + Math.floor(Math.random() * 40);
    if (chance(e.boss ? 1 : 0.6)) {
      this.killLog.push({ text: `[${pick(['SIGKILL', 'SIGSEGV', 'SIGTERM', 'OOM'])}] ${this.victimName(e)} pid ${this.pid}`, t: 3.5, color: e.boss ? '#ff2a2a' : '#5f7a6a' });
      if (this.killLog.length > 4) this.killLog.shift();
    }
    if (chance(0.16)) this.addText(e.x, e.y - e.hoff * 2 - 4, pick(KILL_WORDS), pick(['#fff', '#ffd23d', '#ff7ad9', '#39ffe5']));
  }

  /** As the game goes on, the log stops saying "zombie" and starts saying who it was. */
  private victimName(e: Enemy) {
    const human = e.kind === 'walker' || e.kind === 'runner' || e.kind === 'recruiter' || e.kind === 'segfault' || e.kind === 'stack';
    const k = [0, 0.08, 0.35, 0.7, 1][this.levelIdx] ?? 1;
    return human && chance(k) ? pick(VICTIM_NAMES) : T().enemies[e.kind].name;
  }

  multiplier() {
    return 1 + Math.floor(this.streak / 10);
  }

  aliveCount() {
    return this.enemies.length;
  }

  // ---- Game loop ----

  updatePlay(rawDt: number) {
    const target = this.term.open ? 0.08 : this.phase === 'bossDeath' ? 0.32 : this.slowmo > 0 ? 0.3 : this.player.dead ? 0.2 : 1;
    this.timeScale = lerp(this.timeScale, target, clamp(rawDt * 14, 0, 1));
    this.slowmo = Math.max(0, this.slowmo - rawDt);
    // hitstop nearly freezes the world but keeps reading player input
    const dt = rawDt * (this.hitstop > 0 ? 0.03 : this.timeScale);
    this.hitstop = Math.max(0, this.hitstop - rawDt);
    this.dynLights.length = 0;

    this.term.update(rawDt);
    const pl = this.player;
    if (!pl.dead && pl.hp < pl.maxHp * 0.35 && pl.ram >= 200) this.hint('lowHp', T().hints.lowHp);
    else if (pl.ram >= 450) this.hint('fullRam', T().hints.fullRam);
    updateCombat(this, dt, rawDt);
    updateEnemies(this, dt);
    updateFx(this, dt);
    this.updateDirector(dt);

    if (this.streakT > 0) {
      this.streakT -= dt;
      if (this.streakT <= 0) {
        this.streak = 0;
        this.nextStreak = 0;
      }
    }
  }

  spawnPoint(): { x: number; y: number } | null {
    const p = this.player;
    for (let i = 0; i < 24; i++) {
      const s = this.map.randomFloor();
      const onScreen = s.x > this.camX - 12 && s.x < this.camX + W + 12 && s.y > this.camY - 12 && s.y < this.camY + H + 12;
      const far = dist(s.x, s.y, p.x, p.y) > 150;
      const reach = this.map.distField[Math.floor(s.y / TILE) * this.map.w + Math.floor(s.x / TILE)] >= 0;
      if (far && reach && (!onScreen || i > 18)) return s;
    }
    return null;
  }

  private updateDirector(dt: number) {
    const lvl = this.level;
    if (this.phase === 'wave') {
      const w = lvl.waves[this.waveIdx];
      this.spawnAcc += dt * w.rate;
      while (this.spawnAcc >= 1 && this.queue.length && this.enemies.length < w.maxAlive) {
        this.spawnAcc -= 1;
        const at = this.spawnPoint();
        if (!at) break;
        const group = Math.min(this.queue.length, 1 + Math.floor(Math.random() * 3));
        for (let i = 0; i < group; i++) {
          const k = this.queue.pop()!;
          spawnEnemy(this, k, at.x + (Math.random() - 0.5) * 8, at.y + (Math.random() - 0.5) * 8);
        }
      }
      if (this.spawnAcc > 2) this.spawnAcc = 2;
      if (!this.queue.length && this.enemies.length === 0) {
        this.phase = 'waveClear';
        if (!this.tookDamage) this.unlock('clean_wave');
        if (this.player.hp < this.player.maxHp * 0.1) this.unlock('close_call');
        this.phaseT = 1.3;
        this.audio.announce();
        this.note = { text: T().notes.waveClear, t: 1.3 };
        spawnPickupsForWaveClear(this);
      }
    } else if (this.phase === 'waveClear') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.openPerks('wave');
    } else if (this.phase === 'bossIntro') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.phase = 'boss';
    } else if (this.phase === 'bossDeath') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.finishLevel();
    }
    if (lvl.theme === 'production' && this.phase !== 'bossDeath' && this.phase !== 'waveClear') {
      this.stripT -= dt;
      if (this.stripT <= 0) {
        this.stripT = 4.5 + Math.random() * 3;
        const m = this.map;
        const vertical = chance(0.5);
        const p = this.player;
        const thick = TILE * 3;
        if (vertical) {
          const x = clamp(p.x + (Math.random() - 0.5) * 120 - thick / 2, TILE, m.pxW - thick - TILE);
          this.hazards.push({ x, y: 0, w: thick, h: m.pxH, warn: 1.3, life: 0.9, dmg: 22, style: 'deploy', stained: false });
        } else {
          const y = clamp(p.y + (Math.random() - 0.5) * 100 - thick / 2, TILE, m.pxH - thick - TILE);
          this.hazards.push({ x: 0, y, w: m.pxW, h: thick, warn: 1.3, life: 0.9, dmg: 22, style: 'deploy', stained: false });
        }
        this.audio.warn();
      }
    }
  }

  private finishLevel() {
    const arcade = this.isArcade();
    const bossKills = this.progress.bossKills;
    bossKills[this.level.boss] = (bossKills[this.level.boss] ?? 0) + 1;
    if (!arcade) {
      this.saveBest();
      if (!this.progress.beaten.includes(this.level.boss)) this.progress.beaten.push(this.level.boss);
      this.checkUnlocks();
    }
    if (!this.tookDamage) this.unlock('clean_boss');
    if (!this.usedWeapon) this.unlock('pistol_level');
    if (!this.usedCommand) this.unlock('no_commands');
    // a crate left on the floor must not cost the player a weapon
    for (const pk of this.pickups) if (pk.kind === 'weapon' && pk.weapon) giveWeapon(this, pk.weapon, false);
    const reward = this.level.reward;
    this.rewardMsg = '';
    if (reward) {
      giveWeapon(this, reward, false);
      this.rewardMsg = `npm install ${WEAPONS[reward].name}`;
    }
    if (!arcade && this.levelIdx === LEVELS.length - 1) {
      if (this.difficulty === 'hard' || this.difficulty === 'hardcore') this.unlock('hard_clear');
      this.clearSave();
      // the ending plays in silence, and the next run is already counted
      this.endRun = this.run();
      this.progress.runs++;
      this.saveProgress();
      this.checkAchievements();
      this.endPage = 0;
      this.endT = 0;
      this.setState('victory');
      this.audio.playMusic(null);
    } else {
      this.setState('clear');
      this.checkAchievements();
    }
  }

  beginBossDeath(x: number, y: number) {
    this.phase = 'bossDeath';
    this.phaseT = 1.5;
    this.bossDeathX = x;
    this.bossDeathY = y;
    this.bossBoomT = 0;
    this.ebullets = [];
    this.beams = [];
    this.hazards = [];
    for (const e of this.enemies) {
      if (!e.boss) {
        e.hp = Math.min(e.hp, 1);
        e.burn = 2;
      }
    }
    this.player.invuln = 3;
    this.glitch = 1;
    this.addShake(18);
    this.audio.explosion(true);
  }

  update(rawDt: number) {
    this.time += rawDt;
    this.stateT += rawDt;
    this.glitch = Math.max(0, this.glitch - rawDt * 1.6);
    this.hurtFlash = Math.max(0, this.hurtFlash - rawDt * 2.6);
    this.whiteFlash = Math.max(0, this.whiteFlash - rawDt * 3);
    this.invert = Math.max(0, this.invert - rawDt);
    if (this.announce) {
      this.announce.t -= rawDt;
      if (this.announce.t <= 0) this.announce = null;
    }
    if (this.note) {
      this.note.t -= rawDt;
      if (this.note.t <= 0) this.note = null;
    }
    // no toast over the ending: the unlocked skin waits for the last screen
    if (this.toasts.length && !this.inEndingPages()) {
      this.toasts[0].t -= rawDt;
      if (this.toasts[0].t <= 0) this.toasts.shift();
    }
    for (let i = this.killLog.length - 1; i >= 0; i--) {
      this.killLog[i].t -= rawDt;
      if (this.killLog[i].t <= 0) this.killLog.splice(i, 1);
    }
    this.shownScore = lerp(this.shownScore, this.score, clamp(rawDt * 9, 0, 1));
    if (this.state === 'play') {
      this.progress.playTime += rawDt;
      this.updatePlay(rawDt);
    }
    else if (this.state === 'dead') {
      // the world keeps going in very slow motion behind the death screen
      const dt = rawDt * 0.08;
      updateFx(this, dt);
    }
  }
}
