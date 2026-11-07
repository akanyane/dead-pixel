import { rand } from '../core/util';
import { killNearest, pingAll, rmRf } from './combat';
import { glitchPixels, ring } from './fx';
import type { Game } from './game';
import { T } from './i18n';

export interface Command {
  name: string;
  aliases: string[];
  cost: number;
  run: (g: Game) => string;
}

// Os comandos são os mesmos em todos os idiomas; só a ajuda e as respostas mudam.
export const COMMANDS: Command[] = [
  {
    name: 'ping', aliases: ['ping -c 1', 'ping localhost'], cost: 60,
    run: (g) => { pingAll(g); return T().term.outputs.ping; },
  },
  {
    name: 'fork', aliases: ['fork()', './fork'], cost: 150,
    run: (g) => {
      const p = g.player;
      if (g.allies.length >= 4) return T().term.forkLimit;
      g.allies.push({ x: p.x + rand(-10, 10), y: p.y + rand(-10, 10), life: 20, cd: 0, walk: 0, flip: false, aim: 0 });
      glitchPixels(g, p.x, p.y - 8, 30, 90);
      if (g.allies.length >= 4) g.unlock('fork_4');
      return T().term.forkOk(g.allies.length, 3000 + Math.floor(rand(999)));
    },
  },
  {
    name: 'overclock', aliases: ['oc', 'overclock --force'], cost: 180,
    run: (g) => { g.player.overclockT = 8; return T().term.outputs.overclock; },
  },
  {
    name: 'revert', aliases: ['git revert', 'git revert head'], cost: 200,
    run: (g) => {
      const p = g.player;
      p.hp = Math.min(p.maxHp, p.hp + 50);
      ring(g, p.x, p.y - 6, 120, 0.4, '#ff5a6a');
      return T().term.outputs.revert;
    },
  },
  {
    name: 'kill', aliases: ['kill -9', 'killall', 'pkill zumbi', 'pkill zombie', 'pkill zombi'], cost: 250,
    run: (g) => { killNearest(g, 14, 240); return T().term.outputs.kill; },
  },
  {
    name: 'sudo', aliases: ['sudo su', 'sudo -i'], cost: 300,
    run: (g) => { g.player.sudoT = 6; g.glitch = 0.6; return T().term.outputs.sudo; },
  },
  {
    name: 'rm', aliases: ['rm -rf', 'rm -rf /', 'rm -rf *', 'rm -rf /*'], cost: 450,
    run: (g) => { rmRf(g); return T().term.outputs.rm; },
  },
];

export class Terminal {
  open = false;
  line = '';
  lines: { text: string; color: string }[] = [];
  history: string[] = [];
  hIdx = -1;
  cursorT = 0;
  justClosed = false;

  constructor(private g: Game) {}

  reset() {
    this.open = false;
    this.line = '';
    this.lines = [{ text: T().term.hello, color: '#6d8a78' }];
    this.g.audio.setMuffled(false);
  }

  show() {
    this.open = true;
    this.line = '';
    this.hIdx = -1;
    this.g.audio.setMuffled(true);
    this.g.audio.ui();
  }

  hide() {
    this.open = false;
    this.justClosed = true;
    this.g.audio.setMuffled(false);
  }

  private print(text: string, color = '#a8ffc0') {
    this.lines.push({ text, color });
    if (this.lines.length > 7) this.lines.shift();
  }

  matches(): Command[] {
    const l = this.line.trim().toLowerCase();
    if (!l) return COMMANDS;
    return COMMANDS.filter((c) => c.name.startsWith(l) || c.aliases.some((a) => a.startsWith(l)));
  }

  private exec(raw: string) {
    const g = this.g;
    const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    this.print(`# ${raw}`, '#ffffff');
    if (!cmd) {
      this.hide();
      return;
    }
    if (this.history[this.history.length - 1] !== raw) this.history.push(raw);
    if (cmd === 'help' || cmd === '?') {
      for (const c of COMMANDS) this.print(`${c.name.padEnd(10)} ${String(c.cost).padStart(3)}MB  ${T().commands[c.name].help}`, '#a8ffc0');
      return;
    }
    if (cmd === 'clear') {
      this.lines = [];
      return;
    }
    const found = COMMANDS.find((c) => c.name === cmd || c.aliases.includes(cmd));
    if (found) {
      const p = g.player;
      if (p.ram < found.cost) {
        this.print(T().term.noMemory(found.name, Math.floor(p.ram), found.cost), '#ff5a6a');
        g.audio.ui(false);
        return;
      }
      p.ram -= found.cost;
      g.usedCommand = true;
      this.print(found.run(g), '#a8ffc0');
      g.audio.command();
      g.glitch = Math.max(g.glitch, 0.25);
      this.hide();
      return;
    }
    const lore = T().term.lore[cmd];
    if (lore) {
      lore.forEach((t) => this.print(t, '#ffd23d'));
      if (!g.progress.lore.includes(cmd)) g.progress.lore.push(cmd);
      if (cmd === 'cat noa.img') g.unlock('cat_noa');
      g.checkAchievements();
      return;
    }
    this.print(T().term.notFound(cmd.split(' ')[0]), '#ff5a6a');
    g.audio.ui(false);
  }

  update(dt: number) {
    this.justClosed = false;
    if (!this.open) return;
    const g = this.g;
    this.cursorT += dt;
    for (const k of g.input.typed) {
      if (k === 'Escape') {
        this.hide();
        return;
      } else if (k === 'Enter') {
        const raw = this.line;
        this.line = '';
        this.hIdx = -1;
        this.exec(raw);
        if (!this.open) return;
      } else if (k === 'Backspace') {
        this.line = this.line.slice(0, -1);
        g.audio.key();
      } else if (k === 'Tab') {
        const m = this.matches();
        if (m.length >= 1 && this.line.trim()) {
          this.line = m[0].name;
          g.audio.key();
        }
      } else if (k === 'ArrowUp') {
        if (this.history.length) {
          this.hIdx = this.hIdx < 0 ? this.history.length - 1 : Math.max(0, this.hIdx - 1);
          this.line = this.history[this.hIdx];
          g.audio.key();
        }
      } else if (k === 'ArrowDown') {
        if (this.hIdx >= 0) {
          this.hIdx = Math.min(this.history.length, this.hIdx + 1);
          this.line = this.history[this.hIdx] ?? '';
          if (this.hIdx >= this.history.length) this.hIdx = -1;
        }
      } else if (k.length === 1 && this.line.length < 40) {
        this.line += k;
        g.audio.key();
      }
    }
  }
}
