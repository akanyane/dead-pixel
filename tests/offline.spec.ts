import { expect, test } from '@playwright/test';

const PREVIEW = 'http://localhost:5198/';

test('the installed game works offline after the first visit', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(PREVIEW);
  const manifest = await page.evaluate(async () => {
    const r = await fetch('./manifest.webmanifest');
    const m = (await r.json()) as { icons: { src: string }[] };
    return { ok: r.ok, icons: await Promise.all(m.icons.map((i) => fetch(i.src).then((x) => x.ok))) };
  });
  expect(manifest.ok).toBe(true);
  expect(manifest.icons.every(Boolean)).toBe(true);
  // wait until the service worker controls the page, which means the cache is filled
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('DEAD PIXEL');
  const script = await page.evaluate(() => [...document.scripts].some((s) => /assets\/index-.*\.js$/.test(s.src)));
  expect(script).toBe(true);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
