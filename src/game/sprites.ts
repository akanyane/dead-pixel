import { makeCanvas } from '../core/util';

export interface Sprite {
  c: HTMLCanvasElement;
  flash: HTMLCanvasElement;
  w: number;
  h: number;
}

type Pal = Record<string, string>;

export function sprite(rows: string[], pal: Pal): Sprite {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const [c, ctx] = makeCanvas(w, h);
  const [f, fctx] = makeCanvas(w, h);
  fctx.fillStyle = '#fff';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
      fctx.fillRect(x, y, 1, 1);
    }
  });
  return { c, flash: f, w, h };
}

/** Desenha ancorado no centro dos pés. */
export function drawSprite(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, flip = false, flash = false, scale = 1) {
  const img = flash ? s.flash : s.c;
  const dw = s.w * scale;
  const dh = s.h * scale;
  const px = Math.round(x);
  const py = Math.round(y);
  if (flip) {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -Math.floor(dw / 2), -dh, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, px - Math.floor(dw / 2), py - dh, dw, dh);
  }
}

// ---------- Humanos ----------

const SKIN_Z: Pal = { F: '#7fa66a', f: '#5b7d4c', e: '#ff2a2a', m: '#2a0a0a', r: '#a3101a', R: '#6d0a12', '#': '#1a1016' };

const ZOMBIE_HEAD = ['...HHHH....', '..HHHHHH...', '..HFFFFFF..', '..HFeFFeF..', '..FFFFmmF..', '...FFFFr...'];
const ZOMBIE_BODY_A = ['..TTTTTTFFF', '..TTLTTTr..', '..TTLTTTFFF', '..TTTTTT...'];
const ZOMBIE_BODY_B = ['..TTTTTT...', '..TTLTTTFFF', '..TTLTTT...', '..TTTTTTFFF'];
const ZOMBIE_WOUND_A = ['..TrTTTTFFF', '..TTLrrrR..', '..TTLTTrr..', '..TrTTTTr..'];
const ZOMBIE_WOUND_B = ['..TTTrTT...', '..TTLTTrFFF', '..TrLrrrR..', '..TTTTTTr..'];
const LEGS_A = ['...BB.BB...', '...BB.BB...', '...BB..BB..', '...KK..KK..'];
const LEGS_B = ['...BB.BB...', '...BB.BB...', '..BB..BB...', '..KK..KK...'];

export interface WalkSet {
  walk: Sprite[];
  wound: Sprite[];
}

function zombie(colors: Pal): WalkSet {
  const pal = { ...SKIN_Z, ...colors };
  return {
    walk: [
      sprite([...ZOMBIE_HEAD, ...ZOMBIE_BODY_A, ...LEGS_A], pal),
      sprite([...ZOMBIE_HEAD, ...ZOMBIE_BODY_B, ...LEGS_B], pal),
    ],
    wound: [
      sprite([...ZOMBIE_HEAD.slice(0, 5), '...rFFrR...', ...ZOMBIE_WOUND_A, ...LEGS_A], pal),
      sprite([...ZOMBIE_HEAD.slice(0, 5), '...rFFrR...', ...ZOMBIE_WOUND_B, ...LEGS_B], pal),
    ],
  };
}

export const SPR = {} as {
  player: Sprite[];
  playerGold: Sprite[];
  ally: Sprite[];
  zombies: WalkSet[];
  runner: Sprite[];
  bug: Sprite[];
  leak: Sprite[];
  leakSmall: Sprite[];
  stack: Sprite[];
  nullp: Sprite[];
  segfault: Sprite[];
  recruiter: Sprite[];
  scrum: Sprite[];
  ups: Sprite;
  guns: Record<string, Sprite>;
  gibHead: Sprite[];
  gibArm: Sprite;
  gibLeg: Sprite;
  gibRib: Sprite;
  gibGut: Sprite;
  gibEye: Sprite;
  gibKey: Sprite[];
  gibChip: Sprite;
  gibSlime: Sprite;
  gibLeg6: Sprite;
  pickHp: Sprite;
  pickAmmo: Sprite;
  pickRam: Sprite;
  crate: Sprite;
};

export function buildSprites() {
  const P: Pal = { H: '#14505c', h: '#0e3840', S: '#e0b48c', C: '#39ffe5', T: '#17202c', t: '#232f40', L: '#a8ff3e', B: '#27324a', K: '#0a0a12', W: '#a8ff3e' };
  const PG: Pal = { ...P, H: '#d7a520', T: '#8a6410', t: '#a87a12', L: '#fff29a', W: '#fff29a', C: '#ffffff' };
  const PA: Pal = { ...P, H: '#264f8f', T: '#17305c', S: '#7fd4ff', C: '#ffffff', L: '#7fd4ff', W: '#7fd4ff' };
  const head = ['...HHHHH...', '..HHHHHHH..', '..HHSSSSS..', '..HHCCSCC..', '..HHSSSSS..', '...HSSSS...'];
  const torso = ['..TTTTTTT..', '.TTTWTWTTT.', '.TT.TTT.TT.', '.SS.TLT.SS.', '....TTT....'];
  const legsIdle = ['...BB.BB...', '...BB.BB...', '...KK.KK...'];
  const legsA = ['...BB.BB...', '..BB...BB..', '..KK...KK..'];
  const legsB = ['...BBBB....', '...BBBB....', '...KKKK....'];
  const mk = (pal: Pal) => [
    sprite([...head, ...torso, ...legsIdle], pal),
    sprite([...head, ...torso, ...legsA], pal),
    sprite([...head, ...torso, ...legsB], pal),
  ];
  SPR.player = mk(P);
  SPR.playerGold = mk(PG);
  SPR.ally = mk(PA);

  SPR.zombies = [
    zombie({ H: '#2a1d14', T: '#4f5d75', L: '#39415a', B: '#2b3248', K: '#111' }), // moletom
    zombie({ H: '#6b3a12', T: '#c9ccd3', L: '#a3101a', B: '#23232c', K: '#111' }), // camisa + gravata
    zombie({ H: '#111118', T: '#6b2d5c', L: '#2ec4b6', B: '#3a3a44', K: '#ddd' }), // camiseta de evento
    zombie({ H: '#b0a07a', T: '#2f6d55', L: '#f1c40f', B: '#1f2933', K: '#111' }), // crachá
  ];

  const R: Pal = { G: '#c2d4c4', g: '#8ca092', e: '#ff2a2a', m: '#200', r: '#b3101a', T: '#101826', C: '#ff2bd6', c: '#2bfff2', K: '#000' };
  SPR.runner = [
    sprite(['.......GGG.', '......GGGeC', 'C.....GGGmc', '.TTTTTTGg..', 'cTTrTTT.GGG', '..TTTT.....', '..TT.TT....', '.TT...TT...', '.KK....KK..'], R),
    sprite(['.......GGG.', '......GGGeC', '.c....GGGmc', '.TTTTTTGGG.', 'CTTrTTTg...', '..TTTT.....', '...TTT.....', '...TTT.....', '...KKK.....'], R),
  ];

  const B: Pal = { g: '#59ff3a', G: '#1f8a15', k: '#0e2a0a', r: '#ff2a2a' };
  SPR.bug = [
    sprite(['k..kk..k', '.kGggGk.', 'kGgggggr', '.GgggGgr', 'k.GGGG.k', '.k....k.'], B),
    sprite(['.k.kk.k.', 'k.GggG.k', '.Ggggggr', 'kGgggGgr', '..GGGG..', 'k......k'], B),
  ];

  const L: Pal = { p: '#a855f7', P: '#6d28d9', d: '#3b1275', w: '#f3e8ff', e: '#fff' };
  SPR.leak = [
    sprite(['.....ppppp.....', '...pppppppp....', '..pppwppppwpp..', '.pppwdpppwdppp.', '.ppppppppppppp.', 'pppppddddpppppp', 'PPPPPPPPPPPPPPP', 'PP.PPP.PPPP.PPP', 'd...P...PP...Pd'], L),
    sprite(['...............', '....ppppppp....', '..pppwppppwppp.', '.pppwdpppwdpppp', 'pppppppppppppp.', 'pppppddddpppppp', 'PPPPPPPPPPPPPPP', 'PPP.PPPP.PP.PPP', '.P...P....P..d.'], L),
  ];
  SPR.leakSmall = [
    sprite(['..pppp..', '.pwpwpp.', 'ppdpdppp', 'pppppppp', 'PPPPPPPP', 'P.PP.P.P'], L),
    sprite(['........', '.pppppp.', 'pwpwpppp', 'pdpdpppp', 'PPPPPPPP', 'PP.P.PP.'], L),
  ];

  const S: Pal = { A: '#3a4a63', a: '#57708f', b: '#212c3d', x: '#ffae00', X: '#ff5a00', g: '#a8ff3e', F: '#7fa66a', e: '#ff2a2a', K: '#111', r: '#a3101a' };
  const stackTop = [
    '.....FFFFFF.....', '....FeFFFFeF....', '....FFrrrrFF....', '.....FFFFFF.....',
    '..aaaaaaaaaaaa..', '..AxxAAAAAAAAb..', '..AAAAgAgAgAAb..', '..AAAAAAAAAAAb..', '..bbbbbbbbbbbb..',
    '.aaaaaaaaaaaaaa.', '.AXXAAAAAAAAAAb.', '.AAAAAgAgAgAAAb.', '.AAAAAAAAAAAAAb.', '.bbbbbbbbbbbbbb.',
    'aaaaaaaaaaaaaaaa', 'ArrAAAAAAAAAAAAb', 'AAAAAAAgAgAgAAAb', 'AAAAAAAAAAAAAAAb', 'bbbbbbbbbbbbbbbb',
  ];
  SPR.stack = [
    sprite([...stackTop, '..KKK......KKK..', '..KKK......KKK..'], S),
    sprite([...stackTop, '...KKK....KKK...', '....KK....KK....'], S),
  ];

  const N: Pal = { c: '#2bfff2', C: '#127f7c', w: '#ffffff', k: '#001014' };
  SPR.nullp = [
    sprite(['...cc.cc...', '.c.......c.', '.c.kk.kk.c.', 'c..kw.kw..c', 'c.........c', '.c.c.c.c.c.', 'c.........c', 'c.C.....C.c', '.c...c...c.', 'c..C...C..c', '.c.c.c.c.c.', '..c..c..c..'], N),
    sprite(['...c.c.c...', '.c.......c.', 'c..kk.kk..c', '.c.kw.kw.c.', 'c.........c', 'c..c.c.c..c', '.c.......c.', 'c..C...C..c', 'c....c....c', '.c.C...C.c.', '..c.c.c.c..', 'c...c...c.c'], N),
  ];

  const X: Pal = { F: '#8fa84f', f: '#6d7f38', e: '#ffec3d', m: '#200', R: '#d81e2c', r: '#ff5a3c', y: '#ffec3d', K: '#111', B: '#333', w: '#fff' };
  const segHead = ['....FFFF.....', '...FFFFFF....', '...FeFFeF....', '...FFmmFF....'];
  SPR.segfault = [
    sprite([...segHead, '..RRRRRRRR...', '.RRrrRRrrRR..', 'FRRryyyyrRRFF', 'FRRRyRRyRRRF.', '.RRrryyrrRR..', '..RRRRRRRR...', '...BB..BB....', '...KK..KK....'], X),
    sprite([...segHead, '..RRRRRRRR...', '.RRRrrrrRRR..', 'FRRrwwwwrRRF.', 'FRRrwyywrRRFF', '.RRrrwwrrRR..', '..RRRRRRRR...', '..BB....BB...', '..KK....KK...'], X),
  ];

  const Q: Pal = { H: '#e8c070', F: '#a4b88a', e: '#ff2a2a', m: '#200', T: '#1f2d4d', W: '#e8e8f0', L: '#2678b2', p: '#0a66c2', B: '#1f2d4d', K: '#000', r: '#a3101a' };
  const qHead = ['...HHHHH...', '..HHHHHHH..', '..HFFFFFF..', '..HFeFFeF..', '..FFFmmFF..', '...FFFFr...'];
  SPR.recruiter = [
    sprite([...qHead, '..TTWWTTTpp', '..TTWLTTFpp', '..TTTLTT...', '..TTTTTT...', '...BB.BB...', '...BB.BB...', '...BB..BB..', '...KK..KK..'], Q),
    sprite([...qHead, '..TTWWTT.pp', '..TTWLTTFpp', '..TTTLTT...', '..TTTTTT...', '...BB.BB...', '...BB.BB...', '..BB..BB...', '..KK..KK...'], Q),
  ];

  const M: Pal = { ...SKIN_Z, H: '#3a3a3a', T: '#1b1f2e', L: '#ffe14d', B: '#14172a', K: '#050505', y: '#ffe14d', z: '#ff8ad1', x: '#6fe3ff' };
  SPR.scrum = [
    sprite([...ZOMBIE_HEAD, '..yyTzTTFFF', '..TxLTyTr..', '..zTLyTTFFF', '..TyTTxz...', ...LEGS_A], M),
    sprite([...ZOMBIE_HEAD, '..yyTzTT...', '..TxLTyTFFF', '..zTLyTT...', '..TyTTxzFFF', ...LEGS_B], M),
  ];

  SPR.ups = sprite(['.kkkkkkkk.', 'kyyyyyyyyk', 'kyddddddyk', 'kyddrrddyk', 'kydrrrrdyk', 'kyddrrddyk', 'kyddddddyk', 'kyyyyyyyyk', 'kyyyyyyyyk', 'kbbbbbbbbk', '.kkkkkkkk.'], { k: '#111', y: '#e9a800', d: '#222', r: '#ff2a2a', b: '#7a5600' });

  const GP: Pal = { k: '#1a1d26', g: '#5c6578', w: '#c8d0dc', c: '#39ffe5', o: '#ff7a1a', r: '#ff2a2a', y: '#ffd23d', l: '#a8ff3e' };
  SPR.guns = {
    pistol: sprite(['.wwwwwwc', '.ggggggk', '.kkk....', '.kk.....'], GP),
    smg: sprite(['.wwwwwwwwwc', 'kggggggggkk', 'kkkk.kk....', '.kk..kk....'], GP),
    shotgun: sprite(['.wwwwwwwwwwwwc', 'kkggggggggggkk', 'kkkkk..kkkk...', 'kk............'], GP),
    rail: sprite(['..lwwwwwwwwwwwwc', 'kkggggcgcgcggggk', 'kkkkkkk.kk......', '.kk.............'], GP),
    flame: sprite(['..ggggggggoor', 'kkokokokggkko', 'kkooooookk...', '.kk..........'], GP),
    rocket: sprite(['kkkggggggggggyy', 'kkkgrrgggggggyy', 'kkkggggggggggyy', '...kk..kk......'], GP),
  };

  const G: Pal = { F: '#7fa66a', f: '#5b7d4c', e: '#ff2a2a', w: '#f4efe6', r: '#a3101a', R: '#6d0a12', p: '#d65f6f', H: '#2a1d14', y: '#d9c9a3', k: '#20242e', K: '#d7dbe6', g: '#55606f', c: '#2bfff2', s: '#a855f7', S: '#6d28d9', l: '#59ff3a' };
  SPR.gibHead = [
    sprite(['.HHHH.', 'HFFFFF', 'FeFFeF', 'FFrrFF', '.rRRr.'], G),
    sprite(['.FFFF.', 'FeFFrw', 'FFFrrw', 'rFrrRr', '.rRRr.'], G),
    sprite(['.wwww.', 'wrwwrw', 'wwwwww', '.wrwr.', '.rRr..'], G),
  ];
  SPR.gibArm = sprite(['FFFFrr', 'FfFFRw'], G);
  SPR.gibLeg = sprite(['kkrw', 'kkkr', 'kkrr', 'gg..'], G);
  SPR.gibRib = sprite(['w.w.w', 'wwwww', 'r.r.r'], G);
  SPR.gibGut = sprite(['.pp.', 'prrp', 'pRrp', 'Rp..'], G);
  SPR.gibEye = sprite(['ww', 'we'], G);
  SPR.gibKey = [
    sprite(['KKKK', 'KkkK', 'gggg'], G),
    sprite(['kkkk', 'kKKk', 'gggg'], G),
    sprite(['ccc', 'gcg'], G),
  ];
  SPR.gibChip = sprite(['g.g.g', 'kkkkk', 'kckck', 'kkkkk', 'g.g.g'], G);
  SPR.gibSlime = sprite(['.ss.', 'sssS', 'SsSS'], G);
  SPR.gibLeg6 = sprite(['l.l', '.l.', 'l.l'], G);

  SPR.pickHp = sprite(['.wwwwwww.', 'wwwwrwwww', 'wwwwrwwww', 'wwrrrrrww', 'wwwwrwwww', 'wwwwrwwww', '.wwwwwww.'], { w: '#eaf6ff', r: '#ff2a3c' });
  SPR.pickAmmo = sprite(['.yy.yy.yy', '.yy.yy.yy', '.oo.oo.oo', '.oo.oo.oo', 'kkkkkkkkk', 'kgggggggk', 'kkkkkkkkk'], { y: '#ffd23d', o: '#c8861a', k: '#2b2f3a', g: '#5c6578' });
  SPR.pickRam = sprite(['ggggggggggg', 'gkkgkkgkkgg', 'gkkgkkgkkgg', 'ggggggggggg', 'y.y.y.y.y.y'], { g: '#117a3b', k: '#0a0f14', y: '#ffd23d' });
  SPR.crate = sprite(['bbbbbbbbbbbbbbbb', 'bcccccccccccccb.', 'bcRRRRRRRRRRRcb.', 'bcRwwwRwwRwwRcb.', 'bcRwRwRwRwRwRcb.', 'bcRwRwRwRwRwRcb.', 'bcRRRRRRRRRRRcb.', 'bcccccccccccccb.', 'bddddddddddddddb', 'bddddddddddddddb', 'bbbbbbbbbbbbbbbb'], { b: '#3f2a14', c: '#8a5a2b', d: '#6b4420', R: '#cc3534', w: '#fff' });
}
