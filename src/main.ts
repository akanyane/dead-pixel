import { Presenter } from './core/crt';
import { drawText } from './core/font';
import { Input } from './core/input';
import { H, W, makeCanvas, rand } from './core/util';
import { Game } from './game/game';
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
// abates somados não podem se perder se a aba for fechada no meio de uma fase
window.addEventListener('pagehide', () => game.saveProgress());

const params = new URLSearchParams(location.search);
if (import.meta.env.DEV) {
  (window as unknown as { __g: Game }).__g = game;
  if (params.has('god')) game.god = true;
}

// ---------- Menu ----------

const drips = Array.from({ length: 34 }, () => ({ x: Math.floor(rand(92, 388)), len: rand(0, 18), speed: rand(1, 8), w: Math.random() < 0.3 ? 2 : 1 }));
const parade = Array.from({ length: 9 }, (_, i) => ({ x: rand(-40, W + 40), s: i % 4, speed: rand(8, 20), t: rand(5) }));

type MenuItem = { label: string; act: () => void };

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

function openManual(from: 'menu' | 'pause') {
  game.returnTo = from;
  game.setState('manual');
}

function openOptions(from: 'menu' | 'pause') {
  game.returnTo = from;
  game.optionsIdx = 0;
  game.setState('options');
}

// O rótulo de idioma é bilíngue de propósito: precisa ser achado por quem não lê o idioma atual.
const langLabel = () => `IDIOMA / LANGUAGE: ${T().langName}`;

function menuItems(): MenuItem[] {
  const t = T();
  const items: MenuItem[] = [];
  if (game.snapshot) {
    const lv = game.snapshot.level;
    items.push({ label: t.menu.continue(lv + 1, t.levels[lv].title), act: () => game.continueGame() });
  }
  items.push({ label: t.menu.newGame, act: () => game.newGame() });
  items.push({ label: t.menu.skins, act: () => openSkins(game) });
  items.push({ label: t.menu.achievements, act: () => openAchievements(game, 'menu') });
  items.push({ label: t.menu.manual, act: () => openManual('menu') });
  items.push({ label: t.menu.options, act: () => openOptions('menu') });
  items.push({ label: langLabel(), act: cycleLang });
  return items;
}

function optionItems(): MenuItem[] {
  const o = T().options;
  return [
    { label: `${o.gore}: ${goreName()}`, act: cycleGore },
    { label: `${o.music}: ${onOff(game.musicOn)}`, act: () => { game.musicOn = !game.musicOn; game.saveOptions(); } },
    { label: `${o.crt}: ${onOff(game.crtOn)}`, act: () => { game.crtOn = !game.crtOn; presenter.crtEnabled = game.crtOn; game.saveOptions(); } },
    { label: `${o.tips}: ${onOff(game.tipsOn)}`, act: () => { game.tipsOn = !game.tipsOn; game.saveOptions(); } },
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

/** Navegação comum dos menus: teclado, hover e clique. Retorna o índice selecionado. */
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
  if (inside && (input.mx !== lastMx || input.my !== lastMy)) i = row;
  lastMx = input.mx;
  lastMy = input.my;
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
    drawText(ctx, it.label, W / 2, y + i * rowH, on ? '#02150a' : '#dfe6ee', { align: 'center' });
  });
}

const MENU_Y = 122;
const MENU_ROW = 14;
const OPT_Y = 72;

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
}

let runnerX = 60;

function renderMenu(dt: number) {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);
  // manchas de fundo
  ctx.fillStyle = '#0d0a0d';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);

  // horda ao fundo
  for (const z of parade) {
    z.x += z.speed * dt;
    z.t += dt;
    if (z.x > W + 30) z.x = -30;
    const fr = Math.floor(z.t * 5) % 2;
    ctx.globalAlpha = 0.55;
    drawSprite(ctx, SPR.zombies[z.s].walk[fr], z.x, H - 8);
    ctx.globalAlpha = 1;
  }
  // você, com a skin escolhida, fugindo na frente da horda
  runnerX += 30 * dt;
  if (runnerX > W + 30) runnerX = -30;
  drawSprite(ctx, skinSprites(game.progress.skin, game.time)[1 + (Math.floor(game.time * 8) % 2)], runnerX, H - 8);
  ctx.fillStyle = '#2a0408';
  ctx.fillRect(0, H - 8, W, 8);

  // título com gotejamento
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
  // o próprio pixel morto, no meio do título
  ctx.fillStyle = '#000';
  ctx.fillRect(W / 2 - 1, ty + 12, 3, 3);

  drawText(ctx, T().menu.tagline, W / 2, 90, '#8fa3bf', { align: 'center' });
  drawText(ctx, T().menu.best(game.best), W / 2, 103, '#ffd23d', { align: 'center' });
  drawList(menuItems(), game.menuIdx, MENU_Y, MENU_ROW, 150);
  drawText(ctx, T().menu.controls, W / 2, H - 22, '#6d8a78', { align: 'center' });
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
    if (matchMedia('(pointer: coarse)').matches) drawText(ctx, T().boot.needsKeyboard, W / 2, 212, '#ffd23d', { align: 'center' });
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

// ---------- Máquina de estados ----------

function handleInput(dt: number) {
  switch (game.state) {
    case 'boot':
      if ((input.typed.length > 0 || input.leftPressed || input.rightPressed) && game.stateT > 0.1) {
        game.quitToMenu();
      }
      break;
    case 'menu':
      game.menuIdx = runList(menuItems(), game.menuIdx, MENU_Y, MENU_ROW, 150);
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
      game.perkHover = hover;
      if (game.stateT > 0.3) {
        let choice = -1;
        if (input.hit('Digit1')) choice = 0;
        if (input.hit('Digit2')) choice = 1;
        if (input.hit('Digit3')) choice = 2;
        if (input.leftPressed && hover >= 0) choice = hover;
        if (choice >= 0 && game.perkChoices[choice]) game.applyPerk(game.perkChoices[choice]);
      }
      break;
    }
    case 'play':
      if (input.hit('Escape', 'KeyP') && !game.term.open && !game.term.justClosed) {
        game.pauseIdx = 0;
        game.setState('pause');
        game.audio.setMuffled(true);
      }
      break;
    case 'pause':
      game.pauseIdx = runList(pauseItems(), game.pauseIdx, 96, 16, 92);
      if (input.hit('Escape', 'KeyP') && game.stateT > 0.05 && game.state === 'pause') {
        game.setState('play');
        game.audio.setMuffled(false);
      }
      break;
    case 'dead':
      if (input.hit('KeyR') || (game.stateT > 0.5 && input.hit('Enter'))) game.retry();
      if (input.hit('KeyM')) game.quitToMenu();
      break;
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
    default:
      renderWorld(game, ctx);
      renderHud(game, ctx);
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
  game.update(dt);
  handleInput(dt);
  render(dt);
  presenter.present(game.time, game.glitch, game.invert > 0 && game.state === 'play');
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
