import { expect, test } from '@playwright/test';

// A bot plays level 1 from the first wave to the boss. The simulation is stepped
// directly at 60 Hz, so the test does not depend on how fast the CI machine renders.
// It catches waves that never end, enemies that cannot be hit and runtime errors.

const ALL_SEEN = ['walker', 'bug', 'recruiter', 'runner', 'leak', 'leakSmall', 'stack', 'nullp', 'segfault', 'scrum', 'kernel', 'hydra', 'monolith', 'pixel'];

test('a bot clears level 1, boss included, without a stalled wave', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  await page.goto('./');
  await page.waitForFunction(() => (window as unknown as { __g?: unknown }).__g !== undefined);

  const result = await page.evaluate((seen) => {
    type Vec = { x: number; y: number };
    type Enemy = Vec & { hoff: number };
    type G = {
      state: string;
      phase: string;
      waveIdx: number;
      god: boolean;
      kills: number;
      camX: number;
      camY: number;
      enemies: Enemy[];
      pickups: (Vec & { kind: string })[];
      perkChoices: unknown[];
      progress: { seen: string[] };
      player: Vec & { weapon: string; weapons: string[]; ammo: Record<string, number> };
      input: { mx: number; my: number; left: boolean; down: Set<string>; endFrame(): void };
      newGame(d: string): void;
      beginPlay(): void;
      nextIntro(): void;
      applyPerk(p: unknown): void;
      update(dt: number): void;
    };
    const g = (window as unknown as { __g: G }).__g;
    g.progress.seen = seen;
    g.god = true;
    g.newGame('normal');
    const i = g.input;
    const pl = g.player;
    const tick = () => {
      if (g.state === 'story') return g.beginPlay();
      if (g.state === 'intro') return g.nextIntro();
      if (g.state === 'perk') return g.applyPerk(g.perkChoices[0]);
      if (g.state !== 'play') return;
      let best: Enemy | null = null;
      let bd = Infinity;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x - pl.x, e.y - pl.y);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      i.down.clear();
      if (best) {
        i.mx = best.x - g.camX;
        i.my = best.y - best.hoff - g.camY;
        i.left = true;
        // back away from close enemies, circle around distant ones
        const away = Math.atan2(pl.y - best.y, pl.x - best.x) + (bd < 90 ? 0 : 1.4);
        if (Math.cos(away) < -0.3) i.down.add('KeyA');
        if (Math.cos(away) > 0.3) i.down.add('KeyD');
        if (Math.sin(away) < -0.3) i.down.add('KeyW');
        if (Math.sin(away) > 0.3) i.down.add('KeyS');
      } else i.left = false;
      for (const w of ['shotgun', 'smg', 'pistol']) {
        if (pl.weapons.includes(w) && pl.ammo[w] > 0) {
          pl.weapon = w;
          break;
        }
      }
      const crate = g.pickups.find((p) => p.kind === 'weapon');
      if (crate && !best) {
        pl.x = crate.x;
        pl.y = crate.y;
      }
    };
    let worstWave = 0;
    let waveT = 0;
    let lastKey = '';
    for (let frame = 0; frame < 60 * 600; frame++) {
      tick();
      g.update(1 / 60);
      i.endFrame();
      const key = `${g.waveIdx}:${g.phase}`;
      if (key !== lastKey) {
        lastKey = key;
        waveT = 0;
      } else if (g.state === 'play') waveT += 1 / 60;
      worstWave = Math.max(worstWave, waveT);
      if (g.state === 'clear') return { cleared: true, seconds: Math.round(frame / 60), worstWave: Math.round(worstWave), kills: g.kills };
      if (waveT > 150) return { cleared: false, stalledAt: key, enemies: g.enemies.length, worstWave: Math.round(worstWave), kills: g.kills };
    }
    return { cleared: false, timedOut: true, worstWave: Math.round(worstWave), kills: g.kills };
  }, ALL_SEEN);

  console.log('bot run:', JSON.stringify(result));
  expect(result.cleared, JSON.stringify(result)).toBe(true);
  expect(errors).toEqual([]);
});
