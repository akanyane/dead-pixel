import { chance, clamp, pick, rand, randInt } from '../core/util';
import type { Game } from './game';
import { SPR, type Sprite } from './sprites';

export const enum P {
  Blood,
  Spark,
  Smoke,
  Fire,
  Pixel,
  Ring,
  Flash,
}

export interface Particle {
  kind: P;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
  stainSet: string[] | null;
}

export interface Gib {
  spr: Sprite;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rot: number;
  vr: number;
  bleed: string[] | null;
  bounces: number;
}

export const BLOOD: Record<string, string[]> = {
  red: ['#b3101a', '#8f0c16', '#d4161f', '#6d0a12', '#e8222a'],
  green: ['#3fbf25', '#2b8f18', '#59ff3a', '#1d6410'],
  purple: ['#a855f7', '#7c3aed', '#c084fc', '#4c1d95'],
  cyan: ['#2bfff2', '#14a8a2', '#7ffff8', '#0b6b67'],
  black: ['#07070a', '#16161c', '#000000', '#27272f', '#ff004c', '#00e5ff'],
};

const MAX_PARTS = 2600;
const MAX_GIBS = 220;

export function spawnPart(g: Game, kind: P, x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, color: string, size = 1, stainSet: string[] | null = null) {
  if (g.parts.length >= MAX_PARTS) g.parts[randInt(0, g.parts.length - 1)] = g.parts[g.parts.length - 1], g.parts.pop();
  g.parts.push({ kind, x, y, z, vx, vy, vz, life, max: life, color, size, stainSet });
}

/** Permanent stain on the floor: the map keeps everything that happened on it. */
export function splat(g: Game, x: number, y: number, n: number, spread: number, set: string[]) {
  const c = g.map.fctx;
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2);
    const d = Math.pow(Math.random(), 1.6) * spread;
    c.fillStyle = pick(set);
    const s = chance(0.18) ? 2 : 1;
    c.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.7), s, s);
  }
  // marks wet floor for the player's footprints
  if (set === BLOOD.red) g.markWet(x, y, spread);
}

/** Solid, irregular pool: gives kills weight, in contrast with the splatter. */
export function bloodPool(g: Game, x: number, y: number, r: number, set: string[]) {
  const c = g.map.fctx;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const ry = Math.max(2, Math.round(r * 0.62));
  let wobble = rand(-1, 1);
  for (let oy = -ry; oy <= ry; oy++) {
    wobble += rand(-1.3, 1.3);
    wobble = clamp(wobble, -r * 0.35, r * 0.35);
    const half = Math.sqrt(Math.max(0, 1 - (oy * oy) / (ry * ry))) * r + wobble;
    if (half <= 0) continue;
    c.fillStyle = set[3] ?? set[0];
    c.fillRect(Math.round(cx - half), cy + oy, Math.round(half * 2), 1);
    c.fillStyle = set[0];
    const inner = half * 0.72;
    if (inner > 1) c.fillRect(Math.round(cx - inner + rand(-1, 1)), cy + oy, Math.round(inner * 2), 1);
  }
  // wet shine
  c.fillStyle = set[4] ?? set[2];
  c.fillRect(cx - Math.round(r * 0.3), cy - Math.round(ry * 0.4), Math.max(1, Math.round(r * 0.3)), 1);
  if (set === BLOOD.red) g.markWet(x, y, r);
}

export function bloodSpray(g: Game, x: number, y: number, z: number, ang: number, n: number, force: number, set: string[], cone = 0.7) {
  const count = Math.ceil(n * g.goreLevel);
  for (let i = 0; i < count; i++) {
    const a = ang + rand(-cone, cone);
    const f = rand(0.25, 1) * force;
    spawnPart(g, P.Blood, x, y, z, Math.cos(a) * f, Math.sin(a) * f * 0.8, rand(10, 70), 2, pick(set), chance(0.2) ? 2 : 1, set);
  }
}

export function bloodFountain(g: Game, x: number, y: number, z: number, n: number, set: string[]) {
  const count = Math.ceil(n * g.goreLevel);
  for (let i = 0; i < count; i++) {
    const a = rand(Math.PI * 2);
    const f = rand(15, 110);
    spawnPart(g, P.Blood, x, y, z, Math.cos(a) * f, Math.sin(a) * f * 0.7, rand(50, 190), 3, pick(set), chance(0.25) ? 2 : 1, set);
  }
}

export function spawnGib(g: Game, spr: Sprite, x: number, y: number, z: number, force: number, ang: number, bleed: string[] | null) {
  if (g.gibs.length >= MAX_GIBS) stampGib(g, g.gibs.shift()!);
  const a = ang + rand(-1, 1);
  const f = rand(0.35, 1) * force;
  g.gibs.push({ spr, x, y, z, vx: Math.cos(a) * f, vy: Math.sin(a) * f * 0.8, vz: rand(60, 170), rot: rand(6), vr: rand(-14, 14), bleed, bounces: 0 });
}

function stampGib(g: Game, b: Gib) {
  const c = g.map.fctx;
  c.save();
  c.translate(Math.round(b.x), Math.round(b.y));
  c.rotate(Math.round(b.rot / (Math.PI / 2)) * (Math.PI / 2));
  c.drawImage(b.spr.c, -b.spr.w / 2, -b.spr.h / 2);
  c.restore();
}

export function updateFx(g: Game, dt: number) {
  const m = g.map;
  for (let i = g.parts.length - 1; i >= 0; i--) {
    const p = g.parts[i];
    p.life -= dt;
    let dead = p.life <= 0;
    switch (p.kind) {
      case P.Blood:
        p.vz -= 340 * dt;
        p.z += p.vz * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.z <= 0) {
          if (p.stainSet) {
            const c = m.fctx;
            c.fillStyle = p.color;
            const st = Math.hypot(p.vx, p.vy);
            // fast drops become streaks, slow drops become dots
            if (st > 90) {
              c.fillRect(Math.round(p.x), Math.round(p.y), 2 + (st > 170 ? 1 : 0), 1);
            } else {
              c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
            }
          }
          dead = true;
        }
        break;
      case P.Spark:
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        break;
      case P.Smoke:
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 8 * dt;
        p.vx *= 0.97;
        p.size += dt * 6;
        break;
      case P.Fire:
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.vy -= 26 * dt;
        break;
      case P.Pixel:
        p.vz -= 180 * dt;
        p.z = Math.max(0, p.z + p.vz * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy *= 0.97;
        break;
      case P.Ring:
        p.size += p.vx * dt;
        break;
      case P.Flash:
        break;
    }
    if (dead) {
      g.parts[i] = g.parts[g.parts.length - 1];
      g.parts.pop();
    }
  }

  for (let i = g.gibs.length - 1; i >= 0; i--) {
    const b = g.gibs[i];
    b.vz -= 420 * dt;
    b.z += b.vz * dt;
    const nx = b.x + b.vx * dt;
    const ny = b.y + b.vy * dt;
    if (m.solidAt(nx, b.y)) b.vx *= -0.5;
    else b.x = nx;
    if (m.solidAt(b.x, ny)) b.vy *= -0.5;
    else b.y = ny;
    b.rot += b.vr * dt;
    if (b.bleed && chance(0.6)) {
      const c = m.fctx;
      c.fillStyle = pick(b.bleed);
      if (b.z < 4) c.fillRect(Math.round(b.x + rand(-1, 1)), Math.round(b.y + rand(-1, 1)), 1, 1);
      else if (chance(0.3)) spawnPart(g, P.Blood, b.x, b.y, b.z, b.vx * 0.2, b.vy * 0.2, 0, 1.4, pick(b.bleed), 1, b.bleed);
    }
    if (b.z <= 0) {
      b.z = 0;
      b.vz = -b.vz * 0.4;
      b.vx *= 0.55;
      b.vy *= 0.55;
      b.vr *= 0.5;
      b.bounces++;
      if (b.bleed) splat(g, b.x, b.y, 8, 5, b.bleed);
      if (b.bounces >= 3 || Math.abs(b.vz) < 18) {
        stampGib(g, b);
        g.gibs[i] = g.gibs[g.gibs.length - 1];
        g.gibs.pop();
      }
    }
  }

  for (let i = g.texts.length - 1; i >= 0; i--) {
    const t = g.texts[i];
    t.life -= dt;
    t.y += t.vy * dt;
    t.vy *= 0.94;
    if (t.life <= 0) {
      g.texts[i] = g.texts[g.texts.length - 1];
      g.texts.pop();
    }
  }
}

export function sparks(g: Game, x: number, y: number, n: number, color: string, force = 90) {
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2);
    const f = rand(0.3, 1) * force;
    spawnPart(g, P.Spark, x, y, 0, Math.cos(a) * f, Math.sin(a) * f, 0, rand(0.1, 0.35), color);
  }
}

export function glitchPixels(g: Game, x: number, y: number, n: number, force = 80) {
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2);
    const f = rand(0.2, 1) * force;
    spawnPart(g, P.Pixel, x, y, rand(2, 10), Math.cos(a) * f, Math.sin(a) * f, rand(20, 90), rand(0.4, 1.1), pick(['#ff004c', '#00e5ff', '#39ff88', '#ffffff']), chance(0.3) ? 2 : 1);
  }
}

export function fireBurst(g: Game, x: number, y: number, n: number, force = 70) {
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2);
    const f = rand(0.1, 1) * force;
    spawnPart(g, P.Fire, x, y, 0, Math.cos(a) * f, Math.sin(a) * f, 0, rand(0.2, 0.7), pick(['#ffec3d', '#ff9a1a', '#ff5a1a', '#d81e2c']), randInt(2, 5));
  }
}

export function smokeBurst(g: Game, x: number, y: number, n: number, force = 26) {
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2);
    const f = rand(0.1, 1) * force;
    spawnPart(g, P.Smoke, x, y, 0, Math.cos(a) * f, Math.sin(a) * f, 0, rand(0.5, 1.5), pick(['#2a2a30', '#3a3a42', '#1a1a20']), randInt(2, 5));
  }
}

export function ring(g: Game, x: number, y: number, speed: number, life: number, color: string) {
  spawnPart(g, P.Ring, x, y, 0, speed, 0, 0, life, color, 1);
}

/** The main show: takes a human body apart. */
export function dismember(g: Game, x: number, y: number, ang: number, force: number, set: string[], heavy = false) {
  const lv = g.goreLevel;
  spawnGib(g, pick(SPR.gibHead), x, y, 12, force * 1.15, ang, set);
  spawnGib(g, SPR.gibArm, x, y, 8, force, ang + rand(-1.2, 1.2), set);
  if (chance(0.7) || heavy) spawnGib(g, SPR.gibArm, x, y, 8, force, ang + rand(-1.2, 1.2), set);
  if (chance(0.7) || heavy) spawnGib(g, SPR.gibLeg, x, y, 3, force * 0.8, ang + rand(-1.4, 1.4), set);
  if (chance(0.5) || heavy) spawnGib(g, SPR.gibLeg, x, y, 3, force * 0.8, ang + rand(-1.4, 1.4), set);
  const extra = Math.round((heavy ? 7 : 3) * lv);
  for (let i = 0; i < extra; i++) {
    spawnGib(g, pick([SPR.gibGut, SPR.gibRib, SPR.gibGut, SPR.gibEye]), x, y, 7, force * 1.1, ang + rand(-1.6, 1.6), set);
  }
  bloodSpray(g, x, y, 7, ang, 30, force * 1.6, set, 0.9);
  bloodFountain(g, x, y, 10, heavy ? 80 : 34, set);
  bloodPool(g, x, y, (heavy ? rand(11, 16) : rand(6, 9)) * clamp(lv, 0.5, 1.2), set);
  splat(g, x, y, Math.round((heavy ? 240 : 110) * clamp(lv, 0.3, 1.5)), heavy ? 26 : 15, set);
}
