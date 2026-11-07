import { drawText } from '../core/font';
import { H, W, chance, clamp, makeCanvas, pick, rand } from '../core/util';
import { P } from './fx';
import type { Enemy, Game } from './game';
import { SPR, drawSprite, skinSprites } from './sprites';

const [lightC, lctx] = makeCanvas(W, H);
const lightTex = new Map<string, HTMLCanvasElement>();

function lightTexture(color: string) {
  let t = lightTex.get(color);
  if (t) return t;
  const [c, x] = makeCanvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color + '88');
  g.addColorStop(1, color + '00');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  lightTex.set(color, c);
  t = c;
  return t;
}

const coneTex = (() => {
  const [c, x] = makeCanvas(256, 256);
  const img = x.createImageData(256, 256);
  for (let py = 0; py < 256; py++) {
    for (let px = 0; px < 256; px++) {
      const dy = py - 128;
      const d = Math.hypot(px, dy);
      const ang = Math.abs(Math.atan2(dy, px));
      const edge = clamp((0.62 - ang) / 0.34, 0, 1);
      const fall = clamp(1 - d / 250, 0, 1);
      const a = edge * edge * (3 - 2 * edge) * fall * fall * 0.75;
      const i = (py * 256 + px) * 4;
      img.data[i] = 240;
      img.data[i + 1] = 222;
      img.data[i + 2] = 180;
      img.data[i + 3] = a * 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
})();

export function drawEnemy(g: Game, ctx: CanvasRenderingContext2D, e: Enemy) {
  const flash = e.flash > 0;
  if (e.spawnT > 0.05) {
    // materializando: chuvisco antes de virar corpo
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = pick(['#ff004c', '#00e5ff', '#39ff88', '#fff']);
      ctx.fillRect(e.x + rand(-6, 6), e.y - rand(0, 14), 2, 1);
    }
    if (chance(0.5)) return;
  }
  const shadowW = e.r * 2;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(Math.round(e.x - shadowW / 2), Math.round(e.y - 1), shadowW, 2);
  const frameRate = e.kind === 'runner' || e.kind === 'bug' ? 14 : 6;
  const fr = Math.floor(e.t * frameRate) % 2;
  switch (e.kind) {
    case 'walker': {
      const set = SPR.zombies[e.skin];
      const lean = Math.sin(e.t * 3) > 0 ? 1 : 0;
      drawSprite(ctx, (e.wounded ? set.wound : set.walk)[fr], e.x + lean * (e.flip ? -1 : 1), e.y, e.flip, flash);
      break;
    }
    case 'runner':
      drawSprite(ctx, SPR.runner[fr], e.x, e.y, e.flip, flash);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(SPR.runner[fr].flash, Math.round(e.x) - 5 - (e.flip ? -3 : 3), Math.round(e.y) - 9);
      ctx.globalAlpha = 1;
      break;
    case 'bug':
      drawSprite(ctx, SPR.bug[fr], e.x, e.y, e.flip, flash);
      break;
    case 'leak':
      drawSprite(ctx, SPR.leak[fr], e.x, e.y, e.flip, flash);
      break;
    case 'leakSmall':
      drawSprite(ctx, SPR.leakSmall[fr], e.x, e.y, e.flip, flash);
      break;
    case 'stack':
      drawSprite(ctx, SPR.stack[fr], e.x, e.y, e.flip, flash);
      break;
    case 'nullp':
      if (e.state === 1) {
        ctx.globalAlpha = 0.25;
        drawSprite(ctx, SPR.nullp[fr], e.x + rand(-2, 2), e.y, e.flip, false);
        ctx.globalAlpha = 1;
      } else drawSprite(ctx, SPR.nullp[fr], e.x, e.y, e.flip, flash);
      break;
    case 'segfault':
      drawSprite(ctx, SPR.segfault[fr], e.x, e.y, e.flip, flash);
      if (e.state === 1) {
        ctx.strokeStyle = Math.sin(e.t * 40) > 0 ? '#ffec3d' : '#ff2a2a';
        ctx.beginPath();
        ctx.arc(Math.round(e.x), Math.round(e.y - 6), 18 + Math.sin(e.t * 30) * 3, 0, 7);
        ctx.stroke();
      }
      break;
    case 'recruiter': {
      drawSprite(ctx, SPR.recruiter[fr], e.x, e.y, e.flip, flash);
      break;
    }
    case 'scrum': {
      const shakeX = e.state === 1 ? rand(-2, 2) : 0;
      if (e.state === 3) {
        for (let i = 0; i < 3; i++) {
          const a = g.time * 5 + i * 2.1;
          drawText(ctx, '*', e.x + Math.cos(a) * 18 - 2, e.y - 56 + Math.sin(a) * 4, '#ffe14d');
        }
      }
      drawSprite(ctx, SPR.scrum[e.state === 2 ? Math.floor(g.time * 18) % 2 : fr], e.x + shakeX, e.y, e.flip, flash, 3);
      if (e.state === 1) {
        // telegrafa a direção da corrida
        ctx.strokeStyle = '#ff2a2a';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - 10);
        ctx.lineTo(e.x + Math.cos(e.a) * 400, e.y - 10 + Math.sin(e.a) * 400);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      break;
    }
    case 'kernel':
      drawKernel(g, ctx, e, flash);
      break;
    case 'hydra':
      drawHydra(g, ctx, e, flash);
      break;
    case 'monolith':
      drawMonolith(g, ctx, e, flash);
      break;
    case 'pixel':
      drawPixelBoss(g, ctx, e, flash);
      break;
  }
}

function drawKernel(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, flash: boolean) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y - e.hoff + Math.sin(g.time * 2) * 3);
  const s = 22;
  ctx.fillStyle = '#0a0d14';
  for (let i = -s + 2; i < s; i += 5) {
    ctx.fillRect(cx + i, cy - s - 4, 2, 4);
    ctx.fillRect(cx + i, cy + s, 2, 4);
    ctx.fillRect(cx - s - 4, cy + i, 4, 2);
    ctx.fillRect(cx + s, cy + i, 4, 2);
  }
  ctx.fillStyle = flash ? '#fff' : '#1c2434';
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  if (flash) return;
  ctx.fillStyle = '#2a3549';
  ctx.fillRect(cx - s + 2, cy - s + 2, s * 2 - 4, s * 2 - 4);
  ctx.fillStyle = '#10309f';
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  // um olho, com o pixel morto no centro
  ctx.fillStyle = '#dfe6ee';
  ctx.fillRect(cx - 9, cy - 5, 18, 8);
  ctx.fillRect(cx - 6, cy - 7, 12, 12);
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - 2, cy - 3, 4, 4);
  ctx.fillStyle = Math.sin(g.time * 8) > 0 ? '#ff2bd6' : '#2bfff2';
  ctx.fillRect(cx - 12, cy + 8, 24, 2);
  drawText(ctx, 'PANIC', cx, cy - s - 14, '#2bfff2', { align: 'center' });
}

function drawHydra(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, flash: boolean) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y - e.hoff);
  ctx.strokeStyle = '#2b8f18';
  ctx.lineWidth = e.tier === 3 ? 2 : 1;
  for (const o of g.bosses) {
    if (o !== e && o.tier >= e.tier && g.bosses.includes(e)) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const midX = (cx + o.x) / 2 + Math.sin(g.time * 3 + e.t) * 18;
      const midY = (cy + o.y - o.hoff) / 2 + Math.cos(g.time * 2 + e.t) * 18;
      ctx.quadraticCurveTo(midX, midY, o.x, o.y - o.hoff);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
  const r = Math.round(e.r);
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y));
    ctx.fillStyle = flash ? '#fff' : y < -r * 0.3 ? '#3fbf25' : y < r * 0.4 ? '#2b8f18' : '#1d6410';
    ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
  if (flash) return;
  const eyeR = Math.max(2, Math.round(r / 3));
  const dirX = Math.round(Math.cos(Math.atan2(g.player.y - cy, g.player.x - cx)) * eyeR * 0.5);
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - eyeR * 2, cy - eyeR, eyeR * 2 - 1, eyeR * 2 - 1);
  ctx.fillRect(cx + 1, cy - eyeR, eyeR * 2 - 1, eyeR * 2 - 1);
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(cx - eyeR * 2 + eyeR / 2 + dirX, cy - eyeR / 2, Math.max(1, eyeR - 1), Math.max(1, eyeR - 1));
  ctx.fillRect(cx + 1 + eyeR / 2 + dirX, cy - eyeR / 2, Math.max(1, eyeR - 1), Math.max(1, eyeR - 1));
  ctx.fillStyle = '#100';
  ctx.fillRect(cx - r + 3, cy + eyeR + 1, r * 2 - 6, Math.max(2, r / 3));
  ctx.fillStyle = '#fff';
  for (let x = cx - r + 3; x < cx + r - 4; x += 3) ctx.fillRect(x, cy + eyeR + 1, 1, 2);
  if (e.tier === 3) drawText(ctx, 'API', cx, cy - r - 10, '#59ff3a', { align: 'center' });
}

function drawMonolith(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, flash: boolean) {
  const w = 72;
  const h = 84;
  const x = Math.round(e.x - w / 2);
  const y = Math.round(e.y - h);
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.fillRect(x - 4, y + h - 3, w + 8, 6);
  ctx.fillStyle = flash ? '#fff' : '#3a3f4a';
  ctx.fillRect(x, y, w, h);
  if (flash) return;
  ctx.fillStyle = '#2a2e38';
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = '#c9b458';
  ctx.fillRect(x, y, w, 2);
  const open = e.state === 1 ? 1 : e.state === 2 ? 1 - Math.max(0, e.stateT) / 1.1 : 0;
  // núcleo atrás das portas
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(x + 22, y + 26, 28, 38);
  ctx.fillStyle = Math.sin(g.time * 12) > 0 ? '#ffec3d' : '#ff8a1a';
  ctx.fillRect(x + 30, y + 34, 12, 22);
  // portas
  const dw = 16 * (1 - open);
  ctx.fillStyle = '#4b515e';
  ctx.fillRect(x + 20, y + 24, Math.ceil(dw), 42);
  ctx.fillRect(x + 52 - Math.ceil(dw), y + 24, Math.ceil(dw), 42);
  // fósforo verde rolando
  ctx.fillStyle = '#04140a';
  ctx.fillRect(x + 8, y + 6, w - 16, 15);
  const scroll = Math.floor(g.time * 6);
  for (let i = 0; i < 2; i++) {
    const col = ['GOTO 1974', 'MOVE ZERO', 'STOP RUN.', 'PIC 9(66)', 'PERFORM'][(scroll + i) % 5];
    drawText(ctx, col, x + 10, y + 6 + i * 7, '#49ff6e', { alpha: 0.75 });
  }
  ctx.fillStyle = '#7dff7d';
  for (let i = 0; i < 5; i++) if (Math.sin(g.time * (i + 2) * 2) > 0) ctx.fillRect(x + 6, y + 28 + i * 7, 2, 2);
  ctx.fillStyle = '#ffae00';
  for (let i = 0; i < 5; i++) if (Math.sin(g.time * (i + 3)) > 0) ctx.fillRect(x + w - 8, y + 28 + i * 7, 2, 2);
}

function drawPixelBoss(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, flash: boolean) {
  const r = Math.max(1, e.state === 1 ? 2 : Math.round(e.r));
  const x = Math.round(e.x);
  const y = Math.round(e.y);
  // o ponto é minúsculo: anéis para achá-lo
  if (e.state === 1) {
    ctx.strokeStyle = '#0a0a0c';
    ctx.globalAlpha = 0.3 + Math.sin(g.time * 8) * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, 12 + Math.sin(g.time * 5) * 3, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const j = e.state === 3 ? 2 : 1;
  ctx.fillStyle = '#ff004c';
  ctx.fillRect(x - r - j + rand(-1, 1), y - r, r * 2, r * 2);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(x - r + j + rand(-1, 1), y - r, r * 2, r * 2);
  ctx.fillStyle = flash ? '#fff' : '#000';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (e.state >= 2) {
    for (let i = 0; i < 14 * e.state; i++) {
      const a = rand(6.28);
      const d = r + rand(0, 8) * e.state;
      ctx.fillStyle = pick(['#000', '#000', '#ff004c', '#00e5ff']);
      ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 2, 2);
    }
  }
}

function drawPlayer(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player;
  if (p.dead) return;
  if (p.invuln > 0 && p.dashT <= 0 && Math.floor(g.time * 18) % 2 === 0 && p.sudoT <= 0) return;
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 1, 8, 2);
  const set = p.sudoT > 0 ? SPR.playerGold : skinSprites(g.progress.skin, g.time);
  const fr = p.moving ? 1 + (Math.floor(p.walk) % 2) : 0;
  const px = p.x;
  const py = p.y;
  // arma por trás quando mira para cima
  const behind = Math.sin(p.aim) < -0.35;
  if (behind) drawGun(g, ctx);
  if (p.dashT > 0) {
    ctx.globalAlpha = 0.45;
    drawSprite(ctx, set[fr], px - p.dashX * 6, py - p.dashY * 6, p.flip, true);
    drawSprite(ctx, set[fr], px - p.dashX * 12, py - p.dashY * 12, p.flip, true);
    ctx.globalAlpha = 1;
  }
  drawSprite(ctx, set[fr], px, py, p.flip, p.invuln > 0.45);
  if (!behind) drawGun(g, ctx);
  if (p.dashCd > 0) {
    const k = 1 - p.dashCd / (1.15 * g.stats.dashCd);
    ctx.fillStyle = '#10141c';
    ctx.fillRect(Math.round(px) - 6, Math.round(py) + 2, 12, 1);
    ctx.fillStyle = '#39ffe5';
    ctx.fillRect(Math.round(px) - 6, Math.round(py) + 2, Math.round(12 * k), 1);
  }
}

function drawGun(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player;
  const spr = SPR.guns[p.weapon];
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y - 7));
  ctx.rotate(p.aim);
  if (Math.cos(p.aim) < 0) ctx.scale(1, -1);
  const swing = p.meleeT > 0 ? -p.meleeT * 8 : 0;
  ctx.rotate(swing);
  ctx.drawImage(spr.c, Math.round(2 - p.gunKick), -2);
  ctx.restore();
  if (p.muzzle > 0) {
    const tipX = p.x + Math.cos(p.aim) * (spr.w + 3);
    const tipY = p.y - 7 + Math.sin(p.aim) * (spr.w + 3);
    ctx.fillStyle = '#fff6cc';
    const s = 2 + Math.floor(Math.random() * 3);
    ctx.fillRect(Math.round(tipX - s), Math.round(tipY - s), s * 2, s * 2);
    ctx.fillStyle = '#ffae3a';
    ctx.fillRect(Math.round(tipX + Math.cos(p.aim) * s - 1), Math.round(tipY + Math.sin(p.aim) * s - 1), 3, 3);
  }
}

interface Drawable {
  y: number;
  draw: () => void;
}

export function renderWorld(g: Game, ctx: CanvasRenderingContext2D) {
  const m = g.map;
  const shakeX = g.shake > 0 ? rand(-g.shake, g.shake) * 0.5 : 0;
  const shakeY = g.shake > 0 ? rand(-g.shake, g.shake) * 0.5 : 0;
  const ox = Math.round(g.camX + g.kickX + shakeX);
  const oy = Math.round(g.camY + g.kickY + shakeY);

  ctx.fillStyle = m.theme === 'void' ? '#ffffff' : '#050507';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-ox, -oy);
  ctx.drawImage(m.floor, 0, 0);

  // LEDs dos racks
  for (const l of m.leds) {
    if (l.x < ox || l.x > ox + W || l.y < oy || l.y > oy + H) continue;
    if (Math.sin(g.time * l.speed + l.phase) > -0.2) {
      ctx.fillStyle = l.color;
      ctx.fillRect(l.x, l.y, 1, 1);
    }
  }

  // poças
  for (const pd of g.puddles) {
    ctx.fillStyle = 'rgba(138,62,235,.35)';
    ctx.beginPath();
    ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.7, 0, 0, 7);
    ctx.fill();
  }

  // faixas de perigo
  for (const h of g.hazards) {
    if (h.style === 'deploy') {
      if (h.warn > 0) {
        const on = Math.floor(g.time * 12) % 2 === 0;
        ctx.fillStyle = on ? 'rgba(255,42,42,.30)' : 'rgba(255,42,42,.12)';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = '#ff2a2a';
        ctx.strokeRect(h.x + 0.5, h.y + 0.5, h.w - 1, h.h - 1);
        if (on) drawText(ctx, 'DEPLOY', g.camX + W / 2, Math.max(h.y + 4, g.camY + 24), '#ff2a2a', { align: 'center' });
      } else {
        ctx.fillStyle = 'rgba(255,248,210,.9)';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = 'rgba(255,90,20,.7)';
        ctx.fillRect(h.x + 3, h.y + 3, Math.max(0, h.w - 6), Math.max(0, h.h - 6));
      }
    } else {
      if (h.warn > 0) {
        ctx.strokeStyle = Math.floor(g.time * 14) % 2 ? '#000' : '#ff004c';
        ctx.strokeRect(h.x + 0.5, h.y + 0.5, h.w - 1, h.h - 1);
      } else {
        const fade = h.life < 1 ? h.life : 1;
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#000';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = pick(['#ff004c', '#00e5ff', '#222']);
          ctx.fillRect(h.x + rand(h.w), h.y + rand(h.h), 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  // Alerta dos feixes
  for (const b of g.beams) {
    if (b.warn > 0) {
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.45 + Math.sin(g.time * 30) * 0.3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.cos(b.a) * b.len, b.y + Math.sin(b.a) * b.len);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  // ordena por Y
  const list: Drawable[] = [];
  const onScreen = (x: number, y: number, pad = 40) => x > ox - pad && x < ox + W + pad && y > oy - pad && y < oy + H + pad;
  for (const b of g.barrels) {
    if (onScreen(b.x, b.y)) list.push({ y: b.y, draw: () => drawSprite(ctx, SPR.ups, b.x, b.y, false, b.flash > 0) });
  }
  for (const pk of g.pickups) {
    if (!onScreen(pk.x, pk.y)) continue;
    if (pk.life < 3 && Math.floor(g.time * 10) % 2 === 0) continue;
    list.push({
      y: pk.y,
      draw: () => {
        const bob = Math.sin(pk.t * 5) * 1.5 + pk.z;
        const spr = pk.kind === 'hp' ? SPR.pickHp : pk.kind === 'ammo' ? SPR.pickAmmo : pk.kind === 'ram' ? SPR.pickRam : SPR.crate;
        drawSprite(ctx, spr, pk.x, pk.y - bob, false, false);
        if (pk.kind === 'weapon') drawText(ctx, 'npm install', pk.x, pk.y - 26, '#a8ff3e', { align: 'center', shadow: '#000' });
      },
    });
  }
  for (const e of g.enemies) {
    if (onScreen(e.x, e.y, e.boss ? 120 : 30)) list.push({ y: e.y, draw: () => drawEnemy(g, ctx, e) });
  }
  for (const al of g.allies) {
    list.push({
      y: al.y,
      draw: () => {
        ctx.globalAlpha = al.life < 3 && Math.floor(g.time * 12) % 2 ? 0.4 : 0.92;
        drawSprite(ctx, SPR.ally[1 + (Math.floor(al.walk) % 2)], al.x, al.y, al.flip);
        ctx.globalAlpha = 1;
      },
    });
  }
  list.push({ y: g.player.y, draw: () => drawPlayer(g, ctx) });
  for (const b of g.gibs) {
    list.push({
      y: b.y,
      draw: () => {
        ctx.save();
        ctx.translate(Math.round(b.x), Math.round(b.y - b.z));
        ctx.rotate(Math.round(b.rot / (Math.PI / 4)) * (Math.PI / 4));
        ctx.drawImage(b.spr.c, -b.spr.w / 2, -b.spr.h / 2);
        ctx.restore();
      },
    });
  }
  list.sort((a, b) => a.y - b.y);
  for (const d of list) d.draw();

  // Partículas
  for (const p of g.parts) {
    const k = p.life / p.max;
    switch (p.kind) {
      case P.Blood:
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.size, p.size);
        break;
      case P.Spark:
      case P.Pixel:
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.size, p.size);
        break;
      case P.Smoke:
        ctx.globalAlpha = k * 0.5;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.round(p.size), Math.round(p.size));
        ctx.globalAlpha = 1;
        break;
      case P.Fire: {
        const s = Math.max(1, Math.round(p.size * k));
        ctx.fillStyle = k > 0.65 ? '#fff0a0' : p.color;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
        break;
      }
      case P.Ring:
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = k;
        ctx.lineWidth = 1 + k * 2;
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.size, 0, 7);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        break;
      case P.Flash:
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.size, 0, 7);
        ctx.fill();
        break;
    }
  }
  ctx.restore();

  // Luz
  renderLights(g, ctx, ox, oy);

  // Tudo que brilha fica por cima da escuridão, para ser sempre legível
  ctx.save();
  ctx.translate(-ox, -oy);
  // olhos vermelhos enxergam-se antes do corpo no escuro
  if (m.theme !== 'void') {
    const blink = (e: Enemy) => Math.sin(e.t * 1.7 + e.skin) > -0.93;
    for (const e of g.enemies) {
      if (e.boss || e.spawnT > 0 || !blink(e)) continue;
      const dir = e.flip ? -1 : 1;
      const ex = Math.round(e.x);
      const ey = Math.round(e.y);
      if (e.kind === 'walker' || e.kind === 'recruiter') {
        ctx.fillStyle = '#ff3a3a';
        ctx.fillRect(ex - 2 * dir, ey - 13, 1, 1);
        ctx.fillRect(ex + 1 * dir, ey - 13, 1, 1);
      } else if (e.kind === 'runner') {
        ctx.fillStyle = '#ff3a3a';
        ctx.fillRect(ex + 3 * dir, ey - 8, 1, 1);
      } else if (e.kind === 'segfault') {
        ctx.fillStyle = '#ffec3d';
        ctx.fillRect(ex - 2 * dir, ey - 12, 1, 1);
        ctx.fillRect(ex + 1 * dir, ey - 12, 1, 1);
      } else if (e.kind === 'stack') {
        ctx.fillStyle = '#ff3a3a';
        ctx.fillRect(ex - 3 * dir, ey - 20, 1, 1);
        ctx.fillRect(ex + 2 * dir, ey - 20, 1, 1);
      } else if (e.kind === 'bug') {
        ctx.fillStyle = '#ff3a3a';
        ctx.fillRect(ex + 3 * dir, ey - 3, 1, 2);
      }
    }
  }
  for (const b of g.bullets) {
    const sp = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / sp) * (b.size + 4);
    const ty = b.y - (b.vy / sp) * (b.size + 4);
    if (b.flame) continue;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.size;
    ctx.beginPath();
    ctx.moveTo(Math.round(tx), Math.round(ty));
    ctx.lineTo(Math.round(b.x), Math.round(b.y));
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
  }
  ctx.lineWidth = 1;
  for (const t of g.tracers) {
    const k = t.life / t.max;
    ctx.strokeStyle = t.color;
    ctx.globalAlpha = k;
    ctx.lineWidth = Math.max(1, t.w * k);
    ctx.beginPath();
    ctx.moveTo(t.ax, t.ay);
    ctx.lineTo(t.bx, t.by);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(t.ax, t.ay);
    ctx.lineTo(t.bx, t.by);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const t of g.bolts) {
    // raios irregulares
    ctx.strokeStyle = Math.random() < 0.5 ? '#fff' : t.color;
    ctx.beginPath();
    ctx.moveTo(t.ax, t.ay);
    for (let i = 1; i < 6; i++) {
      const k = i / 6;
      ctx.lineTo(t.ax + (t.bx - t.ax) * k + rand(-7, 7), t.ay + (t.by - t.ay) * k + rand(-7, 7));
    }
    ctx.lineTo(t.bx, t.by);
    ctx.stroke();
  }
  for (const b of g.beams) {
    if (b.warn > 0) continue;
    const ex = b.x + Math.cos(b.a) * b.len;
    const ey = b.y + Math.sin(b.a) * b.len;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.w * 2 + rand(-1, 1);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = b.color === '#0a0a0c' ? '#ff004c' : '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  for (const b of g.ebullets) {
    const pulse = Math.sin(g.time * 18 + b.x) > 0;
    const R = b.r;
    ctx.fillStyle = pulse ? '#ffffff' : b.color;
    ctx.fillRect(Math.round(b.x - R), Math.round(b.y - R), R * 2, R * 2);
    ctx.fillStyle = b.color;
    ctx.fillRect(Math.round(b.x - R + 1), Math.round(b.y - R + 1), R * 2 - 2, R * 2 - 2);
    if (b.text) drawText(ctx, b.text, b.x, b.y - R - 8, b.color, { align: 'center' });
  }
  // órbita
  if (g.stats.orbit > 0 && !g.player.dead) {
    for (let k = 0; k < g.stats.orbit; k++) {
      const a = g.player.orbitA + (k * Math.PI * 2) / g.stats.orbit;
      ctx.fillStyle = '#39ffe5';
      ctx.fillRect(Math.round(g.player.x + Math.cos(a) * 26) - 2, Math.round(g.player.y - 6 + Math.sin(a) * 26) - 2, 4, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(g.player.x + Math.cos(a) * 26) - 1, Math.round(g.player.y - 6 + Math.sin(a) * 26) - 1, 2, 2);
    }
  }
  // Texto flutuante
  for (const t of g.texts) {
    drawText(ctx, t.str, t.x, t.y, t.color, { scale: t.scale, align: 'center', shadow: '#000', alpha: Math.min(1, t.life * 3) });
  }
  ctx.restore();
}

function renderLights(g: Game, ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const m = g.map;
  if (m.theme === 'void') return;
  const pl = g.player;
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = g.level.ambient;
  lctx.fillRect(0, 0, W, H);
  lctx.globalCompositeOperation = 'lighter';
  const put = (x: number, y: number, r: number, color: string, a = 1) => {
    const sx = x - ox;
    const sy = y - oy;
    if (sx + r < 0 || sy + r < 0 || sx - r > W || sy - r > H) return;
    lctx.globalAlpha = a;
    lctx.drawImage(lightTexture(color), sx - r, sy - r, r * 2, r * 2);
  };
  for (const l of m.lights) {
    let a = 1;
    if (l.flicker && Math.sin(g.time * 13 + l.x) + Math.sin(g.time * 37 + l.y) > 1.4) a = 1 - l.flicker;
    put(l.x, l.y, l.r, l.color, a);
  }
  for (const d of g.dynLights) put(d.x, d.y, d.r, d.color);
  if (!pl.dead) {
    put(pl.x, pl.y - 6, 74, '#b8b0a0', 0.85);
    lctx.globalAlpha = 0.95;
    lctx.save();
    lctx.translate(Math.round(pl.x - ox), Math.round(pl.y - 7 - oy));
    lctx.rotate(pl.aim);
    lctx.drawImage(coneTex, 0, -128);
    lctx.restore();
    if (pl.sudoT > 0) put(pl.x, pl.y - 6, 60, '#ffcc33', 0.8);
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(lightC, 0, 0);
  ctx.restore();
}

