import { expect, test, type Page } from '@playwright/test';

// Minimal view of the dev-only `window.__g` object these tests drive.
type G = {
  state: string;
  menuPage: string;
  god: boolean;
  mode: string;
  arcadeSeed: number;
  arcadeWave: number;
  levelIdx: number;
  kills: number;
  enemies: unknown[];
  queue: unknown[];
  perkChoices: { id: string }[];
  progress: { seen: string[]; beaten: string[] };
  map: { tiles: Uint8Array };
  level: { waves: unknown[] };
  newGame(d?: string): void;
  beginPlay(): void;
  startArcade(m: 'endless' | 'daily'): void;
};
declare global {
  interface Window {
    __g: G;
  }
}

const ALL_SEEN = ['walker', 'bug', 'recruiter', 'runner', 'leak', 'stack', 'nullp', 'segfault', 'scrum', 'kernel', 'hydra', 'monolith', 'pixel'];

/** Presses a key and waits a few frames: the game reads input once per frame. */
async function tap(page: Page, key: string) {
  await page.keyboard.press(key);
  await page.waitForTimeout(120);
}

/** Opens the game, collects page errors and logs in past the boot screen. */
async function boot(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__g?.state === 'boot');
  await page.waitForTimeout(300);
  // park the mouse away from the menus so hover never changes the selection
  await page.mouse.move(2, 2);
  await tap(page, 'Enter');
  await expect.poll(() => page.evaluate(() => window.__g.state)).toBe('menu');
  return errors;
}

test('boots into the menu without errors', async ({ page }) => {
  const errors = await boot(page);
  await tap(page, 'Enter');
  await expect.poll(() => page.evaluate(() => window.__g.menuPage)).toBe('play');
  expect(errors).toEqual([]);
});

test('a story level runs, spawns enemies and registers kills', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate((seen) => {
    const g = window.__g;
    g.god = true;
    g.progress.seen = seen;
    g.newGame('normal');
    g.beginPlay();
  }, ALL_SEEN);
  await expect.poll(() => page.evaluate(() => window.__g.enemies.length), { timeout: 15_000 }).toBeGreaterThan(0);
  // pull the enemies in front of the player and hold the trigger to the right
  await page.mouse.move(900, 360);
  await page.mouse.down();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const g = window.__g as unknown as { player: { x: number; y: number }; enemies: { x: number; y: number }[]; kills: number };
          for (const e of g.enemies) {
            e.x = g.player.x + 40;
            e.y = g.player.y;
          }
          return g.kills;
        }),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);
  await page.mouse.up();
  expect(await page.evaluate(() => window.__g.state)).toMatch(/play|perk|intro/);
  expect(errors).toEqual([]);
});

test('the daily run is the same for everyone on the same day', async ({ browser }) => {
  const run = async () => {
    const page = await browser.newPage();
    const errors = await boot(page);
    const r = await page.evaluate((seen) => {
      const g = window.__g;
      g.god = true;
      g.progress.seen = seen;
      g.startArcade('daily');
      let h = 0;
      for (const t of g.map.tiles) h = (h * 31 + t) | 0;
      return { seed: g.arcadeSeed, tiles: h, waves: JSON.stringify(g.level.waves), mode: g.mode, wave: g.arcadeWave };
    }, ALL_SEEN);
    // clear the first wave to get the first patch offer
    await page.evaluate(() => {
      window.__g.queue = [];
      window.__g.enemies = [];
    });
    // on failure, the message shows state/phase/queue/enemies instead of just the state
    const progress = () =>
      page.evaluate(() => {
        const g = window.__g as unknown as { state: string; phase: string; queue: unknown[]; enemies: unknown[] };
        return g.state === 'perk' ? 'perk' : `${g.state}/${g.phase}/${g.queue.length}/${g.enemies.length}`;
      });
    await expect.poll(progress, { timeout: 30_000 }).toBe('perk');
    const perks = await page.evaluate(() => window.__g.perkChoices.map((p) => p.id).join(','));
    expect(errors).toEqual([]);
    await page.close();
    return { ...r, perks };
  };
  const a = await run();
  const b = await run();
  expect(a.mode).toBe('daily');
  expect(a.wave).toBe(1);
  expect(b).toEqual(a);
});

test('endless mode stays locked until the story is finished', async ({ page }) => {
  await boot(page);
  await tap(page, 'Enter');
  // pick the endless entry directly: at low frame rates, quick arrow presses can share a frame
  await page.evaluate(() => {
    (window.__g as unknown as { playIdx: number }).playIdx = 4;
  });
  await tap(page, 'Enter');
  expect(await page.evaluate(() => window.__g.state)).toBe('menu');
  await page.evaluate(() => window.__g.progress.beaten.push('pixel'));
  await tap(page, 'Enter');
  await expect.poll(() => page.evaluate(() => window.__g.mode)).toBe('endless');
});

test('shots hit a zombie pressed against the player, with every weapon', async ({ page }) => {
  const errors = await boot(page);
  await page.addScriptTag({ type: 'module', content: "import { spawnEnemy } from '/src/game/enemies.ts'; window.__spawn = spawnEnemy;" });
  await page.waitForFunction(() => '__spawn' in window);
  const damage = await page.evaluate((seen) => {
    type E = { x: number; y: number; hp: number; maxHp: number; spawnT: number; stun: number };
    type P = { x: number; y: number; weapon: string; weapons: string[]; ammo: Record<string, number>; cd: number };
    const g = window.__g as unknown as G & { player: P; bullets: unknown[]; camX: number; camY: number; input: { mx: number; my: number; left: boolean; endFrame(): void }; update(dt: number): void };
    const spawn = (window as unknown as { __spawn: (g: unknown, k: string, x: number, y: number) => E }).__spawn;
    g.god = true;
    g.progress.seen = seen;
    g.newGame('normal');
    g.beginPlay();
    const pl = g.player;
    for (const w of ['smg', 'shotgun', 'rail', 'flame', 'rocket']) {
      pl.weapons.push(w);
      pl.ammo[w] = 999;
    }
    const out: Record<string, number> = {};
    for (const w of ['pistol', 'smg', 'shotgun', 'rail', 'flame', 'rocket']) {
      g.enemies = [];
      g.queue = [];
      g.bullets = [];
      pl.weapon = w;
      pl.cd = 0;
      const e = spawn(g, 'walker', pl.x + 2, pl.y);
      e.spawnT = 0;
      e.hp = e.maxHp = 1000;
      e.stun = 99;
      for (let f = 0; f < 20; f++) {
        g.input.mx = pl.x - g.camX + 60;
        g.input.my = pl.y - 7 - g.camY;
        g.input.left = true;
        g.update(1 / 60);
        g.input.endFrame();
        e.x = pl.x + 2;
        e.y = pl.y;
      }
      g.input.left = false;
      out[w] = 1000 - e.hp;
    }
    return out;
  }, ALL_SEEN);
  for (const [weapon, dealt] of Object.entries(damage)) expect(dealt, weapon).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
