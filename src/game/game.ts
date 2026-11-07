import { Sound } from '../core/audio';
import { Input } from '../core/input';
import { H, TILE, W, chance, clamp, dist, lerp, pick, shuffle, storageDel, storageGet, storageSet } from '../core/util';
import { updateCombat, spawnPickupsForWaveClear, giveWeapon } from './combat';
import { ENEMIES, KILL_WORDS, LEVELS, PERKS, STREAKS, WEAPONS, type EnemyDef, type EnemyKind, type LevelDef, type PerkDef, type WeaponId } from './data';
import { spawnEnemy, updateEnemies, spawnBoss } from './enemies';
import { updateFx, type Gib, type Particle } from './fx';
import { GameMap, buildMap } from './map';
import { Terminal } from './terminal';

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

export type State = 'boot' | 'menu' | 'story' | 'play' | 'perk' | 'pause' | 'dead' | 'clear' | 'victory';
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
}

const SAVE_KEY = 'dead-pixel-save-v1';
const BEST_KEY = 'dead-pixel-best-v1';
const OPTS_KEY = 'dead-pixel-opts-v1';

export class Game {
  input: Input;
  audio = new Sound();
  state: State = 'boot';
  time = 0;
  stateT = 0;

  map!: GameMap;
  levelIdx = 0;
  level!: LevelDef;
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
  musicOn = true;
  god = false;

  constructor(input: Input) {
    this.input = input;
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
      const o = JSON.parse(storageGet(OPTS_KEY) ?? '{}') as { gore?: number; crt?: boolean; music?: boolean };
      if (o.gore !== undefined) this.goreLevel = o.gore;
      if (o.crt !== undefined) this.crtOn = o.crt;
      if (o.music !== undefined) this.musicOn = o.music;
    } catch {
      /* opções padrão */
    }
    this.audio.musicOn = this.musicOn;
    this.map = buildMap('office');
    this.wet = new Uint8Array(this.map.w * this.map.h);
    this.player = this.newPlayer();
  }

  saveOptions() {
    storageSet(OPTS_KEY, JSON.stringify({ gore: this.goreLevel, crt: this.crtOn, music: this.musicOn }));
    this.audio.musicOn = this.musicOn;
  }

  private newPlayer(): Player {
    return {
      x: 0, y: 0, hp: 100, maxHp: 100, ram: 200, maxRam: 512, aim: 0, flip: false, dashT: 0, dashCd: 0, dashX: 0, dashY: 0, invuln: 0, walk: 0, moving: false,
      weapon: 'pistol', weapons: ['pistol'],
      ammo: { pistol: Infinity, smg: 0, shotgun: 0, rail: 0, flame: 0, rocket: 0 },
      cd: 0, meleeCd: 0, meleeT: 0, sudoT: 0, overclockT: 0, wetSteps: 0, footAcc: 0, footSide: false, gunKick: 0, muzzle: 0, slowT: 0, orbitA: 0, gcAcc: 0, dead: false,
    };
  }

  setState(s: State) {
    this.state = s;
    this.stateT = 0;
  }

  newGame() {
    this.stats = baseStats();
    this.perks = {};
    this.player = this.newPlayer();
    this.score = 0;
    this.shownScore = 0;
    this.kills = 0;
    this.deaths = 0;
    this.maxStreak = 0;
    this.startLevel(0);
  }

  continueGame() {
    if (!this.snapshot) return this.newGame();
    this.restore(this.snapshot);
    this.startLevel(this.snapshot.level);
  }

  private restore(s: Snapshot) {
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
    };
    storageSet(SAVE_KEY, JSON.stringify(this.snapshot, (_k, v) => (v === Infinity ? 'Infinity' : v)));
  }

  startLevel(idx: number) {
    this.levelIdx = idx;
    this.level = LEVELS[idx];
    this.takeSnapshot(idx);
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
    this.setState('story');
    this.audio.playMusic(this.level.music);
  }

  beginPlay() {
    this.setState('play');
    this.levelStartT = this.time;
    this.startWave();
  }

  startWave() {
    const w = this.level.waves[this.waveIdx];
    const q: EnemyKind[] = [];
    for (const [k, n] of w.spawns) for (let i = 0; i < n; i++) q.push(k);
    this.queue = shuffle(q);
    this.phase = 'wave';
    this.spawnAcc = 0;
    this.note = { text: `wave ${this.waveIdx + 1}/${this.level.waves.length}: ${w.note}`, t: 3.2 };
    this.audio.warn();
  }

  startBoss() {
    this.phase = 'bossIntro';
    this.phaseT = 3;
    this.queue = [];
    spawnBoss(this, this.level.boss);
    this.bossTotal = this.bossHpSum();
    this.audio.bossRoar();
    this.audio.playMusic(this.level.theme === 'void' ? 'l5' : 'boss');
    this.glitch = 1;
    this.shake = 10;
  }

  bossHpSum() {
    return this.bosses.reduce((s, b) => s + Math.max(0, b.hp), 0) + (this.level.boss === 'hydra' ? this.hydraReserve() : 0);
  }

  /** HP ainda "guardado" nas divisões futuras da Hidra. */
  hydraReserve() {
    let total = 0;
    for (const b of this.bosses) {
      if (b.tier === 3) total += 2 * ENEMIES.hydra.hp * 0.45 + 4 * ENEMIES.hydra.hp * 0.18;
      else if (b.tier === 2) total += 2 * ENEMIES.hydra.hp * 0.18;
    }
    return total;
  }

  openPerks(after: 'wave' | 'boss' | 'level') {
    this.afterPerk = after;
    const avail = PERKS.filter((p) => !p.max || (this.perks[p.id] ?? 0) < p.max);
    this.perkChoices = shuffle([...avail]).slice(0, 3);
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
      if (this.levelIdx + 1 < LEVELS.length) this.startLevel(this.levelIdx + 1);
    }
  }

  nextFromClear() {
    this.openPerks('level');
  }

  retry() {
    this.deaths++;
    const d = this.deaths;
    if (this.snapshot) {
      this.restore(this.snapshot);
      this.deaths = d;
      this.startLevel(this.snapshot.level);
    } else this.newGame();
  }

  quitToMenu() {
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

  // ---- Helpers de jogo ----

  addLight(x: number, y: number, r: number, color: string) {
    if (this.dynLights.length < 48) this.dynLights.push({ x, y, r, color });
  }

  addShake(v: number) {
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
    this.streak++;
    this.streakT = 3.5;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    const mult = this.multiplier();
    this.score += e.def.score * mult;
    const p = this.player;
    p.ram = Math.min(p.maxRam, p.ram + e.def.ram * this.stats.ramGain);
    const next = STREAKS[this.nextStreak];
    if (next && this.streak >= next[0]) {
      this.announce = { text: next[1], t: 1.6, color: pick(['#ff2a2a', '#39ffe5', '#ffd23d', '#ff2bd6']) };
      this.nextStreak++;
      this.glitch = Math.max(this.glitch, 0.5);
      this.audio.announce();
    }
    this.pid += 1 + Math.floor(Math.random() * 40);
    if (chance(e.boss ? 1 : 0.6)) {
      this.killLog.push({ text: `[${pick(['SIGKILL', 'SIGSEGV', 'SIGTERM', 'OOM'])}] ${e.def.name} pid ${this.pid}`, t: 3.5, color: e.boss ? '#ff2a2a' : '#5f7a6a' });
      if (this.killLog.length > 4) this.killLog.shift();
    }
    if (chance(0.16)) this.addText(e.x, e.y - e.hoff * 2 - 4, pick(KILL_WORDS), pick(['#fff', '#ffd23d', '#ff7ad9', '#39ffe5']));
  }

  multiplier() {
    return 1 + Math.floor(this.streak / 10);
  }

  aliveCount() {
    return this.enemies.length;
  }

  // ---- Loop de jogo ----

  updatePlay(rawDt: number) {
    const target = this.term.open ? 0.08 : this.phase === 'bossDeath' ? 0.32 : this.slowmo > 0 ? 0.3 : this.player.dead ? 0.2 : 1;
    this.timeScale = lerp(this.timeScale, target, clamp(rawDt * 14, 0, 1));
    this.slowmo = Math.max(0, this.slowmo - rawDt);
    // hitstop quase congela o mundo, mas continua lendo a entrada do jogador
    const dt = rawDt * (this.hitstop > 0 ? 0.03 : this.timeScale);
    this.hitstop = Math.max(0, this.hitstop - rawDt);
    this.dynLights.length = 0;

    this.term.update(rawDt);
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
        this.phaseT = 1.3;
        this.audio.announce();
        this.note = { text: 'wave limpa. abrindo pull request...', t: 1.3 };
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
    this.saveBest();
    // crate esquecida no chão não pode custar uma arma
    for (const pk of this.pickups) if (pk.kind === 'weapon' && pk.weapon) giveWeapon(this, pk.weapon, false);
    const reward = this.level.reward;
    this.rewardMsg = '';
    if (reward) {
      giveWeapon(this, reward, false);
      this.rewardMsg = `npm install ${WEAPONS[reward].name}`;
    }
    if (this.levelIdx === LEVELS.length - 1) {
      this.clearSave();
      this.setState('victory');
      this.audio.playMusic('menu');
    } else {
      this.setState('clear');
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
    for (let i = this.killLog.length - 1; i >= 0; i--) {
      this.killLog[i].t -= rawDt;
      if (this.killLog[i].t <= 0) this.killLog.splice(i, 1);
    }
    this.shownScore = lerp(this.shownScore, this.score, clamp(rawDt * 9, 0, 1));
    if (this.state === 'play') this.updatePlay(rawDt);
    else if (this.state === 'dead') {
      // o mundo continua em câmera lentíssima atrás da tela de morte
      const dt = rawDt * 0.08;
      updateFx(this, dt);
    }
  }
}
