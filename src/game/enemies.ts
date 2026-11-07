import { TILE, angleTo, chance, clamp, dist, pick, rand } from '../core/util';
import { explosion, forNear, hurtEnemy, hurtPlayer, killEnemy, setHydraTier } from './combat';
import { ENEMIES, type EnemyKind } from './data';
import { T } from './i18n';
import { BLOOD, P, bloodFountain, bloodSpray, glitchPixels, ring, spawnPart, splat } from './fx';
import type { Enemy, Game } from './game';

export function spawnEnemy(g: Game, kind: EnemyKind, x: number, y: number): Enemy {
  const d = ENEMIES[kind];
  // escala leve de HP por fase: as armas também evoluem. Chefes têm a própria escala.
  const scale = d.hp > 1000 ? g.bossHpMul() : g.enemyHpScale();
  const e: Enemy = {
    kind, def: d, x, y, vx: 0, vy: 0, hp: d.hp * scale, maxHp: d.hp * scale, r: d.r, hoff: d.hoff, flash: 0, t: rand(5), flip: false,
    state: 0, stateT: rand(0.5, 2), a: rand(6.28), b: 0, wounded: false, burn: 0, stun: 0, skin: Math.floor(rand(4)), speedMul: rand(0.85, 1.2),
    boss: false, tier: 0, dead: false, atkCd: 0, orbitCd: 0, spawnT: 0.4, lastX: x, lastY: y, stuckT: 0,
  };
  g.enemies.push(e);
  return e;
}

export function spawnBoss(g: Game, kind: EnemyKind) {
  const m = g.map;
  const p = g.player;
  let x = m.pxW / 2;
  let y = m.pxH / 2 - 60;
  if (kind === 'monolith') {
    y = TILE * 7;
    if (p.y < y + 90) p.y = y + 110;
  }
  if (kind === 'pixel') y = m.pxH / 2;
  if (dist(x, y, p.x, p.y) < 70) {
    p.y = Math.min(m.pxH - TILE * 2, y + 110);
    if (m.collides(p.x, p.y, 4)) {
      const s = m.randomFloor();
      p.x = s.x;
      p.y = s.y;
    }
  }
  const e = spawnEnemy(g, kind, x, y);
  e.boss = true;
  e.spawnT = 0;
  e.state = 0;
  e.stateT = 2.8;
  e.stun = 0;
  e.speedMul = 1;
  e.skin = 0;
  if (kind === 'hydra') setHydraTier(g, e, 3);
  if (kind === 'monolith') {
    e.state = 0;
    e.stateT = 6;
  }
  if (kind === 'pixel') {
    e.state = 1;
    e.stateT = 3;
    g.whiteFlash = 1;
  }
  g.bosses.push(e);
}

// Inimigo sendo atualizado: quem disparou fica registrado na bala, para a tela de morte.
let shooter: EnemyKind = 'walker';

function shoot(g: Game, x: number, y: number, a: number, sp: number, dmg: number, color: string, text: string | null = null, r = 3, life = 5, turn = 0) {
  if (g.ebullets.length > 420) return;
  // com o tempo, os disparos começam a dizer o que realmente são: mensagens
  if (text && chance([0, 0, 0.15, 0.4, 0.8][g.levelIdx] ?? 0)) text = pick(T().floats.pleas);
  g.ebullets.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r, life, dmg, color, text, turn, by: shooter });
}

function moveToward(g: Game, e: Enemy, speed: number, dt: number) {
  const p = g.player;
  const d = dist(e.x, e.y, p.x, p.y);
  let dx: number;
  let dy: number;
  if (d < 60 && g.map.lineClear(e.x, e.y, p.x, p.y)) {
    dx = (p.x - e.x) / (d || 1);
    dy = (p.y - e.y) / (d || 1);
  } else {
    [dx, dy] = g.map.flowAt(e.x, e.y);
  }
  g.map.move(e, dx * speed * dt, dy * speed * dt, Math.min(e.r, 6));
  e.flip = dx < 0;
}

const BOSS_LIGHT: Partial<Record<EnemyKind, string>> = { scrum: '#d8c060', kernel: '#2bb8c9', hydra: '#59c83a', monolith: '#c9503a' };

function updateBoss(g: Game, e: Enemy, dt: number) {
  const p = g.player;
  const hy = e.y - e.hoff;
  const glow = BOSS_LIGHT[e.kind];
  if (glow) g.addLight(e.x, hy, Math.max(70, e.r * 5), glow);
  e.stateT -= dt;
  const toP = angleTo(e.x, hy, p.x, p.y - 7);
  const hpK = e.hp / e.maxHp;
  switch (e.kind) {
    case 'scrum': {
      // estados: 0 anda; 1 prepara sprint; 2 sprint; 3 atordoado; 4 daily (invoca)
      const enrage = hpK < 0.5 ? 1.4 : 1;
      if (e.state === 0) {
        moveToward(g, e, e.def.speed * enrage * 1.2, dt);
        e.b -= dt;
        if (e.b <= 0) {
          e.b = 1.6 / enrage;
          for (let i = -2; i <= 2; i++) shoot(g, e.x, hy, toP + i * 0.2, 118, 10, '#ffe14d', pick(['P0', 'P1', 'ERR', 'SOS']), 4);
          g.audio.enemyShot();
        }
        if (e.stateT <= 0) {
          if (chance(0.3)) {
            e.state = 4;
            e.stateT = 1.1;
            g.addText(e.x, hy - 34, T().floats.daily, '#ffe14d', 1, 1.2);
            g.audio.warn();
          } else {
            e.state = 1;
            e.stateT = 0.9;
            e.a = toP;
            g.audio.warn();
            g.addText(e.x, hy - 34, T().floats.charge, '#ff2a2a', 2, 0.9);
          }
        }
      } else if (e.state === 1) {
        e.a = toP;
        if (e.stateT <= 0) {
          e.state = 2;
          e.stateT = 1.1;
        }
      } else if (e.state === 2) {
        const sp = 300 * enrage;
        const hit = g.map.move(e, Math.cos(e.a) * sp * dt, Math.sin(e.a) * sp * dt, 12);
        e.flip = Math.cos(e.a) < 0;
        bloodSpray(g, e.x, e.y, 3, e.a + Math.PI, 2, 60, BLOOD.red);
        forNear(g, e.x, e.y, (o) => {
          if (o !== e && !o.boss && dist(e.x, e.y, o.x, o.y) < 22) hurtEnemy(g, o, 200, e.a, { force: 280, gib: true, quiet: true });
        });
        if (hit || e.stateT <= 0) {
          e.state = 3;
          e.stateT = hit ? 1.7 : 0.6;
          if (hit) {
            g.addShake(12);
            g.audio.explosion();
            g.addText(e.x, hy - 34, T().floats.blocked, '#ffffff', 1, 1.1);
            bloodFountain(g, e.x, e.y, 16, 20, BLOOD.red);
          }
        }
      } else if (e.state === 3) {
        if (e.stateT <= 0) {
          e.state = 0;
          e.stateT = rand(2, 3.5) / enrage;
        }
      } else if (e.state === 4 && e.stateT <= 0) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * 6.28;
          const c = spawnEnemy(g, chance(0.25) ? 'recruiter' : 'walker', e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 26);
          if (g.map.collides(c.x, c.y, 4)) {
            c.x = e.x;
            c.y = e.y;
          }
        }
        e.state = 0;
        e.stateT = 3;
      }
      break;
    }
    case 'kernel': {
      // flutua lentamente; 0 espiral; 1 anéis; 2 invoca + BSOD
      const d = dist(e.x, e.y, p.x, p.y);
      if (d > 90) {
        e.x += Math.cos(toP) * e.def.speed * dt;
        e.y += Math.sin(toP) * e.def.speed * dt;
      }
      e.a += dt * (hpK < 0.5 ? 2.4 : 1.6);
      e.b -= dt;
      const enrage = hpK < 0.5;
      if (e.state === 0) {
        if (e.b <= 0) {
          e.b = enrage ? 0.075 : 0.11;
          const hex = pick(['0xF', '0x0', 'ERR', '0xA', 'NUL']);
          shoot(g, e.x, hy, e.a, 96, 10, '#2bfff2', hex, 4, 5);
          shoot(g, e.x, hy, e.a + Math.PI, 96, 10, '#2bfff2', hex, 4, 5);
          if (enrage) shoot(g, e.x, hy, -e.a * 1.4, 112, 10, '#ff2bd6', null, 3, 5);
          g.audio.enemyShot();
        }
      } else if (e.state === 1) {
        if (e.b <= 0) {
          e.b = 0.75;
          const n = enrage ? 26 : 18;
          for (let i = 0; i < n; i++) shoot(g, e.x, hy, (i / n) * 6.283 + e.a, 88, 10, '#ff2bd6', null, 3, 6, enrage ? 0.4 : 0);
          ring(g, e.x, hy, 260, 0.3, '#ff2bd6');
          g.audio.warn();
        }
      } else if (e.state === 2) {
        if (e.b <= 0) {
          e.b = 0.5;
          for (let i = 0; i < 4; i++) spawnEnemy(g, chance(0.4) ? 'runner' : 'bug', e.x + rand(-30, 30), e.y + rand(-20, 30));
          // laser que varre
          g.beams.push({ x: e.x, y: hy, a: toP - 0.9, len: 440, w: 3, warn: 0.9, life: 1.6, omega: 1.1, dmg: 20, color: '#2bfff2' });
          g.audio.warn();
          e.state = 0;
          e.stateT = 5;
        }
      }
      if (e.stateT <= 0) {
        e.state = e.state === 0 ? 1 : 2;
        e.stateT = 4;
        e.b = 0;
      }
      break;
    }
    case 'hydra': {
      moveToward(g, e, e.def.speed * e.speedMul, dt);
      e.b -= dt;
      if (e.b <= 0) {
        const t = e.tier;
        e.b = t === 3 ? 0.95 : t === 2 ? 1.25 : 1.5;
        const n = t === 3 ? 7 : t === 2 ? 3 : 1;
        for (let i = 0; i < n; i++) shoot(g, e.x, hy, toP + (i - (n - 1) / 2) * 0.22, 100 + (3 - t) * 18, 11, '#59ff3a', t === 3 ? pick(['503', '504', '429']) : null, 3);
        g.audio.enemyShot();
      }
      if (e.tier === 3 && e.stateT <= 0) {
        e.stateT = 4;
        for (let i = 0; i < 5; i++) spawnEnemy(g, 'bug', e.x + rand(-20, 20), e.y + rand(-20, 20));
      }
      break;
    }
    case 'monolith': {
      // imóvel: 0 blindado (só invoca e atira) | 1 portas abertas, leva dano total
      e.a += dt;
      e.b -= dt;
      const enrage = hpK < 0.4;
      if (e.state === 0) {
        if (e.b <= 0) {
          e.b = enrage ? 0.55 : 0.8;
          const n = enrage ? 11 : 7;
          for (let i = 0; i < n; i++) shoot(g, e.x, hy + 26, toP + (i - (n - 1) / 2) * 0.17, 104, 13, '#7dff7d', pick(['GOTO', 'COBOL', 'PIC X', 'NOP', 'JCL']), 4);
          g.audio.enemyShot();
        }
        if (e.stateT <= 0) {
          e.state = 2;
          e.stateT = 1.1;
          const count = enrage ? 4 : 3;
          for (let i = 0; i < count; i++) {
            const a = toP - 0.8 + (i * 1.6) / Math.max(1, count - 1);
            g.beams.push({ x: e.x, y: hy + 28, a, len: 560, w: 4, warn: 1, life: 2.2, omega: (i % 2 ? 1 : -1) * (enrage ? 0.75 : 0.55), dmg: 24, color: '#ff2a2a' });
          }
          g.audio.warn();
          g.addText(e.x, hy - 54, 'JOB SUBMITTED', '#ff2a2a', 2, 1);
        }
      } else if (e.state === 2) {
        if (e.stateT <= 0) {
          e.state = 1;
          e.stateT = 3.4;
          g.addText(e.x, hy - 54, T().floats.exposed, '#ffd23d', 2, 1.2);
          for (let i = 0; i < 6; i++) spawnEnemy(g, chance(0.3) ? 'stack' : chance(0.5) ? 'segfault' : 'walker', e.x + rand(-60, 60), e.y + 70 + rand(0, 40));
        }
      } else if (e.state === 1 && e.stateT <= 0) {
        e.state = 0;
        e.stateT = 6;
      }
      break;
    }
    case 'pixel': {
      // tier: 1 ponto minúsculo, 2 quadrado, 3 forma final
      const phase = hpK > 0.66 ? 1 : hpK > 0.33 ? 2 : 3;
      if (phase !== e.state) {
        e.state = phase;
        e.stateT = 2;
        g.glitch = 1;
        g.invert = 0.3;
        g.addShake(16);
        g.audio.bossRoar();
        g.note = { text: phase === 2 ? T().notes.pixelSpread : T().notes.dontLook, t: 3 };
      }
      const size = phase === 1 ? 6 : phase === 2 ? 15 : 28;
      e.r += (size - e.r) * clamp(dt * 3, 0, 1);
      e.hoff = 0;
      e.a += dt * (phase === 3 ? 2.2 : 1.4);
      e.b -= dt;
      const tele = phase === 1 ? 1.5 : 2.6;
      e.tier -= dt;
      if (e.tier <= 0) {
        e.tier = tele;
        glitchPixels(g, e.x, e.y, 22, 140);
        const s = g.map.randomFloor();
        e.x = s.x;
        e.y = s.y;
        if (dist(e.x, e.y, p.x, p.y) < 70) {
          e.x = clamp(p.x + (p.x < g.map.pxW / 2 ? 140 : -140), 24, g.map.pxW - 24);
          e.y = clamp(p.y + rand(-60, 60), 24, g.map.pxH - 24);
        }
        glitchPixels(g, e.x, e.y, 22, 140);
        g.audio.glitch();
        const n = phase === 1 ? 5 : phase === 2 ? 14 : 24;
        for (let i = 0; i < n; i++) shoot(g, e.x, e.y, angleTo(e.x, e.y, p.x, p.y - 7) + (phase === 1 ? (i - 2) * 0.12 : (i / n) * 6.283), phase === 1 ? 150 : 100, 12, '#0a0a0c', null, 3);
      }
      if (phase >= 2 && e.b <= 0) {
        e.b = phase === 2 ? 0.8 : 0.5;
        // tile corrompido caindo perto do jogador
        const tx = Math.floor((p.x + rand(-90, 90)) / TILE) * TILE;
        const ty = Math.floor((p.y + rand(-70, 70)) / TILE) * TILE;
        g.hazards.push({ x: tx, y: ty, w: TILE * 2, h: TILE * 2, warn: 0.9, life: 7, dmg: 16, style: 'corrupt', stained: false });
        if (chance(0.4)) spawnEnemy(g, pick(['walker', 'runner', 'nullp', 'segfault'] as EnemyKind[]), e.x + rand(-20, 20), e.y + rand(-20, 20));
      }
      if (phase === 3 && e.stateT <= 0) {
        e.stateT = 5.2;
        for (let i = 0; i < 4; i++) g.beams.push({ x: e.x, y: e.y, a: e.a + (i * Math.PI) / 2, len: 600, w: 3, warn: 1, life: 2.6, omega: 0.75, dmg: 22, color: '#0a0a0c' });
        g.audio.warn();
      }
      if (phase === 3 && chance(dt * 9)) {
        shoot(g, e.x, e.y, e.a * 3, 118, 12, '#0a0a0c', null, 3);
      }
      break;
    }
    default:
      break;
  }

  // tocar no chefe dói
  if (e.kind !== 'pixel' || e.state >= 2) {
    if (dist(e.x, hy, p.x, p.y - 7) < e.r + 4) hurtPlayer(g, e.def.dmg, e.x, hy, e.kind);
  }
}

export function updateEnemies(g: Game, dt: number) {
  const p = g.player;
  const m = g.map;

  g.flowT -= dt;
  if (g.flowT <= 0) {
    g.flowT = 0.22;
    m.computeFlow(p.x, p.y);
  }

  // Separação entre inimigos (usa o hash montado em updateCombat)
  for (const list of g.hash.values()) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < min * min && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = ((min - d) / d) * 0.5 * Math.min(1, dt * 14);
          m.move(a, -dx * push, -dy * push, a.r > 5 ? 5 : a.r);
          m.move(b, dx * push, dy * push, b.r > 5 ? 5 : b.r);
        }
      }
    }
  }

  for (const e of g.enemies) {
    if (e.dead) continue;
    shooter = e.kind;
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    e.atkCd = Math.max(0, e.atkCd - dt);
    e.orbitCd = Math.max(0, e.orbitCd - dt);
    if (e.spawnT > 0) e.spawnT -= dt;

    // queimando
    if (e.burn > 0) {
      e.burn -= dt;
      if (chance(dt * 28)) spawnPart(g, P.Fire, e.x + rand(-e.r, e.r), e.y - rand(0, e.hoff * 2), 0, rand(-8, 8), rand(-30, -6), 0, rand(0.15, 0.4), pick(['#ffec3d', '#ff9a1a', '#ff5a1a']), 2);
      if (chance(dt * 6)) g.addLight(e.x, e.y - e.hoff, 28, '#ff7a1a');
      e.hp -= 22 * dt * g.stats.dmg;
      if (e.hp <= 0) {
        killEnemy(g, e, rand(6.28), 40, false);
        continue;
      }
    }
    // sangramento de quem perdeu o braço
    if (e.wounded && chance(dt * 12)) {
      m.fctx.fillStyle = pick(BLOOD.red);
      m.fctx.fillRect(Math.round(e.x + rand(-3, 3)), Math.round(e.y), 1, 1);
    }
    // knockback
    if (Math.abs(e.vx) > 1 || Math.abs(e.vy) > 1) {
      m.move(e, e.vx * dt, e.vy * dt, Math.min(e.r, 6));
      const f = Math.pow(0.002, dt);
      e.vx *= f;
      e.vy *= f;
    }
    if (e.stun > 0) {
      e.stun -= dt;
      continue;
    }
    if (e.boss) {
      updateBoss(g, e, dt);
      continue;
    }
    if (e.spawnT > 0) continue;

    const d = dist(e.x, e.y, p.x, p.y);

    // rede de segurança: um inimigo preso fora de vista não pode travar a wave
    if (dist(e.x, e.y, e.lastX, e.lastY) > 6) {
      e.lastX = e.x;
      e.lastY = e.y;
      e.stuckT = 0;
    } else {
      e.stuckT += dt;
      if (e.stuckT > 4 && !m.lineClear(e.x, e.y - 4, p.x, p.y - 4)) {
        const s = g.spawnPoint();
        if (s) {
          e.x = e.lastX = s.x;
          e.y = e.lastY = s.y;
          e.spawnT = 0.4;
        }
        e.stuckT = 0;
        continue;
      }
    }
    const speed = e.def.speed * e.speedMul * (e.wounded ? 0.8 : 1) * g.enemySpeedScale();

    switch (e.kind) {
      case 'walker':
      case 'leak':
      case 'leakSmall':
      case 'stack':
        moveToward(g, e, speed, dt);
        if (e.kind === 'leak' && chance(dt * 1.4)) {
          const set = BLOOD.purple;
          splat(g, e.x, e.y, 16, 6, set);
          if (g.puddles.length < 40 && chance(0.5)) g.puddles.push({ x: e.x, y: e.y, r: 11, life: 5 });
        }
        if (e.kind === 'walker' && chance(dt * 0.1) && d < 200) g.audio.groan();
        break;
      case 'bug':
      case 'runner': {
        // ziguezague de quem chega sem sincronizar
        moveToward(g, e, speed, dt);
        const zig = Math.sin(e.t * (e.kind === 'bug' ? 14 : 9)) * speed * 0.5 * dt;
        const ang = angleTo(e.x, e.y, p.x, p.y) + Math.PI / 2;
        m.move(e, Math.cos(ang) * zig, Math.sin(ang) * zig, e.r);
        break;
      }
      case 'nullp': {
        // 0 visível, 1 fantasma intangível se aproximando, 2 atira
        e.stateT -= dt;
        if (e.state === 0) {
          moveToward(g, e, speed * 0.7, dt);
          e.b -= dt;
          if (e.b <= 0 && d < 220 && m.lineClear(e.x, e.y - 6, p.x, p.y - 7)) {
            e.b = 1.5;
            shoot(g, e.x, e.y - 6, angleTo(e.x, e.y - 6, p.x, p.y - 7), 128, e.def.dmg, '#2bfff2', 'null', 3);
            g.audio.enemyShot();
          }
          if (e.stateT <= 0) {
            e.state = 1;
            e.stateT = 0.8;
            glitchPixels(g, e.x, e.y - 6, 12);
            g.audio.glitch();
          }
        } else {
          if (e.stateT <= 0) {
            const a = rand(6.28);
            const r = rand(50, 90);
            const nx = p.x + Math.cos(a) * r;
            const ny = p.y + Math.sin(a) * r;
            if (!m.collides(nx, ny, 5)) {
              e.x = nx;
              e.y = ny;
            }
            e.state = 0;
            e.stateT = rand(1.8, 3);
            e.b = 0.5;
            glitchPixels(g, e.x, e.y - 6, 12);
          }
        }
        break;
      }
      case 'segfault': {
        // 0 corre; 1 fusível aceso
        if (e.state === 0) {
          moveToward(g, e, speed, dt);
          if (d < 26) {
            e.state = 1;
            e.stateT = 0.55;
            g.audio.warn();
          }
        } else {
          e.stateT -= dt;
          e.flash = Math.sin(e.t * 50) > 0 ? 0.05 : 0;
          if (e.stateT <= 0) {
            // explode: machuca jogador e quem estiver por perto
            e.hp = 0;
            killEnemy(g, e, rand(6.28), 100, true);
            if (dist(e.x, e.y, p.x, p.y) < 52) hurtPlayer(g, e.def.dmg, e.x, e.y, e.kind);
            continue;
          }
        }
        break;
      }
      case 'recruiter': {
        // mantém distância e manda "oportunidades incríveis"
        const los = d < 240 && m.lineClear(e.x, e.y - 8, p.x, p.y - 7);
        if (!los || d > 150) moveToward(g, e, speed, dt);
        else if (d < 90) {
          const a = angleTo(p.x, p.y, e.x, e.y);
          m.move(e, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt, e.r);
          e.flip = p.x < e.x;
        } else e.flip = p.x < e.x;
        e.b -= dt;
        if (los && e.b <= 0) {
          e.b = rand(1.6, 2.6);
          shoot(g, e.x, e.y - 8, angleTo(e.x, e.y - 8, p.x, p.y - 7), 110, e.def.dmg, '#3aa0ff', pick(T().floats.broadcastShots), 3);
          g.audio.enemyShot();
        }
        break;
      }
      default:
        break;
    }

    // ataque corpo a corpo
    if (e.atkCd <= 0 && !(e.kind === 'nullp' && e.state === 1) && e.kind !== 'segfault' && dist(e.x, e.y - e.hoff, p.x, p.y - 7) < e.r + 6) {
      e.atkCd = 0.7;
      const landed = hurtPlayer(g, e.def.dmg, e.x, e.y, e.kind);
      if (landed && g.stats.thorns > 0) {
        hurtEnemy(g, e, 40 * g.stats.thorns, angleTo(p.x, p.y, e.x, e.y), { force: 120, gib: true });
      }
    }
  }

  g.enemies = g.enemies.filter((e) => !e.dead);

  // morte do chefe: reação em cadeia
  if (g.phase === 'bossDeath') {
    g.bossBoomT -= dt;
    if (g.bossBoomT <= 0) {
      g.bossBoomT = 0.09;
      const x = g.bossDeathX + rand(-46, 46);
      const y = g.bossDeathY + rand(-36, 36);
      explosion(g, x, y, rand(24, 56), 0, true);
      const set = BLOOD[g.level.theme === 'void' ? 'black' : 'red'];
      bloodFountain(g, x, y, 20, 40, set);
      splat(g, x, y, 180, 30, set);
      glitchPixels(g, x, y, 12, 150);
    }
  }
}
