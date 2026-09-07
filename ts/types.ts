export type ChordQuality =
  | "major"
  | "minor"
  | "7th"
  | "maj7"
  | "min7"
  | "dim"
  | "dim7"
  | "aug"
  | "sus2"
  | "sus4"
  | "add9"
  | "m7b5";

export type InstrumentId =
  | "piano"
  | "guitar"
  | "ukulele"
  | "harmonica"
  | "violin"
  | "bass"
  | "guitalele";

export type DisplayView = "chord" | "notes";

export interface Inversion {
  notes: string[];
  label: string;
}

export interface VoicingOption {
  id: string;
  label: string;
  guitar?: number[]; // frets
  piano?: number[]; // MIDI notes
  ukulele?: number[]; // frets
  guitalele?: number[]; // frets
  violin?: number[]; // finger positions / double-stops
  bass?: number[]; // frets
}

export interface PianoVoicing {
  keys: number[]; // MIDI key numbers (e.g. 60 = C4, 64 = E4, 67 = G4)
  diagram?: string;
}

export interface GuitarVoicing {
  frets: number[]; // e.g. [-1, 3, 2, 0, 1, 0] (-1 = mute, 0 = open)
  strings?: number[]; // [6, 5, 4, 3, 2, 1]
  fingers?: number[]; // [0, 3, 2, 0, 1, 0] (0 = none, 1 = index, 2 = middle, 3 = ring, 4 = pinky)
  barres?: number[]; // [1, 3] etc.
  diagram?: string;
}

export interface UkuleleVoicing {
  frets: number[]; // e.g. [0, 0, 0, 3] (strings 4, 3, 2, 1 -> G, C, E, A)
  strings?: number[];
  fingers?: number[];
  diagram?: string;
}

export interface GuitaleleVoicing {
  frets: number[]; // [0, 0, 2, 2, 2, 0] etc (ADGCEA)
  strings?: number[];
  fingers?: number[];
  diagram?: string;
}

export interface ViolinVoicing {
  frets?: number[]; // 4 strings [G, D, A, E] finger positions
  doubleStops?: number[][]; // e.g. [[0, 2], [2, 0]]
  notes?: number[]; // MIDI notes
  strings?: number[];
  fingers?: number[];
  diagram?: string;
}

export interface BassVoicing {
  frets: number[]; // 4 strings [E, A, D, G]
  notes?: number[]; // MIDI notes
  strings?: number[];
  fingers?: number[];
  diagram?: string;
}

export interface HarmonicaVoicing {
  holes: string[]; // e.g. ["4", "5", "6"] or ["4-", "4=", "4+", "5-"]
  blowDraw?: ("blow" | "draw")[];
  notes?: string[];
  diagram?: string;
}

export interface ChordInstruments {
  piano: PianoVoicing;
  guitar: GuitarVoicing;
  ukulele: UkuleleVoicing;
  harmonica: HarmonicaVoicing;
  violin?: ViolinVoicing;
  bass?: BassVoicing;
  guitalele?: GuitaleleVoicing;
}

export interface Chord {
  id: string; // "Cmaj"
  name: string; // "C Major"
  symbol: string; // "C"
  quality: ChordQuality;
  root: string; // "C", "C#", "Db", etc.
  notes: string[]; // ["C4", "E4", "G4"]
  intervals: number[]; // [0, 4, 7]
  scale: string; // "C Major"
  inversions: Inversion[];
  instruments: ChordInstruments;
  voicings?: VoicingOption[];
}

export interface Progression {
  id: string;
  name: string;
  key: string;
  chords: string[]; // chord IDs, length 4–16
  beatsPerChord: number;
  tempo: number; // BPM
  style?: string;
  strumPatternId?: string;
}

export interface TuningConfig {
  id: string;
  name: string;
  strings: number[]; // MIDI note numbers for open strings (low to high)
}

export interface Instrument {
  id: InstrumentId;
  name: string;
  strings?: number[]; // default MIDI note numbers
  tunings?: TuningConfig[];
  fretRange: [number, number];
  capoRange: [number, number];
  defaultView?: DisplayView;
}

export interface StrumPattern {
  id: string;
  name: string;
  pattern: string[]; // ["D", "", "U", "", "D", "U", "D", "U"]
  accent?: number[]; // beat indices with accent (0-indexed)
  bpm?: number;
}

export interface AudioSettings {
  lpf: number; // Low-pass filter frequency in Hz (200 - 20000)
  hpf: number; // High-pass filter frequency in Hz (20 - 2000)
  decay: number; // Decay/Release duration in seconds (0.05 - 3.0)
  detune: number; // Detune in cents (-25 to +25)
  reverb: number; // Reverb wet mix (0.0 - 1.0)
  volume: number; // Instrument specific gain (0.0 - 1.0)
}

export interface AppToggles {
  showNotes: boolean;
  showIntervals: boolean;
  showScaleDegrees: boolean;
  showStrum: boolean;
  showCircle: boolean;
  showInversions: boolean;
}

export interface AppState {
  mode: "clean" | "advanced";
  activeInstrument: InstrumentId;
  displayView: DisplayView;
  selectedChord: string | null;
  selectedInversionIndex: number;
  selectedVoicingId: string;
  progression: string[];
  progressionTitle: string;
  activeChordIndex: number;
  capo: number;
  tuning: string;
  strumPattern: string | null;
  tempo: number;
  volume: number;
  isPlaying: boolean;
  soundPreset: string;
  audioSettings: Record<string, AudioSettings>;
  toggles: AppToggles;
  theme: "light" | "dark" | "system";
  transposeOffset: number;
}

// Global declaration for jsPDF CDN and Google Analytics (gtag.js)
export interface JSPDFInstance {
  setFontSize(size: number): void;
  setTextColor(r: number, g?: number, b?: number): void;
  setFont(fontName: string, fontStyle?: string): void;
  text(text: string | string[], x: number, y: number, options?: Record<string, unknown>): void;
  addImage(
    imageData: string | HTMLCanvasElement,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  addPage(format?: string | number[], orientation?: "portrait" | "landscape"): void;
  setFillColor(r: number, g?: number, b?: number): void;
  setDrawColor(r: number, g?: number, b?: number): void;
  setLineWidth(width: number): void;
  save(filename: string): void;
  output(type: string): unknown;
}

declare global {
  interface Window {
    jspdf?: {
      jsPDF: new (options?: {
        orientation?: "portrait" | "landscape";
        unit?: "pt" | "mm" | "in" | "px";
        format?: string | number[];
      }) => JSPDFInstance;
    };
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}


