// Reference screens: manual, new enemy cards, skin selection and achievements.
import { drawText, wrap } from '../core/font';
import type { Input } from '../core/input';
import { H, W } from '../core/util';
import { ACHIEVEMENTS } from './achievements';
import { ENEMIES, LEVELS, SKINS, WEAPONS, WEAPON_ORDER, type EnemyKind } from './data';
import type { Enemy, Game } from './game';
import { bar } from './hud';
import { T } from './i18n';
import { drawEnemy } from './render';
import { SPR, drawSprite, skinSprites } from './sprites';
import { COMMANDS } from './terminal';

const REGULAR: EnemyKind[] = ['walker', 'bug', 'runner', 'recruiter', 'leak', 'leakSmall', 'nullp', 'segfault', 'stack'];
const BOSSES: EnemyKind[] = ['scrum', 'kernel', 'hydra', 'monolith', 'pixel'];

/** First level where the enemy appears, computed from the waves themselves. */
function firstLevel(kind: EnemyKind) {
  if (kind === 'leakSmall') return firstLevel('leak');
  const i = LEVELS.findIndex((l) => l.boss === kind || l.waves.some((w) => w.spawns.some(([k]) => k === kind)));
  return i + 1;
}

// ---------- Animated enemy preview ----------

const PREVIEW_SCALE: Partial<Record<EnemyKind, number>> = { walker: 4, runner: 5, bug: 6, leak: 4, leakSmall: 6, stack: 3, nullp: 4, segfault: 4, recruiter: 4, scrum: 1, kernel: 1, hydra: 2, monolith: 1, pixel: 2 };
const previews = new Map<EnemyKind, Enemy>();

function preview(kind: EnemyKind): Enemy {
  let e = previews.get(kind);
  if (!e) {
    const d = ENEMIES[kind];
    e = {
      kind, def: d, x: 0, y: 0, vx: 0, vy: 0, hp: d.hp, maxHp: d.hp, r: d.r, hoff: d.hoff, flash: 0, t: 0, flip: false,
      state: kind === 'monolith' || kind === 'pixel' ? (kind === 'pixel' ? 2 : 1) : 0, stateT: 1, a: 0, b: 0, wounded: false, burn: 0, stun: 0, skin: 0, speedMul: 1,
      boss: BOSSES.includes(kind), tier: kind === 'hydra' ? 3 : 0, dead: false, atkCd: 0, orbitCd: 0, spawnT: 0, lastX: 0, lastY: 0, stuckT: 0,
    };
    if (kind === 'pixel') e.r = 12;
    previews.set(kind, e);
  }
  return e;
}

function drawPreview(g: Game, ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = kind === 'pixel' ? '#ecece6' : '#0b1016';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2b3844';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const e = preview(kind);
  e.t = g.time;
  const k = PREVIEW_SCALE[kind] ?? 3;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, w - 2, h - 2);
  ctx.clip();
  const cy = kind === 'pixel' ? y + h / 2 : y + h - 6;
  ctx.translate(x + w / 2, cy);
  ctx.scale(k, k);
  drawEnemy(g, ctx, e);
  ctx.restore();
}

function stat(ctx: CanvasRenderingContext2D, label: string, value: string, k: number, x: number, y: number, color: string) {
  drawText(ctx, label, x, y, '#6d7f8f');
  drawText(ctx, value, x + 62 + 96, y, '#ffffff', { align: 'right' });
  bar(ctx, x + 62, y + 9, 96, 2, k, color);
}

function paragraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, chars: number, color: string) {
  const lines = wrap(text, chars);
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * 10, color));
  return y + lines.length * 10;
}

/** Enemy sheet, used in the manual and in the in-game cards. */
function enemySheet(g: Game, ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, chars: number) {
  const t = T();
  const m = t.manual;
  const info = t.enemies[kind];
  const d = ENEMIES[kind];
  const boss = BOSSES.includes(kind);
  drawPreview(g, ctx, kind, x, y, 92, 92);
  const sx = x + 100;
  drawText(ctx, info.name, sx, y, boss ? '#ff5a5a' : '#ffffff');
  drawText(ctx, info.role, sx, y + 11, '#ffd23d');
  const lvl = firstLevel(kind);
  drawText(ctx, boss ? m.boss(lvl) : m.appears(lvl), sx, y + 22, '#6d7f8f');
  const hpRef = boss ? 22000 : 300;
  stat(ctx, m.hp, String(kind === 'hydra' ? Math.round(d.hp * 2.62) : d.hp), Math.sqrt(d.hp / hpRef), sx, y + 36, '#e8222a');
  stat(ctx, m.speed, String(d.speed), d.speed / 96, sx, y + 50, '#39ffe5');
  stat(ctx, m.damage, String(d.dmg), d.dmg / 28, sx, y + 64, '#ffae3a');
  stat(ctx, m.reward, `+${d.ram}MB`, d.ram / (boss ? 200 : 24), sx, y + 78, '#39ff88');
  let ty = paragraph(ctx, info.desc, x, y + 100, chars, '#dfe6ee');
  ty += 4;
  drawText(ctx, m.howTo, x, ty, '#39ff88');
  paragraph(ctx, info.tip, x, ty + 10, chars, '#aab7c4');
}

// ---------- Manual ----------

interface Entry {
  label: string;
  draw: (x: number, y: number) => void;
}

const DETAIL_CHARS = 52;

function manualEntries(g: Game, ctx: CanvasRenderingContext2D, tab: number): Entry[] {
  const t = T();
  const m = t.manual;
  if (tab === 0 || tab === 1) {
    // names too long for the list keep only the first word; the sheet shows the full name
    const short = (n: string) => (n.length > 20 ? n.split(' ')[0] : n);
    return (tab === 0 ? REGULAR : BOSSES).map((k) => ({ label: short(t.enemies[k].name), draw: (x, y) => enemySheet(g, ctx, k, x, y, DETAIL_CHARS) }));
  }
  if (tab === 2) {
    const weaponEntries: Entry[] = WEAPON_ORDER.map((id) => ({
      label: WEAPONS[id].name,
      draw: (x, y) => {
        const d = WEAPONS[id];
        const w = t.weapons[id];
        ctx.fillStyle = '#0b1016';
        ctx.fillRect(x, y, 92, 50);
        ctx.strokeStyle = '#2b3844';
        ctx.strokeRect(x + 0.5, y + 0.5, 91, 49);
        drawSprite(ctx, SPR.guns[id], x + 46, y + 32, false, false, 4);
        const sx = x + 100;
        drawText(ctx, d.name, sx, y, '#ffffff');
        drawText(ctx, w.kind, sx, y + 11, '#ffd23d');
        const dmg = d.pellets > 1 ? `${d.dmg} x${d.pellets}` : String(d.dmg);
        stat(ctx, m.damage, dmg, (d.dmg * d.pellets) / 170, sx, y + 24, '#ffae3a');
        stat(ctx, m.rate, `${d.rate}s`, 0.07 / d.rate, sx, y + 38, '#39ffe5');
        stat(ctx, m.ammo, d.ammoMax === Infinity ? m.infinite : String(d.ammoMax), d.ammoMax === Infinity ? 1 : d.ammoMax / 800, sx, y + 52, '#39ff88');
        let ty = paragraph(ctx, w.desc, x, y + 72, DETAIL_CHARS, '#dfe6ee');
        ty += 4;
        drawText(ctx, m.howTo, x, ty, '#39ff88');
        ty = paragraph(ctx, w.tip, x, ty + 10, DETAIL_CHARS, '#aab7c4');
        drawText(ctx, m.get, x, ty + 4, '#39ff88');
        drawText(ctx, w.how, x, ty + 14, '#aab7c4');
      },
    }));
    weaponEntries.push({
      label: t.melee.name,
      draw: (x, y) => {
        drawText(ctx, t.melee.name, x, y, '#ffffff');
        drawText(ctx, t.melee.kind, x, y + 11, '#ffd23d');
        let ty = paragraph(ctx, t.melee.desc, x, y + 26, DETAIL_CHARS, '#dfe6ee');
        ty += 4;
        drawText(ctx, m.howTo, x, ty, '#39ff88');
        paragraph(ctx, t.melee.tip, x, ty + 10, DETAIL_CHARS, '#aab7c4');
      },
    });
    return weaponEntries;
  }
  if (tab === 3) {
    return COMMANDS.map((c) => ({
      label: c.name,
      draw: (x, y) => {
        drawText(ctx, c.name, x, y, '#39ff88', { scale: 2 });
        drawText(ctx, `${m.cost}: ${c.cost}MB`, x, y + 22, '#ffd23d');
        let ty = paragraph(ctx, t.commands[c.name].long, x, y + 38, DETAIL_CHARS, '#dfe6ee');
        ty += 6;
        drawText(ctx, m.aliases, x, ty, '#6d7f8f');
        paragraph(ctx, c.aliases.join(', '), x, ty + 10, DETAIL_CHARS, '#aab7c4');
      },
    }));
  }
  return m.tips.map((tip) => ({
    label: tip.title,
    draw: (x, y) => {
      drawText(ctx, tip.title, x, y, '#39ff88', { scale: 2 });
      paragraph(ctx, tip.body, x, y + 26, DETAIL_CHARS, '#dfe6ee');
    },
  }));
}

const TAB_Y = 21;
const LIST_X = 10;
const LIST_Y = 38;
const LIST_W = 128;
const ROW_H = 13;

function tabRects() {
  const tabs = T().manual.tabs;
  let x = LIST_X;
  return tabs.map((label) => {
    const w = label.length * 6 + 10;
    const r = { label, x, w };
    x += w + 3;
    return r;
  });
}

let lastMx = -1;
let lastMy = -1;

export function updateManual(g: Game, input: Input, ctx: CanvasRenderingContext2D) {
  const tabs = tabRects();
  const count = () => manualEntries(g, ctx, g.manualTab).length;
  const setTab = (i: number) => {
    g.manualTab = (i + tabs.length) % tabs.length;
    g.manualIdx = 0;
    g.audio.ui();
  };
  if (input.hit('ArrowRight', 'KeyD')) setTab(g.manualTab + 1);
  if (input.hit('ArrowLeft', 'KeyA')) setTab(g.manualTab - 1);
  if (input.hit('ArrowDown', 'KeyS')) {
    g.manualIdx = (g.manualIdx + 1) % count();
    g.audio.ui();
  }
  if (input.hit('ArrowUp', 'KeyW')) {
    g.manualIdx = (g.manualIdx - 1 + count()) % count();
    g.audio.ui();
  }
  if (input.wheel) g.manualIdx = (g.manualIdx + input.wheel + count()) % count();

  const moved = !input.usingPad && (input.mx !== lastMx || input.my !== lastMy);
  lastMx = input.mx;
  lastMy = input.my;
  if (input.leftPressed && input.my >= TAB_Y - 2 && input.my < TAB_Y + 12) {
    const i = tabs.findIndex((r) => input.mx >= r.x && input.mx < r.x + r.w);
    if (i >= 0) setTab(i);
  }
  const row = Math.floor((input.my - LIST_Y) / ROW_H);
  if (input.mx >= LIST_X && input.mx < LIST_X + LIST_W && row >= 0 && row < count() && (moved || input.leftPressed)) g.manualIdx = row;
  if (input.hit('Escape', 'Backspace') || (input.leftPressed && input.my >= H - 16)) {
    g.setState(g.returnTo);
    g.audio.ui();
  }
}

export function renderManual(g: Game, ctx: CanvasRenderingContext2D) {
  const m = T().manual;
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, `$ ${m.title}`, LIST_X, 8, '#6d8a78');

  for (const [i, r] of tabRects().entries()) {
    const on = g.manualTab === i;
    ctx.fillStyle = on ? '#39ff88' : '#111a20';
    ctx.fillRect(r.x, TAB_Y - 2, r.w, 13);
    drawText(ctx, r.label, r.x + 5, TAB_Y, on ? '#02150a' : '#aab7c4');
  }

  const entries = manualEntries(g, ctx, g.manualTab);
  entries.forEach((e, i) => {
    const on = g.manualIdx === i;
    if (on) {
      ctx.fillStyle = '#16302a';
      ctx.fillRect(LIST_X, LIST_Y + i * ROW_H - 2, LIST_W, ROW_H - 1);
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(LIST_X, LIST_Y + i * ROW_H - 2, 2, ROW_H - 1);
    }
    drawText(ctx, e.label, LIST_X + 6, LIST_Y + i * ROW_H, on ? '#ffffff' : '#8fa3bf');
  });

  ctx.fillStyle = '#16202a';
  ctx.fillRect(LIST_X + LIST_W + 5, LIST_Y - 2, 1, H - LIST_Y - 14);
  entries[Math.min(g.manualIdx, entries.length - 1)].draw(LIST_X + LIST_W + 12, LIST_Y);

  drawText(ctx, `${m.back}  |  ${m.nav}`, W / 2, H - 12, '#6d8a78', { align: 'center' });
}

// ---------- New enemy card ----------

export function updateIntro(g: Game, input: Input) {
  if (g.stateT > 0.25 && (input.hit('Enter', 'Space') || input.leftPressed)) g.nextIntro();
}

export function renderIntro(g: Game, ctx: CanvasRenderingContext2D) {
  const kind = g.introQueue[0];
  if (!kind) return;
  const t = T().intro;
  const boss = BOSSES.includes(kind);
  ctx.fillStyle = 'rgba(2,6,10,.82)';
  ctx.fillRect(0, 0, W, H);
  const w = 410;
  const h = 228;
  const x = (W - w) / 2;
  const y = 14;
  ctx.fillStyle = '#080e13';
  ctx.fillRect(x, y, w, h);
  const accent = boss ? '#ff2a2a' : '#39ff88';
  ctx.strokeStyle = accent;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, 11);
  drawText(ctx, boss ? t.newBoss : t.newEnemy, x + 5, y + 2, boss ? '#ffffff' : '#02150a');
  enemySheet(g, ctx, kind, x + 10, y + 17, 64);
  const blink = Math.floor(g.time * 2) % 2 === 0;
  drawText(ctx, t.next, W / 2, y + h - 22, blink ? '#39ff88' : '#a8ffc0', { align: 'center' });
  drawText(ctx, t.off, W / 2, y + h - 11, '#4b6655', { align: 'center' });
}

// ---------- Skins ----------

const GRID_X = 18;
const GRID_Y = 34;
const CARD_W = 84;
const CARD_H = 70;
const GAP = 6;
const COLS = 5;

function cardRect(i: number) {
  return { x: GRID_X + (i % COLS) * (CARD_W + GAP), y: GRID_Y + Math.floor(i / COLS) * (CARD_H + GAP) };
}

export function openSkins(g: Game) {
  g.skinIdx = Math.max(0, SKINS.findIndex((s) => s.id === g.progress.skin));
  g.setState('skins');
}

function equip(g: Game, i: number) {
  const s = SKINS[i];
  if (!g.isSkinUnlocked(s)) {
    g.audio.ui(false);
    return;
  }
  g.progress.skin = s.id;
  g.saveProgress();
  g.audio.command();
}

export function updateSkins(g: Game, input: Input) {
  const n = SKINS.length;
  const move = (d: number) => {
    g.skinIdx = (g.skinIdx + d + n) % n;
    g.audio.ui();
  };
  if (input.hit('ArrowRight', 'KeyD')) move(1);
  if (input.hit('ArrowLeft', 'KeyA')) move(-1);
  if (input.hit('ArrowDown', 'KeyS')) move(COLS);
  if (input.hit('ArrowUp', 'KeyW')) move(-COLS);
  const moved = !input.usingPad && (input.mx !== lastMx || input.my !== lastMy);
  lastMx = input.mx;
  lastMy = input.my;
  let hover = -1;
  for (let i = 0; i < n; i++) {
    const r = cardRect(i);
    if (input.mx >= r.x && input.mx < r.x + CARD_W && input.my >= r.y && input.my < r.y + CARD_H) hover = i;
  }
  if (hover >= 0 && (moved || input.leftPressed)) g.skinIdx = hover;
  if (input.hit('Enter', 'Space') || (input.leftPressed && hover >= 0)) equip(g, g.skinIdx);
  if (input.hit('Escape', 'Backspace') || (input.leftPressed && input.my >= H - 16)) {
    g.setState('menu');
    g.audio.ui();
  }
}

export function renderSkins(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  const u = t.skinsScreen;
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, u.title, W / 2, 10, '#f0efe8', { align: 'center', scale: 2 });

  SKINS.forEach((s, i) => {
    const { x, y } = cardRect(i);
    const on = g.skinIdx === i;
    const open = g.isSkinUnlocked(s);
    const equipped = g.progress.skin === s.id;
    ctx.fillStyle = on ? '#3a4c5c' : '#28343f';
    ctx.fillRect(x, y, CARD_W, CARD_H);
    ctx.strokeStyle = equipped ? '#39ff88' : on ? '#dfe6ee' : '#3f4f5c';
    ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);
    const frames = skinSprites(s.id, g.time);
    const fr = on && open ? 1 + (Math.floor(g.time * 7) % 2) : 0;
    const cx = x + CARD_W / 2;
    const feet = y + 56;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(cx - 10, feet - 1, 20, 2);
    if (open) {
      drawSprite(ctx, frames[fr], cx, feet, false, false, 3);
    } else {
      ctx.globalAlpha = 0.28;
      drawSprite(ctx, frames[0], cx, feet, false, true, 3);
      ctx.globalAlpha = 1;
      drawText(ctx, '?', cx, feet - 34, '#ffd23d', { align: 'center', scale: 2 });
    }
    drawText(ctx, t.skins[s.id].name.slice(0, 13), cx, y + 59, open ? (equipped ? '#39ff88' : '#ffffff') : '#8493a0', { align: 'center' });
  });

  const s = SKINS[g.skinIdx];
  const info = t.skins[s.id];
  const open = g.isSkinUnlocked(s);
  const py = GRID_Y + (CARD_H + GAP) * 2 + 2;
  drawText(ctx, info.name, GRID_X, py, '#ffffff');
  const tag = !open ? u.locked : g.progress.skin === s.id ? u.equipped : u.equip;
  drawText(ctx, tag, W - GRID_X, py, !open ? '#ffd23d' : '#39ff88', { align: 'right' });
  drawText(ctx, wrap(info.desc, 74)[0], GRID_X, py + 11, '#aab7c4');
  if (!open && info.unlock) drawText(ctx, `${u.howTo}: ${info.unlock}`, GRID_X, py + 22, '#ffd23d');
  drawText(ctx, u.nav, W / 2, H - 12, '#6d8a78', { align: 'center' });
}

// ---------- Achievements ----------

const ACH_X = 10;
const ACH_Y = 38;
const ACH_W = 156;
const ACH_ROW = 13;
const ACH_VISIBLE = 16;

function achScroll(idx: number) {
  return Math.max(0, Math.min(ACHIEVEMENTS.length - ACH_VISIBLE, idx - Math.floor(ACH_VISIBLE / 2)));
}

export function openAchievements(g: Game, from: 'menu' | 'pause') {
  g.returnTo = from;
  g.achievementIdx = 0;
  g.setState('achievements');
}

export function updateAchievements(g: Game, input: Input) {
  const n = ACHIEVEMENTS.length;
  const move = (d: number) => {
    g.achievementIdx = (g.achievementIdx + d + n) % n;
    g.audio.ui();
  };
  if (input.hit('ArrowDown', 'KeyS')) move(1);
  if (input.hit('ArrowUp', 'KeyW')) move(-1);
  if (input.wheel) g.achievementIdx = Math.max(0, Math.min(n - 1, g.achievementIdx + input.wheel));
  const moved = !input.usingPad && (input.mx !== lastMx || input.my !== lastMy);
  lastMx = input.mx;
  lastMy = input.my;
  const row = Math.floor((input.my - ACH_Y + 2) / ACH_ROW);
  const scroll = achScroll(g.achievementIdx);
  if (input.mx >= ACH_X && input.mx < ACH_X + ACH_W && row >= 0 && row < ACH_VISIBLE && (moved || input.leftPressed)) {
    g.achievementIdx = Math.min(n - 1, scroll + row);
  }
  if (input.hit('Escape', 'Backspace') || (input.leftPressed && input.my >= H - 16)) {
    g.setState(g.returnTo);
    g.audio.ui();
  }
}

function trophy(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, on: boolean) {
  const rows = ['.GGGGGGGG.', 'GGGGGGGGGG', 'G.GGGGGG.G', 'GGGGGGGGGG', '..GGGGGG..', '...GGGG...', '....GG....', '....GG....', '..DDDDDD..', '..DDDDDD..'];
  rows.forEach((r, ry) => {
    for (let rx = 0; rx < r.length; rx++) {
      if (r[rx] === '.') continue;
      ctx.fillStyle = on ? (r[rx] === 'G' ? (rx < 4 ? '#ffe680' : '#ffd23d') : '#a87a12') : r[rx] === 'G' ? '#3b4650' : '#2b343c';
      ctx.fillRect(x + rx * s, y + ry * s, s, s);
    }
  });
}

export function renderAchievements(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  const u = t.achievementsScreen;
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, W, H);
  const done = g.progress.achievements;
  const total = ACHIEVEMENTS.length;
  drawText(ctx, t.menu.achievements, ACH_X, 9, '#f0efe8', { scale: 2 });
  drawText(ctx, `${done.length}/${total} ${u.count}`, W - ACH_X, 9, '#ffd23d', { align: 'right' });
  bar(ctx, W - ACH_X - 120, 20, 120, 3, done.length / total, '#ffd23d');

  const scroll = achScroll(g.achievementIdx);
  ACHIEVEMENTS.slice(scroll, scroll + ACH_VISIBLE).forEach((a, i) => {
    const idx = scroll + i;
    const on = g.achievementIdx === idx;
    const got = done.includes(a.id);
    const y = ACH_Y + i * ACH_ROW;
    if (on) {
      ctx.fillStyle = '#16302a';
      ctx.fillRect(ACH_X, y - 2, ACH_W, ACH_ROW - 1);
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(ACH_X, y - 2, 2, ACH_ROW - 1);
    }
    trophy(ctx, ACH_X + 5, y - 1, 1, got);
    const name = a.hidden && !got ? u.hiddenName : t.achievements[a.id].name;
    drawText(ctx, name, ACH_X + 19, y, got ? '#ffffff' : on ? '#aab7c4' : '#6d7f8f');
  });
  if (scroll > 0) drawText(ctx, '^', ACH_X + ACH_W - 8, ACH_Y - 11, '#6d8a78');
  if (scroll + ACH_VISIBLE < total) drawText(ctx, 'v', ACH_X + ACH_W - 8, ACH_Y + ACH_VISIBLE * ACH_ROW - 3, '#6d8a78');

  ctx.fillStyle = '#16202a';
  ctx.fillRect(ACH_X + ACH_W + 5, ACH_Y - 2, 1, H - ACH_Y - 14);

  const a = ACHIEVEMENTS[g.achievementIdx];
  const got = done.includes(a.id);
  const masked = !!a.hidden && !got;
  const x = ACH_X + ACH_W + 14;
  ctx.fillStyle = '#0b1016';
  ctx.fillRect(x, ACH_Y, 56, 56);
  ctx.strokeStyle = got ? '#ffd23d' : '#2b3844';
  ctx.strokeRect(x + 0.5, ACH_Y + 0.5, 55, 55);
  trophy(ctx, x + 8, ACH_Y + 8, 4, got);
  drawText(ctx, masked ? u.hiddenName : t.achievements[a.id].name, x + 64, ACH_Y + 4, got ? '#ffd23d' : '#ffffff');
  drawText(ctx, got ? u.unlocked : u.locked, x + 64, ACH_Y + 16, got ? '#39ff88' : '#6d7f8f');
  paragraph(ctx, masked ? u.hiddenDesc : t.achievements[a.id].desc, x, ACH_Y + 68, 47, '#dfe6ee');
  if (a.stat && !masked && !got) {
    const [cur, max] = a.stat(g);
    if (max > 1) {
      drawText(ctx, u.progress, x, ACH_Y + 112, '#39ff88');
      drawText(ctx, `${Math.min(cur, max)}/${max}`, W - ACH_X, ACH_Y + 112, '#ffffff', { align: 'right' });
      bar(ctx, x, ACH_Y + 123, W - ACH_X - x, 4, cur / max, '#39ff88');
    }
  }
  drawText(ctx, u.nav, W / 2, H - 12, '#6d8a78', { align: 'center' });
}

// ---------- Stats ----------

/** Key with the highest count in a record, or null when it is empty. */
function topKey(rec: Record<string, number>): string | null {
  let best: string | null = null;
  for (const [k, v] of Object.entries(rec)) if (v > 0 && (best === null || v > rec[best])) best = k;
  return best;
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m ${String(Math.floor(seconds % 60)).padStart(2, '0')}s`;
}

export function renderStats(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  const s = t.statsScreen;
  const P = g.progress;
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, s.title, W / 2, 14, '#f0efe8', { align: 'center', scale: 2 });
  const killer = topKey(P.deathsBy);
  const killerName = killer ? (killer in t.enemies ? t.enemies[killer as EnemyKind].name : t.killers[killer as 'deploy' | 'corrupt' | 'beam']?.name ?? killer) : s.none;
  const weapon = topKey(P.shots);
  const shots = Object.values(P.shots).reduce((n, v) => n + v, 0);
  const bosses = Object.values(P.bossKills).reduce((n, v) => n + v, 0);
  const eb = g.arcadeBest.endless;
  const db = g.arcadeBest.daily;
  const today = new Date().toISOString().slice(0, 10);
  const rows: [string, string][] = [
    [s.playTime, fmtDuration(P.playTime)],
    [s.kills, String(P.kills)],
    [s.melee, String(P.meleeKills)],
    [s.deaths, String(P.deaths)],
    [s.killedBy, P.deaths ? `${killerName} (${P.deathsBy[killer!]})` : s.none],
    [s.weapon, weapon ? `${WEAPONS[weapon as keyof typeof WEAPONS].name} (${P.shots[weapon]})` : s.none],
    [s.shots, String(shots)],
    [s.commands, String(P.commands)],
    [s.streak, String(P.bestStreak)],
    [s.endings, String(P.runs)],
    [s.bosses, String(bosses)],
    [s.endless, eb.wave ? `${eb.wave}  (${eb.score})` : s.none],
    [s.daily, db.date === today && db.wave ? `${db.wave}  (${db.score})` : s.none],
  ];
  rows.forEach(([label, value], i) => {
    const y = 42 + i * 14;
    if (i % 2 === 0) {
      ctx.fillStyle = '#0b1218';
      ctx.fillRect(60, y - 3, W - 120, 13);
    }
    drawText(ctx, label, 70, y, '#8fa3bf');
    drawText(ctx, value, W - 70, y, '#ffffff', { align: 'right' });
  });
  drawText(ctx, s.nav, W / 2, H - 12, '#6d8a78', { align: 'center' });
}

export function updateStats(g: Game, input: Input) {
  if (input.hit('Escape', 'Backspace', 'Enter') || (input.leftPressed && g.stateT > 0.2)) {
    g.audio.ui();
    g.setState('menu');
  }
}
