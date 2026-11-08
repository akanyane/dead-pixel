import { H, TILE, W, angleTo, chance, clamp, dist, distToSegment, lerp, pick, rand, randInt } from '../core/util';
import { ENEMIES, PLAYER_SPEED, SKINS, WEAPONS, WEAPON_ORDER, type WeaponId } from './data';
import { T } from './i18n';
import { spawnEnemy } from './enemies';
import { BLOOD, P, bloodFountain, bloodSpray, dismember, fireBurst, glitchPixels, ring, smokeBurst, sparks, spawnGib, spawnPart, splat } from './fx';
import type { Bullet, Enemy, Game, KillerId, Pickup } from './game';
import { SPR } from './sprites';

// ---------- Weapons ----------

export function giveWeapon(g: Game, id: WeaponId, equip = true) {
  const p = g.player;
  const def = WEAPONS[id];
  if (!p.weapons.includes(id)) {
    p.weapons.push(id);
    p.weapons.sort((a, b) => WEAPON_ORDER.indexOf(a) - WEAPON_ORDER.indexOf(b));
    p.ammo[id] = Math.floor(def.ammoMax * 0.6 * g.stats.ammoMul);
    if (p.weapons.length >= WEAPON_ORDER.length) g.unlock('all_weapons');
    if (equip) p.weapon = id;
  } else if (id !== 'pistol') {
    p.ammo[id] = Math.min(Math.floor(def.ammoMax * g.stats.ammoMul), p.ammo[id] + def.ammoPickup * 2);
  }
}

/** Distance from the player's center to the gun tip. */
const MUZZLE = 11;

/**
 * Where shots start. Normally the gun's height on the body, but in this top-down view that
 * point sits inside the wall when the player hugs a wall to the north, so shots then leave
 * from the feet, which are never inside a wall.
 */
function shotOrigin(g: Game) {
  const p = g.player;
  const y = g.map.blocksBullet(p.x, p.y - 7) ? p.y - 2 : p.y - 7;
  return { x: p.x, y };
}

function gunTip(g: Game, len: number) {
  const p = g.player;
  return { x: p.x + Math.cos(p.aim) * len, y: p.y - 7 + Math.sin(p.aim) * len };
}

function fireWeapon(g: Game) {
  const p = g.player;
  const def = WEAPONS[p.weapon];
  const s = g.stats;
  if (p.ammo[p.weapon] <= 0) {
    p.weapon = 'pistol';
    g.note = { text: T().notes.noAmmo, t: 1.5 };
    g.audio.ui(false);
    return;
  }
  if (p.weapon !== 'pistol') {
    p.ammo[p.weapon]--;
    g.usedWeapon = true;
  }
  g.progress.shots[p.weapon] = (g.progress.shots[p.weapon] ?? 0) + 1;
  const over = p.overclockT > 0 ? 1.9 : 1;
  p.cd = def.rate / (s.rate * over);
  p.gunKick = def.kick;
  p.muzzle = 0.05;
  g.kickX -= Math.cos(p.aim) * def.kick * 0.7;
  g.kickY -= Math.sin(p.aim) * def.kick * 0.7;
  g.addShake(def.shake);
  g.audio.shoot(p.weapon);

  const tip = gunTip(g, MUZZLE);
  const sudo = p.sudoT > 0 ? 2 : 1;
  if (!def.flame) g.addLight(tip.x, tip.y, def.pellets > 1 ? 80 : 54, '#ffcc66');

  // ejected shell casing
  if (!def.flame && !def.rail) {
    const a = p.aim + (p.flip ? 1 : -1) * 1.8 + rand(-0.4, 0.4);
    spawnPart(g, P.Pixel, p.x, p.y - 7, 8, Math.cos(a) * 50, Math.sin(a) * 50, 60, 0.7, '#e0b040');
  }

  if (def.rail) {
    // like bullets, the beam starts at the body so it also hits whatever is pressed against the player
    const { x: ox, y: oy } = shotOrigin(g);
    fireRail(g, ox, oy, p.aim, def.dmg * s.dmg * sudo, def.color);
    if (s.multi > 0) {
      for (let i = 1; i <= s.multi; i++) {
        fireRail(g, ox, oy, p.aim + 0.09 * i, def.dmg * s.dmg * sudo * 0.5, def.color);
        fireRail(g, ox, oy, p.aim - 0.09 * i, def.dmg * s.dmg * sudo * 0.5, def.color);
      }
    }
    return;
  }

  const pellets = def.pellets + s.multi * (def.pellets > 1 ? 3 : 1);
  for (let i = 0; i < pellets; i++) {
    let a = p.aim + rand(-def.spread, def.spread);
    if (s.multi > 0 && def.pellets === 1 && !def.flame) {
      a = p.aim + (i - (pellets - 1) / 2) * 0.1 + rand(-def.spread, def.spread) * 0.5;
    }
    const crit = chance(s.crit);
    const sp = def.speed * rand(0.92, 1.06);
    const origin = shotOrigin(g);
    const b: Bullet = {
      x: origin.x, y: origin.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      dmg: def.dmg * s.dmg * sudo * (crit ? 2.5 : 1),
      life: def.life * rand(0.85, 1.1),
      pierce: def.pierce + s.pierce,
      bounce: def.flame ? 0 : s.bounce,
      color: crit ? '#ff2bd6' : def.color,
      size: def.size + (crit ? 1 : 0),
      explode: def.explode ?? 0,
      flame: !!def.flame,
      crit,
      burn: def.flame ? 1.6 : s.burn * 2,
      hit: def.pierce + s.pierce > 0 ? new Set() : null,
      trail: !!def.explode,
    };
    // the bullet leaves from the body and travels to the gun tip right away: zombies pressed
    // against the player get hit, and a gun poking into a wall stops at the wall
    if (sweepBullet(g, b, MUZZLE / sp)) g.bullets.push(b);
  }
}

function fireRail(g: Game, x: number, y: number, a: number, dmg: number, color: string) {
  let ex = x;
  let ey = y;
  for (let d = 0; d < 520; d += 4) {
    ex = x + Math.cos(a) * d;
    ey = y + Math.sin(a) * d;
    if (g.map.blocksBullet(ex, ey)) break;
  }
  g.tracers.push({ ax: x, ay: y, bx: ex, by: ey, life: 0.22, max: 0.22, color, w: 3 });
  sparks(g, ex, ey, 14, color, 150);
  g.map.fctx.fillStyle = '#071a18';
  g.map.fctx.fillRect(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4);
  for (let d = 0; d < 500; d += 26) {
    if (d < Math.hypot(ex - x, ey - y)) g.addLight(x + Math.cos(a) * d, y + Math.sin(a) * d, 26, '#227f78');
  }
  for (const e of [...g.enemies]) {
    if (e.dead) continue;
    if (distToSegment(e.x, e.y - e.hoff, x, y, ex, ey) < e.r + 3) {
      hurtEnemy(g, e, dmg, a, { force: 170, gib: true });
    }
  }
  for (const b of g.barrels) {
    if (b.hp > 0 && distToSegment(b.x, b.y - 5, x, y, ex, ey) < 7) hurtBarrel(g, b, 99);
  }
  if (g.enemies.length) g.hitstop = Math.max(g.hitstop, 0.025);
}

// ---------- Damage ----------

interface HurtOpts {
  force?: number;
  crit?: boolean;
  gib?: boolean;
  burn?: number;
  quiet?: boolean;
}

export function hurtEnemy(g: Game, e: Enemy, dmg: number, ang: number, o: HurtOpts = {}) {
  if (e.dead || e.spawnT > 0.25) return;
  dmg *= g.damageDealtMul();
  if (e.kind === 'monolith' && e.state === 0) {
    dmg *= 0.3; // armored until the doors open
    g.hint('armored', T().hints.armored);
  }
  e.hp -= dmg;
  e.flash = e.boss ? 0.022 : 0.07; // a boss under constant fire must not turn into a white silhouette
  const force = o.force ?? 40;
  if (!e.boss) {
    const mass = e.kind === 'stack' ? 0.2 : 1;
    e.vx += Math.cos(ang) * force * mass;
    e.vy += Math.sin(ang) * force * mass;
  }
  if (o.burn) e.burn = Math.max(e.burn, o.burn);
  if (!o.quiet) g.audio.hit();

  const bloodKind = e.def.blood;
  const set = BLOOD[bloodKind] ?? BLOOD.red;
  const hy = e.y - e.hoff;
  if (bloodKind !== 'none') {
    const n = Math.min(14, 3 + Math.floor(dmg / 7));
    bloodSpray(g, e.x, e.y, e.hoff, ang, n, 70 + force, set);
    bloodSpray(g, e.x, e.y, e.hoff, ang + Math.PI, Math.ceil(n / 3), 40, set); // entry splatter
  }
  if (e.boss) {
    glitchPixels(g, e.x + rand(-e.r, e.r), hy + rand(-e.r, e.r), 2);
  }
  if (o.crit || dmg >= 60) {
    g.addText(e.x + rand(-4, 4), hy - e.r - 2, String(Math.round(dmg)), o.crit ? '#ff2bd6' : '#ffd23d', dmg > 200 ? 2 : 1, 0.6);
  }
  // lost an arm: the zombie keeps coming, spurting blood
  if (!e.wounded && e.hp < e.maxHp * 0.55 && (e.kind === 'walker' || e.kind === 'recruiter')) {
    e.wounded = true;
    spawnGib(g, SPR.gibArm, e.x, e.y, 9, 110, ang, set);
    bloodFountain(g, e.x, e.y, 9, 9, set);
    splat(g, e.x, e.y, 14, 7, set);
    g.audio.splat();
  }
  if (e.hp <= 0) killEnemy(g, e, ang, force, !!o.gib || -e.hp > e.maxHp * 0.6);
}

export function killEnemy(g: Game, e: Enemy, ang: number, force: number, heavy: boolean) {
  e.dead = true;
  g.registerKill(e);
  const set = BLOOD[e.def.blood] ?? BLOOD.red;
  const f = 120 + force * 0.8;
  g.audio.splat();
  g.addLight(e.x, e.y, 26, '#ff2a2a');
  switch (e.kind) {
    case 'walker':
    case 'runner':
    case 'recruiter':
      dismember(g, e.x, e.y, ang, f, set, heavy);
      break;
    case 'bug':
      for (let i = 0; i < 3; i++) spawnGib(g, SPR.gibLeg6, e.x, e.y, 3, f * 0.8, ang + rand(-1.5, 1.5), set);
      bloodSpray(g, e.x, e.y, 3, ang, 14, f, set, 1.4);
      splat(g, e.x, e.y, 34, 7, set);
      break;
    case 'leak':
      for (let i = 0; i < 8; i++) spawnGib(g, SPR.gibSlime, e.x, e.y, 6, f, rand(6.3), set);
      bloodFountain(g, e.x, e.y, 6, 50, set);
      splat(g, e.x, e.y, 180, 22, set);
      g.puddles.push({ x: e.x, y: e.y, r: 20, life: 7 });
      for (let i = 0; i < 3; i++) {
        const c = spawnEnemy(g, 'leakSmall', e.x + rand(-6, 6), e.y + rand(-6, 6));
        c.vx = Math.cos(i * 2.1) * 120;
        c.vy = Math.sin(i * 2.1) * 120;
        c.spawnT = 0;
      }
      break;
    case 'leakSmall':
      for (let i = 0; i < 3; i++) spawnGib(g, SPR.gibSlime, e.x, e.y, 3, f, rand(6.3), set);
      bloodSpray(g, e.x, e.y, 3, ang, 18, f, set, 1.5);
      splat(g, e.x, e.y, 44, 10, set);
      break;
    case 'stack':
      dismember(g, e.x, e.y, ang, f * 1.2, set, true);
      for (let i = 0; i < 5; i++) spawnGib(g, SPR.gibChip, e.x, e.y, 12, f, rand(6.3), null);
      sparks(g, e.x, e.y - 10, 30, '#ffae00', 170);
      for (let i = 0; i < 4; i++) {
        const c = spawnEnemy(g, 'walker', e.x + rand(-8, 8), e.y + rand(-8, 8));
        c.vx = Math.cos(i * 1.57) * 150;
        c.vy = Math.sin(i * 1.57) * 150;
        c.spawnT = 0;
        c.hp = c.maxHp *= 0.7;
      }
      g.addShake(6);
      g.addText(e.x, e.y - 30, 'pop() pop() pop()', '#ffae00', 1, 1);
      break;
    case 'nullp':
      glitchPixels(g, e.x, e.y - 6, 40, 130);
      splat(g, e.x, e.y, 34, 12, set);
      g.addText(e.x, e.y - 18, 'NullReferenceException', '#2bfff2', 1, 1);
      break;
    case 'segfault':
      dismember(g, e.x, e.y, ang, f * 1.4, set, true);
      explosion(g, e.x, e.y - 4, 46, 60, true);
      g.addText(e.x, e.y - 18, 'SEGFAULT', '#ffec3d', 1, 0.9);
      break;
    case 'hydra':
      bloodFountain(g, e.x, e.y, 10, 110, set);
      splat(g, e.x, e.y, 340, e.r * 2.2, set);
      for (let i = 0; i < 8; i++) spawnGib(g, SPR.gibChip, e.x, e.y, 10, f * 1.3, rand(6.3), set);
      explosion(g, e.x, e.y - e.hoff, e.r * 3, 0, true);
      if (e.tier > 1) {
        const t = e.tier - 1;
        for (let i = 0; i < 2; i++) {
          const c = spawnEnemy(g, 'hydra', e.x + (i ? 8 : -8), e.y);
          setHydraTier(g, c, t);
          g.bosses.push(c);
          c.spawnT = 0;
          c.vx = (i ? 1 : -1) * 180;
          c.stun = 0.4;
        }
        g.addText(e.x, e.y - 30, 'kubectl scale --replicas=2', '#59ff3a', 1, 1.2);
      }
      break;
    default:
      break;
  }

  if (e.boss) {
    g.bosses = g.bosses.filter((b) => b !== e);
    g.slowmo = 0.3;
    g.hitstop = 0.09;
    if (g.bosses.length === 0 && (e.kind !== 'hydra' || e.tier <= 1) && !g.enemies.some((o) => !o.dead && o.boss)) {
      g.beginBossDeath(e.x, e.y - e.hoff);
      if (e.kind !== 'hydra') {
        dismember(g, e.x, e.y, ang, 220, set, true);
        dismember(g, e.x, e.y, ang + 2, 240, set, true);
      }
    }
  } else {
    // big kills get a tiny freeze: this is where the gore lands
    if (heavy) g.hitstop = Math.max(g.hitstop, 0.035);
    g.addShake(heavy ? 4 : 1.8);
    if (chance(g.stats.boom) && e.kind !== 'segfault') explosion(g, e.x, e.y - 4, 34, 30, true);
    drops(g, e);
    if (g.stats.gc > 0) {
      g.player.gcAcc++;
      if (g.player.gcAcc >= 4) {
        g.player.gcAcc = 0;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.stats.gc);
      }
    }
  }
}

export function setHydraTier(g: Game, c: Enemy, t: number) {
  c.tier = t;
  const k = t === 3 ? 1 : t === 2 ? 0.45 : 0.18;
  c.maxHp = c.hp = ENEMIES.hydra.hp * k * g.bossHpMul();
  c.r = t === 3 ? 15 : t === 2 ? 10 : 6;
  c.hoff = c.r;
  c.speedMul = t === 3 ? 1 : t === 2 ? 1.35 : 1.8;
  c.boss = true;
}

function drops(g: Game, e: Enemy) {
  const p = g.player;
  const r = Math.random();
  const low = p.hp < p.maxHp * 0.35 ? 0.05 : 0;
  const hasAmmoGun = p.weapons.some((w) => w !== 'pistol');
  if (r < 0.035 + low) addPickup(g, 'hp', e.x, e.y);
  else if (r < 0.1 + low && hasAmmoGun) addPickup(g, 'ammo', e.x, e.y);
  else if (r < 0.145 + low) addPickup(g, 'ram', e.x, e.y);
}

export function addPickup(g: Game, kind: Pickup['kind'], x: number, y: number, weapon?: WeaponId) {
  // an item that would land inside a desk or wall spawns at the player's feet
  if (g.map.collides(x, y, 3)) {
    x = g.player.x;
    y = g.player.y;
  }
  g.pickups.push({ kind, x, y, z: 8, vz: 60, life: kind === 'weapon' ? 9999 : 15, weapon, t: 0 });
}

export function spawnPickupsForWaveClear(g: Game) {
  const p = g.player;
  addPickup(g, 'hp', p.x + rand(-26, 26), p.y + rand(-22, 22));
  if (p.weapons.length > 1) addPickup(g, 'ammo', p.x + rand(-26, 26), p.y + rand(-22, 22));
  addPickup(g, 'ram', p.x + rand(-26, 26), p.y + rand(-22, 22));
  if (g.isArcade() ? g.arcadeWave === 1 : g.levelIdx === 0 && g.waveIdx === 0) {
    addPickup(g, 'weapon', p.x + 18, p.y, 'smg');
    g.hint('crate', T().hints.crate);
  }
}

export function explosion(g: Game, x: number, y: number, r: number, dmg: number, scorch: boolean) {
  fireBurst(g, x, y, Math.min(50, Math.floor(r)), r * 2.2);
  smokeBurst(g, x, y, Math.min(26, Math.floor(r / 2)));
  sparks(g, x, y, Math.min(30, Math.floor(r)), '#ffd23d', r * 4);
  ring(g, x, y, r * 4.5, 0.22, '#ffffff');
  spawnPart(g, P.Flash, x, y, 0, 0, 0, 0, 0.08, '#fff6cc', r * 0.9);
  g.addLight(x, y, r * 3.2, '#ff9a3a');
  g.addShake(Math.min(14, r / 4.5));
  g.audio.explosion(r > 60);
  g.whiteFlash = Math.max(g.whiteFlash, 0.07);
  if (scorch) {
    const c = g.map.fctx;
    for (let i = 0; i < r * 3; i++) {
      const a = rand(6.3);
      const d = Math.pow(Math.random(), 0.7) * r * 0.8;
      c.fillStyle = pick(['#0d0d10', '#17171b', '#26262b', '#000']);
      c.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + 4 + Math.sin(a) * d * 0.7), randInt(1, 2), 1);
    }
  }
  if (dmg <= 0) return;
  const sudo = g.player.sudoT > 0 ? 2 : 1;
  for (const e of [...g.enemies]) {
    if (e.dead) continue;
    const d = dist(x, y, e.x, e.y - e.hoff);
    if (d < r + e.r) {
      const k = 1 - clamp(d / (r + e.r), 0, 0.7);
      hurtEnemy(g, e, dmg * k * g.stats.dmg * sudo, angleTo(x, y, e.x, e.y), { force: 240, gib: true, quiet: true, burn: 1 });
    }
  }
  for (const b of g.barrels) {
    if (b.hp > 0 && dist(x, y, b.x, b.y) < r) hurtBarrel(g, b, 99);
  }
}

export function hurtBarrel(g: Game, b: { x: number; y: number; hp: number; flash: number }, dmg: number) {
  if (b.hp <= 0) return;
  b.hp -= dmg;
  b.flash = 0.08;
  sparks(g, b.x, b.y - 5, 4, '#ffd23d');
  if (b.hp <= 0) {
    // the explosion waits for the next frame to avoid infinite chain recursion
    window.setTimeout(() => {
      if (g.state === 'play') {
        explosion(g, b.x, b.y - 5, 64, 130, true);
        g.addText(b.x, b.y - 18, 'UPS OFFLINE', '#ffd23d', 1, 0.9);
        g.barrelBooms = g.barrelBooms.filter((t) => g.time - t < 1.5);
        g.barrelBooms.push(g.time);
        if (g.barrelBooms.length >= 3) g.unlock('chain_3');
      }
    }, 70);
  }
}

export function hurtPlayer(g: Game, dmg: number, srcX: number, srcY: number, by: KillerId) {
  const p = g.player;
  if (g.god || p.dead || p.invuln > 0 || p.dashT > 0 || p.sudoT > 0) return false;
  dmg *= g.damageTakenMul();
  g.lastKiller = by;
  g.tookDamage = true;
  p.hp -= dmg;
  p.invuln = 0.55;
  g.hurtFlash = 1;
  g.glitch = Math.max(g.glitch, 0.55);
  g.addShake(8);
  g.audio.hurt();
  const a = angleTo(srcX, srcY, p.x, p.y);
  bloodSpray(g, p.x, p.y, 8, a, 16, 110, BLOOD.red);
  splat(g, p.x, p.y, 16, 7, BLOOD.red);
  g.kickX += Math.cos(a) * 4;
  g.kickY += Math.sin(a) * 4;
  g.streakT = Math.min(g.streakT, 1.2);
  if (p.hp <= 0) {
    if (g.stats.backup > 0) {
      g.stats.backup = 0;
      g.unlock('backup_used');
      g.perks.backup = 1;
      p.hp = p.maxHp * 0.5;
      p.invuln = 2.5;
      g.announce = { text: T().notes.backup, t: 2, color: '#39ffe5' };
      g.audio.command();
      g.whiteFlash = 1;
      explosion(g, p.x, p.y - 6, 90, 200, true);
      return true;
    }
    killPlayer(g);
  }
  return true;
}

function killPlayer(g: Game) {
  const p = g.player;
  p.dead = true;
  p.hp = 0;
  g.saveBest();
  g.progress.deaths++;
  g.progress.deathsBy[g.lastKiller] = (g.progress.deathsBy[g.lastKiller] ?? 0) + 1;
  g.saveProgress();
  g.onPlayerDeath();
  dismember(g, p.x, p.y, rand(6.3), 200, BLOOD.red, true);
  bloodFountain(g, p.x, p.y, 10, 140, BLOOD.red);
  g.glitch = 1;
  g.addShake(18);
  g.audio.explosion(true);
  g.audio.playMusic(null);
  g.deathT = 0;
}

// ---------- Terminal effects ----------

export function pingAll(g: Game) {
  ring(g, g.player.x, g.player.y - 6, 620, 0.5, '#39ffe5');
  ring(g, g.player.x, g.player.y - 6, 460, 0.5, '#39ffe5');
  for (const e of g.enemies) {
    if (!e.boss) e.stun = Math.max(e.stun, 2.4);
    else e.stun = Math.max(e.stun, 0.5);
  }
  g.ebullets = [];
  g.audio.glitch();
}

export function killNearest(g: Game, n: number, dmg: number) {
  const p = g.player;
  const targets = g.enemies
    .filter((e) => !e.dead && dist(e.x, e.y, p.x, p.y) < 320)
    .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))
    .slice(0, n);
  for (const e of targets) {
    g.bolts.push({ ax: p.x, ay: p.y - 8, bx: e.x, by: e.y - e.hoff, life: 0.28, max: 0.28, color: '#39ffe5', w: 2 });
    hurtEnemy(g, e, dmg, angleTo(p.x, p.y, e.x, e.y), { force: 220, gib: true });
    g.addLight(e.x, e.y - e.hoff, 40, '#39ffe5');
  }
  g.addShake(8);
}

export function rmRf(g: Game) {
  const p = g.player;
  g.whiteFlash = 1;
  g.glitch = 1;
  g.addShake(18);
  g.audio.explosion(true);
  ring(g, p.x, p.y - 6, 700, 0.5, '#ffffff');
  ring(g, p.x, p.y - 6, 500, 0.6, '#ff2a2a');
  const killsBefore = g.kills;
  for (const e of [...g.enemies]) {
    if (e.dead) continue;
    if (Math.abs(e.x - p.x) < W * 0.7 && Math.abs(e.y - p.y) < H * 0.7) {
      hurtEnemy(g, e, 500, angleTo(p.x, p.y, e.x, e.y), { force: 340, gib: true, quiet: true });
    }
  }
  if (g.kills - killsBefore >= 20) g.unlock('rm_20');
  g.ebullets = [];
  for (const b of g.barrels) if (b.hp > 0 && Math.abs(b.x - p.x) < W * 0.6 && Math.abs(b.y - p.y) < H * 0.6) hurtBarrel(g, b, 99);
}

// ---------- Player and projectile update ----------

export function rebuildHash(g: Game) {
  const h = g.hash;
  for (const list of h.values()) list.length = 0;
  for (const e of g.enemies) {
    if (e.boss) continue;
    const k = (Math.floor(e.y / 32) << 12) | Math.floor(e.x / 32);
    let list = h.get(k);
    if (!list) {
      list = [];
      h.set(k, list);
    }
    list.push(e);
  }
}

function forNear(g: Game, x: number, y: number, fn: (e: Enemy) => boolean | void) {
  const cx = Math.floor(x / 32);
  const cy = Math.floor(y / 32);
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const list = g.hash.get(((cy + oy) << 12) | (cx + ox));
      if (!list) continue;
      for (const e of list) {
        if (!e.dead && fn(e) === true) return;
      }
    }
  }
  for (const b of g.bosses) if (!b.dead && fn(b) === true) return;
}

export { forNear };

/** Longest distance a bullet moves between collision checks, so nothing small slips between two frames. */
const BULLET_STEP = 4;

function updateBullet(g: Game, b: Bullet, dt: number): boolean {
  b.life -= dt;
  if (b.life <= 0) {
    if (b.explode) explosion(g, b.x, b.y, b.explode, b.dmg / g.stats.dmg, true);
    return false;
  }
  if (!sweepBullet(g, b, dt)) return false;
  if (b.flame) {
    if (chance(0.6)) spawnPart(g, P.Fire, b.x, b.y, 0, b.vx * 0.2, b.vy * 0.2, 0, rand(0.1, 0.3), pick(['#ffec3d', '#ff9a1a', '#ff5a1a']), randInt(1, 4));
    if (chance(0.25)) g.addLight(b.x, b.y, 30, '#ff7a1a');
    if (chance(0.015)) splat(g, b.x, b.y, 3, 3, ['#111', '#222']);
  } else if (b.trail) {
    spawnPart(g, P.Smoke, b.x, b.y, 0, rand(-6, 6), rand(-6, 6), 0, 0.6, '#555', 2);
    spawnPart(g, P.Fire, b.x, b.y, 0, -b.vx * 0.1, -b.vy * 0.1, 0, 0.14, '#ffae3a', 2);
    g.addLight(b.x, b.y, 34, '#ff7a1a');
  }
  return true;
}

/** Moves a bullet for `dt` in short steps, checking walls, enemies and barrels at each one. */
function sweepBullet(g: Game, b: Bullet, dt: number): boolean {
  const steps = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / BULLET_STEP));
  for (let i = 0; i < steps; i++) if (!stepBullet(g, b, dt / steps)) return false;
  return true;
}

function stepBullet(g: Game, b: Bullet, dt: number): boolean {
  const nx = b.x + b.vx * dt;
  const ny = b.y + b.vy * dt;
  if (g.map.blocksBullet(nx, ny)) {
    if (b.explode) {
      explosion(g, b.x, b.y, b.explode, b.dmg / g.stats.dmg, true);
      return false;
    }
    if (b.flame) return false;
    if (b.bounce > 0) {
      b.bounce--;
      if (g.map.blocksBullet(nx, b.y)) b.vx = -b.vx;
      if (g.map.blocksBullet(b.x, ny)) b.vy = -b.vy;
      sparks(g, b.x, b.y, 3, b.color);
      return true;
    }
    sparks(g, b.x, b.y, 5, '#ffd23d', 70);
    g.map.fctx.fillStyle = '#111';
    g.map.fctx.fillRect(Math.round(nx), Math.round(ny), 1, 1);
    return false;
  }
  b.x = nx;
  b.y = ny;

  let alive = true;
  const ang = Math.atan2(b.vy, b.vx);
  forNear(g, b.x, b.y, (e) => {
    if (b.hit?.has(e)) return false;
    const hitR = e.r + b.size;
    const hy = e.y - e.hoff;
    if (Math.abs(b.x - e.x) > hitR || Math.abs(b.y - hy) > hitR + 2) return false;
    if (e.kind === 'nullp' && e.state === 1) return false;
    if (b.explode) {
      explosion(g, b.x, b.y, b.explode, b.dmg / g.stats.dmg, true);
      alive = false;
      return true;
    }
    hurtEnemy(g, e, b.dmg, ang, { force: b.flame ? 6 : 34 + b.dmg * 2, crit: b.crit, burn: b.burn || undefined, quiet: b.flame });
    b.hit?.add(e);
    if (b.pierce > 0) {
      b.pierce--;
      return false;
    }
    alive = false;
    return true;
  });
  if (!alive) return false;

  for (const br of g.barrels) {
    if (br.hp > 0 && Math.abs(b.x - br.x) < 6 && b.y < br.y + 2 && b.y > br.y - 12) {
      if (b.explode) {
        explosion(g, b.x, b.y, b.explode, b.dmg / g.stats.dmg, true);
        return false;
      }
      hurtBarrel(g, br, b.dmg);
      if (!b.flame) return false;
    }
  }
  return true;
}

export function updateCombat(g: Game, dt: number, rawDt: number) {
  const p = g.player;
  const i = g.input;
  const s = g.stats;
  const inputOn = !p.dead && !g.term.open;

  rebuildHash(g);

  // aim: with a gamepad or touch, the aim point sits at a fixed distance from the player
  if (i.aimDir !== null && !p.dead) {
    i.mx = clamp(p.x - g.camX + Math.cos(i.aimDir) * 64, 0, W);
    i.my = clamp(p.y - 7 - g.camY + Math.sin(i.aimDir) * 64, 0, H);
  }
  const wx = g.camX + i.mx;
  const wy = g.camY + i.my;
  if (!p.dead) {
    p.aim = Math.atan2(wy - (p.y - 7), wx - p.x);
    p.flip = wx < p.x;
  }

  // movement
  let mx = 0;
  let my = 0;
  if (inputOn) [mx, my] = i.moveVec();
  const len = Math.hypot(mx, my);
  p.moving = len > 0;

  p.dashCd = Math.max(0, p.dashCd - dt);
  if (inputOn && p.dashCd <= 0 && i.actHit('dash')) {
    const dx = len ? mx / len : Math.cos(p.aim);
    const dy = len ? my / len : Math.sin(p.aim);
    p.dashT = 0.17;
    p.dashCd = 1.15 * s.dashCd;
    p.dashX = dx;
    p.dashY = dy;
    g.audio.dash();
    glitchPixels(g, p.x, p.y - 6, 10, 50);
  }

  let speed = PLAYER_SPEED * s.speed * (p.overclockT > 0 ? 1.3 : 1);
  for (const pd of g.puddles) if (dist(pd.x, pd.y, p.x, p.y) < pd.r) speed *= 0.55;
  if (p.dashT > 0) {
    p.dashT -= dt;
    const dashSpeed = 340;
    g.map.move(p, p.dashX * dashSpeed * dt, p.dashY * dashSpeed * dt, 4);
    spawnPart(g, P.Pixel, p.x + rand(-4, 4), p.y - rand(0, 14), 0, 0, 0, 0, 0.25, pick((SKINS.find((k) => k.id === g.progress.skin) ?? SKINS[0]).trail), 2);
    if (s.dashDmg > 0) {
      forNear(g, p.x, p.y - 6, (e) => {
        if (dist(p.x, p.y - 6, e.x, e.y - e.hoff) < e.r + 8 && e.orbitCd <= 0) {
          e.orbitCd = 0.3;
          hurtEnemy(g, e, 70 * s.dashDmg * s.dmg, Math.atan2(p.dashY, p.dashX), { force: 200, gib: true });
        }
      });
    }
  } else if (len) {
    g.map.move(p, mx * speed * dt, my * speed * dt, 4);
    p.walk += dt * 10;
    p.footAcc += speed * dt;
    const tileI = Math.floor(p.y / TILE) * g.map.w + Math.floor(p.x / TILE);
    if (g.wet[tileI]) p.wetSteps = 24;
    if (p.footAcc > 9) {
      p.footAcc = 0;
      p.footSide = !p.footSide;
      if (p.wetSteps > 0) {
        p.wetSteps--;
        const c = g.map.fctx;
        c.fillStyle = p.wetSteps > 12 ? '#8f0c16' : '#5c0a10';
        const off = p.footSide ? -2 : 2;
        c.fillRect(Math.round(p.x + (my !== 0 ? off : 0)), Math.round(p.y + (mx !== 0 ? off : 0)), 2, 1);
      }
    }
  }

  p.invuln = Math.max(0, p.invuln - dt);
  p.sudoT = Math.max(0, p.sudoT - rawDt * (g.term.open ? 0 : 1));
  p.overclockT = Math.max(0, p.overclockT - rawDt * (g.term.open ? 0 : 1));
  p.gunKick = lerp(p.gunKick, 0, clamp(dt * 16, 0, 1));
  p.muzzle = Math.max(0, p.muzzle - dt);
  p.cd = Math.max(0, p.cd - dt);
  p.meleeCd = Math.max(0, p.meleeCd - dt);
  p.meleeT = Math.max(0, p.meleeT - dt);

  if (inputOn) {
    // weapon switch
    for (let n = 0; n < WEAPON_ORDER.length; n++) {
      if (i.hit('Digit' + (n + 1))) {
        const id = WEAPON_ORDER[n];
        if (p.weapons.includes(id) && (p.ammo[id] > 0)) {
          p.weapon = id;
          g.audio.ui();
        }
      }
    }
    if (i.wheel) {
      const owned = p.weapons.filter((w) => p.ammo[w] > 0);
      const idx = owned.indexOf(p.weapon);
      p.weapon = owned[(idx + i.wheel + owned.length) % owned.length];
      g.audio.ui();
    }
    if (i.firing() && p.cd <= 0) fireWeapon(g);
    if ((i.rightPressed || i.actHit('melee')) && p.meleeCd <= 0) meleeSwing(g);
  }

  // terminal
  if (!p.dead && !g.term.open && !g.term.justClosed && i.actHit('terminal')) g.term.show();

  // orbitals (cron job)
  if (s.orbit > 0) {
    p.orbitA += dt * 4.6;
    for (let k = 0; k < s.orbit; k++) {
      const a = p.orbitA + (k * Math.PI * 2) / s.orbit;
      const ox = p.x + Math.cos(a) * 26;
      const oy = p.y - 6 + Math.sin(a) * 26;
      g.addLight(ox, oy, 16, '#39ffe5');
      forNear(g, ox, oy, (e) => {
        if (e.orbitCd <= 0 && dist(ox, oy, e.x, e.y - e.hoff) < e.r + 5) {
          e.orbitCd = 0.28;
          hurtEnemy(g, e, 22 * s.dmg, a + Math.PI / 2, { force: 70 });
        }
      });
    }
  }

  // allies (fork)
  for (let k = g.allies.length - 1; k >= 0; k--) {
    const al = g.allies[k];
    al.life -= dt;
    if (al.life <= 0) {
      glitchPixels(g, al.x, al.y - 6, 20);
      g.allies.splice(k, 1);
      continue;
    }
    const tx = p.x + Math.cos(k * 2.1 + g.time) * 24;
    const ty = p.y + Math.sin(k * 2.1 + g.time) * 18;
    const d = dist(al.x, al.y, tx, ty);
    if (d > 6) {
      const sp = Math.min(d * 4, 120);
      g.map.move(al, ((tx - al.x) / d) * sp * dt, ((ty - al.y) / d) * sp * dt, 4);
      al.walk += dt * 10;
    }
    al.cd -= dt;
    let best: Enemy | null = null;
    let bestD = 190;
    for (const e of g.enemies) {
      const ed = dist(e.x, e.y, al.x, al.y);
      if (ed < bestD && g.map.lineClear(al.x, al.y - 6, e.x, e.y - e.hoff)) {
        bestD = ed;
        best = e;
      }
    }
    if (best) {
      al.aim = angleTo(al.x, al.y - 7, best.x, best.y - best.hoff);
      al.flip = best.x < al.x;
      if (al.cd <= 0) {
        al.cd = 0.17;
        const a = al.aim + rand(-0.05, 0.05);
        g.bullets.push({ x: al.x, y: al.y - 7, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, dmg: 12 * s.dmg, life: 0.8, pierce: 0, bounce: 0, color: '#7fd4ff', size: 1, explode: 0, flame: false, crit: false, burn: 0, hit: null, trail: false });
        g.audio.shoot('ally');
      }
    }
  }

  // bullets
  for (let k = g.bullets.length - 1; k >= 0; k--) {
    if (!updateBullet(g, g.bullets[k], dt)) {
      g.bullets[k] = g.bullets[g.bullets.length - 1];
      g.bullets.pop();
    }
  }

  // enemy bullets
  const phx = p.x;
  const phy = p.y - 7;
  for (let k = g.ebullets.length - 1; k >= 0; k--) {
    const b = g.ebullets[k];
    b.life -= dt;
    if (b.turn) {
      const a = Math.atan2(b.vy, b.vx) + b.turn * dt;
      const sp = Math.hypot(b.vx, b.vy);
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    let gone = b.life <= 0 || g.map.blocksBullet(b.x, b.y);
    if (!gone && dist(b.x, b.y, phx, phy) < b.r + 4) {
      if (hurtPlayer(g, b.dmg, b.x - b.vx, b.y - b.vy, b.by)) gone = true;
    }
    if (gone) {
      sparks(g, b.x, b.y, 3, b.color, 50);
      g.ebullets[k] = g.ebullets[g.ebullets.length - 1];
      g.ebullets.pop();
    }
  }

  // pickups
  const magR = 34 * s.magnet;
  for (let k = g.pickups.length - 1; k >= 0; k--) {
    const pk = g.pickups[k];
    pk.life -= dt;
    pk.t += dt;
    pk.vz -= 240 * dt;
    pk.z = Math.max(0, pk.z + pk.vz * dt);
    if (pk.z === 0) pk.vz = 0;
    const d = dist(pk.x, pk.y, p.x, p.y);
    if (d < magR && !p.dead && pk.kind !== 'weapon') {
      const sp = lerp(170, 30, d / magR);
      pk.x += ((p.x - pk.x) / (d || 1)) * sp * dt;
      pk.y += ((p.y - pk.y) / (d || 1)) * sp * dt;
    }
    if (d < 11 && !p.dead) {
      collect(g, pk);
      g.pickups.splice(k, 1);
    } else if (pk.life <= 0) {
      g.pickups.splice(k, 1);
    }
  }

  // barrels and residue
  for (const b of g.barrels) b.flash = Math.max(0, b.flash - dt);
  g.barrels = g.barrels.filter((b) => b.hp > 0);
  for (let k = g.puddles.length - 1; k >= 0; k--) {
    const pd = g.puddles[k];
    pd.life -= dt;
    if (pd.life <= 0) g.puddles.splice(k, 1);
    else if (dist(pd.x, pd.y, p.x, p.y) < pd.r) hurtPlayer(g, 4, pd.x, pd.y, 'leak');
  }
  for (let k = g.tracers.length - 1; k >= 0; k--) {
    g.tracers[k].life -= dt;
    if (g.tracers[k].life <= 0) g.tracers.splice(k, 1);
  }
  for (let k = g.bolts.length - 1; k >= 0; k--) {
    g.bolts[k].life -= rawDt;
    if (g.bolts[k].life <= 0) g.bolts.splice(k, 1);
  }

  // beams
  for (let k = g.beams.length - 1; k >= 0; k--) {
    const b = g.beams[k];
    if (b.warn > 0) {
      b.warn -= dt;
      b.a += b.omega * dt * 0.15;
      if (b.warn <= 0) g.audio.laser();
    } else {
      b.a += b.omega * dt;
      b.life -= dt;
      const ex = b.x + Math.cos(b.a) * b.len;
      const ey = b.y + Math.sin(b.a) * b.len;
      if (distToSegment(phx, phy, b.x, b.y, ex, ey) < b.w + 3) hurtPlayer(g, b.dmg, b.x, b.y, 'beam');
      for (let d = 30; d < b.len; d += 70) g.addLight(b.x + Math.cos(b.a) * d, b.y + Math.sin(b.a) * d, 44, '#ff2a2a');
      if (b.life <= 0) g.beams.splice(k, 1);
    }
  }

  // deploy strips and corrupted tiles
  for (let k = g.hazards.length - 1; k >= 0; k--) {
    const h = g.hazards[k];
    if (h.warn > 0) {
      h.warn -= dt;
      if (h.warn <= 0) {
        g.addShake(5);
        if (h.style === 'deploy') {
          g.audio.explosion(false);
          // the deploy burns whatever is in the way, zombies included
          for (const e of [...g.enemies]) {
            if (!e.boss && e.x > h.x && e.x < h.x + h.w && e.y > h.y && e.y < h.y + h.h) hurtEnemy(g, e, 400, 0, { force: 60, gib: true, quiet: true, burn: 2 });
          }
        }
      }
    } else {
      h.life -= dt;
      if (p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) hurtPlayer(g, h.dmg, p.x, p.y, h.style);
      if (h.style === 'deploy' && !h.stained) {
        h.stained = true;
        const c = g.map.fctx;
        const n = (h.w * h.h) / 60;
        for (let q = 0; q < n; q++) {
          c.fillStyle = pick(['#120d0d', '#1c1414', '#090707']);
          c.fillRect(h.x + rand(h.w), h.y + rand(h.h), 2, 1);
        }
      }
      if (h.life <= 0) g.hazards.splice(k, 1);
    }
  }

  // player death: final sequence
  if (p.dead) {
    g.deathT += rawDt;
    if (g.deathT > 1.5 && g.state === 'play') g.setState('dead');
  }

  // camera
  const lookX = clamp(i.mx - W / 2, -W / 2, W / 2) * 0.22;
  const lookY = clamp(i.my - H / 2, -H / 2, H / 2) * 0.22;
  const tx = p.x - W / 2 + lookX;
  const ty = p.y - H / 2 - 6 + lookY;
  const camK = clamp(rawDt * 7, 0, 1);
  g.camX = lerp(g.camX, tx, camK);
  g.camY = lerp(g.camY, ty, camK);
  // margin at the map edges so the player is never hidden behind the HUD
  g.camX = clamp(g.camX, -14, Math.max(-14, g.map.pxW - W + 14));
  g.camY = clamp(g.camY, -38, Math.max(-38, g.map.pxH - H + 22));
  g.kickX = lerp(g.kickX, 0, clamp(rawDt * 12, 0, 1));
  g.kickY = lerp(g.kickY, 0, clamp(rawDt * 12, 0, 1));
  g.shake = Math.max(0, g.shake - rawDt * 34);
}

function meleeSwing(g: Game) {
  const p = g.player;
  const s = g.stats;
  p.meleeCd = 0.42;
  p.meleeT = 0.16;
  g.audio.melee();
  g.tracers.push({ ax: p.x, ay: p.y - 7, bx: p.x + Math.cos(p.aim) * 30, by: p.y - 7 + Math.sin(p.aim) * 30, life: 0.07, max: 0.07, color: '#ffffff', w: 1 });
  sparks(g, p.x + Math.cos(p.aim) * 14, p.y - 6 + Math.sin(p.aim) * 14, 5, '#cfd6e0', 70);
  let connected = 0;
  for (const e of [...g.enemies]) {
    if (e.dead) continue;
    const d = dist(p.x, p.y - 6, e.x, e.y - e.hoff);
    if (d > 32 + e.r) continue;
    const a = angleTo(p.x, p.y - 6, e.x, e.y - e.hoff);
    let diff = Math.abs(a - p.aim);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff > 1) continue;
    connected++;
    const before = e.hp;
    hurtEnemy(g, e, 70 * s.melee * s.dmg * (p.sudoT > 0 ? 2 : 1), a, { force: 300, gib: true });
    if (e.dead && before > 0) {
      g.progress.meleeKills++;
      g.checkAchievements();
      p.hp = Math.min(p.maxHp, p.hp + 3);
    }
  }
  if (connected) {
    g.hitstop = Math.max(g.hitstop, 0.05);
    g.addShake(6);
  }
}

function collect(g: Game, pk: Pickup) {
  const p = g.player;
  switch (pk.kind) {
    case 'hp':
      p.hp = Math.min(p.maxHp, p.hp + 22);
      g.addText(p.x, p.y - 22, T().floats.hotfix, '#ff5a6a');
      g.audio.pickup(0);
      break;
    case 'ammo':
      for (const w of p.weapons) {
        if (w === 'pistol') continue;
        const d = WEAPONS[w];
        p.ammo[w] = Math.min(Math.floor(d.ammoMax * g.stats.ammoMul), p.ammo[w] + d.ammoPickup);
      }
      g.addText(p.x, p.y - 22, 'apt-get ammo', '#ffd23d');
      g.audio.pickup(2);
      break;
    case 'ram': {
      const v = 48 * g.stats.ramGain;
      p.ram = Math.min(p.maxRam, p.ram + v);
      g.addText(p.x, p.y - 22, `+${Math.round(v)}MB`, '#39ff88');
      g.audio.pickup(4);
      break;
    }
    case 'weapon':
      if (pk.weapon) {
        giveWeapon(g, pk.weapon);
        g.announce = { text: `npm install ${WEAPONS[pk.weapon].name}`, t: 2, color: '#a8ff3e' };
        g.note = { text: T().weapons[pk.weapon].desc, t: 3 };
        g.audio.command();
      }
      break;
  }
  ring(g, pk.x, pk.y, 90, 0.2, pk.kind === 'hp' ? '#ff5a6a' : pk.kind === 'ram' ? '#39ff88' : '#ffd23d');
}
