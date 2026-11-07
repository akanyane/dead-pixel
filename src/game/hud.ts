import { drawText, wrap } from '../core/font';
import { H, W, clamp, rand } from '../core/util';
import { ENEMIES, LEVELS, WEAPONS, WEAPON_ORDER, type PerkDef } from './data';
import type { Game } from './game';
import { SPR, drawSprite } from './sprites';
import { COMMANDS } from './terminal';

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number, col: string, back = '#14141c') {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), h);
  // segmentos estilo gauge de terminal
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  for (let i = 4; i < w; i += 5) ctx.fillRect(x + i, y, 1, h);
}

const TAG_COLOR: Record<PerkDef['tag'], string> = {
  feat: '#a8ff3e',
  fix: '#ff5a6a',
  perf: '#39ffe5',
  chore: '#ffd23d',
  refactor: '#ff7ad9',
};

export function renderHud(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player;
  const isVoid = g.map.theme === 'void';
  const text = isVoid ? '#111118' : '#dfe6ee';
  const shadow = isVoid ? '#ffffff' : '#000000';
  const ramColor = isVoid ? '#0a7a3a' : '#39ff88';

  // HP / RAM
  drawText(ctx, 'HP', 14, 8, text, { shadow });
  const hpK = p.hp / p.maxHp;
  bar(ctx, 34, 9, 72, 6, hpK, hpK < 0.3 ? (Math.floor(g.time * 6) % 2 ? '#ff2a2a' : '#ff8a8a') : '#e8222a');
  drawText(ctx, `${Math.ceil(p.hp)}/${p.maxHp}`, 111, 8, text, { shadow });
  drawText(ctx, 'RAM', 14, 18, ramColor, { shadow });
  bar(ctx, 34, 20, 72, 4, p.ram / p.maxRam, ramColor);
  drawText(ctx, `${Math.floor(p.ram)}MB`, 111, 18, ramColor, { shadow });
  if (p.sudoT > 0) drawText(ctx, `SUDO ${p.sudoT.toFixed(1)}s`, 14, 29, '#ffcc33', { shadow });
  if (p.overclockT > 0) drawText(ctx, `OC ${p.overclockT.toFixed(1)}s`, 14, p.sudoT > 0 ? 39 : 29, '#39ffe5', { shadow });

  // Placar
  const score = Math.round(g.shownScore).toString().padStart(7, '0');
  drawText(ctx, score, W - 14, 7, text, { align: 'right', scale: 2, shadow });
  if (g.streak > 1) {
    const mult = g.multiplier();
    drawText(ctx, `x${mult}  ${g.streak} abates`, W - 14, 24, mult > 1 ? '#ffd23d' : text, { align: 'right', shadow });
    bar(ctx, W - 74, 34, 60, 2, g.streakT / 3.5, '#ffd23d');
  }

  // log de processos (tail -f)
  let ly = 42;
  for (const l of g.killLog) {
    drawText(ctx, l.text, W - 14, ly, isVoid ? '#555' : l.color, { align: 'right', alpha: Math.min(1, l.t) });
    ly += 9;
  }

  // Chefe ou wave
  if (g.bosses.length && (g.phase === 'boss' || g.phase === 'bossIntro')) {
    const name = ENEMIES[g.level.boss].name;
    const k = g.bossHpSum() / (g.bossTotal || 1);
    const bw = 168;
    const bx = (W - bw) / 2;
    drawText(ctx, name, W / 2, 7, isVoid ? '#000' : '#ff5a5a', { align: 'center', shadow });
    bar(ctx, bx, 17, bw, 6, k, isVoid ? '#000' : '#ff2a2a', isVoid ? '#cfcfc8' : '#14141c');
  } else if (g.phase === 'wave') {
    const left = g.queue.length + g.enemies.length;
    drawText(ctx, `wave ${g.waveIdx + 1}/${g.level.waves.length}  |  ${left} procs`, W / 2 + 14, 8, text, { align: 'center', shadow });
  }

  // Aviso
  if (g.note) {
    drawText(ctx, g.note.text, W / 2, 32, isVoid ? '#000' : '#a8ffc0', { align: 'center', shadow, alpha: Math.min(1, g.note.t * 2) });
  }

  // Anúncio de sequência
  if (g.announce) {
    const a = g.announce;
    const pop = clamp((1.6 - a.t) * 12, 0, 1);
    const s = pop < 1 ? 4 : 3;
    const jx = rand(-1, 1);
    drawText(ctx, a.text, W / 2 + jx - 2, 62, '#ff004c', { align: 'center', scale: s, alpha: 0.7 });
    drawText(ctx, a.text, W / 2 + jx + 2, 62, '#00e5ff', { align: 'center', scale: s, alpha: 0.7 });
    drawText(ctx, a.text, W / 2 + jx, 62, a.color, { align: 'center', scale: s });
  }

  // Apresentação do chefe
  if (g.phase === 'bossIntro') {
    const t = 3 - g.phaseT;
    const cardH = Math.min(58, t * 240);
    ctx.fillStyle = 'rgba(0,0,0,.84)';
    ctx.fillRect(0, H / 2 - cardH / 2 - 30, W, cardH);
    if (t > 0.2) {
      const name = ENEMIES[g.level.boss].name;
      const scale = name.length > 16 ? 2 : 3;
      drawText(ctx, name, W / 2, H / 2 - 48, '#ff2a2a', { align: 'center', scale, shadow: '#400' });
      const lines = g.level.bossLines;
      drawText(ctx, lines[t < 1.6 ? 0 : 1], W / 2, H / 2 - 20, '#dfe6ee', { align: 'center' });
    }
  }

  // Dica de controles no começo do jogo
  if (g.levelIdx === 0 && g.waveIdx === 0 && g.time - g.levelStartT < 14) {
    const hint = 'WASD anda | mouse atira | ESPAÇO dash | F teclada | Q terminal: digite help';
    drawText(ctx, hint, W / 2, H - 25, '#ffffff', { align: 'center', shadow: '#000' });
  }

  // Barra tmux
  const by = H - 13;
  ctx.fillStyle = '#1f7a45';
  ctx.fillRect(0, by, W, 13);
  let x = 10;
  const session = `[${g.level.dir}]`;
  drawText(ctx, session, x, by + 2, '#02150a');
  x += session.length * 6 + 6;
  // só a arma ativa mostra o nome: com as 6 armas o resto vira "n:munição"
  WEAPON_ORDER.forEach((id, i) => {
    if (!p.weapons.includes(id)) return;
    const on = p.weapon === id;
    const infinite = id === 'pistol';
    const ammo = infinite ? 'inf' : String(p.ammo[id]);
    const label = on ? `${i + 1}:${WEAPONS[id].name} ${infinite ? '' : ammo}`.trimEnd() : `${i + 1}:${ammo}`;
    const w = label.length * 6 + 2;
    if (on) {
      ctx.fillStyle = '#a8ffc0';
      ctx.fillRect(x - 1, by, w, 13);
    }
    drawText(ctx, label, x, by + 2, !infinite && p.ammo[id] <= 0 ? '#0b3a20' : '#02150a');
    x += w + 3;
  });
  const usable = COMMANDS.filter((c) => p.ram >= c.cost).length;
  drawText(ctx, `[Q] term ${usable}/${COMMANDS.length}`, W - 10, by + 2, usable && Math.floor(g.time * 2) % 2 ? '#d7ffe4' : '#02150a', { align: 'right' });

  // Sangue na borda da tela quando ferido
  if (g.hurtFlash > 0 || hpK < 0.35) {
    const low = hpK < 0.35 && !p.dead ? 0.22 + Math.sin(g.time * 6) * 0.1 : 0;
    const a = Math.max(low, g.hurtFlash * 0.42);
    ctx.fillStyle = `rgba(190,10,20,${a})`;
    const t = 14 + Math.floor(a * 30);
    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, H - t, W, t);
    ctx.fillRect(0, 0, t, H);
    ctx.fillRect(W - t, 0, t, H);
    ctx.fillStyle = `rgba(190,10,20,${a * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (g.whiteFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${g.whiteFlash * 0.75})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (g.term.open) renderTerminal(g, ctx);
}

function renderTerminal(g: Game, ctx: CanvasRenderingContext2D) {
  const t = g.term;
  const x = 8;
  const w = W - 16;
  const h = 102;
  const y = H - 15 - h;
  ctx.fillStyle = 'rgba(2,10,6,.93)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#39ff88';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(x, y, w, 9);
  drawText(ctx, `root@deadpixel:${g.level.dir}`, x + 3, y, '#02150a');
  drawText(ctx, 'BULLET TIME  |  ESC fecha', x + w - 3, y, '#02150a', { align: 'right' });

  // Saída
  const leftW = 354;
  const maxLines = 7;
  const lines = t.lines.slice(-maxLines);
  lines.forEach((l, i) => {
    drawText(ctx, l.text.slice(0, Math.floor(leftW / 6)), x + 4, y + 12 + i * 9, l.color);
  });
  const cursor = Math.floor(t.cursorT * 3) % 2 === 0 ? '_' : ' ';
  const prompt = t.inVim ? ':' : '#';
  drawText(ctx, `${prompt} ${t.line}${cursor}`, x + 4, y + h - 12, '#ffffff');

  // Comandos com custo
  const cx = x + leftW + 6;
  ctx.fillStyle = '#123';
  ctx.fillRect(cx - 3, y + 10, 1, h - 11);
  const match = new Set(t.matches().map((c) => c.name));
  COMMANDS.forEach((c, i) => {
    const can = g.player.ram >= c.cost;
    const hit = match.has(c.name) && t.line.trim().length > 0;
    const color = hit ? '#ffffff' : can ? '#39ff88' : '#3b5245';
    drawText(ctx, `${c.name.padEnd(9)}${String(c.cost).padStart(3)}MB`, cx, y + 12 + i * 10, color);
  });
}

export function renderPerks(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(2,6,10,.8)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, '$ gh pr list --state open', 22, 26, '#6d8a78');
  drawText(ctx, 'ESCOLHA UM PULL REQUEST PARA MERGEAR', W / 2, 44, '#ffffff', { align: 'center', scale: 1 });
  const cw = 138;
  const ch = 112;
  const gap = 10;
  const sx = (W - (cw * 3 + gap * 2)) / 2;
  const y = 66;
  g.perkChoices.forEach((pk, i) => {
    const x = sx + i * (cw + gap);
    const hover = g.perkHover === i;
    const lift = hover ? 4 : 0;
    const col = TAG_COLOR[pk.tag];
    ctx.fillStyle = hover ? '#16202a' : '#0c1218';
    ctx.fillRect(x, y - lift, cw, ch);
    ctx.strokeStyle = hover ? col : '#2b3844';
    ctx.strokeRect(x + 0.5, y - lift + 0.5, cw - 1, ch - 1);
    ctx.fillStyle = col;
    ctx.fillRect(x, y - lift, cw, 3);
    drawText(ctx, `#${1337 + g.levelIdx * 31 + i + g.waveIdx * 7}`, x + 6, y - lift + 7, '#6d7f8f');
    drawText(ctx, `[${i + 1}]`, x + cw - 6, y - lift + 7, hover ? '#fff' : '#6d7f8f', { align: 'right' });
    drawText(ctx, `${pk.tag}:`, x + 6, y - lift + 20, col);
    wrap(pk.title, 21).forEach((l, n) => drawText(ctx, l, x + 6, y - lift + 30 + n * 10, '#ffffff'));
    wrap(pk.desc, 21).forEach((l, n) => drawText(ctx, l, x + 6, y - lift + 56 + n * 10, '#aab7c4'));
    const owned = g.perks[pk.id] ?? 0;
    if (owned) drawText(ctx, `já mergeado x${owned}`, x + 6, y - lift + ch - 12, '#6d7f8f');
  });
  drawText(ctx, 'clique, ou aperte 1, 2 ou 3', W / 2, 192, '#6d8a78', { align: 'center' });
}

export function renderStory(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, W, H);
  const lvl = g.level;
  drawText(ctx, `FASE ${g.levelIdx + 1}/${LEVELS.length}`, 34, 44, '#6d8a78');
  drawText(ctx, lvl.title, 34, 56, '#ff2a2a', { scale: 4, shadow: '#400' });
  drawText(ctx, `$ cd ${lvl.dir}`, 34, 100, '#39ff88');
  const cps = 42;
  let budget = Math.floor(g.storyT * cps);
  let y = 118;
  for (const l of lvl.story) {
    if (budget <= 0) break;
    const shown = l.slice(0, budget);
    budget -= l.length + 6;
    wrap(shown, 68).forEach((row) => {
      drawText(ctx, row, 34, y, '#dfe6ee');
      y += 10;
    });
    y += 4;
  }
  const total = lvl.story.reduce((n, l) => n + l.length + 6, 0);
  if (g.storyT * cps > total && Math.floor(g.time * 2) % 2) {
    drawText(ctx, 'pressione ENTER para executar', W / 2, H - 28, '#39ff88', { align: 'center' });
  } else if (g.storyT * cps <= total) {
    drawText(ctx, 'ENTER para pular', W - 12, H - 16, '#3b5245', { align: 'right' });
  }
}

function fmtTime(g: Game) {
  const s = Math.floor(g.time - g.levelStartT);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
}

export function renderClear(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(2,8,6,.88)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, '$ ./deploy.sh', 60, 36, '#6d8a78');
  drawText(ctx, 'BUILD PASSED', W / 2, 54, '#39ff88', { align: 'center', scale: 4 });
  drawText(ctx, `fase "${g.level.title}" estabilizada`, W / 2, 96, '#dfe6ee', { align: 'center' });
  const rows: [string, string][] = [
    ['pontuação', String(g.score)],
    ['abates', String(g.kills)],
    ['maior sequência', String(g.maxStreak)],
    ['tempo de fase', fmtTime(g)],
  ];
  rows.forEach(([a, b], i) => {
    drawText(ctx, a, 150, 118 + i * 11, '#8fa3bf');
    drawText(ctx, b, W - 150, 118 + i * 11, '#ffffff', { align: 'right' });
  });
  if (g.rewardMsg) {
    drawText(ctx, `$ ${g.rewardMsg}`, W / 2, 176, '#a8ff3e', { align: 'center', scale: 1 });
    const r = g.level.reward;
    if (r) {
      drawText(ctx, WEAPONS[r].desc, W / 2, 188, '#aab7c4', { align: 'center' });
      const spr = SPR.guns[r];
      drawSprite(ctx, spr, W / 2, 172, false, false, 2);
    }
  }
  if (Math.floor(g.time * 2) % 2) drawText(ctx, 'ENTER para abrir o próximo PR', W / 2, H - 28, '#39ff88', { align: 'center' });
}

export function renderDead(g: Game, ctx: CanvasRenderingContext2D) {
  const k = clamp(g.stateT * 2, 0, 1);
  ctx.fillStyle = `rgba(30,0,4,${0.8 * k})`;
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'Segmentation fault', W / 2, 62, '#ff2a2a', { align: 'center', scale: 3, shadow: '#400' });
  drawText(ctx, '(core dumped)', W / 2, 92, '#ff8a8a', { align: 'center', scale: 2 });
  drawText(ctx, pick2(g), W / 2, 120, '#dfe6ee', { align: 'center' });
  drawText(ctx, `pontuação ${g.score}   |   abates ${g.kills}   |   recorde ${Math.max(g.best, g.score)}`, W / 2, 140, '#8fa3bf', { align: 'center' });
  drawText(ctx, 'R reinicia a fase', W / 2, 176, Math.floor(g.time * 2) % 2 ? '#39ff88' : '#a8ffc0', { align: 'center', scale: 2 });
  drawText(ctx, 'M volta ao menu', W / 2, 200, '#6d8a78', { align: 'center' });
}

const EPITAPHS = [
  'você morreu com 37 abas abertas.',
  'em produção ninguém ouve seu grito.',
  'seu último commit foi "ajustes".',
  'funcionava na sua máquina.',
  'o stack trace ficou lindo no chão.',
  'você foi deprecado.',
];
function pick2(g: Game) {
  return EPITAPHS[(g.deaths + g.kills) % EPITAPHS.length];
}

export function renderPause(g: Game, ctx: CanvasRenderingContext2D, items: string[]) {
  ctx.fillStyle = 'rgba(2,6,10,.82)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'SIGSTOP', W / 2, 48, '#ffffff', { align: 'center', scale: 3 });
  drawText(ctx, 'processo pausado', W / 2, 76, '#6d8a78', { align: 'center' });
  items.forEach((it, i) => {
    const on = g.pauseIdx === i;
    if (on) {
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(W / 2 - 92, 96 + i * 16 - 2, 184, 13);
    }
    drawText(ctx, it, W / 2, 96 + i * 16, on ? '#02150a' : '#dfe6ee', { align: 'center' });
  });
  const lines = ['WASD mover  |  mouse mirar e atirar  |  ESPAÇO dash', 'F ou botão direito: teclada  |  1-6 ou scroll: arma', 'Q: terminal (digite help, rm -rf, kill -9, sudo...)'];
  lines.forEach((l, i) => drawText(ctx, l, W / 2, 200 + i * 11, '#6d8a78', { align: 'center' }));
}

export function renderVictory(g: Game, ctx: CanvasRenderingContext2D) {
  const k = clamp(g.stateT / 1.5, 0, 1);
  ctx.fillStyle = `rgba(255,255,255,${k})`;
  ctx.fillRect(0, 0, W, H);
  if (k < 1) return;
  drawText(ctx, 'git revert HEAD', 40, 34, '#888');
  drawText(ctx, 'O PIXEL VOLTOU.', W / 2, 54, '#000', { align: 'center', scale: 4 });
  drawText(ctx, 'Os monitores acordaram. O escritório está... bem sujo.', W / 2, 96, '#333', { align: 'center' });
  drawText(ctx, 'Ninguém se lembra de nada. Segunda tem daily às 9h.', W / 2, 108, '#333', { align: 'center' });
  const rows: [string, string][] = [
    ['pontuação final', String(g.score)],
    ['recorde', String(Math.max(g.best, g.score))],
    ['processos encerrados', String(g.kills)],
    ['maior sequência', String(g.maxStreak)],
    ['mortes', String(g.deaths)],
  ];
  rows.forEach(([a, b], i) => {
    drawText(ctx, a, 140, 132 + i * 11, '#555');
    drawText(ctx, b, W - 140, 132 + i * 11, '#000', { align: 'right' });
  });
  ctx.fillStyle = '#000';
  ctx.fillRect(W / 2, 200, 1, 1);
  drawText(ctx, 'ENTER para o menu', W / 2, H - 28, '#a3101a', { align: 'center' });
  drawText(ctx, 'obrigado por jogar. faça backup.', W / 2, H - 14, '#888', { align: 'center' });
}

