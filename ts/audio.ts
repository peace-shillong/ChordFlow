import { InstrumentId, AudioSettings } from "./types.js";
import { midiToFrequency } from "./chord.js";

export const SOUND_PRESETS: Record<InstrumentId, { id: string; label: string }[]> = {
  piano: [
    { id: "grand", label: "Grand Piano" },
    { id: "electric", label: "Electric Piano" },
    { id: "organ", label: "Organ" },
    { id: "lofi", label: "Lofi Piano" },
    { id: "music_box", label: "Music Box" }
  ],
  guitar: [
    { id: "acoustic_steel", label: "Acoustic (Steel)" },
    { id: "acoustic_nylon", label: "Acoustic (Nylon)" },
    { id: "electric_clean", label: "Electric Clean" },
    { id: "electric_distort", label: "Electric Distort" },
    { id: "jazz_archtop", label: "Jazz Archtop" }
  ],
  ukulele: [
    { id: "standard", label: "Standard Soprano" },
    { id: "tenor", label: "Tenor" },
    { id: "baritone", label: "Baritone" }
  ],
  guitalele: [
    { id: "standard", label: "Standard Guitalele" },
    { id: "warm", label: "Warm Nylon" }
  ],
  violin: [
    { id: "standard", label: "Standard Violin" },
    { id: "dampened", label: "Violin (Dampened / Muted)" }
  ],
  bass: [
    { id: "acoustic_upright", label: "Acoustic / Upright Bass" },
    { id: "electric_clean", label: "Electric Clean" },
    { id: "electric_finger", label: "Electric Finger" },
    { id: "slap", label: "Slap Bass" }
  ],
  harmonica: [
    { id: "standard", label: "Standard Diatonic" },
    { id: "draw_bar", label: "Draw Bar" },
    { id: "octave", label: "Octave Harmonica" }
  ]
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lpfNode: BiquadFilterNode | null = null;
  private hpfNode: BiquadFilterNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private activeNodes: { stop: (time: number) => void }[] = [];
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;

  private activePreset: Record<string, string> = {
    piano: "grand",
    guitar: "acoustic_steel",
    ukulele: "standard",
    guitalele: "standard",
    violin: "standard",
    bass: "electric_finger",
    harmonica: "standard"
  };

  private customSettings: Record<string, AudioSettings> = {};

  constructor() {
    this.loadSettings();
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      // Lowpass & Highpass Filters
      this.lpfNode = this.ctx.createBiquadFilter();
      this.lpfNode.type = "lowpass";
      this.lpfNode.frequency.setValueAtTime(20000, this.ctx.currentTime);

      this.hpfNode = this.ctx.createBiquadFilter();
      this.hpfNode.type = "highpass";
      this.hpfNode.frequency.setValueAtTime(20, this.ctx.currentTime);

      // Reverb Engine (Impulse Response buffer generator)
      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.createReverbBuffer(this.ctx, 1.8, 2.0);

      // Routing: Input -> LPF -> HPF -> (Dry + Reverb) -> MasterGain -> Destination
      this.lpfNode.connect(this.hpfNode);
      this.hpfNode.connect(this.dryGain);
      this.hpfNode.connect(this.convolver);
      this.convolver.connect(this.reverbGain);

      this.dryGain.connect(this.masterGain);
      this.reverbGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private createReverbBuffer(ctx: AudioContext, duration: number = 1.5, decay: number = 2.0): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.masterVolume);
    return this.isMuted;
  }

  public resetInstrument(instrument: InstrumentId): AudioSettings {
    const defaultPreset = SOUND_PRESETS[instrument]?.[0]?.id || "standard";
    this.activePreset[instrument] = defaultPreset;
    const defaults: AudioSettings = {
      lpf: 12000,
      hpf: 80,
      decay: 0.3,
      detune: 0,
      reverb: 0.2,
      volume: 0.8
    };
    delete this.customSettings[instrument];
    try {
      localStorage.removeItem(`chordflow-audio-${instrument}`);
    } catch {
      // Ignore
    }
    this.applyAudioSettings(instrument);
    this.saveSettings();
    return defaults;
  }

  public resetAll(): void {
    const instruments: InstrumentId[] = ["piano", "guitar", "ukulele", "guitalele", "violin", "bass", "harmonica"];
    instruments.forEach(inst => {
      this.activePreset[inst] = SOUND_PRESETS[inst]?.[0]?.id || "standard";
      delete this.customSettings[inst];
      try {
        localStorage.removeItem(`chordflow-audio-${inst}`);
      } catch {
        // Ignore
      }
    });
    this.masterVolume = 0.8;
    this.applyAudioSettings("guitar");
    this.saveSettings();
  }

  public setPreset(instrument: InstrumentId, presetId: string): void {
    this.activePreset[instrument] = presetId;
    this.saveSettings();
  }

  public getPreset(instrument: InstrumentId): string {
    return this.activePreset[instrument] || SOUND_PRESETS[instrument]?.[0]?.id || "standard";
  }

  public setAudioSettings(instrument: string, settings: Partial<AudioSettings>): void {
    const current = this.getAudioSettings(instrument);
    this.customSettings[instrument] = { ...current, ...settings };
    this.applyAudioSettings(instrument);
    try {
      localStorage.setItem(`chordflow-audio-${instrument}`, JSON.stringify(this.customSettings[instrument]));
    } catch {
      // Ignore
    }
    this.saveSettings();
  }

  public getAudioSettings(instrument: string): AudioSettings {
    // Check localStorage fallback for per-instrument key if not in memory
    if (!this.customSettings[instrument]) {
      try {
        const saved = localStorage.getItem(`chordflow-audio-${instrument}`);
        if (saved) {
          this.customSettings[instrument] = JSON.parse(saved);
        }
      } catch {
        // Ignore
      }
    }

    return this.customSettings[instrument] || {
      lpf: 12000,
      hpf: 80,
      decay: 0.3,
      detune: 0,
      reverb: 0.2,
      volume: 0.8
    };
  }

  private applyAudioSettings(instrument: string): void {
    const s = this.getAudioSettings(instrument);
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.lpfNode) this.lpfNode.frequency.setValueAtTime(Math.max(200, Math.min(20000, s.lpf)), now);
    if (this.hpfNode) this.hpfNode.frequency.setValueAtTime(Math.max(20, Math.min(2000, s.hpf)), now);
    if (this.reverbGain && this.dryGain) {
      const rev = Math.max(0, Math.min(1, s.reverb));
      this.reverbGain.gain.setValueAtTime(rev, now);
      this.dryGain.gain.setValueAtTime(1 - rev * 0.5, now);
    }
  }

  public getCurrentTime(): number {
    return this.ensureContext().currentTime;
  }

  /**
   * Play a single note
   */
  public playNote(
    midi: number,
    instrument: InstrumentId = "piano",
    startTime?: number,
    duration?: number
  ): void {
    const ctx = this.ensureContext();
    this.applyAudioSettings(instrument);
    const t = startTime !== undefined ? startTime : ctx.currentTime;
    const freq = midiToFrequency(midi);
    const settings = this.getAudioSettings(instrument);
    const effectiveDuration = duration || settings.decay || 1.2;
    const preset = this.getPreset(instrument);

    switch (instrument) {
      case "piano":
        this.synthesizePiano(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "guitar":
        this.synthesizeGuitar(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "ukulele":
        this.synthesizeUkulele(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "guitalele":
        this.synthesizeGuitalele(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "violin":
        this.synthesizeViolin(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "bass":
        this.synthesizeBass(ctx, freq, t, effectiveDuration, preset, settings);
        break;
      case "harmonica":
        this.synthesizeHarmonica(ctx, freq, t, effectiveDuration, preset, settings);
        break;
    }
  }

  /**
   * Play a full chord with direction (down, up, down_up)
   */
  public playChord(
    midiNotes: number[],
    instrument: InstrumentId = "guitar",
    startTime?: number,
    isStrummed: boolean = true,
    direction: "down" | "up" | "down_up" = "down"
  ): void {
    const ctx = this.ensureContext();
    const t = startTime !== undefined ? startTime : ctx.currentTime;
    const validNotes = midiNotes.filter(n => n > 0 && n < 128);

    if (validNotes.length === 0) return;

    let orderedNotes = [...validNotes];
    if (direction === "up") {
      orderedNotes.reverse();
    }

    const strumDelay = isStrummed ? (instrument === "guitar" || instrument === "guitalele" ? 0.025 : instrument === "ukulele" ? 0.02 : 0.01) : 0;

    orderedNotes.forEach((midi, i) => {
      const noteTime = t + i * strumDelay;
      this.playNote(midi, instrument, noteTime, 1.8);
    });

    if (direction === "down_up") {
      // Rapid up-strum after down-strum
      const upTime = t + orderedNotes.length * strumDelay + 0.12;
      [...validNotes].reverse().forEach((midi, i) => {
        const noteTime = upTime + i * strumDelay;
        this.playNote(midi, instrument, noteTime, 1.4);
      });
    }
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
          // Ignore
        }
      }
      this.activeNodes = [];
    }
  }

  // --- Synthesis Models ---

  private synthesizePiano(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();

    const detune = settings.detune || 0;

    if (preset === "electric") {
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 3, t);
    } else if (preset === "organ") {
      osc1.type = "sawtooth";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 2, t);
    } else if (preset === "lofi") {
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime(-10 + detune, t);
      osc2.frequency.setValueAtTime(freq * 2, t);
      osc2.detune.setValueAtTime(8 + detune, t);
    } else if (preset === "music_box") {
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(freq * 2, t);
      osc2.frequency.setValueAtTime(freq * 4, t);
    } else {
      // Grand piano default
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime(detune, t);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, t);
    }

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(preset === "music_box" ? 0.4 : 0.25, t);
    osc2.connect(osc2Gain);

    const attack = preset === "organ" ? 0.02 : 0.005;
    const decay = duration * 0.4;
    const sustain = preset === "organ" ? 0.7 : 0.3;
    const release = 0.3;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.5 * settings.volume, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.5 * sustain * settings.volume, t + attack + decay);
    noteGain.gain.setValueAtTime(0.5 * sustain * settings.volume, t + duration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);

    osc1.connect(noteGain);
    osc2Gain.connect(noteGain);
    noteGain.connect(this.lpfNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + duration + release + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeGuitar(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();
    const detune = settings.detune || 0;

    if (preset === "electric_distort") {
      osc1.type = "sawtooth";
      osc2.type = "square";
      filter.frequency.setValueAtTime(4500, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    } else if (preset === "acoustic_nylon") {
      osc1.type = "triangle";
      osc2.type = "sine";
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    } else if (preset === "jazz_archtop") {
      osc1.type = "triangle";
      osc2.type = "sine";
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(250, t + 0.4);
    } else {
      // Acoustic steel / electric clean
      osc1.type = "sawtooth";
      osc2.type = "triangle";
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);
    }

    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-3 + detune, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.setValueAtTime(3 + detune, t);

    filter.type = "lowpass";
    filter.Q.setValueAtTime(2, t);

    const attack = 0.003;
    const decay = Math.min(duration, 1.5);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.45 * settings.volume, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lpfNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeUkulele(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(settings.detune || 0, t);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(preset === "baritone" ? 2200 : 3500, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.3);

    const attack = 0.002;
    const decay = Math.min(duration, 0.9);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.4 * settings.volume, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lpfNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeGuitalele(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-2 + (settings.detune || 0), t);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.setValueAtTime(2 + (settings.detune || 0), t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(preset === "warm" ? 2200 : 3200, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.35);

    const attack = 0.003;
    const decay = Math.min(duration, 1.2);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.42 * settings.volume, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lpfNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeViolin(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, t);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.2, t);
    osc2.connect(osc2Gain);

    // Bowed Violin LFO vibrato (6Hz, 15 cents)
    lfo.frequency.setValueAtTime(preset === "dampened" ? 4.5 : 6.0, t);
    lfoGain.gain.setValueAtTime(preset === "dampened" ? 8 : 15, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.detune);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(preset === "dampened" ? 1800 : 4000, t);

    // Smooth bowed string attack
    const attack = 0.08;
    const release = 0.25;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.38 * settings.volume, t + attack);
    noteGain.gain.setValueAtTime(0.38 * settings.volume, t + duration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);

    osc1.connect(filter);
    osc2Gain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lpfNode);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    const stopTime = t + duration + release + 0.05;
    lfo.stop(stopTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2, lfo);
  }

  private synthesizeBass(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    if (preset === "slap") {
      osc1.type = "sawtooth";
      osc2.type = "square";
      filter.frequency.setValueAtTime(2500, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);
    } else if (preset === "acoustic_upright") {
      osc1.type = "triangle";
      osc2.type = "sine";
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.4);
    } else {
      // Electric clean / finger
      osc1.type = "sine";
      osc2.type = "sawtooth";
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    }

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.25, t);
    osc2.connect(osc2Gain);

    filter.type = "lowpass";
    filter.Q.setValueAtTime(3, t);

    const attack = 0.005;
    const decay = Math.min(duration, 1.6);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.55 * settings.volume, t + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);

    osc1.connect(filter);
    osc2Gain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lpfNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + attack + decay + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2);
  }

  private synthesizeHarmonica(
    ctx: AudioContext,
    freq: number,
    t: number,
    duration: number,
    preset: string,
    settings: AudioSettings
  ): void {
    if (!this.lpfNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const noteGain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = "square";
    osc2.frequency.setValueAtTime(preset === "octave" ? freq * 2 : freq, t);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.08, t);
    osc2.connect(osc2Gain);

    lfo.frequency.setValueAtTime(5.2, t);
    lfoGain.gain.setValueAtTime(12, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.detune);
    lfoGain.connect(osc2.detune);

    const attack = 0.04;
    const release = 0.15;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.35 * settings.volume, t + attack);
    noteGain.gain.setValueAtTime(0.35 * settings.volume, t + duration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);

    osc1.connect(noteGain);
    osc2Gain.connect(noteGain);
    noteGain.connect(this.lpfNode);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    const stopTime = t + duration + release + 0.05;
    lfo.stop(stopTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    this.activeNodes.push(osc1, osc2, lfo);
  }

  private saveSettings(): void {
    try {
      localStorage.setItem("chordflow_audio_presets", JSON.stringify(this.activePreset));
      localStorage.setItem("chordflow_audio_settings", JSON.stringify(this.customSettings));
      localStorage.setItem("chordflow_volume", JSON.stringify(this.masterVolume));
    } catch {
      // Ignore
    }
  }

  private loadSettings(): void {
    try {
      const presets = localStorage.getItem("chordflow_audio_presets");
      if (presets) this.activePreset = { ...this.activePreset, ...JSON.parse(presets) };
      const custom = localStorage.getItem("chordflow_audio_settings");
      if (custom) this.customSettings = JSON.parse(custom);
      const vol = localStorage.getItem("chordflow_volume");
      if (vol) this.masterVolume = JSON.parse(vol);
    } catch {
      // Fallback
    }
  }
}

export const audio = new AudioEngine();

