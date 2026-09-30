// Procedural WebAudio only. No audio files. Never required to play; important sounds have captions (strings.json).
export class Audio {
  private ctx: AudioContext | null = null;
  muted = false;
  volume = 0.6;

  /** Browsers require a user gesture before sound; call on first input. */
  unlock(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  private tone(freq: number, ms: number, type: OscillatorType = 'sine', gain = 0.2, glideTo?: number): void {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + ms / 1000);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * this.volume, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + ms / 1000 + 0.02);
  }

  private noise(ms: number, gain = 0.15, cutoffFrom = 4000, cutoffTo = 400): void {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * (ms / 1000));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoffFrom, t0);
    f.frequency.exponentialRampToValueAtTime(cutoffTo, t0 + ms / 1000);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain * this.volume, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t0);
  }

  play(id: string): void {
    switch (id) {
      case 'tick': this.tone(880, 60, 'square', 0.05); break;
      case 'pick': this.tone(660, 90, 'triangle', 0.15); this.tone(990, 120, 'triangle', 0.1); break;
      case 'found': this.tone(523, 80, 'sine', 0.15); this.tone(784, 160, 'sine', 0.15); break;
      case 'lock': this.tone(523, 300, 'sine', 0.12); this.tone(659, 400, 'sine', 0.1); this.tone(784, 600, 'sine', 0.08); break;
      case 'dive': this.noise(1800, 0.2, 6000, 200); this.tone(220, 1600, 'sine', 0.08, 55); break;
      case 'back': this.noise(1400, 0.15, 300, 5000); this.tone(110, 1200, 'sine', 0.08, 330); break;
      case 'door': this.tone(120, 500, 'sawtooth', 0.06, 90); this.noise(300, 0.05); break;
      case 'rattle': this.noise(120, 0.12, 3000, 800); this.tone(180, 100, 'square', 0.05); break;
      case 'purr': for (let i = 0; i < 12; i++) setTimeout(() => this.tone(70, 60, 'sawtooth', 0.05), i * 70); break;
      case 'sneeze': this.noise(180, 0.2, 5000, 500); this.tone(900, 100, 'sine', 0.08, 300); break;
      case 'chime': this.tone(1046, 500, 'sine', 0.12); this.tone(1318, 700, 'sine', 0.08); break;
      case 'glow': this.tone(110, 1400, 'sine', 0.1, 440); this.tone(220, 1400, 'triangle', 0.05, 880); break;
      case 'hush': this.noise(900, 0.1, 2000, 100); break;
      case 'slide': this.noise(250, 0.08, 1500, 300); break;
      case 'paper': this.noise(200, 0.08, 6000, 2000); break;
      case 'twitch': this.tone(300, 60, 'triangle', 0.05); break;
      case 'stand': this.noise(400, 0.06, 800, 200); break;
      default: this.tone(600, 50, 'square', 0.04);
    }
  }
}
