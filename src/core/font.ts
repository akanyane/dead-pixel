// Fonte bitmap 5x7 (com descendentes) desenhada pixel a pixel, para o texto
// continuar nítido na resolução interna de 480x270. Acentos do português são
// compostos a partir da letra base.

const RAW =
  '0000000000|00005F0000|0007000700|147F147F14|242A7F2A12|2313086462|3649562050|0008070300|001C224100|0041221C00|' +
  '2A1C7F1C2A|08083E0808|0080703000|0808080808|0000606000|2010080402|3E5149453E|00427F4000|7249494946|2141494D33|' +
  '1814127F10|2745454539|3C4A494931|4121110907|3649494936|464949291E|0000140000|0040340000|0008142241|1414141414|' +
  '0041221408|0201590906|3E415D594E|7C1211127C|7F49494936|3E41414122|7F4141413E|7F49494941|7F09090901|3E41415173|' +
  '7F0808087F|00417F4100|2040413F01|7F08142241|7F40404040|7F021C027F|7F0408107F|3E4141413E|7F09090906|3E4151215E|' +
  '7F09192946|2649494932|03017F0103|3F4040403F|1F2040201F|3F4038403F|6314081463|0304780403|6159494D43|007F414141|' +
  '0204081020|004141417F|0402010204|4040404040|0003070800|2054547840|7F28444438|3844444428|384444287F|3854545418|' +
  '00087E0902|18A4A49C78|7F08040478|00447D4000|2040403D00|7F10284400|00417F4000|7C04780478|7C08040478|3844444438|' +
  'FC18242418|18242418FC|7C08040408|4854545424|04043F4424|3C4040207C|1C2040201C|3C4030403C|4428102844|4C9090907C|' +
  '4464544C44|0008364100|0000770000|0041360800|0201020402';

const GLYPHS = new Map<string, number[]>();
RAW.split('|').forEach((hex, i) => {
  const cols: number[] = [];
  for (let c = 0; c < 5; c++) cols.push(parseInt(hex.slice(c * 2, c * 2 + 2), 16));
  GLYPHS.set(String.fromCharCode(32 + i), cols);
});

type Px = [number, number];
const MARKS: Record<string, (r0: number, r1: number) => Px[]> = {
  '́': (a, b) => [[3, a], [2, b]],
  '̀': (a, b) => [[1, a], [2, b]],
  '̂': (a, b) => [[2, a], [1, b], [3, b]],
  '̃': (a, b) => [[1, b], [2, a], [3, b], [4, a]],
};

const glyphCache = new Map<string, Px[]>();

function glyphPixels(ch: string): Px[] {
  const cached = glyphCache.get(ch);
  if (cached) return cached;
  const nfd = ch.normalize('NFD');
  const base = nfd[0];
  const mark = nfd[1];
  const cols = GLYPHS.get(base) ?? GLYPHS.get('?')!;
  const px: Px[] = [];
  const dotless = base === 'i' && !!mark && mark !== '̧';
  cols.forEach((col, x) => {
    for (let y = 0; y < 8; y++) {
      if (col & (1 << y)) {
        if (dotless && y === 0) continue;
        px.push([x, y]);
      }
    }
  });
  if (mark === '̧') {
    px.push([2, 7], [1, 8]);
  } else if (mark && MARKS[mark]) {
    const upper = base >= 'A' && base <= 'Z';
    px.push(...MARKS[mark](upper ? -2 : 0, upper ? -1 : 1));
  }
  glyphCache.set(ch, px);
  return px;
}

export interface TextOpts {
  scale?: number;
  align?: 'left' | 'center' | 'right';
  shadow?: string;
  alpha?: number;
}

export const textWidth = (s: string, scale = 1) => s.length * 6 * scale;

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, o: TextOpts = {}) {
  const scale = o.scale ?? 1;
  const width = textWidth(s, scale);
  let sx = Math.round(x);
  if (o.align === 'center') sx = Math.round(x - width / 2);
  else if (o.align === 'right') sx = Math.round(x - width);
  const sy = Math.round(y);
  const prevAlpha = ctx.globalAlpha;
  if (o.alpha !== undefined) ctx.globalAlpha = prevAlpha * o.alpha;
  const pass = (ox: number, oy: number, col: string) => {
    ctx.fillStyle = col;
    let cx = sx + ox;
    for (const ch of s) {
      if (ch !== ' ') for (const [gx, gy] of glyphPixels(ch)) ctx.fillRect(cx + gx * scale, sy + oy + gy * scale, scale, scale);
      cx += 6 * scale;
    }
  };
  if (o.shadow) pass(scale, scale, o.shadow);
  pass(0, 0, color);
  ctx.globalAlpha = prevAlpha;
}

/** Quebra uma string em linhas para caber em `max` caracteres. */
export function wrap(s: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    if ((line + ' ' + word).trim().length > max) {
      out.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) out.push(line);
  return out;
}
