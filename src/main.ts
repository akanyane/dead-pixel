import { Presenter } from './core/crt';
import { drawText, wrap } from './core/font';
import { ACTIONS, Input, TOUCH_BUTTONS, keyLabel } from './core/input';
import { H, W, makeCanvas, rand } from './core/util';
import { DIFFICULTIES } from './game/data';
import { Game, todayUTC } from './game/game';
import { advanceEnding, logDone, renderClear, renderDead, renderHud, renderLog, renderPause, renderPerks, renderStory, renderToast, renderVictory, storyDuration } from './game/hud';
import { LANGS, T, getLang, setLang } from './game/i18n';
import { renderWorld } from './game/render';
import { openAchievements, openSkins, renderAchievements, renderIntro, renderManual, renderSkins, updateAchievements, updateIntro, updateManual, updateSkins } from './game/screens';
import { SPR, buildSprites, drawSprite, skinSprites } from './game/sprites';

const screen = document.getElementById('screen') as HTMLCanvasElement;
const [buffer, ctx] = makeCanvas(W, H);
buildSprites();

const input = new Input(screen);
const presenter = new Presenter(screen, buffer);
const game = new Game(input);
presenter.crtEnabled = game.crtOn;

input.onFirstGesture = () => game.audio.init();
// total kills must not be lost if the tab is closed in the middle of a level
window.addEventListener('pagehide', () => game.saveProgress());

const params = new URLSearchParams(location.search);
if (import.meta.env.DEV) {
  (window as unknown as { __g: Game }).__g = game;
  if (params.has('god')) game.god = true;
}

// ---------- Menu ----------

const drips = Array.from({ length: 34 }, () => ({ x: Math.floor(rand(92, 388)), len: rand(0, 18), speed: rand(1, 8), w: Math.random() < 0.3 ? 2 : 1 }));
const parade = Array.from({ length: 9 }, (_, i) => ({ x: rand(-40, W + 40), s: i % 4, speed: rand(8, 20), t: rand(5) }));

/** `adjust` lets a row respond to left and right arrows, like the volume rows. */
type MenuItem = { label: string; act: () => void; adjust?: (d: number) => void; dim?: boolean; desc?: string[] };

function goreName() {
  const l = T().options.goreLevels;
  return game.goreLevel >= 1.2 ? l.max : game.goreLevel >= 0.8 ? l.normal : l.low;
}

function cycleGore() {
  game.goreLevel = game.goreLevel >= 1.2 ? 0.3 : game.goreLevel >= 0.8 ? 1.2 : 0.9;
  game.saveOptions();
}

function cycleLang() {
  setLang(LANGS[(LANGS.indexOf(getLang()) + 1) % LANGS.length]);
  game.saveOptions();
}

const onOff = (v: boolean) => (v ? T().options.on : T().options.off);

/** Text volume bar, drawn with the game font. */
const volBar = (v: number) => `${'|'.repeat(v)}${'.'.repeat(10 - v)} ${v * 10}%`;

function setVolume(kind: 'musicVol' | 'sfxVol', v: number) {
  game[kind] = Math.max(0, Math.min(10, v));
  game.saveOptions();
  if (kind === 'sfxVol') game.audio.ui();
}

function openManual(from: 'menu' | 'pause') {
  game.returnTo = from;
  game.setState('manual');
}

function openControls() {
  game.controlsIdx = 0;
  game.rebinding = null;
  game.setState('controls');
}

/** Copies the arcade result to the clipboard and shows a notice. */
function copyResult() {
  const text = game.shareText();
  const done = () => game.toasts.push({ text: T().arcade.copied, t: 2 });
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => undefined);
}

function openOptions(from: 'menu' | 'pause') {
  game.returnTo = from;
  game.optionsIdx = 0;
  game.setState('options');
}

// The language label is bilingual on purpose: people who cannot read the current language must still find it.
const langLabel = () => `IDIOMA / LANGUAGE: ${T().langName}`;

function menuItems(): MenuItem[] {
  const t = T();
  const items: MenuItem[] = [];
  if (game.snapshot) {
    const lv = game.snapshot.level;
    items.push({ label: t.menu.continue(lv + 1, t.levels[lv].title), act: () => game.continueGame() });
  }
  items.push({ label: t.menu.newGame, act: () => { game.menuPage = 'play'; game.playIdx = 1; } });
  items.push({ label: t.menu.skins, act: () => openSkins(game) });
  items.push({ label: t.menu.achievements, act: () => openAchievements(game, 'menu') });
  items.push({ label: t.menu.manual, act: () => openManual('menu') });
  items.push({ label: t.menu.options, act: () => openOptions('menu') });
  items.push({ label: langLabel(), act: cycleLang });
  return items;
}

/** PLAY submenu: story difficulties, endless mode and the daily run. */
function playItems(): MenuItem[] {
  const t = T();
  const m = t.modes;
  const items: MenuItem[] = DIFFICULTIES.map((d) => ({
    label: m.story(m.difficulty[d]),
    act: () => game.newGame(d),
    desc: [m.difficultyDesc[d], ...(game.snapshot ? [m.replaceSave] : [])],
  }));
  const unlocked = game.progress.beaten.includes('pixel');
  const eb = game.arcadeBest.endless;
  items.push({
    label: m.endless,
    dim: !unlocked,
    act: () => {
      if (unlocked) game.startArcade('endless');
      else game.audio.ui(false);
    },
    desc: unlocked ? [m.endlessDesc, ...(eb.wave ? [m.best(eb.wave, eb.score)] : [])] : [m.locked],
  });
  const db = game.arcadeBest.daily;
  const today = todayUTC();
  items.push({ label: m.daily(today), act: () => game.startArcade('daily'), desc: [m.dailyDesc, ...(db.date === today && db.wave ? [m.best(db.wave, db.score)] : [])] });
  items.push({ label: m.back, act: () => { game.menuPage = 'main'; } });
  return items;
}

function controlItems(): MenuItem[] {
  const c = T().controlsScreen;
  const items: MenuItem[] = ACTIONS.map((a) => ({
    label: `${c.actions[a].padEnd(10)} ${game.rebinding === a ? '...' : input.bindings[a].map(keyLabel).join(' / ')}`,
    act: () => { game.rebinding = a; },
  }));
  items.push({ label: c.reset, act: () => { input.resetBindings(); game.saveOptions(); } });
  items.push({ label: T().options.back, act: () => game.setState('options') });
  return items;
}

function optionItems(): MenuItem[] {
  const o = T().options;
  return [
    { label: `${o.gore}: ${goreName()}`, act: cycleGore },
    { label: `${o.music}: ${volBar(game.musicVol)}`, act: () => setVolume('musicVol', (game.musicVol + 1) % 11), adjust: (d) => setVolume('musicVol', game.musicVol + d) },
    { label: `${o.sfx}: ${volBar(game.sfxVol)}`, act: () => setVolume('sfxVol', (game.sfxVol + 1) % 11), adjust: (d) => setVolume('sfxVol', game.sfxVol + d) },
    { label: `${o.crt}: ${onOff(game.crtOn)}`, act: () => { game.crtOn = !game.crtOn; presenter.crtEnabled = game.crtOn; game.saveOptions(); } },
    { label: `${o.tips}: ${onOff(game.tipsOn)}`, act: () => { game.tipsOn = !game.tipsOn; game.saveOptions(); } },
    { label: `${o.highContrast}: ${onOff(game.highContrast)}`, act: () => { game.highContrast = !game.highContrast; game.saveOptions(); } },
    { label: o.controls, act: openControls },
    { label: langLabel(), act: cycleLang },
    { label: o.back, act: () => game.setState(game.returnTo) },
  ];
}

function pauseItems(): MenuItem[] {
  const t = T();
  return [
    { label: t.pause.resume, act: () => { game.setState('play'); game.audio.setMuffled(false); } },
    { label: t.menu.manual.split(':')[0], act: () => openManual('pause') },
    { label: t.menu.achievements, act: () => openAchievements(game, 'pause') },
    { label: t.menu.options, act: () => openOptions('pause') },
    { label: t.pause.quit, act: () => game.quitToMenu() },
  ];
}

let lastMx = -1;
let lastMy = -1;

/** Shared menu navigation: keyboard, hover and click. Returns the selected index. */
function runList(items: MenuItem[], idx: number, y: number, rowH: number, halfW: number): number {
  const n = items.length;
  let i = Math.min(idx, n - 1);
  if (input.hit('ArrowDown', 'KeyS')) {
    i = (i + 1) % n;
    game.audio.ui();
  }
  if (input.hit('ArrowUp', 'KeyW')) {
    i = (i - 1 + n) % n;
    game.audio.ui();
  }
  const row = Math.floor((input.my - y + 2) / rowH);
  const inside = row >= 0 && row < n && Math.abs(input.mx - W / 2) < halfW;
  // with a gamepad, a resting mouse position must not steal the selection
  if (inside && !input.usingPad && (input.mx !== lastMx || input.my !== lastMy)) i = row;
  lastMx = input.mx;
  lastMy = input.my;
  const adjust = items[i].adjust;
  if (adjust && input.hit('ArrowLeft', 'KeyA')) adjust(-1);
  if (adjust && input.hit('ArrowRight', 'KeyD')) adjust(1);
  if (input.hit('Enter', 'Space') || (input.leftPressed && inside)) {
    game.audio.ui();
    items[inside && input.leftPressed ? row : i].act();
  }
  return i;
}

function drawList(items: MenuItem[], idx: number, y: number, rowH: number, halfW: number) {
  items.forEach((it, i) => {
    const on = idx === i;
    if (on) {
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(W / 2 - halfW, y + i * rowH - 2, halfW * 2, rowH - 2);
    }
    drawText(ctx, it.label, W / 2, y + i * rowH, on ? '#02150a' : it.dim ? '#4a5560' : '#dfe6ee', { align: 'center' });
  });
}

const MENU_Y = 122;
const MENU_ROW = 14;
const OPT_Y = 62;
const CTRL_Y = 46;
const CTRL_ROW = 13;

function renderOptions() {
  if (game.returnTo === 'menu') {
    ctx.fillStyle = '#05080c';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = 'rgba(2,6,10,.9)';
    ctx.fillRect(0, 0, W, H);
  }
  drawText(ctx, T().options.title, W / 2, 34, '#f0efe8', { align: 'center', scale: 3 });
  drawList(optionItems(), game.optionsIdx, OPT_Y, 16, 130);
  drawText(ctx, T().options.adjust, W / 2, H - 22, '#6d8a78', { align: 'center' });
}

function renderControls() {
  const c = T().controlsScreen;
  ctx.fillStyle = game.returnTo === 'menu' ? '#05080c' : 'rgba(2,6,10,.94)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, c.title, W / 2, 16, '#f0efe8', { align: 'center', scale: 2 });
  drawList(controlItems(), game.controlsIdx, CTRL_Y, CTRL_ROW, 150);
  drawText(ctx, game.rebinding ? c.press : c.nav, W / 2, 186, game.rebinding ? '#ffd23d' : '#6d8a78', { align: 'center' });
  c.gamepad.forEach((l, i) => drawText(ctx, l, W / 2, 210 + i * 11, '#8fa3bf', { align: 'center' }));
}

/** Controls hint for the device in use. */
function controlsHint() {
  if (input.touchActive) return T().touch.hint;
  if (input.usingPad) return T().pad.hint;
  return T().menu.controls;
}

/** On-screen sticks and buttons, only while playing by touch. */
function renderTouchControls() {
  const tt = T().touch;
  const labels: Record<string, string> = { dash: tt.dash, melee: tt.melee, weapon: tt.weapon, terminal: '>_', pause: 'II' };
  ctx.save();
  for (const b of TOUCH_BUTTONS) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#0c1a12';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#39ff88';
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    drawText(ctx, labels[b.id], b.x, b.y - 3, '#a8ffc0', { align: 'center' });
  }
  for (const st of [input.moveStick, input.aimStick]) {
    if (!st) continue;
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#dfe6ee';
    ctx.beginPath();
    ctx.arc(st.ox, st.oy, 26, 0, 7);
    ctx.stroke();
    const dx = st.x - st.ox;
    const dy = st.y - st.oy;
    const d = Math.hypot(dx, dy);
    const k = d > 26 ? 26 / d : 1;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath();
    ctx.arc(st.ox + dx * k, st.oy + dy * k, 9, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}

let runnerX = 60;

function renderMenu(dt: number) {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);
  // background stains
  ctx.fillStyle = '#0d0a0d';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);

  // horde in the background
  for (const z of parade) {
    z.x += z.speed * dt;
    z.t += dt;
    if (z.x > W + 30) z.x = -30;
    const fr = Math.floor(z.t * 5) % 2;
    ctx.globalAlpha = 0.55;
    drawSprite(ctx, SPR.zombies[z.s].walk[fr], z.x, H - 8);
    ctx.globalAlpha = 1;
  }
  // you, in the chosen skin, running ahead of the horde
  runnerX += 30 * dt;
  if (runnerX > W + 30) runnerX = -30;
  drawSprite(ctx, skinSprites(game.progress.skin, game.time)[1 + (Math.floor(game.time * 8) % 2)], runnerX, H - 8);
  ctx.fillStyle = '#2a0408';
  ctx.fillRect(0, H - 8, W, 8);

  // dripping title
  const title = 'DEAD PIXEL';
  const ty = 34;
  const gl = Math.random() < 0.06 ? rand(-3, 3) : 0;
  drawText(ctx, title, W / 2 - 2 + gl, ty, '#00e5ff', { align: 'center', scale: 5, alpha: 0.65 });
  drawText(ctx, title, W / 2 + 2 - gl, ty, '#ff004c', { align: 'center', scale: 5, alpha: 0.65 });
  drawText(ctx, title, W / 2, ty, '#f0efe8', { align: 'center', scale: 5 });
  for (const d of drips) {
    d.len += d.speed * dt;
    if (d.len > 70) {
      d.len = 0;
      d.x = Math.floor(rand(92, 388));
    }
    ctx.fillStyle = '#b3101a';
    ctx.fillRect(d.x, ty + 28, d.w, Math.floor(d.len));
    ctx.fillStyle = '#e8222a';
    ctx.fillRect(d.x, ty + 28 + Math.floor(d.len), d.w, 2);
  }
  // the dead pixel itself, in the middle of the title
  ctx.fillStyle = '#000';
  ctx.fillRect(W / 2 - 1, ty + 12, 3, 3);

  drawText(ctx, T().menu.tagline, W / 2, 90, '#8fa3bf', { align: 'center' });
  drawText(ctx, T().menu.best(game.best), W / 2, 103, '#ffd23d', { align: 'center' });
  if (game.menuPage === 'play') {
    const items = playItems();
    drawList(items, game.playIdx, MENU_Y, MENU_ROW, 150);
    const desc = items[Math.min(game.playIdx, items.length - 1)].desc ?? [];
    desc.flatMap((l) => wrap(l, 74)).slice(0, 3).forEach((l, i) => drawText(ctx, l, W / 2, 224 + i * 10, i === 0 ? '#aab7c4' : '#ffd23d', { align: 'center' }));
    return;
  }
  drawList(menuItems(), game.menuIdx, MENU_Y, MENU_ROW, 150);
  drawText(ctx, controlsHint(), W / 2, H - 22, '#6d8a78', { align: 'center' });
}

// ---------- Boot ----------

const bootLog = () => [
  '[    0.000000] vesper-os 4.1.2 (root@lazaro) #1 SMP FRI 17:58',
  '[    0.004231] Memory: 512MB available, 99.9% reserved',
  `[    0.113370] lazaro: restore point loaded. run ${String(game.run()).padStart(4, '0')}`,
  '[    0.218801] display: 1 dead pixel at (240, 135)',
  '[    0.420000] display: do not look.',
  '[    0.666666] proc[3000]: <defunct>',
  '[    0.666667] proc[3001]: <defunct>',
  '[    0.666668] proc[3002]: <defunct>',
  '[    0.667000] WARNING: 412 processes not responding',
];

function renderBoot() {
  ctx.fillStyle = '#020304';
  ctx.fillRect(0, 0, W, H);
  const n = Math.floor(game.stateT * 7);
  bootLog().slice(0, n).forEach((l, i) => drawText(ctx, l, 10, 12 + i * 10, i >= 5 ? '#ff5a5a' : '#8fa3bf'));
  if (n > 9) {
    if (Math.floor(game.time * 2) % 2) drawText(ctx, T().boot.press, W / 2, 190, '#39ff88', { align: 'center' });
    drawText(ctx, T().boot.warning, W / 2, 232, '#3b5245', { align: 'center' });
    if (matchMedia('(pointer: coarse)').matches) drawText(ctx, T().boot.touch, W / 2, 212, '#ffd23d', { align: 'center' });
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(W / 2, H / 2, 1, 1);
}

function crosshair() {
  const x = Math.round(input.mx);
  const y = Math.round(input.my);
  const p = game.player;
  const gap = game.state === 'play' ? 3 + Math.round(p.gunKick * 1.4) : 2;
  const color = game.map.theme === 'void' && game.state === 'play' ? '#000' : '#fff';
  ctx.fillStyle = '#000';
  ctx.fillRect(x - gap - 4, y - 1, 4, 3);
  ctx.fillRect(x + gap + 1, y - 1, 4, 3);
  ctx.fillRect(x - 1, y - gap - 4, 3, 4);
  ctx.fillRect(x - 1, y + gap + 1, 3, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - gap - 3, y, 3, 1);
  ctx.fillRect(x + gap + 1, y, 3, 1);
  ctx.fillRect(x, y - gap - 3, 1, 3);
  ctx.fillRect(x, y + gap + 1, 1, 3);
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(x, y, 1, 1);
}

// ---------- State machine ----------

function handleInput(dt: number) {
  switch (game.state) {
    case 'boot':
      if ((input.typed.length > 0 || input.leftPressed || input.rightPressed) && game.stateT > 0.1) {
        game.quitToMenu();
      }
      break;
    case 'menu':
      if (game.menuPage === 'play') {
        if (input.hit('Escape', 'Backspace')) game.menuPage = 'main';
        else game.playIdx = runList(playItems(), game.playIdx, MENU_Y, MENU_ROW, 150);
      } else game.menuIdx = runList(menuItems(), game.menuIdx, MENU_Y, MENU_ROW, 150);
      break;
    case 'controls':
      if (game.rebinding) {
        const code = input.lastCode;
        if (code === 'Escape') game.rebinding = null;
        else if (code) {
          input.rebind(game.rebinding, code);
          game.rebinding = null;
          game.saveOptions();
          game.audio.ui();
        }
      } else {
        game.controlsIdx = runList(controlItems(), game.controlsIdx, CTRL_Y, CTRL_ROW, 150);
        if (input.hit('Escape') && game.state === 'controls') game.setState('options');
      }
      break;
    case 'options':
      game.optionsIdx = runList(optionItems(), game.optionsIdx, OPT_Y, 16, 130);
      if (input.hit('Escape')) game.setState(game.returnTo);
      break;
    case 'manual':
      updateManual(game, input, ctx);
      break;
    case 'skins':
      updateSkins(game, input);
      break;
    case 'achievements':
      updateAchievements(game, input);
      break;
    case 'intro':
      updateIntro(game, input);
      break;
    case 'log':
      game.logT += dt;
      if (game.stateT > 0.3 && (input.hit('Enter', 'Space') || input.leftPressed)) {
        if (logDone(game)) game.openPerks('level');
        else game.logT = 999;
      }
      break;
    case 'story': {
      game.storyT += dt;
      const skip = input.hit('Enter', 'Space') || input.leftPressed;
      if (game.stateT > 0.2 && skip) {
        if (game.storyT < storyDuration(game)) game.storyT = storyDuration(game) + 1;
        else game.beginPlay();
      }
      break;
    }
    case 'perk': {
      const cw = 138;
      const gap = 10;
      const sx = (W - (cw * 3 + gap * 2)) / 2;
      let hover = -1;
      for (let i = 0; i < game.perkChoices.length; i++) {
        const x = sx + i * (cw + gap);
        if (input.mx >= x && input.mx < x + cw && input.my >= 62 && input.my < 178) hover = i;
      }
      // the mouse only changes the selection when it moves, so it does not fight the keyboard and gamepad
      if (hover >= 0 && !input.usingPad && (input.mx !== lastMx || input.my !== lastMy)) game.perkHover = hover;
      lastMx = input.mx;
      lastMy = input.my;
      const n = game.perkChoices.length;
      if (input.hit('ArrowRight', 'KeyD')) game.perkHover = (Math.max(0, game.perkHover) + 1) % n;
      if (input.hit('ArrowLeft', 'KeyA')) game.perkHover = (Math.max(0, game.perkHover) - 1 + n) % n;
      if (game.stateT > 0.3) {
        let choice = -1;
        if (input.hit('Digit1')) choice = 0;
        if (input.hit('Digit2')) choice = 1;
        if (input.hit('Digit3')) choice = 2;
        if (input.hit('Enter', 'Space') && game.perkHover >= 0) choice = game.perkHover;
        if (input.leftPressed && hover >= 0) choice = hover;
        if (choice >= 0 && game.perkChoices[choice]) game.applyPerk(game.perkChoices[choice]);
      }
      break;
    }
    case 'play':
      if (input.actHit('pause') && !game.term.open && !game.term.justClosed) {
        game.pauseIdx = 0;
        game.setState('pause');
        game.audio.setMuffled(true);
      }
      break;
    case 'pause':
      game.pauseIdx = runList(pauseItems(), game.pauseIdx, 96, 16, 92);
      if ((input.hit('Escape') || input.actHit('pause')) && game.stateT > 0.05 && game.state === 'pause') {
        game.setState('play');
        game.audio.setMuffled(false);
      }
      break;
    case 'dead': {
      // touch: the bottom line goes to the menu, the copy line copies, anywhere else retries
      const tapMenu = input.leftPressed && input.my >= 206;
      const tapCopy = input.leftPressed && game.isArcade() && input.my >= 192 && input.my < 206;
      if (input.hit('KeyM', 'Escape') || tapMenu) game.quitToMenu();
      else if (game.isArcade() && (input.hit('KeyC') || tapCopy)) copyResult();
      else if (input.hit('KeyR') || (game.stateT > 0.5 && (input.hit('Enter') || input.leftPressed))) game.retry();
      break;
    }
    case 'clear':
      if (game.stateT > 0.4 && (input.hit('Enter', 'Space') || input.leftPressed)) game.nextFromClear();
      break;
    case 'victory':
      if (game.stateT > 1.5) game.endT += dt;
      if (game.stateT > 1.8 && (input.hit('Enter', 'Space') || input.leftPressed) && advanceEnding(game)) game.quitToMenu();
      break;
  }
}

function render(dt: number) {
  switch (game.state) {
    case 'boot':
      renderBoot();
      break;
    case 'menu':
      renderMenu(dt);
      break;
    case 'story':
      renderStory(game, ctx);
      break;
    case 'skins':
      renderSkins(game, ctx);
      break;
    case 'achievements':
      renderAchievements(game, ctx);
      break;
    case 'log':
      renderLog(game, ctx);
      break;
    case 'manual':
      renderManual(game, ctx);
      break;
    case 'options':
      renderOptions();
      break;
    case 'controls':
      renderControls();
      break;
    default:
      renderWorld(game, ctx);
      renderHud(game, ctx, controlsHint());
      if (game.state === 'play' && input.touchActive && !game.term.open && !game.player.dead) renderTouchControls();
      if (game.state === 'perk') renderPerks(game, ctx);
      else if (game.state === 'intro') renderIntro(game, ctx);
      else if (game.state === 'pause') renderPause(game, ctx, pauseItems().map((i) => i.label));
      else if (game.state === 'dead') renderDead(game, ctx);
      else if (game.state === 'clear') renderClear(game, ctx);
      else if (game.state === 'victory') renderVictory(game, ctx);
  }
  renderToast(game, ctx);
  crosshair();
}

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  input.uiMode = game.state !== 'play' || game.term.open;
  input.poll(dt);
  game.update(dt);
  handleInput(dt);
  render(dt);
  presenter.present(game.time, game.glitch, game.invert > 0 && game.state === 'play');
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
