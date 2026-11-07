import { drawText } from '../core/font';
import { T } from './i18n';
import { TILE, chance, makeCanvas, pick, rand, randInt } from '../core/util';

export const FLOOR = 0;
export const WALL = 1; // blocks everything
export const LOW = 2; // blocks movement, bullets pass

export interface StaticLight {
  x: number;
  y: number;
  r: number;
  color: string;
  flicker?: number;
}

export interface Led {
  x: number;
  y: number;
  color: string;
  phase: number;
  speed: number;
}

export type Theme = 'office' | 'datacenter' | 'undernet' | 'production' | 'void';

export class GameMap {
  tiles: Uint8Array;
  floor: HTMLCanvasElement;
  fctx: CanvasRenderingContext2D;
  distField: Int16Array;
  dirX: Float32Array;
  dirY: Float32Array;
  lights: StaticLight[] = [];
  leds: Led[] = [];
  barrelSpots: { x: number; y: number }[] = [];
  pxW: number;
  pxH: number;

  constructor(public w: number, public h: number, public theme: Theme) {
    this.tiles = new Uint8Array(w * h);
    [this.floor, this.fctx] = makeCanvas(w * TILE, h * TILE);
    this.distField = new Int16Array(w * h);
    this.dirX = new Float32Array(w * h);
    this.dirY = new Float32Array(w * h);
    this.pxW = w * TILE;
    this.pxH = h * TILE;
  }

  tile(tx: number, ty: number) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return WALL;
    return this.tiles[ty * this.w + tx];
  }

  set(tx: number, ty: number, v: number) {
    if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.tiles[ty * this.w + tx] = v;
  }

  solidAt(x: number, y: number) {
    return this.tile(Math.floor(x / TILE), Math.floor(y / TILE)) !== FLOOR;
  }

  blocksBullet(x: number, y: number) {
    return this.tile(Math.floor(x / TILE), Math.floor(y / TILE)) === WALL;
  }

  collides(x: number, y: number, r: number) {
    return this.solidAt(x - r, y - r) || this.solidAt(x + r, y - r) || this.solidAt(x - r, y + r) || this.solidAt(x + r, y + r);
  }

  /** Movement that slides along each axis. Returns true if it hit something. */
  move(o: { x: number; y: number }, dx: number, dy: number, r: number) {
    let hit = false;
    // a body already touching a wall (spawn, knockback) can leave it: only the center blocks
    const embedded = this.collides(o.x, o.y, r);
    if (dx !== 0) {
      const blocked = embedded ? this.solidAt(o.x + dx, o.y) : this.collides(o.x + dx, o.y, r);
      if (!blocked) o.x += dx;
      else hit = true;
    }
    if (dy !== 0) {
      const blocked = embedded ? this.solidAt(o.x, o.y + dy) : this.collides(o.x, o.y + dy, r);
      if (!blocked) o.y += dy;
      else hit = true;
    }
    return hit;
  }

  lineClear(ax: number, ay: number, bx: number, by: number) {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / (TILE / 2));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.solidAt(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
    }
    return true;
  }

  /** Flow field (BFS) to the player. The whole horde shares the same computation. */
  computeFlow(px: number, py: number) {
    const { w, h, tiles, distField, dirX, dirY } = this;
    distField.fill(-1);
    const q = new Int32Array(w * h);
    let head = 0;
    let tail = 0;
    const start = Math.floor(py / TILE) * w + Math.floor(px / TILE);
    if (start < 0 || start >= w * h) return;
    distField[start] = 0;
    q[tail++] = start;
    while (head < tail) {
      const c = q[head++];
      const d = distField[c] + 1;
      const x = c % w;
      const y = (c / w) | 0;
      if (x > 0 && tiles[c - 1] === FLOOR && distField[c - 1] < 0) { distField[c - 1] = d; q[tail++] = c - 1; }
      if (x < w - 1 && tiles[c + 1] === FLOOR && distField[c + 1] < 0) { distField[c + 1] = d; q[tail++] = c + 1; }
      if (y > 0 && tiles[c - w] === FLOOR && distField[c - w] < 0) { distField[c - w] = d; q[tail++] = c - w; }
      if (y < h - 1 && tiles[c + w] === FLOOR && distField[c + w] < 0) { distField[c + w] = d; q[tail++] = c + w; }
    }
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const c = y * w + x;
        if (tiles[c] !== FLOOR || distField[c] < 0) continue;
        let best = distField[c];
        let bx = 0;
        let by = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            const n = c + oy * w + ox;
            if (tiles[n] !== FLOOR || distField[n] < 0) continue;
            if (ox && oy && (tiles[c + ox] !== FLOOR || tiles[c + oy * w] !== FLOOR)) continue; // no corner cutting
            if (distField[n] < best) {
              best = distField[n];
              bx = ox;
              by = oy;
            }
          }
        }
        const l = Math.hypot(bx, by) || 1;
        dirX[c] = bx / l;
        dirY[c] = by / l;
      }
    }
  }

  /** Direction to the center of the next tile on the path: keeps bodies off corners. */
  flowAt(x: number, y: number): [number, number] {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    const c = ty * this.w + tx;
    const fx = this.dirX[c] ?? 0;
    const fy = this.dirY[c] ?? 0;
    const nx = (tx + Math.sign(fx)) * TILE + TILE / 2 - x;
    const ny = (ty + Math.sign(fy)) * TILE + TILE / 2 - y;
    const l = Math.hypot(nx, ny);
    return l > 0.01 ? [nx / l, ny / l] : [0, 0];
  }

  /** Removes isolated pockets so nothing spawns trapped. */
  ensureConnected(cx: number, cy: number) {
    const { w, h, tiles } = this;
    const seen = new Uint8Array(w * h);
    const stack = [cy * w + cx];
    seen[stack[0]] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      for (const n of [c - 1, c + 1, c - w, c + w]) {
        if (n >= 0 && n < w * h && !seen[n] && tiles[n] === FLOOR) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    for (let i = 0; i < w * h; i++) if (tiles[i] === FLOOR && !seen[i]) tiles[i] = WALL;
  }

  randomFloor(): { x: number; y: number } {
    for (let i = 0; i < 400; i++) {
      const tx = randInt(1, this.w - 2);
      const ty = randInt(1, this.h - 2);
      if (this.tile(tx, ty) === FLOOR && this.tile(tx + 1, ty) === FLOOR && this.tile(tx, ty + 1) === FLOOR) {
        return { x: tx * TILE + 8, y: ty * TILE + 8 };
      }
    }
    return { x: (this.w * TILE) / 2, y: (this.h * TILE) / 2 };
  }
}

// ---------- Generators ----------

function border(m: GameMap) {
  for (let x = 0; x < m.w; x++) {
    m.set(x, 0, WALL);
    m.set(x, m.h - 1, WALL);
  }
  for (let y = 0; y < m.h; y++) {
    m.set(0, y, WALL);
    m.set(m.w - 1, y, WALL);
  }
}

function clearCenter(m: GameMap, r: number) {
  const cx = m.w >> 1;
  const cy = m.h >> 1;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) m.set(cx + x, cy + y, FLOOR);
}

function genOffice(m: GameMap) {
  border(m);
  for (let gy = 3; gy < m.h - 4; gy += 6) {
    for (let gx = 3; gx < m.w - 6; gx += 9) {
      const roll = Math.random();
      if (roll < 0.62) {
        for (let x = 0; x < 6; x++) {
          m.set(gx + x, gy, LOW);
          m.set(gx + x, gy + 1, LOW);
        }
      } else if (roll < 0.85) {
        for (let x = 0; x < 6; x++) {
          m.set(gx + x, gy - 1, WALL);
          if (x !== 2 && x !== 3) m.set(gx + x, gy + 3, WALL);
        }
        for (let y = 0; y < 4; y++) {
          m.set(gx, gy - 1 + y, WALL);
          m.set(gx + 5, gy - 1 + y, WALL);
        }
      }
    }
  }
  clearCenter(m, 4);
  const cy = m.h >> 1;
  for (let i = 0; i < 7; i++) m.barrelSpots.push({ x: randInt(3, m.w - 4), y: chance(0.5) ? cy + randInt(-2, 2) : randInt(2, m.h - 3) });
}

function genDatacenter(m: GameMap) {
  border(m);
  for (let x = 4; x < m.w - 3; x += 5) {
    for (let y = 3; y < m.h - 3; y++) {
      const crossing = y === (m.h >> 1) || y === (m.h >> 1) - 1 || y % 9 === 0;
      if (!crossing) {
        m.set(x, y, WALL);
        m.set(x + 1, y, WALL);
      }
    }
  }
  clearCenter(m, 4);
  for (let i = 0; i < 10; i++) m.barrelSpots.push({ x: randInt(2, m.w - 3), y: randInt(2, m.h - 3) });
}

function genUndernet(m: GameMap) {
  const { w, h } = m;
  for (let i = 0; i < w * h; i++) m.tiles[i] = chance(0.36) ? WALL : FLOOR;
  for (let it = 0; it < 4; it++) {
    const next = new Uint8Array(m.tiles);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let n = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if ((ox || oy) && m.tile(x + ox, y + oy) === WALL) n++;
        next[y * w + x] = n >= 5 ? WALL : FLOOR;
      }
    }
    m.tiles.set(next);
  }
  // the central arena is bigger: bosses need room
  const cx = w >> 1;
  const cy = h >> 1;
  for (let y = -6; y <= 6; y++) for (let x = -10; x <= 10; x++) if ((x * x) / 100 + (y * y) / 36 < 1) m.set(cx + x, cy + y, FLOOR);
  border(m);
  m.ensureConnected(cx, cy);
  for (let i = 0; i < 12; i++) m.barrelSpots.push({ x: randInt(2, w - 3), y: randInt(2, h - 3) });
}

function genProduction(m: GameMap) {
  border(m);
  for (let i = 0; i < 16; i++) {
    const x = randInt(4, m.w - 6);
    const y = randInt(4, m.h - 6);
    const low = chance(0.5);
    m.set(x, y, low ? LOW : WALL);
    m.set(x + 1, y, low ? LOW : WALL);
    m.set(x, y + 1, low ? LOW : WALL);
    m.set(x + 1, y + 1, low ? LOW : WALL);
  }
  clearCenter(m, 6);
  // the Monolith takes the top center
  const cx = m.w >> 1;
  for (let y = 1; y < 9; y++) for (let x = -5; x <= 5; x++) m.set(cx + x, y, FLOOR);
  for (let i = 0; i < 16; i++) m.barrelSpots.push({ x: randInt(2, m.w - 3), y: randInt(2, m.h - 3) });
}

function genVoid(m: GameMap) {
  border(m);
  const cx = m.w >> 1;
  const cy = m.h >> 1;
  for (const [ox, oy] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) {
    m.set(cx + ox, cy + oy, WALL);
    m.set(cx + ox + 1, cy + oy, WALL);
    m.set(cx + ox, cy + oy + 1, WALL);
    m.set(cx + ox + 1, cy + oy + 1, WALL);
  }
}

// ---------- Static painting ----------

function noise(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cols: string[], n: number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = pick(cols);
    ctx.fillRect(x + randInt(0, w - 1), y + randInt(0, h - 1), 1, 1);
  }
}

const CODE = ['#39ffe5', '#a8ff3e', '#ff7ad9', '#ffd23d', '#8fa3bf'];

function paintMonitor(m: GameMap, x: number, y: number) {
  const c = m.fctx;
  c.fillStyle = '#10131a';
  c.fillRect(x + 2, y + 1, 12, 8);
  c.fillStyle = '#04121a';
  c.fillRect(x + 3, y + 2, 10, 6);
  for (let l = 0; l < 3; l++) {
    c.fillStyle = pick(CODE);
    c.fillRect(x + 4 + randInt(0, 1), y + 3 + l * 2 - (l ? 1 : 0), randInt(3, 7), 1);
  }
  c.fillStyle = '#2b2f3a';
  c.fillRect(x + 7, y + 9, 2, 2);
  m.lights.push({ x: x + 8, y: y + 8, r: 26, color: pick(['#2bb8c9', '#3a7bd5', '#34c98a']) });
}

function paintOffice(m: GameMap) {
  const c = m.fctx;
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      c.fillStyle = (tx + ty) % 2 ? '#39405a' : '#343b52';
      c.fillRect(x, y, TILE, TILE);
      noise(c, x, y, TILE, TILE, ['#454d6b', '#2b3146'], 10);
    }
  }
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const t = m.tile(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === WALL) {
        c.fillStyle = '#c9cfdb';
        c.fillRect(x, y, TILE, TILE - 6);
        c.fillStyle = '#7f88a0';
        c.fillRect(x, y + TILE - 6, TILE, 6);
        c.fillStyle = '#5b6379';
        c.fillRect(x, y + TILE - 1, TILE, 1);
      } else if (t === LOW) {
        c.fillStyle = '#8a6a44';
        c.fillRect(x, y, TILE, TILE - 3);
        c.fillStyle = '#5c432a';
        c.fillRect(x, y + TILE - 3, TILE, 3);
        c.fillStyle = '#a07e56';
        c.fillRect(x, y, TILE, 1);
        if (tx % 3 === 0 && m.tile(tx, ty - 1) !== LOW) paintMonitor(m, x, y);
        else if (chance(0.2)) {
          c.fillStyle = pick(['#fff', '#ffe14d', '#ff8ad1']);
          c.fillRect(x + randInt(2, 10), y + randInt(4, 9), 4, 4); // post-it
        }
      }
    }
  }
  for (let y = 5; y < m.h; y += 9) for (let x = 6; x < m.w; x += 11) m.lights.push({ x: x * TILE, y: y * TILE, r: 92, color: '#8f96aa', flicker: chance(0.25) ? 0.5 : 0 });
  drawText(c, T().floor.officeBig, m.pxW / 2, m.pxH / 2 - 26, '#4c5573', { align: 'center', scale: 2 });
  drawText(c, T().floor.officeSmall, m.pxW / 2, m.pxH / 2 - 6, '#4c5573', { align: 'center' });
}

function paintDatacenter(m: GameMap) {
  const c = m.fctx;
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      c.fillStyle = '#2a3850';
      c.fillRect(x, y, TILE, TILE);
      c.fillStyle = '#17202f';
      c.fillRect(x, y, TILE, 1);
      c.fillRect(x, y, 1, TILE);
      if ((tx + ty) % 4 === 0) for (let i = 2; i < 14; i += 3) for (let j = 2; j < 14; j += 3) c.fillRect(x + i, y + j, 1, 1);
      const t = m.tile(tx, ty);
      if (t === WALL) {
        c.fillStyle = '#10141d';
        c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#232c3c';
        c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        for (let sl = 0; sl < 3; sl++) {
          c.fillStyle = '#0b0f16';
          c.fillRect(x + 2, y + 2 + sl * 4, TILE - 4, 3);
          if (chance(0.8)) {
            m.leds.push({ x: x + randInt(3, 12), y: y + 3 + sl * 4, color: pick(['#39ff88', '#39ff88', '#39c8ff', '#ffae00', '#ff2a2a']), phase: rand(6), speed: rand(1, 9) });
          }
        }
      }
    }
  }
  for (let y = 6; y < m.h; y += 12) for (let x = 2; x < m.w; x += 5) m.lights.push({ x: x * TILE + 8, y: y * TILE, r: 54, color: '#3f73b8' });
  drawText(c, T().floor.coldBig, m.pxW / 2, m.pxH / 2 - 22, '#33435f', { align: 'center', scale: 2 });
  drawText(c, T().floor.coldSmall, m.pxW / 2, m.pxH / 2 - 2, '#33435f', { align: 'center' });
}

function paintUndernet(m: GameMap) {
  const c = m.fctx;
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      c.fillStyle = '#25332b';
      c.fillRect(x, y, TILE, TILE);
      noise(c, x, y, TILE, TILE, ['#2c3c32', '#1c2820', '#34483a'], 22);
    }
  }
  for (let i = 0; i < 26; i++) {
    c.strokeStyle = pick(['#c1121f', '#1261c1', '#c1a812', '#12c15b', '#333']);
    c.lineWidth = 1;
    c.beginPath();
    let x = rand(m.pxW);
    let y = rand(m.pxH);
    c.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += rand(-80, 80);
      y += rand(-60, 60);
      c.lineTo(x, y);
    }
    c.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const p = m.randomFloor();
    const r = randInt(4, 12);
    c.fillStyle = '#254a18';
    c.beginPath();
    c.ellipse(p.x, p.y, r * 1.5, r, 0, 0, 7);
    c.fill();
    c.fillStyle = '#4fbf26';
    c.beginPath();
    c.ellipse(p.x, p.y, r, r * 0.6, 0, 0, 7);
    c.fill();
    m.lights.push({ x: p.x, y: p.y, r: r * 5, color: '#2f8f14' });
  }
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      if (m.tile(tx, ty) !== WALL) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      c.fillStyle = '#2c3a2e';
      c.fillRect(x, y, TILE, TILE);
      noise(c, x, y, TILE, TILE, ['#3a4b3b', '#232f25', '#425742'], 34);
      if (m.tile(tx, ty + 1) !== WALL) {
        c.fillStyle = '#121a13';
        c.fillRect(x, y + 11, TILE, 5);
      }
    }
  }
  drawText(c, 'UNDERNET', m.pxW / 2, m.pxH / 2 - 8, '#2f4a33', { align: 'center', scale: 2 });
}

function paintProduction(m: GameMap) {
  const c = m.fctx;
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      c.fillStyle = (tx ^ ty) & 1 ? '#3a2a2e' : '#33252a';
      c.fillRect(x, y, TILE, TILE);
      noise(c, x, y, TILE, TILE, ['#35252a', '#1a1215'], 12);
      if (chance(0.03)) {
        c.fillStyle = '#ff5a1a';
        c.fillRect(x + randInt(1, 12), y + randInt(1, 12), randInt(2, 5), 1);
      }
    }
  }
  // hazard stripes around the arena
  c.save();
  const bx = 3 * TILE;
  const by = 3 * TILE;
  const bw = m.pxW - 6 * TILE;
  const bh = m.pxH - 6 * TILE;
  for (let i = 0; i < bw; i += 8) {
    c.fillStyle = (i / 8) % 2 ? '#d9a200' : '#17120a';
    c.fillRect(bx + i, by, 8, 3);
    c.fillRect(bx + i, by + bh, 8, 3);
  }
  for (let i = 0; i < bh; i += 8) {
    c.fillStyle = (i / 8) % 2 ? '#d9a200' : '#17120a';
    c.fillRect(bx, by + i, 3, 8);
    c.fillRect(bx + bw, by + i, 3, 8);
  }
  c.restore();
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      const t = m.tile(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === WALL) {
        c.fillStyle = '#3a2a30';
        c.fillRect(x, y, TILE, TILE - 5);
        c.fillStyle = '#1c1417';
        c.fillRect(x, y + TILE - 5, TILE, 5);
        c.fillStyle = '#54404a';
        c.fillRect(x, y, TILE, 1);
      } else if (t === LOW) {
        c.fillStyle = '#b58a00';
        c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#17120a';
        for (let i = -16; i < 16; i += 6) {
          for (let j = 0; j < 3; j++) {
            for (let k = 0; k < TILE; k++) {
              const px = i + k + j;
              if (px >= 0 && px < TILE) c.fillRect(x + px, y + k, 1, 1);
            }
          }
        }
      }
    }
  }
  for (let y = 4; y < m.h; y += 8) {
    for (let x = 4; x < m.w; x += 10) m.lights.push({ x: x * TILE, y: y * TILE, r: 96, color: '#a02a1c', flicker: 0.4 });
  }
  drawText(c, T().floor.prod, m.pxW / 2, m.pxH / 2 - 10, '#4a2b30', { align: 'center', scale: 3 });
}

function paintVoid(m: GameMap) {
  const c = m.fctx;
  c.fillStyle = '#ecece6';
  c.fillRect(0, 0, m.pxW, m.pxH);
  c.fillStyle = '#dfdfd8';
  for (let x = 0; x < m.pxW; x += TILE) c.fillRect(x, 0, 1, m.pxH);
  for (let y = 0; y < m.pxH; y += TILE) c.fillRect(0, y, m.pxW, 1);
  for (let ty = 0; ty < m.h; ty++) {
    for (let tx = 0; tx < m.w; tx++) {
      if (m.tile(tx, ty) === WALL) {
        const x = tx * TILE;
        const y = ty * TILE;
        c.fillStyle = '#0a0a0c';
        c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#ff004c';
        c.fillRect(x - 1, y, 1, TILE);
        c.fillStyle = '#00e5ff';
        c.fillRect(x + TILE, y, 1, TILE);
      }
    }
  }
}

export function buildMap(theme: Theme): GameMap {
  const size: Record<Theme, [number, number]> = {
    office: [46, 30],
    datacenter: [50, 34],
    undernet: [52, 36],
    production: [50, 34],
    void: [36, 22],
  };
  const [w, h] = size[theme];
  const m = new GameMap(w, h, theme);
  ({ office: genOffice, datacenter: genDatacenter, undernet: genUndernet, production: genProduction, void: genVoid })[theme](m);
  m.ensureConnected(w >> 1, h >> 1);
  ({ office: paintOffice, datacenter: paintDatacenter, undernet: paintUndernet, production: paintProduction, void: paintVoid })[theme](m);
  m.barrelSpots = m.barrelSpots.filter((p) => m.tile(p.x, p.y) === FLOOR && Math.hypot(p.x - (w >> 1), p.y - (h >> 1)) > 5);
  return m;
}
