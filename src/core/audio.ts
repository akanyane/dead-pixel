// All game sound is synthesized: there are no audio files.

interface Track {
  bpm: number;
  root: number;
  /** Progression in semitones relative to the root, one degree per bar. */
  prog: number[];
  bass: number[];
  arp: number[];
  kick: number[];
  snare: number[];
  hat: number[];
  lead?: number[];
}

const K4 = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const KG = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
const SN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
const SH = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const HT = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1];
const GAL = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];
const STR = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const SYN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0];

export const TRACKS: Record<string, Track> = {
  menu: { bpm: 84, root: 38, prog: [0, 0, -4, -2], bass: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], arp: [0, 3, 7, 12, 7, 3, 0, 3, 7, 10, 7, 3, 0, 3, 7, 3], kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: SH, hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
  l1: { bpm: 118, root: 40, prog: [0, -4, -7, -2], bass: GAL, arp: [0, 7, 12, 7, 3, 7, 12, 15, 0, 7, 12, 7, 3, 7, 10, 7], kick: K4, snare: SN, hat: HT },
  l2: { bpm: 128, root: 37, prog: [0, 0, 3, -2], bass: STR, arp: [12, 0, 7, 0, 15, 0, 7, 0, 12, 0, 10, 0, 7, 0, 3, 0], kick: K4, snare: SN, hat: HT },
  l3: { bpm: 104, root: 35, prog: [0, 1, 0, -2], bass: SYN, arp: [0, 1, 7, 1, 0, 1, 8, 7, 0, 1, 7, 1, 0, 13, 12, 8], kick: KG, snare: SH, hat: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1] },
  l4: { bpm: 146, root: 38, prog: [0, -2, -4, -5], bass: STR, arp: [0, 12, 3, 12, 7, 12, 3, 12, 0, 12, 3, 12, 10, 12, 7, 3], kick: KG, snare: SN, hat: STR },
  l5: { bpm: 166, root: 36, prog: [0, 1, -1, 6], bass: STR, arp: [0, 6, 12, 18, 12, 6, 13, 7, 0, 6, 12, 18, 24, 18, 13, 7], kick: KG, snare: SN, hat: STR, lead: [24, 0, 0, 25, 0, 0, 22, 0, 0, 19, 0, 0, 18, 0, 19, 0] },
  boss: { bpm: 158, root: 39, prog: [0, 1, -2, -1], bass: STR, arp: [0, 3, 7, 12, 15, 12, 7, 3, 0, 3, 8, 12, 15, 12, 8, 3], kick: KG, snare: SN, hat: STR, lead: [12, 0, 15, 0, 13, 0, 0, 12, 0, 10, 0, 8, 0, 7, 0, 0] },
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private noiseBuf!: AudioBuffer;
  private last = new Map<string, number>();
  private track: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private timer = 0;
  muted = false;
  /** Volumes from 0 to 1, set in the options. Music at 0 also stops the sequencer. */
  musicVol = 0.7;
  sfxVol = 1;

  get musicOn() {
    return this.musicVol > 0;
  }

  setVolumes(music: number, sfx: number) {
    this.musicVol = music;
    this.sfxVol = sfx;
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(0.47 * music, this.ctx.currentTime, 0.03);
    this.sfx.gain.setTargetAtTime(0.9 * sfx, this.ctx.currentTime, 0.03);
  }

  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9 * this.sfxVol;
    this.sfx.connect(this.master);
    this.music = ctx.createGain();
    this.music.gain.value = 0.47 * this.musicVol;
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 18000;
    this.music.connect(this.musicFilter).connect(this.master);
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.timer = window.setInterval(() => this.schedule(), 40);
    void ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  /** Muffles the music during terminal bullet time. */
  setMuffled(on: boolean) {
    if (this.ctx) this.musicFilter.frequency.setTargetAtTime(on ? 420 : 18000, this.ctx.currentTime, 0.08);
  }

  playMusic(id: string | null) {
    const t = id ? TRACKS[id] : null;
    if (t === this.track) return;
    this.track = t;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.1;
  }

  private schedule() {
    if (!this.ctx || !this.track || !this.musicOn || this.ctx.state !== 'running') return;
    const stepDur = 60 / this.track.bpm / 4;
    if (this.nextTime < this.ctx.currentTime - 0.3) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.14) {
      this.playStep(this.track, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private playStep(t: Track, step: number, when: number, dur: number) {
    const s = step % 16;
    const bar = Math.floor(step / 16) % t.prog.length;
    const root = t.root + t.prog[bar];
    if (t.kick[s]) this.drumKick(when);
    if (t.snare[s]) this.drumSnare(when);
    if (t.hat[s]) this.drumHat(when, s % 4 === 2 ? 0.06 : 0.035);
    if (t.bass[s]) {
      this.synth(midi(root), when, dur * 0.85, 'sawtooth', 0.34, 500);
      this.synth(midi(root - 12), when, dur * 0.85, 'square', 0.16, 300);
    }
    const a = t.arp[s];
    if (a !== undefined && (a !== 0 || s % 4 === 0) && step > 16) {
      this.synth(midi(root + 24 + a), when, dur * 0.7, 'square', 0.055, 2200);
    }
    if (t.lead && t.lead[s] && step % 128 >= 32) {
      this.synth(midi(root + 12 + t.lead[s]), when, dur * 2.4, 'sawtooth', 0.09, 3200);
    }
  }

  private synth(freq: number, when: number, dur: number, type: OscillatorType, vol: number, cutoff: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff * 2, when);
    f.frequency.exponentialRampToValueAtTime(cutoff * 0.4, when + dur);
    o.connect(f).connect(g).connect(this.music);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  private drumKick(when: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.75, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
    o.connect(g).connect(this.music);
    o.start(when);
    o.stop(when + 0.18);
  }

  private drumNoise(when: number, dur: number, vol: number, type: BiquadFilterType, freq: number) {
    const ctx = this.ctx!;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    n.connect(f).connect(g).connect(this.music);
    n.start(when, Math.random() * 0.8);
    n.stop(when + dur + 0.02);
  }

  private drumSnare(when: number) {
    this.drumNoise(when, 0.16, 0.42, 'bandpass', 1800);
  }

  private drumHat(when: number, vol: number) {
    this.drumNoise(when, 0.035, vol * 3, 'highpass', 7500);
  }

  // ---- Effects ----

  private throttled(id: string, gapMs: number) {
    if (!this.ctx) return true;
    const now = performance.now();
    if (now - (this.last.get(id) ?? -1e9) < gapMs) return true;
    this.last.set(id, now);
    return false;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, type: BiquadFilterType, freq: number, slideTo?: number, delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f).connect(g).connect(this.sfx);
    n.start(t, Math.random() * 0.8);
    n.stop(t + dur + 0.02);
  }

  shoot(kind: string) {
    if (this.throttled('shoot' + kind, 30)) return;
    switch (kind) {
      case 'pistol':
        this.noise(0.09, 0.5, 'bandpass', 2400, 500);
        this.tone(420, 0.08, 'square', 0.14, 90);
        break;
      case 'smg':
        this.noise(0.06, 0.38, 'bandpass', 3000, 900);
        this.tone(300, 0.05, 'square', 0.1, 90);
        break;
      case 'shotgun':
        this.noise(0.28, 0.95, 'lowpass', 3200, 240);
        this.tone(130, 0.2, 'sawtooth', 0.4, 36);
        this.noise(0.05, 0.2, 'highpass', 4000, undefined, 0.2);
        this.noise(0.05, 0.2, 'highpass', 3000, undefined, 0.3);
        break;
      case 'rail':
        this.tone(2200, 0.35, 'sawtooth', 0.3, 70);
        this.noise(0.4, 0.75, 'bandpass', 5000, 200);
        this.tone(60, 0.35, 'sine', 0.6, 30);
        break;
      case 'flame':
        this.noise(0.14, 0.26, 'lowpass', 1200, 400);
        break;
      case 'rocket':
        this.noise(0.3, 0.5, 'lowpass', 900, 3000);
        this.tone(180, 0.25, 'sawtooth', 0.22, 700);
        break;
      case 'ally':
        this.noise(0.05, 0.14, 'bandpass', 3400, 1200);
        break;
    }
  }

  melee() {
    this.noise(0.14, 0.4, 'bandpass', 900, 3200);
    for (let i = 0; i < 4; i++) this.tone(1400 + Math.random() * 1400, 0.025, 'square', 0.08, undefined, 0.03 + i * 0.025);
  }

  splat() {
    if (this.throttled('splat', 45)) return;
    this.noise(0.13, 0.45, 'lowpass', 900 + Math.random() * 600, 120);
    this.tone(90 + Math.random() * 50, 0.09, 'sine', 0.3, 34);
  }

  hit() {
    if (this.throttled('hit', 40)) return;
    this.noise(0.04, 0.2, 'bandpass', 1500 + Math.random() * 900);
  }

  groan() {
    if (this.throttled('groan', 700)) return;
    const f = 70 + Math.random() * 60;
    this.tone(f, 0.55, 'sawtooth', 0.09, f * 0.6);
    this.tone(f * 1.51, 0.55, 'square', 0.03, f * 0.7);
  }

  explosion(big = false) {
    if (this.throttled('boom', 55)) return;
    this.noise(big ? 1.2 : 0.65, big ? 1.2 : 0.9, 'lowpass', big ? 2600 : 2000, 60);
    this.tone(big ? 100 : 130, big ? 0.9 : 0.5, 'sine', big ? 0.9 : 0.75, 24);
  }

  hurt() {
    if (this.throttled('hurt', 120)) return;
    this.tone(180, 0.22, 'sawtooth', 0.4, 50);
    this.noise(0.18, 0.45, 'bandpass', 700, 200);
  }

  dash() {
    this.noise(0.18, 0.3, 'bandpass', 700, 3500);
  }

  pickup(p = 0) {
    if (this.throttled('pick', 40)) return;
    this.tone(880 + p * 140, 0.07, 'square', 0.1);
    this.tone(1320 + p * 140, 0.09, 'square', 0.08, undefined, 0.06);
  }

  key() {
    this.noise(0.022, 0.2, 'highpass', 3000 + Math.random() * 2000);
    this.tone(180 + Math.random() * 60, 0.018, 'square', 0.05);
  }

  ui(ok = true) {
    this.tone(ok ? 660 : 180, 0.07, 'square', 0.12, ok ? 990 : 110);
  }

  command() {
    [440, 660, 880, 1320].forEach((f, i) => this.tone(f, 0.1, 'square', 0.11, undefined, i * 0.045));
  }

  laser() {
    if (this.throttled('laser', 300)) return;
    this.tone(90, 0.8, 'sawtooth', 0.32, 60);
    this.noise(0.8, 0.3, 'bandpass', 3000, 2000);
  }

  warn() {
    if (this.throttled('warn', 200)) return;
    this.tone(980, 0.14, 'square', 0.13, 760);
    this.tone(980, 0.14, 'square', 0.13, 760, 0.2);
  }

  enemyShot() {
    if (this.throttled('eshot', 70)) return;
    this.tone(760, 0.09, 'square', 0.055, 240);
  }

  announce() {
    [220, 330, 495].forEach((f, i) => this.tone(f, 0.18, 'sawtooth', 0.12, undefined, i * 0.05));
  }

  bossRoar() {
    this.tone(60, 1.3, 'sawtooth', 0.6, 26);
    this.tone(93, 1.3, 'square', 0.22, 38);
    this.noise(1.3, 0.5, 'bandpass', 500, 110);
  }

  glitch() {
    if (this.throttled('glitch', 90)) return;
    for (let i = 0; i < 5; i++) this.tone(200 + Math.random() * 3200, 0.03, 'square', 0.07, undefined, i * 0.03);
  }

  dispose() {
    clearInterval(this.timer);
  }
}
