import { InstrumentId } from "./types.js";
import { midiToFrequency } from "./chord.js";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop: (time: number) => void }[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.8;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public getCurrentTime(): number {
    return this.ensureContext().currentTime;
  }

  /**
   * Play a single synthesizer note with instrument-specific synthesis model
   */
  public playNote(
    midi: number,
    instrument: InstrumentId = "piano",
    startTime?: number,
    duration: number = 1.2
  ): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const t = startTime !== undefined ? startTime : ctx.currentTime;
    const freq = midiToFrequency(midi);

    switch (instrument) {
      case "piano":
        this.synthesizePiano(ctx, freq, t, duration);
        break;
      case "guitar":
        this.synthesizeGuitar(ctx, freq, t, duration);
        break;
      case "ukulele":
        this.synthesizeUkulele(ctx, freq, t, duration);
        break;
      case "harmonica":
        this.synthesizeHarmonica(ctx, freq, t, duration);
        break;
    }
  }

  /**
   * Play a full chord (simultaneously or with humanized strumming delay)
   */
  public playChord(
    midiNotes: number[],
    instrument: InstrumentId = "guitar",
    startTime?: number,
    isStrummed: boolean = true
  ): void {
    const ctx = this.ensureContext();
    const t = startTime !== undefined ? startTime : ctx.currentTime;
    const validNotes = midiNotes.filter(n => n > 0 && n < 128);

    if (validNotes.length === 0) return;

    // Guitar/Ukulele strum staggered delay (~25ms per string); Piano simultaneous/subtle roll
    const strumDelay = isStrummed ? (instrument === "guitar" ? 0.025 : instrument === "ukulele" ? 0.02 : 0.01) : 0;

    validNotes.forEach((midi, i) => {
      const noteTime = t + i * strumDelay;
      this.playNote(midi, instrument, noteTime, 1.8);
    });
  }

  /**
   * Metronome click sound
   */
  public playClick(isAccent: boolean = false, startTime?: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const t = startTime !== undefined ? startTime : ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);

    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public stop(): void {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      for (const node of this.activeNodes) {
        try {
          node.stop(now);
        } catch {
          // Ignore already stopped nodes
        }
      }
      this.activeNodes = [];
    }
  }

  // --- Synthesis Models ---

  private synthesizePiano(ctx: AudioContext, freq: number, t: number, duration: number): void {
    if (!this.masterGain) return;

    // Fundamental + subtle 2nd harmonic
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, t);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.25, t);
    osc2.connect(osc2Gain);

    // ADSR Envelope: Attack 5ms, Decay 200ms, Sustain 0.3, Release 300ms
    const attack = 0.005;
    const decay = 0.2;
    const sustain = 0.3;
    const release = 0.3;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.5, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.5 * sustain, t + attack + decay);
    noteGain.gain.setValueAtTime(0.5 * sustain, t + duration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);

    osc1.connect(noteGain);
    osc2Gain.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + duration + release + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeGuitar(ctx: AudioContext, freq: number, t: number, duration: number): void {
    if (!this.masterGain) return;

    // 2 detuned sawtooth/triangle oscillators (±3 cents) + dynamic lowpass filter
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-3, t);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.setValueAtTime(3, t);

    // Lowpass filter opens on pluck and sweeps down
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2500, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);
    filter.Q.setValueAtTime(2, t);

    // Pluck amplitude envelope
    const attack = 0.003;
    const decay = Math.min(duration, 1.4);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.45, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeUkulele(ctx: AudioContext, freq: number, t: number, duration: number): void {
    if (!this.masterGain) return;

    // Brighter plucked timbre with triangle waves + high cutoff
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.3);

    const attack = 0.002;
    const decay = Math.min(duration, 0.9);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.4, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeHarmonica(ctx: AudioContext, freq: number, t: number, duration: number): void {
    if (!this.masterGain) return;

    // Sine/square blend + 5.2Hz LFO vibrato (10-15 cents pitch modulation)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const noteGain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = "square";
    osc2.frequency.setValueAtTime(freq, t);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.08, t); // Soft square for reed character
    osc2.connect(osc2Gain);

    // LFO for breath vibrato
    lfo.frequency.setValueAtTime(5.2, t);
    lfoGain.gain.setValueAtTime(12, t); // 12 cents depth
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.detune);
    lfoGain.connect(osc2.detune);

    // Breath swell envelope
    const attack = 0.04;
    const release = 0.15;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.35, t + attack);
    noteGain.gain.setValueAtTime(0.35, t + duration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);

    osc1.connect(noteGain);
    osc2Gain.connect(noteGain);
    noteGain.connect(this.masterGain);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    const stopTime = t + duration + release + 0.05;
    lfo.stop(stopTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2, lfo);
  }
}

export const audio = new AudioEngine();
