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
  "Db": "C#",
  "Eb": "D#",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#",
  "B#": "C",
  "E#": "F",
  "Cb": "B",
  "Fb": "E"
};

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
      if (root && root !== "all") {
        const normalizedRoot = ENHARMONIC_EQUIVALENTS[root] || root;
        const chordNormRoot = ENHARMONIC_EQUIVALENTS[chord.root] || chord.root;
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
