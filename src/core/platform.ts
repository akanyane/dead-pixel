// Browser integration: fullscreen, orientation, the rotate overlay, offline support
// and the install prompt. Everything here degrades quietly where it is unsupported.

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: InstallPrompt | null = null;

/** True when the page runs as an installed app instead of a browser tab. */
export const isStandalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;

export const isTouchDevice = () => matchMedia('(pointer: coarse)').matches;

/** Portrait on a touch device: the game needs the phone turned sideways. */
export const needsRotation = () => isTouchDevice() && innerHeight > innerWidth;

export const fullscreenSupported = () => !!document.documentElement.requestFullscreen;

export const isFullscreen = () => !!document.fullscreenElement;

/** Enters fullscreen and, where allowed (Android), locks the screen to landscape. */
export async function enterFullscreen() {
  if (!fullscreenSupported() || isFullscreen()) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await orientation.lock?.('landscape').catch(() => undefined);
  } catch {
    /* the browser refused, usually because there was no user gesture */
  }
}

export async function toggleFullscreen() {
  if (isFullscreen()) await document.exitFullscreen().catch(() => undefined);
  else await enterFullscreen();
}

/** Shows or hides the HTML overlay that asks to turn the phone sideways. */
export function updateRotateOverlay(text: string) {
  const el = document.getElementById('rotate');
  if (!el) return;
  const show = needsRotation();
  el.hidden = !show;
  const label = el.querySelector('p');
  if (label && label.textContent !== text) label.textContent = text;
}

/** Registers the service worker that caches the game for offline play (production only). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

/** Keeps the browser's install prompt so the menu can offer it later. */
export function listenForInstall(onChange: () => void) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e as InstallPrompt;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    onChange();
  });
}

export const canInstall = () => installPrompt !== null;

export async function promptInstall() {
  const p = installPrompt;
  if (!p) return;
  installPrompt = null;
  await p.prompt();
  await p.userChoice.catch(() => undefined);
}
