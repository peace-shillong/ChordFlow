export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const ENHARMONIC_EQUIVALENTS = {
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
export const INTERVAL_NAMES = {
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
    constructor() {
        this.chords = [];
        this.chordsMap = new Map();
        this.instruments = [];
        this.strumPatterns = [];
        this.progressions = [];
    }
    async loadAll() {
        try {
            const [chordsRes, instRes, strumRes, progRes] = await Promise.all([
                fetch("./data/chords.json"),
                fetch("./data/instruments.json"),
                fetch("./data/strumPatterns.json"),
                fetch("./data/progressions.json")
            ]);
            this.chords = (await chordsRes.json());
            this.instruments = (await instRes.json());
            this.strumPatterns = (await strumRes.json());
            this.progressions = (await progRes.json());
            this.chordsMap.clear();
            for (const chord of this.chords) {
                this.chordsMap.set(chord.id, chord);
                this.chordsMap.set(chord.symbol.toLowerCase(), chord);
                this.chordsMap.set(chord.name.toLowerCase(), chord);
            }
        }
        catch (err) {
            console.error("Failed to fetch ChordFlow JSON datasets:", err);
            throw err;
        }
    }
    getAllChords() {
        return this.chords;
    }
    getChordById(id) {
        return this.chordsMap.get(id);
    }
    findChord(query) {
        const trimmed = query.trim().toLowerCase();
        return this.chordsMap.get(trimmed) || this.chords.find(c => c.id.toLowerCase() === trimmed ||
            c.symbol.toLowerCase() === trimmed ||
            c.name.toLowerCase() === trimmed);
    }
    filterChords(root, quality, query) {
        return this.chords.filter(chord => {
            if (root && root !== "all") {
                const normalizedRoot = ENHARMONIC_EQUIVALENTS[root] || root;
                const chordNormRoot = ENHARMONIC_EQUIVALENTS[chord.root] || chord.root;
                if (chordNormRoot !== normalizedRoot)
                    return false;
            }
            if (quality && quality !== "all" && chord.quality !== quality) {
                return false;
            }
            if (query && query.trim().length > 0) {
                const q = query.trim().toLowerCase();
                const matchesName = chord.name.toLowerCase().includes(q);
                const matchesSymbol = chord.symbol.toLowerCase().includes(q);
                const matchesRoot = chord.root.toLowerCase().includes(q);
                if (!matchesName && !matchesSymbol && !matchesRoot)
                    return false;
            }
            return true;
        });
    }
    getInstruments() {
        return this.instruments;
    }
    getInstrument(id) {
        return this.instruments.find(inst => inst.id === id);
    }
    getStrumPatterns() {
        return this.strumPatterns;
    }
    getStrumPattern(id) {
        return this.strumPatterns.find(p => p.id === id) || this.strumPatterns[0];
    }
    getProgressions() {
        return this.progressions;
    }
    getProgression(id) {
        return this.progressions.find(p => p.id === id);
    }
}
/** Convert a MIDI note number to Frequency in Hertz */
export function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}
/** Convert a note string like "C4" or "F#3" to MIDI note number */
export function noteNameToMidi(noteName) {
    const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
    if (!match)
        return 60; // Default C4
    let root = match[1].toUpperCase();
    const octave = parseInt(match[2], 10);
    if (ENHARMONIC_EQUIVALENTS[root]) {
        root = ENHARMONIC_EQUIVALENTS[root];
    }
    const rootIndex = NOTE_NAMES.indexOf(root);
    if (rootIndex === -1)
        return 60;
    return (octave + 1) * 12 + rootIndex;
}
/** Convert MIDI number to note name string (e.g. 60 -> "C4", 61 -> "C#4") */
export function midiToNoteName(midi) {
    const note = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
}
/** Get scale degree Roman numeral for a chord root given a progression key */
export function getScaleDegree(chordRoot, keyRoot) {
    const chordNorm = ENHARMONIC_EQUIVALENTS[chordRoot] || chordRoot;
    const keyNorm = ENHARMONIC_EQUIVALENTS[keyRoot] || keyRoot;
    const chordIndex = NOTE_NAMES.indexOf(chordNorm);
    const keyIndex = NOTE_NAMES.indexOf(keyNorm);
    if (chordIndex === -1 || keyIndex === -1)
        return "I";
    const semitones = (chordIndex - keyIndex + 12) % 12;
    return ROMAN_NUMERALS[semitones] || "I";
}
/** Calculate transposed sounding note when capo is applied */
export function getCapoSoundingRoot(root, capo) {
    if (capo === 0)
        return root;
    const norm = ENHARMONIC_EQUIVALENTS[root] || root;
    const index = NOTE_NAMES.indexOf(norm);
    if (index === -1)
        return root;
    const transposedIndex = (index + capo) % 12;
    return NOTE_NAMES[transposedIndex];
}
/** Calculate chord notes with inversion */
export function getInversionNotes(chord, inversionIndex) {
    if (!chord.inversions || chord.inversions.length === 0) {
        return chord.notes;
    }
    const safeIndex = Math.min(Math.max(0, inversionIndex), chord.inversions.length - 1);
    return chord.inversions[safeIndex].notes;
}
//# sourceMappingURL=chord.js.map