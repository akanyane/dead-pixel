import { pick, rand } from '../core/util';
import { killNearest, pingAll, rmRf } from './combat';
import { glitchPixels, ring } from './fx';
import type { Game } from './game';

export interface Command {
  name: string;
  aliases: string[];
  cost: number;
  help: string;
  run: (g: Game) => string;
}

export const COMMANDS: Command[] = [
  {
    name: 'ping', aliases: ['ping -c 1', 'ping localhost'], cost: 60, help: 'atordoa tudo e limpa os tiros inimigos',
    run: (g) => { pingAll(g); return '64 bytes from zumbi: icmp_seq=1 time=666ms'; },
  },
  {
    name: 'fork', aliases: ['fork()', './fork'], cost: 150, help: 'cria um clone seu que atira por 20s',
    run: (g) => {
      const p = g.player;
      if (g.allies.length >= 4) return 'fork: retry: Resource temporarily unavailable';
      g.allies.push({ x: p.x + rand(-10, 10), y: p.y + rand(-10, 10), life: 20, cd: 0, walk: 0, flip: false, aim: 0 });
      glitchPixels(g, p.x, p.y - 8, 30, 90);
      return `[${g.allies.length}] ${3000 + Math.floor(rand(999))} processo filho criado`;
    },
  },
  {
    name: 'overclock', aliases: ['oc', 'overclock --force'], cost: 180, help: '8s de tiro e movimento acelerados',
    run: (g) => { g.player.overclockT = 8; return 'CPU a 7.2GHz. a garantia acabou.'; },
  },
  {
    name: 'revert', aliases: ['git revert', 'git revert head'], cost: 200, help: 'recupera 50 de HP',
    run: (g) => {
      const p = g.player;
      p.hp = Math.min(p.maxHp, p.hp + 50);
      ring(g, p.x, p.y - 6, 120, 0.4, '#ff5a6a');
      return 'Revert "ser mordido": 1 file changed, 50 insertions(+)';
    },
  },
  {
    name: 'kill', aliases: ['kill -9', 'killall', 'pkill zumbi'], cost: 250, help: 'raio em até 14 alvos próximos',
    run: (g) => { killNearest(g, 14, 240); return 'kill -9 $(pgrep zumbi): processos encerrados'; },
  },
  {
    name: 'sudo', aliases: ['sudo su', 'sudo -i'], cost: 300, help: '6s invencível com dano em dobro',
    run: (g) => { g.player.sudoT = 6; g.glitch = 0.6; return 'root@deadpixel: com grandes poderes...'; },
  },
  {
    name: 'rm', aliases: ['rm -rf', 'rm -rf /', 'rm -rf *', 'rm -rf /*'], cost: 450, help: 'apaga tudo que está na tela',
    run: (g) => { rmRf(g); return 'removed 666 directories, and everyone in them'; },
  },
];

const EASTER: Record<string, string[]> = {
  ls: ['bin/  dev/  home/  zumbis/  pixel_morto.png'],
  pwd: ['/prod/pelo/amor/de/deus'],
  whoami: ['root. o último. boa sorte.'],
  man: ['nenhuma entrada de manual para "sobreviver"'],
  clear: [],
  date: ['sexta-feira, 17:58. para sempre.'],
  uptime: ['17:58 up 666 days, load average: 66.6, 66.6, 66.6'],
  ps: ['PID  TTY  STAT  CMD', '666  ?    Z     [zumbi] <defunct>'],
  top: ['%CPU 100.0  zumbi. todo o resto: morto.'],
  'git blame': ['foi você.'],
  'git status': ['modified: tudo', 'untracked: seus sentimentos'],
  'git push --force': ['você não devia ter feito isso. todos sentiram.'],
  'npm install': ['added 1847 packages, 312 vulnerabilities (299 critical)'],
  'sudo make me a sandwich': ['ok.', '(mas não tem pão: todos morreram)'],
  'make me a sandwich': ['what? make it yourself.'],
  exit: ['não dá para sair de produção.'],
  coffee: ['418 I am a teapot'],
  hello: ['world'],
  'hello world': ['finalmente alguém educado'],
  'cat /dev/urandom': ['§x$!9#~q@&*^%(]{>?'],
  chatgpt: ['modelo indisponível: ele também olhou para o pixel'],
};

export class Terminal {
  open = false;
  line = '';
  lines: { text: string; color: string }[] = [];
  history: string[] = [];
  hIdx = -1;
  cursorT = 0;
  inVim = false;
  justClosed = false;

  constructor(private g: Game) {}

  reset() {
    this.open = false;
    this.line = '';
    this.inVim = false;
    this.lines = [{ text: 'digite "help". TAB completa, seta para cima repete.', color: '#6d8a78' }];
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
    if (this.inVim) {
      if (cmd === ':q' || cmd === ':q!' || cmd === ':wq' || cmd === ':x') {
        this.inVim = false;
        this.print('você escapou do vim. poucos conseguem.', '#ffd23d');
        g.player.ram = Math.min(g.player.maxRam, g.player.ram + 100);
        g.audio.command();
      } else {
        this.print(pick(['E37: No write since last change', 'E492: Not an editor command', 'tente :q!', '-- INSERT --']), '#ff5a6a');
        g.audio.ui(false);
      }
      return;
    }
    if (cmd === 'vim' || cmd === 'vi' || cmd === 'nvim') {
      this.inVim = true;
      this.print('~  ~  ~  VIM: você está preso. boa sorte.', '#ffd23d');
      return;
    }
    if (cmd === 'help' || cmd === '?') {
      for (const c of COMMANDS) this.print(`${c.name.padEnd(10)} ${String(c.cost).padStart(3)}MB  ${c.help}`, '#a8ffc0');
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
        this.print(`bash: ${found.name}: cannot allocate memory (${Math.floor(p.ram)}/${found.cost}MB)`, '#ff5a6a');
        g.audio.ui(false);
        return;
      }
      p.ram -= found.cost;
      this.print(found.run(g), '#a8ffc0');
      g.audio.command();
      g.glitch = Math.max(g.glitch, 0.25);
      this.hide();
      return;
    }
    const egg = EASTER[cmd];
    if (egg) {
      egg.forEach((t) => this.print(t, '#ffd23d'));
      if (cmd === 'git push --force') {
        g.addShake(14);
        g.whiteFlash = 0.6;
      }
      if (cmd === 'sudo make me a sandwich') g.player.hp = Math.min(g.player.maxHp, g.player.hp + 1);
      return;
    }
    this.print(`bash: ${cmd.split(' ')[0]}: command not found`, '#ff5a6a');
    g.audio.ui(false);
  }

  update(_dt: number) {
    this.justClosed = false;
    if (!this.open) return;
    const g = this.g;
    this.cursorT += _dt;
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
