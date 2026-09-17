/**
 * Cozy Web Audio API Synthesizer for Coffee Shop Story
 * Provides real-time procedural sound effects and relaxing lo-fi cafe chord music.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private chordIndex: number = 0;

  public musicVolume: number = 0.5;
  public sfxVolume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume * 0.3, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(vol * 0.28, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.chordIndex = 0;
    this.playNextLoFiChord();

    // Loop cozy chords every 3.2 seconds
    this.musicInterval = window.setInterval(() => {
      if (this.isMusicPlaying) {
        this.playNextLoFiChord();
      }
    }, 3200);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playNextLoFiChord() {
    if (!this.ctx || !this.musicGain || this.musicVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    // Cozy jazz/lofi progression: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
    ];

    const currentNotes = chords[this.chordIndex % chords.length];
    this.chordIndex++;

    // Play each note with warm electric piano / Rhodes envelope
    currentNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      // Soft triangle/sine blend
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      // Warm low-pass filter for cozy lo-fi character
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.06, now + 0.08 + idx * 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain!);

      osc.start(now + idx * 0.03);
      osc.stop(now + 3.15);
    });

    // Gentle cozy bass note
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(currentNotes[0] * 0.5, now);
    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(0.09, now + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    bassOsc.connect(bassGain);
    bassGain.connect(this.musicGain);
    bassOsc.start(now);
    bassOsc.stop(now + 3.05);
  }

  // --- Sound Effects ---

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playBell() {
    // Cafe door chime (Ding-Dong!)
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    const playChime = (freq: number, startTime: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.72);
    };

    playChime(1046.5, now); // C6
    playChime(783.99, now + 0.22); // G5
  }

  public playCash() {
    // Cash register bell + coin sparkle
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;

    // Register bell ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.51, now); // E6
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.9);

    // Coins jingle
    [1567.98, 1760.00, 2093.00].forEach((freq, i) => {
      const cOsc = this.ctx!.createOscillator();
      const cGain = this.ctx!.createGain();
      cOsc.type = 'triangle';
      cOsc.frequency.setValueAtTime(freq, now + 0.1 + i * 0.07);
      cGain.gain.setValueAtTime(0.12, now + 0.1 + i * 0.07);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.07);

      cOsc.connect(cGain);
      cGain.connect(this.sfxGain!);
      cOsc.start(now + 0.1 + i * 0.07);
      cOsc.stop(now + 0.36 + i * 0.07);
    });
  }

  public playEspresso() {
    // Pressurized extraction hiss
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const duration = 1.2;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1200, now + duration);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playSteam() {
    // Milk wand steaming whoosh
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const duration = 0.9;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playGrind() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const duration = 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);
    osc.frequency.linearRampToValueAtTime(90, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playCup() {
    // Ceramic cup placing clink
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playSuccess() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  }

  public playWrong() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playFootstep() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const soundManager = new SoundManager();
