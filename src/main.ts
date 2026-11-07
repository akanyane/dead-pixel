import { Presenter } from './core/crt';
import { drawText } from './core/font';
import { Input } from './core/input';
import { H, W, clamp, makeCanvas, rand } from './core/util';
import { LEVELS } from './game/data';
import { Game } from './game/game';
import { renderClear, renderDead, renderHud, renderPause, renderPerks, renderStory, renderVictory } from './game/hud';
import { renderWorld } from './game/render';
import { SPR, buildSprites, drawSprite } from './game/sprites';

const screen = document.getElementById('screen') as HTMLCanvasElement;
const [buffer, ctx] = makeCanvas(W, H);
buildSprites();

const input = new Input(screen);
const presenter = new Presenter(screen, buffer);
const game = new Game(input);
presenter.crtEnabled = game.crtOn;

input.onFirstGesture = () => game.audio.init();

const params = new URLSearchParams(location.search);
if (import.meta.env.DEV) {
  (window as unknown as { __g: Game }).__g = game;
  if (params.has('god')) game.god = true;
}

// ---------- Menu ----------

const drips = Array.from({ length: 34 }, () => ({ x: Math.floor(rand(92, 388)), len: rand(0, 18), speed: rand(1, 8), w: Math.random() < 0.3 ? 2 : 1 }));
const parade = Array.from({ length: 9 }, (_, i) => ({ x: rand(-40, W + 40), s: i % 4, speed: rand(8, 20), t: rand(5) }));

type MenuItem = { label: string; act: () => void };

function menuItems(): MenuItem[] {
  const items: MenuItem[] = [];
  if (game.snapshot) {
    items.push({ label: `CONTINUAR  (fase ${game.snapshot.level + 1}: ${LEVELS[game.snapshot.level].title})`, act: () => game.continueGame() });
  }
  items.push({ label: 'NOVO JOGO', act: () => game.newGame() });
  items.push({ label: `GORE: ${goreName()}`, act: cycleGore });
  items.push({ label: `MÚSICA: ${game.musicOn ? 'LIGADA' : 'DESLIGADA'}`, act: toggleMusic });
  items.push({ label: `EFEITO CRT: ${game.crtOn ? 'LIGADO' : 'DESLIGADO'}`, act: toggleCrt });
  return items;
}

function goreName() {
  return game.goreLevel >= 1.2 ? 'MÁXIMO' : game.goreLevel >= 0.8 ? 'NORMAL' : 'CONTIDO';
}

function cycleGore() {
  game.goreLevel = game.goreLevel >= 1.2 ? 0.3 : game.goreLevel >= 0.8 ? 1.2 : 0.9;
  game.saveOptions();
}

function toggleMusic() {
  game.musicOn = !game.musicOn;
  game.saveOptions();
}

function toggleCrt() {
  game.crtOn = !game.crtOn;
  presenter.crtEnabled = game.crtOn;
  game.saveOptions();
}

const MENU_Y = 128;

function updateMenu() {
  const items = menuItems();
  if (input.hit('ArrowDown', 'KeyS')) {
    game.menuIdx = (game.menuIdx + 1) % items.length;
    game.audio.ui();
  }
  if (input.hit('ArrowUp', 'KeyW')) {
    game.menuIdx = (game.menuIdx - 1 + items.length) % items.length;
    game.audio.ui();
  }
  const hoverIdx = Math.floor((input.my - MENU_Y + 2) / 14);
  const inside = hoverIdx >= 0 && hoverIdx < items.length && Math.abs(input.mx - W / 2) < 150;
  if (inside && (input.mx !== lastMx || input.my !== lastMy)) game.menuIdx = hoverIdx;
  lastMx = input.mx;
  lastMy = input.my;
  if (input.hit('Enter', 'Space') || (input.leftPressed && inside)) {
    game.audio.ui();
    items[game.menuIdx].act();
    game.menuIdx = clamp(game.menuIdx, 0, menuItems().length - 1);
  }
}
let lastMx = -1;
let lastMy = -1;

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

  drawText(ctx, 'um pixel morreu em produção. todo mundo que olhou virou zumbi.', W / 2, 92, '#8fa3bf', { align: 'center' });
  drawText(ctx, `recorde ${game.best}`, W / 2, 106, '#ffd23d', { align: 'center' });

  menuItems().forEach((it, i) => {
    const on = game.menuIdx === i;
    if (on) {
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(W / 2 - 150, MENU_Y + i * 14 - 2, 300, 12);
    }
    drawText(ctx, it.label, W / 2, MENU_Y + i * 14, on ? '#02150a' : '#dfe6ee', { align: 'center' });
  });

  drawText(ctx, 'WASD move  |  mouse mira e atira  |  ESPAÇO dash  |  F teclada  |  Q terminal', W / 2, H - 22, '#6d8a78', { align: 'center' });
}

// ---------- Boot ----------

const BOOT = [
  '[    0.000000] Linux version 6.6.6-dead (root@pixel) #1 SMP FRI 17:58',
  '[    0.004231] Memory: 512MB available (666MB reserved by zumbi)',
  '[    0.113370] pixel: detected 1 dead pixel at (240, 135)',
  '[    0.218801] pixel: spreading. this is fine.',
  '[    0.420000] systemd[1]: Started Procrastination Daemon.',
  '[    0.666666] zumbi[3000]: <defunct>',
  '[    0.666667] zumbi[3001]: <defunct>',
  '[    0.666668] zumbi[3002]: <defunct>',
  '[    0.667000] WARNING: blood detected on bus 0',
];

function renderBoot() {
  ctx.fillStyle = '#020304';
  ctx.fillRect(0, 0, W, H);
  const n = Math.floor(game.stateT * 7);
  BOOT.slice(0, n).forEach((l, i) => drawText(ctx, l, 10, 12 + i * 10, i >= 5 ? '#ff5a5a' : '#8fa3bf'));
  if (n > BOOT.length) {
    if (Math.floor(game.time * 2) % 2) drawText(ctx, 'clique ou aperte qualquer tecla para logar como root', W / 2, 190, '#39ff88', { align: 'center' });
    drawText(ctx, 'contém violência pixelada, sangue digital e piadas de TI', W / 2, 232, '#3b5245', { align: 'center' });
    if (matchMedia('(pointer: coarse)').matches) drawText(ctx, 'este jogo precisa de teclado e mouse', W / 2, 212, '#ffd23d', { align: 'center' });
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

function pauseItems() {
  return [
    { label: 'CONTINUAR', act: () => { game.setState('play'); game.audio.setMuffled(false); } },
    { label: `GORE: ${goreName()}`, act: cycleGore },
    { label: `MÚSICA: ${game.musicOn ? 'LIGADA' : 'DESLIGADA'}`, act: toggleMusic },
    { label: `EFEITO CRT: ${game.crtOn ? 'LIGADO' : 'DESLIGADO'}`, act: toggleCrt },
    { label: 'SAIR PARA O MENU', act: () => game.quitToMenu() },
  ];
}

function handleInput(dt: number) {
  switch (game.state) {
    case 'boot':
      if ((input.typed.length > 0 || input.leftPressed || input.rightPressed) && game.stateT > 0.1) {
        game.quitToMenu();
      }
      break;
    case 'menu':
      updateMenu();
      break;
    case 'story': {
      game.storyT += dt;
      const total = game.level.story.reduce((n, l) => n + l.length + 6, 0) / 42;
      if (game.stateT > 0.2 && input.hit('Enter', 'Space')) {
        if (game.storyT < total) game.storyT = total + 1;
        else game.beginPlay();
      } else if (game.stateT > 0.2 && input.leftPressed) {
        if (game.storyT < total) game.storyT = total + 1;
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
    case 'pause': {
      const items = pauseItems();
      if (input.hit('ArrowDown', 'KeyS')) game.pauseIdx = (game.pauseIdx + 1) % items.length;
      if (input.hit('ArrowUp', 'KeyW')) game.pauseIdx = (game.pauseIdx - 1 + items.length) % items.length;
      const hover = Math.floor((input.my - 94) / 16);
      if (hover >= 0 && hover < items.length && Math.abs(input.mx - W / 2) < 92 && (input.mx !== lastMx || input.my !== lastMy)) game.pauseIdx = hover;
      lastMx = input.mx;
      lastMy = input.my;
      const clicked = input.leftPressed && hover >= 0 && hover < items.length && Math.abs(input.mx - W / 2) < 92;
      if (input.hit('Enter', 'Space') || clicked) {
        items[game.pauseIdx].act();
        game.audio.ui();
      }
      if (input.hit('Escape', 'KeyP') && game.stateT > 0.05) {
        game.setState('play');
        game.audio.setMuffled(false);
      }
      break;
    }
    case 'dead':
      if (input.hit('KeyR') || (game.stateT > 0.5 && input.hit('Enter'))) game.retry();
      if (input.hit('KeyM')) game.quitToMenu();
      break;
    case 'clear':
      if (game.stateT > 0.4 && (input.hit('Enter', 'Space') || input.leftPressed)) game.nextFromClear();
      break;
    case 'victory':
      if (game.stateT > 1.8 && (input.hit('Enter') || input.leftPressed)) game.quitToMenu();
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
    default:
      renderWorld(game, ctx);
      renderHud(game, ctx);
      if (game.state === 'perk') renderPerks(game, ctx);
      else if (game.state === 'pause') renderPause(game, ctx, pauseItems().map((i) => i.label));
      else if (game.state === 'dead') renderDead(game, ctx);
      else if (game.state === 'clear') renderClear(game, ctx);
      else if (game.state === 'victory') renderVictory(game, ctx);
  }
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
