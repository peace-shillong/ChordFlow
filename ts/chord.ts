import {
  Chord,
  ChordQuality,
  InstrumentId,
  Instrument,
  StrumPattern,
  Progression
} from "./types.js";

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  "DB": "C#", "Db": "C#", "db": "C#",
  "EB": "D#", "Eb": "D#", "eb": "D#",
  "GB": "F#", "Gb": "F#", "gb": "F#",
  "AB": "G#", "Ab": "G#", "ab": "G#",
  "BB": "A#", "Bb": "A#", "bb": "A#",
  "B#": "C", "b#": "C",
  "E#": "F", "e#": "F",
  "CB": "B", "Cb": "B", "cb": "B",
  "FB": "E", "Fb": "E", "fb": "E"
};

export function normalizeRoot(root: string): string {
  const trimmed = root.trim();
  if (ENHARMONIC_EQUIVALENTS[trimmed]) return ENHARMONIC_EQUIVALENTS[trimmed];
  const upper = trimmed.toUpperCase();
  if (ENHARMONIC_EQUIVALENTS[upper]) return ENHARMONIC_EQUIVALENTS[upper];
  if (upper.length === 2 && upper[1] === "B") {
    const sharp = ENHARMONIC_EQUIVALENTS[upper[0] + "b"];
    if (sharp) return sharp;
  }
  return upper;
}

export const INTERVAL_NAMES: Record<number, string> = {
  0: "1",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "b6",
  9: "6",
  10: "b7",
  11: "7",
  12: "8",
  14: "9"
};

export const ROMAN_NUMERALS = ["I", "bII", "ii", "bIII", "iii", "IV", "bV", "V", "bVI", "vi", "bVII", "vii°"];

export interface GeneratorStyle {
  id: string;
  category: string;
  name: string;
  description: string;
  strumPatternId?: string;
  formula: { semitones: number; quality: string }[];
}

export const GENERATOR_STYLES: GeneratorStyle[] = [
  // 1. Japanese & Anime / City Pop
  {
    id: "jp_royal_road",
    category: "Japanese & City Pop",
    name: "Royal Road / 王道進行 (IV-V-iii-vi)",
    description: "The most iconic progression in J-Pop, Anime, and Game soundtracks",
    strumPatternId: "pop_rock",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 5, quality: "maj7" },
      { semitones: 7, quality: "7" },
      { semitones: 4, quality: "min7" },
      { semitones: 9, quality: "min" }
    ]
  },
  {
    id: "jp_just_two_us",
    category: "Japanese & City Pop",
    name: "Just The Two of Us / 4-3-6-1 (IV-III7-vi-I)",
    description: "Groovy Japanese City Pop & R&B progression with secondary dominant III7",
    strumPatternId: "swing",
    formula: [
      { semitones: 0, quality: "maj7" },
      { semitones: 5, quality: "maj7" },
      { semitones: 4, quality: "7" },
      { semitones: 9, quality: "min7" },
      { semitones: 0, quality: "7" }
    ]
  },
  {
    id: "jp_jrock_drive",
    category: "Japanese & City Pop",
    name: "J-Rock Drive / Anime Anthem (VI-VII-i-i)",
    description: "High energy, driving J-Rock and opening theme cadence",
    strumPatternId: "pop_rock",
    formula: [
      { semitones: 0, quality: "min" },
      { semitones: 8, quality: "maj" },
      { semitones: 10, quality: "maj" },
      { semitones: 0, quality: "min" }
    ]
  },
  {
    id: "jp_koakuma",
    category: "Japanese & City Pop",
    name: "Koakuma / Minor 4-5-6 (iv-v-vi)",
    description: "Melancholic minor ascension common in Vocaloid and emotional ballads",
    strumPatternId: "ballad",
    formula: [
      { semitones: 0, quality: "min" },
      { semitones: 5, quality: "min" },
      { semitones: 7, quality: "min" },
      { semitones: 8, quality: "maj" }
    ]
  },

  // 2. Circle of Fifths
  {
    id: "circle_full_7",
    category: "Circle of Fifths Cycles",
    name: "Descending 7-Chord Circle Cycle",
    description: "The complete diatonic circle progression (I-IV-vii°-iii-vi-ii-V)",
    strumPatternId: "basic",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 5, quality: "maj" },
      { semitones: 11, quality: "dim" },
      { semitones: 4, quality: "min" },
      { semitones: 9, quality: "min" },
      { semitones: 2, quality: "min" },
      { semitones: 7, quality: "maj" }
    ]
  },
  {
    id: "circle_jazz_cycle",
    category: "Circle of Fifths Cycles",
    name: "Jazz Circle Cycle (ii-V-I-IV)",
    description: "Smooth continuous circle of fifths standard jazz movement",
    strumPatternId: "swing",
    formula: [
      { semitones: 0, quality: "maj7" },
      { semitones: 2, quality: "min7" },
      { semitones: 7, quality: "7" },
      { semitones: 0, quality: "maj7" },
      { semitones: 5, quality: "maj7" }
    ]
  },
  {
    id: "circle_minor_cycle",
    category: "Circle of Fifths Cycles",
    name: "Minor Circle Turnaround (i-iv-bVII-bIII-bVI-iiø-V)",
    description: "Dramatic full minor key circle progression",
    strumPatternId: "slow_rock",
    formula: [
      { semitones: 0, quality: "min" },
      { semitones: 5, quality: "min" },
      { semitones: 10, quality: "maj" },
      { semitones: 3, quality: "maj" },
      { semitones: 8, quality: "maj" },
      { semitones: 2, quality: "m7b5" },
      { semitones: 7, quality: "7" }
    ]
  },

  // 3. Pop & Songwriting
  {
    id: "pop_axis_4",
    category: "Pop & Songwriting",
    name: "Pop 4-Chord Hit (I-V-vi-IV)",
    description: "The most famous chord progression in modern pop history",
    strumPatternId: "pop_rock",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 7, quality: "maj" },
      { semitones: 9, quality: "min" },
      { semitones: 5, quality: "maj" }
    ]
  },
  {
    id: "pop_sensitive_minor",
    category: "Pop & Songwriting",
    name: "Emotional Hero (i-bVI-bIII-bVII)",
    description: "Epic and emotional minor anthem progression",
    strumPatternId: "pop_rock",
    formula: [
      { semitones: 0, quality: "min" },
      { semitones: 8, quality: "maj" },
      { semitones: 3, quality: "maj" },
      { semitones: 10, quality: "maj" }
    ]
  },
  {
    id: "pop_50s_doowop",
    category: "Pop & Songwriting",
    name: "50s Doo-Wop (I-vi-IV-V)",
    description: "Classic vintage ballad and retro pop turnaround",
    strumPatternId: "slow_rock",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 9, quality: "min" },
      { semitones: 5, quality: "maj" },
      { semitones: 7, quality: "maj" }
    ]
  },
  {
    id: "pachelbel_canon",
    category: "Pop & Songwriting",
    name: "Pachelbel Canon Progression",
    description: "Timeless stepwise bassline progression used in hundreds of songs",
    strumPatternId: "ballad",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 7, quality: "maj" },
      { semitones: 9, quality: "min" },
      { semitones: 4, quality: "min" },
      { semitones: 5, quality: "maj" },
      { semitones: 0, quality: "maj" },
      { semitones: 5, quality: "maj" }
    ]
  },

  // 4. Jazz & Neo-Soul
  {
    id: "jazz_turnaround_251",
    category: "Jazz & Neo-Soul",
    name: "Jazz Rhythm Changes (Imaj7-VI7-ii7-V7)",
    description: "Core jazz turnaround standard",
    strumPatternId: "swing",
    formula: [
      { semitones: 0, quality: "maj7" },
      { semitones: 9, quality: "7" },
      { semitones: 2, quality: "min7" },
      { semitones: 7, quality: "7" }
    ]
  },
  {
    id: "neo_soul_groove",
    category: "Jazz & Neo-Soul",
    name: "Neo-Soul Groove (i7-iv7-bVII7-bIIImaj7)",
    description: "Rich, lush neo-soul and R&B chords",
    strumPatternId: "swing",
    formula: [
      { semitones: 0, quality: "min7" },
      { semitones: 5, quality: "min7" },
      { semitones: 10, quality: "7" },
      { semitones: 3, quality: "maj7" }
    ]
  },

  // 5. Rock, Blues & Flamenco
  {
    id: "blues_12_bar",
    category: "Rock, Blues & Flamenco",
    name: "12-Bar Blues (I7-IV7-I7-V7-IV7-I7)",
    description: "Essential Delta & Chicago blues progression",
    strumPatternId: "slow_rock",
    formula: [
      { semitones: 0, quality: "7" },
      { semitones: 5, quality: "7" },
      { semitones: 0, quality: "7" },
      { semitones: 7, quality: "7" },
      { semitones: 5, quality: "7" },
      { semitones: 0, quality: "7" }
    ]
  },
  {
    id: "flamenco_andalusian",
    category: "Rock, Blues & Flamenco",
    name: "Andalusian Cadence (i-bVII-bVI-V)",
    description: "Classic Flamenco and Spanish Spanish Phrygian cadence",
    strumPatternId: "island",
    formula: [
      { semitones: 0, quality: "min" },
      { semitones: 10, quality: "maj" },
      { semitones: 8, quality: "maj" },
      { semitones: 7, quality: "maj" }
    ]
  },
  {
    id: "mixolydian_rock",
    category: "Rock, Blues & Flamenco",
    name: "Mixolydian Rock (I-bVII-IV-I)",
    description: "Classic rock, Hey Jude, and Southern rock anthem cadence",
    strumPatternId: "pop_rock",
    formula: [
      { semitones: 0, quality: "maj" },
      { semitones: 10, quality: "maj" },
      { semitones: 5, quality: "maj" },
      { semitones: 0, quality: "maj" }
    ]
  }
];

export class ChordDatabase {
  private chords: Chord[] = [];
  private chordsMap: Map<string, Chord> = new Map();
  private instruments: Instrument[] = [];
  private strumPatterns: StrumPattern[] = [];
  private progressions: Progression[] = [];

  public async loadAll(): Promise<void> {
    try {
      const [chordsRes, instRes, strumRes, progRes] = await Promise.all([
        fetch("./data/chords.json"),
        fetch("./data/instruments.json"),
        fetch("./data/strumPatterns.json"),
        fetch("./data/progressions.json")
      ]);

      this.chords = (await chordsRes.json()) as Chord[];
      this.instruments = (await instRes.json()) as Instrument[];
      this.strumPatterns = (await strumRes.json()) as StrumPattern[];
      this.progressions = (await progRes.json()) as Progression[];

      this.chordsMap.clear();
      for (const chord of this.chords) {
        this.chordsMap.set(chord.id, chord);
        this.chordsMap.set(chord.symbol.toLowerCase(), chord);
        this.chordsMap.set(chord.name.toLowerCase(), chord);
      }
    } catch (err) {
      console.error("Failed to fetch ChordFlow JSON datasets:", err);
      throw err;
    }
  }

  public getAllChords(): Chord[] {
    return this.chords;
  }

  public getChordById(id: string): Chord | undefined {
    return this.chordsMap.get(id);
  }

  public findChord(query: string): Chord | undefined {
    const trimmed = query.trim().toLowerCase();
    return this.chordsMap.get(trimmed) || this.chords.find(c => 
      c.id.toLowerCase() === trimmed || 
      c.symbol.toLowerCase() === trimmed ||
      c.name.toLowerCase() === trimmed
    );
  }

  public filterChords(root?: string, quality?: ChordQuality | "all", query?: string): Chord[] {
    return this.chords.filter(chord => {
      if (root && root.toLowerCase() !== "all") {
        const normalizedRoot = normalizeRoot(root);
        const chordNormRoot = normalizeRoot(chord.root);
        if (chordNormRoot !== normalizedRoot) return false;
      }
      if (quality && quality !== "all" && chord.quality !== quality) {
        return false;
      }
      if (query && query.trim().length > 0) {
        const q = query.trim().toLowerCase();
        const matchesName = chord.name.toLowerCase().includes(q);
        const matchesSymbol = chord.symbol.toLowerCase().includes(q);
        const matchesRoot = chord.root.toLowerCase().includes(q);
        if (!matchesName && !matchesSymbol && !matchesRoot) return false;
      }
      return true;
    });
  }

  public getInstruments(): Instrument[] {
    return this.instruments;
  }

  public getInstrument(id: InstrumentId): Instrument | undefined {
    return this.instruments.find(inst => inst.id === id);
  }

  public getStrumPatterns(): StrumPattern[] {
    return this.strumPatterns;
  }

  public getStrumPattern(id: string): StrumPattern | undefined {
    return this.strumPatterns.find(p => p.id === id) || this.strumPatterns[0];
  }

  public getProgressions(): Progression[] {
    return this.progressions;
  }

  public getProgression(id: string): Progression | undefined {
    return this.progressions.find(p => p.id === id);
  }

  /**
   * Generate a chord progression rooted on a given starting chord
   */
  public generateProgressionForChord(chordId: string, styleId: string): string[] {
    const startChord = this.getChordById(chordId) || this.chords[0];
    const style = GENERATOR_STYLES.find(s => s.id === styleId) || GENERATOR_STYLES[0];

    const rootNorm = ENHARMONIC_EQUIVALENTS[startChord.root] || startChord.root;
    let rootIndex = NOTE_NAMES.indexOf(rootNorm);
    if (rootIndex === -1) rootIndex = 0;

    const resultChordIds: string[] = [];

    for (const step of style.formula) {
      const stepRootIndex = (rootIndex + step.semitones) % 12;
      const stepRoot = NOTE_NAMES[stepRootIndex];
      const targetId = `${stepRoot}${step.quality}`;

      // Find in database
      if (this.chordsMap.has(targetId)) {
        resultChordIds.push(targetId);
      } else {
        // Fallback to closest matching quality
        const fallbackId = `${stepRoot}maj`;
        resultChordIds.push(this.chordsMap.has(fallbackId) ? fallbackId : startChord.id);
      }
    }

    return resultChordIds.slice(0, 7);
  }
}

/** Convert a MIDI note number to Frequency in Hertz */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert a note string like "C4" or "F#3" to MIDI note number */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return 60; // Default C4

  let root = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  if (ENHARMONIC_EQUIVALENTS[root]) {
    root = ENHARMONIC_EQUIVALENTS[root];
  }

  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return 60;

  return (octave + 1) * 12 + rootIndex;
}

/** Convert MIDI number to note name string (e.g. 60 -> "C4", 61 -> "C#4") */
export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

/** Get scale degree Roman numeral for a chord root given a progression key */
export function getScaleDegree(chordRoot: string, keyRoot: string): string {
  const chordNorm = ENHARMONIC_EQUIVALENTS[chordRoot] || chordRoot;
  const keyNorm = ENHARMONIC_EQUIVALENTS[keyRoot] || keyRoot;

  const chordIndex = NOTE_NAMES.indexOf(chordNorm);
  const keyIndex = NOTE_NAMES.indexOf(keyNorm);

  if (chordIndex === -1 || keyIndex === -1) return "I";

  const semitones = (chordIndex - keyIndex + 12) % 12;
  return ROMAN_NUMERALS[semitones] || "I";
}

/** Calculate transposed sounding note when capo is applied */
export function getCapoSoundingRoot(root: string, capo: number): string {
  if (capo === 0) return root;
  const norm = ENHARMONIC_EQUIVALENTS[root] || root;
  const index = NOTE_NAMES.indexOf(norm);
  if (index === -1) return root;
  const transposedIndex = (index + capo) % 12;
  return NOTE_NAMES[transposedIndex];
}

/** Calculate chord notes with inversion */
export function getInversionNotes(chord: Chord, inversionIndex: number): string[] {
  if (!chord.inversions || chord.inversions.length === 0) {
    return chord.notes;
  }
  const safeIndex = Math.min(Math.max(0, inversionIndex), chord.inversions.length - 1);
  return chord.inversions[safeIndex].notes;
}
