import { H, W } from './util';

/** Ações de jogo que podem ser remapeadas. Mira, tiro e troca de arma ficam no mouse e nos números. */
export type Action = 'up' | 'down' | 'left' | 'right' | 'dash' | 'melee' | 'terminal' | 'pause';
export const ACTIONS: Action[] = ['up', 'down', 'left', 'right', 'dash', 'melee', 'terminal', 'pause'];

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  dash: ['Space', 'ShiftLeft', 'ShiftRight'],
  melee: ['KeyF'],
  terminal: ['KeyQ', 'Enter'],
  pause: ['Escape', 'KeyP'],
};

/** Botões de controle no layout padrão do navegador (Xbox: A B X Y). */
const PAD_BUTTONS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'Up', 'Down', 'Left', 'Right'] as const;
type PadButton = (typeof PAD_BUTTONS)[number];
const PAD_ACTIONS: Partial<Record<Action, PadButton[]>> = { dash: ['A', 'LT'], melee: ['X'], terminal: ['Y'], pause: ['Start'] };
const DEADZONE = 0.25;

/** Áreas dos botões de toque, em coordenadas da tela de 480x270. */
export const TOUCH_BUTTONS: { id: 'dash' | 'melee' | 'terminal' | 'pause' | 'weapon'; x: number; y: number; r: number }[] = [
  { id: 'dash', x: W - 36, y: H - 50, r: 17 },
  { id: 'melee', x: W - 78, y: H - 34, r: 13 },
  { id: 'weapon', x: W - 30, y: H - 94, r: 12 },
  { id: 'terminal', x: W - 70, y: H - 76, r: 12 },
  { id: 'pause', x: 22, y: 58, r: 10 },
];

interface Stick {
  id: number;
  ox: number;
  oy: number;
  x: number;
  y: number;
}

/** Nome curto de uma tecla, para mostrar na tela de controles. */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5).toUpperCase();
  if (code.startsWith('Numpad')) return 'NUM' + code.slice(6).toUpperCase();
  const names: Record<string, string> = { Space: 'SPACE', ShiftLeft: 'LSHIFT', ShiftRight: 'RSHIFT', ControlLeft: 'LCTRL', ControlRight: 'RCTRL', AltLeft: 'LALT', AltRight: 'RALT', Escape: 'ESC', Enter: 'ENTER', Tab: 'TAB', Backspace: 'BACKSPACE', CapsLock: 'CAPS' };
  return names[code] ?? code.toUpperCase();
}

/**
 * Teclado, mouse, controle e toque. O terminal do jogo consome `typed` em vez das
 * teclas de movimento. Controle e toque viram as mesmas ações do teclado, e nos menus
 * o controle aperta setas, Enter e Esc virtuais para reaproveitar a navegação existente.
 */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  typed: string[] = [];
  mx = W / 2;
  my = H / 2;
  left = false;
  right = false;
  leftPressed = false;
  rightPressed = false;
  wheel = 0;
  onFirstGesture: (() => void) | null = null;
  bindings: Record<Action, string[]> = structuredClone(DEFAULT_BINDINGS);
  /** Última tecla apertada neste frame, usada para remapear. */
  lastCode: string | null = null;

  /** Ligado pelo loop principal quando a tela atual é um menu (ou o terminal está aberto). */
  uiMode = true;

  // controle
  usingPad = false;
  private padDown = new Set<PadButton>();
  private padPressed = new Set<PadButton>();
  padMove = { x: 0, y: 0 };
  padRT = 0;
  private navT = 0;
  private navDir = '';

  // toque
  touchActive = false;
  moveStick: Stick | null = null;
  aimStick: Stick | null = null;
  private touchButtons = new Set<string>();

  /** Direção de mira vinda do controle ou do toque; null quando a mira é o mouse. */
  aimDir: number | null = null;

  constructor(private el: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.gesture();
      this.usingPad = false;
      if (!e.repeat) {
        this.pressed.add(e.code);
        this.lastCode = e.code;
      }
      this.down.add(e.code);
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape') {
        this.typed.push(e.key);
      }
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Quote', 'Slash', 'Backspace'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.left = this.right = false;
      this.moveStick = this.aimStick = null;
    });
    window.addEventListener('mousemove', (e) => {
      if (e.movementX || e.movementY) this.usingPad = false;
      this.aimDir = this.usingPad ? this.aimDir : null;
      this.track(e);
    });
    window.addEventListener('mousedown', (e) => {
      // navegadores de celular simulam mouse depois de um toque: ignore
      if (this.touchActive) return;
      this.gesture();
      this.usingPad = false;
      this.track(e);
      if (e.button === 0) {
        this.left = true;
        this.leftPressed = true;
      }
      if (e.button === 2) {
        this.right = true;
        this.rightPressed = true;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.left = false;
      if (e.button === 2) this.right = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => {
      this.wheel += Math.sign(e.deltaY);
    }, { passive: true });

    el.addEventListener('touchstart', (e) => this.onTouch(e, 'start'), { passive: false });
    el.addEventListener('touchmove', (e) => this.onTouch(e, 'move'), { passive: false });
    el.addEventListener('touchend', (e) => this.onTouch(e, 'end'), { passive: false });
    el.addEventListener('touchcancel', (e) => this.onTouch(e, 'end'), { passive: false });
  }

  private gesture() {
    if (this.onFirstGesture) {
      this.onFirstGesture();
      this.onFirstGesture = null;
    }
  }

  private toScreen(clientX: number, clientY: number) {
    const r = this.el.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }

  private track(e: MouseEvent) {
    const p = this.toScreen(e.clientX, e.clientY);
    this.mx = p.x;
    this.my = p.y;
  }

  private onTouch(e: TouchEvent, kind: 'start' | 'move' | 'end') {
    e.preventDefault();
    this.gesture();
    this.touchActive = true;
    this.usingPad = false;
    for (const t of Array.from(e.changedTouches)) {
      const p = this.toScreen(t.clientX, t.clientY);
      if (this.uiMode) {
        // nos menus, um toque é um clique
        this.mx = p.x;
        this.my = p.y;
        if (kind === 'start') {
          this.left = true;
          this.leftPressed = true;
        } else if (kind === 'end') this.left = false;
        continue;
      }
      if (kind === 'start') {
        const btn = TOUCH_BUTTONS.find((b) => Math.hypot(p.x - b.x, p.y - b.y) < b.r + 4);
        if (btn) {
          if (btn.id === 'weapon') this.wheel += 1;
          else this.touchButtons.add(btn.id);
        } else if (p.x < W / 2 && !this.moveStick) {
          this.moveStick = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y };
        } else if (p.x >= W / 2 && !this.aimStick) {
          this.aimStick = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y };
        }
      } else {
        for (const s of [this.moveStick, this.aimStick]) {
          if (s && s.id === t.identifier) {
            s.x = p.x;
            s.y = p.y;
          }
        }
        if (kind === 'end') {
          if (this.moveStick?.id === t.identifier) this.moveStick = null;
          if (this.aimStick?.id === t.identifier) this.aimStick = null;
        }
      }
    }
    if (this.aimStick) {
      const dx = this.aimStick.x - this.aimStick.ox;
      const dy = this.aimStick.y - this.aimStick.oy;
      if (Math.hypot(dx, dy) > 5) this.aimDir = Math.atan2(dy, dx);
    }
  }

  /** Lê o controle. Chamado uma vez por frame, antes do update do jogo. */
  poll(dt: number) {
    this.padPressed.clear();
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const pad = Array.from(pads).find((p) => p && p.connected);
    if (!pad) {
      this.padMove.x = this.padMove.y = 0;
      this.padRT = 0;
      this.padDown.clear();
      return;
    }
    const now = new Set<PadButton>();
    pad.buttons.forEach((b, i) => {
      const name = PAD_BUTTONS[i];
      if (name && (b.pressed || b.value > 0.4)) now.add(name);
    });
    for (const b of now) if (!this.padDown.has(b)) this.padPressed.add(b);
    this.padDown = now;
    const ax = (i: number) => {
      const v = pad.axes[i] ?? 0;
      return Math.abs(v) < DEADZONE ? 0 : v;
    };
    this.padMove.x = ax(0) || (now.has('Right') ? 1 : 0) - (now.has('Left') ? 1 : 0);
    this.padMove.y = ax(1) || (now.has('Down') ? 1 : 0) - (now.has('Up') ? 1 : 0);
    this.padRT = pad.buttons[7]?.value ?? 0;
    const rx = ax(2);
    const ry = ax(3);
    const used = now.size > 0 || this.padMove.x !== 0 || this.padMove.y !== 0 || rx !== 0 || ry !== 0;
    if (used) {
      this.gesture();
      this.usingPad = true;
    }
    if (rx || ry) this.aimDir = Math.atan2(ry, rx);
    if (!this.uiMode) {
      if (this.padPressed.has('LB')) this.wheel -= 1;
      if (this.padPressed.has('RB')) this.wheel += 1;
    }

    if (this.uiMode && this.usingPad) {
      // menus: direcional e analógico viram setas, com repetição ao segurar
      const dir = this.padMove.y < -0.5 ? 'ArrowUp' : this.padMove.y > 0.5 ? 'ArrowDown' : this.padMove.x < -0.5 ? 'ArrowLeft' : this.padMove.x > 0.5 ? 'ArrowRight' : '';
      if (dir !== this.navDir) {
        this.navDir = dir;
        this.navT = 0.38;
        if (dir) this.virtual(dir);
      } else if (dir) {
        this.navT -= dt;
        if (this.navT <= 0) {
          this.navT = 0.11;
          this.virtual(dir);
        }
      }
      if (this.padPressed.has('A')) this.virtual('Enter');
      if (this.padPressed.has('B')) this.virtual('Escape');
      if (this.padPressed.has('Start')) this.virtual('Escape');
      if (this.padPressed.has('Y')) this.pressed.add('KeyC');
    }
  }

  /** Aperta uma tecla de mentira, vinda do controle. */
  private virtual(code: string) {
    this.pressed.add(code);
    if (code === 'Enter' || code === 'Escape' || code === 'ArrowUp' || code === 'ArrowDown') this.typed.push(code);
  }

  padHit(b: PadButton) {
    return this.padPressed.has(b);
  }

  held(...codes: string[]) {
    return codes.some((c) => this.down.has(c));
  }

  hit(...codes: string[]) {
    return codes.some((c) => this.pressed.has(c));
  }

  actHeld(a: Action) {
    return this.held(...this.bindings[a]) || (PAD_ACTIONS[a]?.some((b) => this.padDown.has(b)) ?? false);
  }

  actHit(a: Action) {
    return this.hit(...this.bindings[a]) || (PAD_ACTIONS[a]?.some((b) => this.padPressed.has(b)) ?? false) || this.touchButtons.has(a);
  }

  /** Vetor de movimento somando teclado, controle e toque, com tamanho no máximo 1. */
  moveVec(): [number, number] {
    let x = (this.actHeld('right') ? 1 : 0) - (this.actHeld('left') ? 1 : 0) + this.padMove.x;
    let y = (this.actHeld('down') ? 1 : 0) - (this.actHeld('up') ? 1 : 0) + this.padMove.y;
    const s = this.moveStick;
    if (s) {
      const dx = s.x - s.ox;
      const dy = s.y - s.oy;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        const k = Math.min(1, d / 26);
        x += (dx / d) * k;
        y += (dy / d) * k;
      }
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return [x, y];
  }

  /** Tiro contínuo: mouse, gatilho do controle ou o analógico de mira na tela de toque. */
  firing() {
    return this.left || this.padRT > 0.3 || this.padDown.has('RT') || this.aimStick !== null;
  }

  /** Troca uma ação para uma tecla nova. A tecla sai de qualquer outra ação que já a usasse. */
  rebind(a: Action, code: string) {
    const previous = this.bindings[a][0];
    for (const other of Object.keys(this.bindings) as Action[]) this.bindings[other] = this.bindings[other].filter((c) => c !== code);
    const used = (c: string) => Object.values(this.bindings).some((l) => l.includes(c));
    const rest = DEFAULT_BINDINGS[a].slice(1).filter((c) => c !== code && !used(c));
    this.bindings[a] = [code, ...rest];
    // nenhuma ação pode ficar sem tecla: quem perdeu a única tecla fica com a antiga desta ação
    for (const other of Object.keys(this.bindings) as Action[]) {
      if (this.bindings[other].length) continue;
      const free = DEFAULT_BINDINGS[other].filter((c) => !used(c));
      this.bindings[other] = free.length ? free : previous && previous !== code ? [previous] : [];
    }
  }

  resetBindings() {
    this.bindings = structuredClone(DEFAULT_BINDINGS);
  }

  /** Chamado ao fim de cada frame. */
  endFrame() {
    this.pressed.clear();
    this.typed.length = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.wheel = 0;
    this.lastCode = null;
    this.touchButtons.clear();
    if (!this.usingPad && !this.aimStick && !this.touchActive) this.aimDir = null;
  }
}
