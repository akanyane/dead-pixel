import { drawText, wrap } from '../core/font';
import { H, W, clamp, rand } from '../core/util';
import { LEVELS, WEAPONS, WEAPON_ORDER, type PerkDef } from './data';
import type { Game } from './game';
import { T } from './i18n';
import { SPR, drawSprite } from './sprites';
import { COMMANDS, TERM_BOX, commandRowY } from './terminal';

export function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number, col: string, back = '#14141c') {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), h);
  // terminal-style gauge segments
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

export function renderHud(g: Game, ctx: CanvasRenderingContext2D, controlsHint = T().hud.controlsHint) {
  const p = g.player;
  const t = T();
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

  // Score
  const score = Math.round(g.shownScore).toString().padStart(7, '0');
  drawText(ctx, score, W - 14, 7, text, { align: 'right', scale: 2, shadow });
  if (g.streak > 1) {
    const mult = g.multiplier();
    drawText(ctx, `x${mult}  ${t.hud.kills(g.streak)}`, W - 14, 24, mult > 1 ? '#ffd23d' : text, { align: 'right', shadow });
    bar(ctx, W - 74, 34, 60, 2, g.streakT / 3.5, '#ffd23d');
  }

  // process log (tail -f)
  let ly = 42;
  for (const l of g.killLog) {
    drawText(ctx, l.text, W - 14, ly, isVoid ? '#555' : l.color, { align: 'right', alpha: Math.min(1, l.t) });
    ly += 9;
  }

  // Boss or wave
  if (g.bosses.length && (g.phase === 'boss' || g.phase === 'bossIntro')) {
    const name = t.enemies[g.level.boss].name;
    const k = g.bossHpSum() / (g.bossTotal || 1);
    const bw = 168;
    const bx = (W - bw) / 2;
    drawText(ctx, name, W / 2, 7, isVoid ? '#000' : '#ff5a5a', { align: 'center', shadow });
    bar(ctx, bx, 17, bw, 6, k, isVoid ? '#000' : '#ff2a2a', isVoid ? '#cfcfc8' : '#14141c');
  } else if (g.phase === 'wave') {
    const left = g.queue.length + g.enemies.length;
    const label = g.isArcade() ? t.arcade.wave(g.arcadeWave, left) : t.hud.wave(g.waveIdx + 1, g.level.waves.length, left);
    drawText(ctx, label, W / 2 + 14, 8, text, { align: 'center', shadow });
  }

  // Notice
  if (g.note) {
    drawText(ctx, g.note.text, W / 2, 32, isVoid ? '#000' : '#a8ffc0', { align: 'center', shadow, alpha: Math.min(1, g.note.t * 2) });
  }

  // Streak announcement
  if (g.announce) {
    const a = g.announce;
    const pop = clamp((1.6 - a.t) * 12, 0, 1);
    const s = pop < 1 && a.text.length * 24 < W - 20 ? 4 : a.text.length * 18 < W - 20 ? 3 : 2;
    const jx = rand(-1, 1);
    drawText(ctx, a.text, W / 2 + jx - 2, 62, '#ff004c', { align: 'center', scale: s, alpha: 0.7 });
    drawText(ctx, a.text, W / 2 + jx + 2, 62, '#00e5ff', { align: 'center', scale: s, alpha: 0.7 });
    drawText(ctx, a.text, W / 2 + jx, 62, a.color, { align: 'center', scale: s });
  }

  // Boss introduction
  if (g.phase === 'bossIntro') {
    const tt = 3 - g.phaseT;
    const cardH = Math.min(58, tt * 240);
    ctx.fillStyle = 'rgba(0,0,0,.84)';
    ctx.fillRect(0, H / 2 - cardH / 2 - 30, W, cardH);
    if (tt > 0.2) {
      const name = t.enemies[g.level.boss].name;
      const scale = name.length > 16 ? 2 : 3;
      drawText(ctx, name, W / 2, H / 2 - 48, '#ff2a2a', { align: 'center', scale, shadow: '#400' });
      const lines = t.levels[g.levelIdx].bossLines;
      drawText(ctx, lines[tt < 1.6 ? 0 : 1], W / 2, H / 2 - 20, '#dfe6ee', { align: 'center' });
    }
  }

  // Controls hint at the start of the game
  const firstWave = g.isArcade() ? g.arcadeWave === 1 : g.levelIdx === 0 && g.waveIdx === 0;
  if (firstWave && g.time - g.levelStartT < 14 && !g.term.open) {
    drawText(ctx, controlsHint === T().menu.controls ? t.hud.controlsHint : controlsHint, W / 2, H - 25, '#ffffff', { align: 'center', shadow: '#000' });
  }

  // tmux bar
  const by = H - 13;
  ctx.fillStyle = '#1f7a45';
  ctx.fillRect(0, by, W, 13);
  let x = 10;
  const session = `[${g.level.dir}]`;
  drawText(ctx, session, x, by + 2, '#02150a');
  x += session.length * 6 + 6;
  // only the active weapon shows its name: with all 6 weapons the rest become "n:ammo"
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

  // Blood on the screen edges when hurt
  if (g.hurtFlash > 0 || hpK < 0.35) {
    const low = hpK < 0.35 && !p.dead ? 0.22 + Math.sin(g.time * 6) * 0.1 : 0;
    const a = Math.max(low, g.hurtFlash * 0.42);
    ctx.fillStyle = `rgba(190,10,20,${a})`;
    const th = 14 + Math.floor(a * 30);
    ctx.fillRect(0, 0, W, th);
    ctx.fillRect(0, H - th, W, th);
    ctx.fillRect(0, 0, th, H);
    ctx.fillRect(W - th, 0, th, H);
    ctx.fillStyle = `rgba(190,10,20,${a * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (g.whiteFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${g.whiteFlash * 0.75})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (g.term.open) renderTerminal(g, ctx);
}

/** Unlock toast: drawn on top of any screen. */
export function renderToast(g: Game, ctx: CanvasRenderingContext2D) {
  const toast = g.toasts[0];
  if (!toast || g.inEndingPages()) return;
  const w = toast.text.length * 6 + 16;
  const x = (W - w) / 2;
  ctx.fillStyle = '#0c1a12';
  ctx.fillRect(x, 208, w, 15);
  ctx.strokeStyle = '#39ff88';
  ctx.strokeRect(x + 0.5, 208.5, w - 1, 14);
  drawText(ctx, toast.text, W / 2, 212, '#a8ff3e', { align: 'center' });
}

function renderTerminal(g: Game, ctx: CanvasRenderingContext2D) {
  const t = g.term;
  const { x, w, h, y } = TERM_BOX;
  ctx.fillStyle = 'rgba(2,10,6,.93)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#39ff88';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(x, y, w, 9);
  drawText(ctx, `root@deadpixel:${g.level.dir}`, x + 3, y, '#02150a');
  drawText(ctx, T().term.bar, x + w - 3, y, '#02150a', { align: 'right' });

  // Output
  const leftW = 354;
  const maxLines = 7;
  const lines = t.lines.slice(-maxLines);
  lines.forEach((l, i) => {
    drawText(ctx, l.text.slice(0, Math.floor(leftW / 6)), x + 4, y + 12 + i * 9, l.color);
  });
  const cursor = Math.floor(t.cursorT * 3) % 2 === 0 ? '_' : ' ';
  const pad = g.input.usingPad;
  if (pad || g.input.touchActive) drawText(ctx, pad ? T().pad.term : T().touch.term, x + 4, y + h - 12, '#ffd23d');
  else drawText(ctx, `# ${t.line}${cursor}`, x + 4, y + h - 12, '#ffffff');

  // Commands and their cost
  const cx = TERM_BOX.listX;
  ctx.fillStyle = '#123';
  ctx.fillRect(cx - 3, y + 10, 1, h - 11);
  const match = new Set(t.matches().map((c) => c.name));
  COMMANDS.forEach((c, i) => {
    const can = g.player.ram >= c.cost;
    const hit = match.has(c.name) && t.line.trim().length > 0;
    const chosen = pad && t.sel === i;
    if (chosen) {
      ctx.fillStyle = can ? '#39ff88' : '#3b5245';
      ctx.fillRect(cx - 2, commandRowY(i) - 1, x + w - cx - 1, TERM_BOX.row - 1);
    }
    const color = chosen ? '#02150a' : hit ? '#ffffff' : can ? '#39ff88' : '#3b5245';
    drawText(ctx, `${c.name.padEnd(9)}${String(c.cost).padStart(3)}MB`, cx, commandRowY(i), color);
  });
}

export function renderPerks(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  ctx.fillStyle = 'rgba(2,6,10,.8)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, '$ patch --list --from op', 22, 26, '#6d8a78');
  drawText(ctx, t.perkScreen.title, W / 2, 44, '#ffffff', { align: 'center', scale: 1 });
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
    const pt = t.perks[pk.id];
    wrap(pt.title, 21).forEach((l, n) => drawText(ctx, l, x + 6, y - lift + 30 + n * 10, '#ffffff'));
    wrap(pt.desc, 21).forEach((l, n) => drawText(ctx, l, x + 6, y - lift + 56 + n * 10, '#aab7c4'));
    const owned = g.perks[pk.id] ?? 0;
    if (owned) drawText(ctx, t.perkScreen.owned(owned), x + 6, y - lift + ch - 12, '#6d7f8f');
  });
  drawText(ctx, t.perkScreen.hint, W / 2, 192, '#6d8a78', { align: 'center' });
}

function storyLines(g: Game) {
  const t = T();
  const lines = [...t.levels[g.levelIdx].story];
  if (g.levelIdx === 0 && g.progress.runs > 0) lines.push(t.story.replay);
  return lines;
}

export function storyDuration(g: Game) {
  return storyLines(g).reduce((n, l) => n + l.length + 6, 0) / 42;
}

export function renderStory(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, W, H);
  const lvl = t.levels[g.levelIdx];
  drawText(ctx, t.story.phase(g.levelIdx + 1, LEVELS.length), 34, 30, '#6d8a78');
  const diff = g.difficulty === 'normal' ? '' : `${t.modes.difficulty[g.difficulty]}  |  `;
  drawText(ctx, `${diff}run ${String(g.run()).padStart(4, '0')}`, W - 34, 30, '#2f3d36', { align: 'right' });
  drawText(ctx, lvl.title, 34, 42, '#ff2a2a', { scale: 4, shadow: '#400' });
  drawText(ctx, `$ cd ${g.level.dir}`, 34, 84, '#39ff88');
  const cps = 42;
  let budget = Math.floor(g.storyT * cps);
  let y = 100;
  for (const l of storyLines(g)) {
    if (budget <= 0) break;
    const shown = l.slice(0, budget);
    budget -= l.length + 6;
    wrap(shown, 68).forEach((row) => {
      drawText(ctx, row, 34, y, '#dfe6ee');
      y += 10;
    });
    y += 4;
  }
  // Fixed tip at the bottom, to make use of the pause between levels
  const tip = t.manual.tips[g.storyTip % t.manual.tips.length];
  ctx.fillStyle = '#0a1612';
  ctx.fillRect(34, 182, W - 68, 50);
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(34, 182, 2, 50);
  drawText(ctx, `${t.story.tip}: ${tip.title}`, 42, 186, '#39ff88');
  wrap(tip.body, 66).slice(0, 3).forEach((row, i) => drawText(ctx, row, 42, 197 + i * 10, '#aab7c4'));

  if (g.storyT > storyDuration(g)) {
    if (Math.floor(g.time * 2) % 2) drawText(ctx, t.story.run, W / 2, H - 28, '#39ff88', { align: 'center' });
  } else {
    drawText(ctx, t.story.skip, W - 34, H - 28, '#3b5245', { align: 'right' });
  }
}

function fmtTime(g: Game) {
  const s = Math.floor(g.time - g.levelStartT);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
}

export function renderClear(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  ctx.fillStyle = 'rgba(2,8,6,.88)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, '$ ./deploy.sh', 60, 36, '#6d8a78');
  drawText(ctx, 'BUILD PASSED', W / 2, 54, '#39ff88', { align: 'center', scale: 4 });
  drawText(ctx, t.clear.stable(t.levels[g.levelIdx].title), W / 2, 96, '#dfe6ee', { align: 'center' });
  const rows: [string, string][] = [
    [t.clear.score, String(g.score)],
    [t.clear.kills, String(g.kills)],
    [t.clear.streak, String(g.maxStreak)],
    [t.clear.time, fmtTime(g)],
  ];
  rows.forEach(([a, b], i) => {
    drawText(ctx, a, 150, 118 + i * 11, '#8fa3bf');
    drawText(ctx, b, W - 150, 118 + i * 11, '#ffffff', { align: 'right' });
  });
  if (g.rewardMsg) {
    drawText(ctx, `$ ${g.rewardMsg}`, W / 2, 176, '#a8ff3e', { align: 'center', scale: 1 });
    const r = g.level.reward;
    if (r) {
      drawText(ctx, wrap(t.weapons[r].desc, 76)[0], W / 2, 188, '#aab7c4', { align: 'center' });
      const spr = SPR.guns[r];
      drawSprite(ctx, spr, W / 2, 172, false, false, 2);
    }
  }
  if (Math.floor(g.time * 2) % 2) drawText(ctx, t.clear.next, W / 2, H - 28, '#39ff88', { align: 'center' });
}

export function renderDead(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T();
  const k = clamp(g.stateT * 2, 0, 1);
  ctx.fillStyle = `rgba(30,0,4,${0.86 * k})`;
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'Segmentation fault', W / 2, 34, '#ff2a2a', { align: 'center', scale: 3, shadow: '#400' });
  drawText(ctx, '(core dumped)', W / 2, 62, '#ff8a8a', { align: 'center', scale: 2 });
  const ep = t.dead.epitaphs;
  drawText(ctx, ep[(g.deaths + g.kills) % ep.length], W / 2, 84, '#dfe6ee', { align: 'center' });

  // Who killed you and how to avoid it: death becomes a lesson
  const killer = g.lastKiller;
  const info = killer === 'deploy' || killer === 'corrupt' || killer === 'beam' ? t.killers[killer] : t.enemies[killer];
  const lines = wrap(info.tip, 68);
  const boxY = 104;
  const boxH = 18 + lines.length * 10;
  ctx.fillStyle = '#1a0408';
  ctx.fillRect(34, boxY, W - 68, boxH);
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(34, boxY, 2, boxH);
  drawText(ctx, t.dead.killedBy(info.name), 42, boxY + 4, '#ff8a8a');
  lines.forEach((l, i) => drawText(ctx, l, 42, boxY + 15 + i * 10, '#dfe6ee'));

  const blink = Math.floor(g.time * 2) % 2 ? '#39ff88' : '#a8ffc0';
  if (g.isArcade()) {
    // arcade: one life only, and the result can be shared
    const a = t.arcade;
    drawText(ctx, `${a.over}: ${a.reached(g.arcadeWave)}`, W / 2, 160, '#ffd23d', { align: 'center' });
    drawText(ctx, `${t.dead.score} ${g.score}   |   ${t.dead.kills} ${g.kills}${g.newBest ? `   |   ${a.newBest}` : ''}`, W / 2, 172, '#8fa3bf', { align: 'center' });
    drawText(ctx, a.retry, W / 2, 184, blink, { align: 'center' });
    drawText(ctx, a.copy, W / 2, 197, '#a8ff3e', { align: 'center' });
    drawText(ctx, t.dead.menu, W / 2, 214, '#6d8a78', { align: 'center' });
    return;
  }
  drawText(ctx, `${t.dead.score} ${g.score}   |   ${t.dead.kills} ${g.kills}   |   ${t.dead.best} ${Math.max(g.best, g.score)}`, W / 2, 170, '#8fa3bf', { align: 'center' });
  if (g.difficulty === 'hardcore') {
    drawText(ctx, t.dead.hardcore, W / 2, 186, '#ff5a5a', { align: 'center' });
    drawText(ctx, t.dead.hardcoreRetry, W / 2, 200, blink, { align: 'center' });
    drawText(ctx, t.dead.menu, W / 2, 214, '#6d8a78', { align: 'center' });
    return;
  }
  drawText(ctx, t.dead.retry, W / 2, 190, blink, { align: 'center', scale: 2 });
  drawText(ctx, t.dead.menu, W / 2, 214, '#6d8a78', { align: 'center' });
}

export function renderPause(g: Game, ctx: CanvasRenderingContext2D, items: string[]) {
  const t = T();
  ctx.fillStyle = 'rgba(2,6,10,.82)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'SIGSTOP', W / 2, 48, '#ffffff', { align: 'center', scale: 3 });
  drawText(ctx, t.pause.subtitle, W / 2, 76, '#6d8a78', { align: 'center' });
  items.forEach((it, i) => {
    const on = g.pauseIdx === i;
    if (on) {
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(W / 2 - 92, 96 + i * 16 - 2, 184, 13);
    }
    drawText(ctx, it, W / 2, 96 + i * 16, on ? '#02150a' : '#dfe6ee', { align: 'center' });
  });
  t.pause.controls.forEach((l, i) => drawText(ctx, l, W / 2, 200 + i * 11, '#6d8a78', { align: 'center' }));
}

/** Text typed out letter by letter. Returns true once it has finished. */
function typed(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, chars: number, elapsed: number, cps: number, color: (line: string) => string) {
  let budget = Math.floor(elapsed * cps);
  for (const line of lines) {
    if (budget <= 0) return false;
    wrap(line.slice(0, budget), chars).forEach((row) => {
      drawText(ctx, row, x, y, color(line));
      y += 10;
    });
    y += line ? 4 : 8;
    budget -= line.length + 8;
  }
  return budget > 0;
}

export function logDone(g: Game) {
  return g.logT * 60 > logLines(g).reduce((n, l) => n + l.length + 8, 0);
}

function logLines(g: Game) {
  const fmt = (n: number) => String(n).padStart(4, '0');
  return T().levels[g.levelIdx].recovered.map((l) => l.replace('{run}', fmt(g.run())).replace('{prev}', String(g.run() - 1)));
}

/** Fragment found after each boss: this is where the mystery moves forward. */
export function renderLog(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#030507';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(30, 44, 2, 150);
  const first = logLines(g)[0];
  const done = typed(ctx, logLines(g), 40, 44, 68, g.logT, 60, (l) => (l === first ? '#39ff88' : l.startsWith('op>') ? '#a8ffc0' : l.startsWith('$') || /^\d\d:/.test(l) ? '#8fa3bf' : '#dfe6ee'));
  if (done && Math.floor(g.time * 2) % 2) drawText(ctx, T().logScreen.next, W / 2, H - 28, '#39ff88', { align: 'center' });
}

const pageLength = (page: string[]) => page.reduce((n, l) => n + l.length + 8, 0);

export function endingPageDone(g: Game) {
  const pages = T().ending.pages(g.endRun);
  return g.endPage >= pages.length || g.endT * 34 > pageLength(pages[g.endPage]);
}

/** Advances the ending. Returns true when there is nothing left to show. */
export function advanceEnding(g: Game) {
  const pages = T().ending.pages(g.endRun);
  if (g.endPage >= pages.length) return true;
  if (!endingPageDone(g)) g.endT = 999;
  else {
    g.endPage++;
    g.endT = 0;
  }
  return false;
}

export function renderVictory(g: Game, ctx: CanvasRenderingContext2D) {
  const t = T().ending;
  const k = clamp(g.stateT / 1.5, 0, 1);
  if (k < 1) {
    ctx.fillStyle = `rgba(255,255,255,${k})`;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const pages = t.pages(g.endRun);
  if (g.endPage < pages.length) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const page = pages[g.endPage];
    const remote = g.endPage === pages.length - 1;
    const done = typed(ctx, page, 44, 64, 66, g.endT, 34, (l) => (remote ? (l.startsWith('$') ? '#ff5a5a' : '#8fa3bf') : l.startsWith('"') ? '#ffffff' : '#8fa3bf'));
    if (done && Math.floor(g.time * 2) % 2) drawText(ctx, t.next, W / 2, H - 28, '#6d8a78', { align: 'center' });
    return;
  }
  // the test pattern comes back, clean, as if nothing had happened
  ctx.fillStyle = '#ecece6';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, t.title, W / 2, 46, '#000', { align: 'center', scale: t.title.length > 15 ? 3 : 4 });
  const rows: [string, string][] = [
    [t.finalScore, String(g.score)],
    [t.best, String(Math.max(g.best, g.score))],
    [t.kills, String(g.kills)],
    [t.streak, String(g.maxStreak)],
    [t.deaths, String(g.deaths)],
  ];
  rows.forEach(([a, b], i) => {
    drawText(ctx, a, 140, 92 + i * 11, '#555');
    drawText(ctx, b, W - 140, 92 + i * 11, '#000', { align: 'right' });
  });
  ctx.fillStyle = '#000';
  ctx.fillRect(W / 2, 170, 1, 1);
  drawText(ctx, t.nextRun(g.endRun + 1), W / 2, 196, '#a3101a', { align: 'center' });
  drawText(ctx, t.menu, W / 2, H - 28, '#555', { align: 'center' });
}
