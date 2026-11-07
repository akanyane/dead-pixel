import { H, W } from './util';

/** Teclado e mouse. O terminal do jogo consome `typed` em vez das teclas de movimento. */
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

  constructor(private el: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.gesture();
      if (!e.repeat) this.pressed.add(e.code);
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
    });
    window.addEventListener('mousemove', (e) => this.track(e));
    window.addEventListener('mousedown', (e) => {
      this.gesture();
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
  }

  private gesture() {
    if (this.onFirstGesture) {
      this.onFirstGesture();
      this.onFirstGesture = null;
    }
  }

  private track(e: MouseEvent) {
    const r = this.el.getBoundingClientRect();
    this.mx = ((e.clientX - r.left) / r.width) * W;
    this.my = ((e.clientY - r.top) / r.height) * H;
  }

  held(...codes: string[]) {
    return codes.some((c) => this.down.has(c));
  }

  hit(...codes: string[]) {
    return codes.some((c) => this.pressed.has(c));
  }

  /** Chamado ao fim de cada frame. */
  endFrame() {
    this.pressed.clear();
    this.typed.length = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.wheel = 0;
  }
}
