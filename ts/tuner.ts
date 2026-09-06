import { NOTE_NAMES } from "./chord.js";

export interface TunerStringTarget {
  name: string;
  midi: number;
  freq: number;
}

export const INSTRUMENT_STRINGS: Record<string, TunerStringTarget[]> = {
  guitar: [
    { name: "6th - E2", midi: 40, freq: 82.41 },
    { name: "5th - A2", midi: 45, freq: 110.00 },
    { name: "4th - D3", midi: 50, freq: 146.83 },
    { name: "3rd - G3", midi: 55, freq: 196.00 },
    { name: "2nd - B3", midi: 59, freq: 246.94 },
    { name: "1st - E4", midi: 64, freq: 329.63 }
  ],
  ukulele: [
    { name: "4th - G4", midi: 67, freq: 392.00 },
    { name: "3rd - C4", midi: 60, freq: 261.63 },
    { name: "2nd - E4", midi: 64, freq: 329.63 },
    { name: "1st - A4", midi: 69, freq: 440.00 }
  ],
  guitalele: [
    { name: "6th - A2", midi: 45, freq: 110.00 },
    { name: "5th - D3", midi: 50, freq: 146.83 },
    { name: "4th - G3", midi: 55, freq: 196.00 },
    { name: "3rd - C4", midi: 60, freq: 261.63 },
    { name: "2nd - E4", midi: 64, freq: 329.63 },
    { name: "1st - A4", midi: 69, freq: 440.00 }
  ],
  violin: [
    { name: "4th - G3", midi: 55, freq: 196.00 },
    { name: "3rd - D4", midi: 62, freq: 293.66 },
    { name: "2nd - A4", midi: 69, freq: 440.00 },
    { name: "1st - E5", midi: 76, freq: 659.25 }
  ],
  bass: [
    { name: "4th - E1", midi: 28, freq: 41.20 },
    { name: "3rd - A1", midi: 33, freq: 55.00 },
    { name: "2nd - D2", midi: 38, freq: 73.42 },
    { name: "1st - G2", midi: 43, freq: 98.00 }
  ]
};

export class TunerController {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening: boolean = false;
  private animFrameId: number | null = null;

  private selectedInstrument: string = "guitar";
  private selectedStringIndex: number = 0;
  private inTuneTimer: number = 0;

  // DOM elements
  private modalEl: HTMLElement | null = null;
  private noteDisplayEl: HTMLElement | null = null;
  private freqDisplayEl: HTMLElement | null = null;
  private centsDisplayEl: HTMLElement | null = null;
  private needleEl: HTMLElement | null = null;
  private stringSelectEl: HTMLSelectElement | null = null;
  private instSelectEl: HTMLSelectElement | null = null;
  private statusEl: HTMLElement | null = null;

  public init(): void {
    this.cacheDom();
    this.bindEvents();
  }

  private cacheDom(): void {
    this.modalEl = document.getElementById("tuner-modal");
    this.noteDisplayEl = document.getElementById("tuner-detected-note");
    this.freqDisplayEl = document.getElementById("tuner-detected-freq");
    this.centsDisplayEl = document.getElementById("tuner-cents-deviation");
    this.needleEl = document.getElementById("tuner-needle");
    this.stringSelectEl = document.getElementById("tuner-string-select") as HTMLSelectElement;
    this.instSelectEl = document.getElementById("tuner-instrument-select") as HTMLSelectElement;
    this.statusEl = document.getElementById("tuner-status-msg");
  }

  private bindEvents(): void {
    document.getElementById("btn-open-tuner")?.addEventListener("click", () => {
      this.open();
    });

    document.getElementById("btn-close-tuner")?.addEventListener("click", () => {
      this.close();
    });

    this.instSelectEl?.addEventListener("change", () => {
      this.selectedInstrument = this.instSelectEl?.value || "guitar";
      this.selectedStringIndex = 0;
      this.populateStringSelect();
    });

    this.stringSelectEl?.addEventListener("change", () => {
      this.selectedStringIndex = parseInt(this.stringSelectEl?.value || "0", 10);
    });

    document.getElementById("btn-tuner-next-string")?.addEventListener("click", () => {
      this.advanceString();
    });
  }

  public async open(): Promise<void> {
    if (!this.modalEl) return;
    this.modalEl.style.display = "flex";
    this.populateStringSelect();
    await this.startListening();
  }

  public close(): void {
    if (!this.modalEl) return;
    this.modalEl.style.display = "none";
    this.stopListening();
  }

  private populateStringSelect(): void {
    if (!this.stringSelectEl) return;
    const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
    this.stringSelectEl.innerHTML = "";
    strings.forEach((str, idx) => {
      const opt = document.createElement("option");
      opt.value = `${idx}`;
      opt.textContent = `${str.name} (${str.freq.toFixed(1)} Hz)`;
      this.stringSelectEl!.appendChild(opt);
    });
    this.stringSelectEl.value = `${this.selectedStringIndex}`;
  }

  private advanceString(): void {
    const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
    this.selectedStringIndex = (this.selectedStringIndex + 1) % strings.length;
    if (this.stringSelectEl) {
      this.stringSelectEl.value = `${this.selectedStringIndex}`;
    }
    this.inTuneTimer = 0;
  }

  public async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 4096;
      source.connect(this.analyser);

      this.isListening = true;
      if (this.statusEl) this.statusEl.textContent = "Listening to microphone...";
      this.updateLoop();
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      if (this.statusEl) this.statusEl.textContent = "Mic permission required for Tuner.";
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private updateLoop(): void {
    if (!this.isListening || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    if (rms > 0.015 && this.audioCtx) {
      const pitch = this.autoCorrelate(buffer, this.audioCtx.sampleRate);
      if (pitch > 20 && pitch < 2000) {
        this.processPitch(pitch);
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.updateLoop());
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    const c = new Float32Array(trimmed.length);

    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;

    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 > 0 && T0 < trimmed.length - 1) {
      const x1 = c[T0 - 1];
      const x2 = c[T0];
      const x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }

    return sampleRate / T0;
  }

  private processPitch(freq: number): void {
    const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
    const target = strings[this.selectedStringIndex] || strings[0];

    const cents = Math.round(1200 * Math.log2(freq / target.freq));
    const clampedCents = Math.max(-50, Math.min(50, cents));

    const midiNum = Math.round(69 + 12 * Math.log2(freq / 440));
    const noteName = NOTE_NAMES[midiNum % 12] || "";
    const octave = Math.floor(midiNum / 12) - 1;

    if (this.noteDisplayEl) this.noteDisplayEl.textContent = `${noteName}${octave}`;
    if (this.freqDisplayEl) this.freqDisplayEl.textContent = `${freq.toFixed(1)} Hz (Target: ${target.freq.toFixed(1)} Hz)`;
    if (this.centsDisplayEl) {
      this.centsDisplayEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;
    }

    const angle = (clampedCents / 50) * 45;
    if (this.needleEl) {
      this.needleEl.style.transform = `rotate(${angle}deg)`;
      const absCents = Math.abs(cents);
      if (absCents <= 4) {
        this.needleEl.style.background = "#10b981";
        if (this.statusEl) this.statusEl.textContent = "🎯 In Tune!";
        this.inTuneTimer++;
        if (this.inTuneTimer > 40) {
          this.advanceString();
        }
      } else if (absCents <= 15) {
        this.needleEl.style.background = "#f59e0b";
        if (this.statusEl) this.statusEl.textContent = cents > 0 ? "Tune Down ▾" : "Tune Up ▴";
        this.inTuneTimer = 0;
      } else {
        this.needleEl.style.background = "#ef4444";
        if (this.statusEl) this.statusEl.textContent = cents > 0 ? "Sharp (Tune Down ▾)" : "Flat (Tune Up ▴)";
        this.inTuneTimer = 0;
      }
    }
  }
}

export const tuner = new TunerController();
