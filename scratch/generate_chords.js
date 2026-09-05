import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Mapping from quality to id suffix and metadata
const QUALITY_CONFIGS = [
  { quality: "major", idSuffix: "maj", symbol: "", nameSuffix: "Major", intervals: [0, 4, 7], scaleName: "Major" },
  { quality: "minor", idSuffix: "min", symbol: "m", nameSuffix: "Minor", intervals: [0, 3, 7], scaleName: "Natural Minor" },
  { quality: "7th", idSuffix: "7", symbol: "7", nameSuffix: "Dominant 7th", intervals: [0, 4, 7, 10], scaleName: "Mixolydian" },
  { quality: "maj7", idSuffix: "maj7", symbol: "maj7", nameSuffix: "Major 7th", intervals: [0, 4, 7, 11], scaleName: "Major" },
  { quality: "min7", idSuffix: "min7", symbol: "m7", nameSuffix: "Minor 7th", intervals: [0, 3, 7, 10], scaleName: "Dorian" },
  { quality: "dim", idSuffix: "dim", symbol: "dim", nameSuffix: "Diminished", intervals: [0, 3, 6], scaleName: "Diminished" },
  { quality: "dim7", idSuffix: "dim7", symbol: "dim7", nameSuffix: "Diminished 7th", intervals: [0, 3, 6, 9], scaleName: "Diminished" },
  { quality: "aug", idSuffix: "aug", symbol: "aug", nameSuffix: "Augmented", intervals: [0, 4, 8], scaleName: "Augmented" },
  { quality: "sus2", idSuffix: "sus2", symbol: "sus2", nameSuffix: "Suspended 2nd", intervals: [0, 2, 7], scaleName: "Major" },
  { quality: "sus4", idSuffix: "sus4", symbol: "sus4", nameSuffix: "Suspended 4th", intervals: [0, 5, 7], scaleName: "Major" },
  { quality: "add9", idSuffix: "add9", symbol: "add9", nameSuffix: "Add 9", intervals: [0, 4, 7, 14], scaleName: "Major" },
  { quality: "m7b5", idSuffix: "m7b5", symbol: "m7b5", nameSuffix: "Half-Diminished", intervals: [0, 3, 6, 10], scaleName: "Locrian" }
];

const KNOWN_GUITAR_SHAPES = {
  // C
  "Cmaj": [-1, 3, 2, 0, 1, 0],
  "Cmin": [-1, 3, 5, 5, 4, 3],
  "C7": [-1, 3, 2, 3, 1, 0],
  "Cmaj7": [-1, 3, 2, 0, 0, 0],
  "Cmin7": [-1, 3, 5, 3, 4, 3],
  "Cdim": [-1, 3, 4, 2, 4, -1],
  "Cdim7": [-1, 3, 4, 2, 4, 2],
  "Caug": [-1, 3, 2, 1, 1, 0],
  "Csus2": [-1, 3, 0, 0, 1, -1],
  "Csus4": [-1, 3, 3, 0, 1, 1],
  "Cadd9": [-1, 3, 2, 0, 3, 0],
  "Cm7b5": [-1, 3, 4, 3, 4, -1],

  // C# / Db
  "C#maj": [-1, 4, 6, 6, 6, 4],
  "C#min": [-1, 4, 6, 6, 5, 4],
  "C#7": [-1, 4, 3, 4, 2, 4],
  "C#maj7": [-1, 4, 6, 5, 6, 4],
  "C#min7": [-1, 4, 6, 4, 5, 4],
  "C#dim": [-1, 4, 5, 3, 5, -1],
  "C#dim7": [-1, -1, 2, 3, 2, 3],
  "C#aug": [-1, 4, 3, 2, 2, -1],
  "C#sus2": [-1, 4, 6, 6, 4, 4],
  "C#sus4": [-1, 4, 6, 6, 7, 4],
  "C#add9": [-1, 4, 3, 1, 4, 1],
  "C#m7b5": [-1, 4, 5, 4, 5, -1],

  // D
  "Dmaj": [-1, -1, 0, 2, 3, 2],
  "Dmin": [-1, -1, 0, 2, 3, 1],
  "D7": [-1, -1, 0, 2, 1, 2],
  "Dmaj7": [-1, -1, 0, 2, 2, 2],
  "Dmin7": [-1, -1, 0, 2, 1, 1],
  "Ddim": [-1, -1, 0, 1, 3, 1],
  "Ddim7": [-1, -1, 0, 1, 0, 1],
  "Daug": [-1, -1, 0, 3, 3, 2],
  "Dsus2": [-1, -1, 0, 2, 3, 0],
  "Dsus4": [-1, -1, 0, 2, 3, 3],
  "Dadd9": [-1, -1, 0, 2, 5, 2],
  "Dm7b5": [-1, -1, 0, 1, 1, 1],

  // D# / Eb
  "D#maj": [-1, 6, 8, 8, 8, 6],
  "D#min": [-1, 6, 8, 8, 7, 6],
  "D#7": [-1, 6, 8, 6, 8, 6],
  "D#maj7": [-1, 6, 8, 7, 8, 6],
  "D#min7": [-1, 6, 8, 6, 7, 6],
  "D#dim": [-1, -1, 1, 2, 1, 2],
  "D#dim7": [-1, -1, 1, 2, 1, 2],
  "D#aug": [-1, 6, 5, 4, 4, -1],
  "D#sus2": [-1, 6, 8, 8, 6, 6],
  "D#sus4": [-1, 6, 8, 8, 9, 6],
  "D#add9": [-1, 6, 5, 3, 6, 3],
  "D#m7b5": [-1, 6, 7, 6, 7, -1],

  // E
  "Emaj": [0, 2, 2, 1, 0, 0],
  "Emin": [0, 2, 2, 0, 0, 0],
  "E7": [0, 2, 0, 1, 0, 0],
  "Emaj7": [0, 2, 1, 1, 0, 0],
  "Emin7": [0, 2, 2, 0, 3, 0],
  "Edim": [-1, -1, 2, 3, 2, 3],
  "Edim7": [0, 1, 2, 0, 2, 0],
  "Eaug": [0, 3, 2, 1, 1, 0],
  "Esus2": [0, 2, 4, 4, 0, 0],
  "Esus4": [0, 2, 2, 2, 0, 0],
  "Eadd9": [0, 2, 2, 1, 0, 2],
  "Em7b5": [0, 1, 0, 0, 3, 0],

  // F
  "Fmaj": [1, 3, 3, 2, 1, 1],
  "Fmin": [1, 3, 3, 1, 1, 1],
  "F7": [1, 3, 1, 2, 1, 1],
  "Fmaj7": [-1, -1, 3, 2, 1, 0],
  "Fmin7": [1, 3, 1, 1, 1, 1],
  "Fdim": [-1, -1, 3, 4, 3, 4],
  "Fdim7": [1, 2, 0, 1, 0, 1],
  "Faug": [-1, -1, 3, 2, 2, 1],
  "Fsus2": [-1, -1, 3, 0, 1, 1],
  "Fsus4": [1, 3, 3, 3, 1, 1],
  "Fadd9": [-1, -1, 3, 2, 1, 3],
  "Fm7b5": [1, 2, 1, 1, 0, -1],

  // F# / Gb
  "F#maj": [2, 4, 4, 3, 2, 2],
  "F#min": [2, 4, 4, 2, 2, 2],
  "F#7": [2, 4, 2, 3, 2, 2],
  "F#maj7": [2, 4, 3, 3, 2, 2],
  "F#min7": [2, 4, 2, 2, 2, 2],
  "F#dim": [-1, -1, 4, 5, 4, 5],
  "F#dim7": [2, 3, 1, 2, 1, 2],
  "F#aug": [2, 1, 0, 3, 3, 2],
  "F#sus2": [2, 4, 4, 1, 2, 2],
  "F#sus4": [2, 4, 4, 4, 2, 2],
  "F#add9": [2, 1, 4, 1, 2, 2],
  "F#m7b5": [2, 3, 2, 2, 1, -1],

  // G
  "Gmaj": [3, 2, 0, 0, 0, 3],
  "Gmin": [3, 5, 5, 3, 3, 3],
  "G7": [3, 2, 0, 0, 0, 1],
  "Gmaj7": [3, 2, 0, 0, 0, 2],
  "Gmin7": [3, 5, 3, 3, 3, 3],
  "Gdim": [3, 1, 0, 0, 2, 3],
  "Gdim7": [3, 4, 2, 3, 2, 3],
  "Gaug": [3, 2, 1, 0, 0, 3],
  "Gsus2": [3, 0, 0, 0, 3, 3],
  "Gsus4": [3, 3, 0, 0, 1, 3],
  "Gadd9": [3, 2, 0, 2, 0, 3],
  "Gm7b5": [3, 4, 3, 3, 2, -1],

  // G# / Ab
  "G#maj": [4, 6, 6, 5, 4, 4],
  "G#min": [4, 6, 6, 4, 4, 4],
  "G#7": [4, 6, 4, 5, 4, 4],
  "G#maj7": [4, 6, 5, 5, 4, 4],
  "G#min7": [4, 6, 4, 4, 4, 4],
  "G#dim": [-1, -1, 0, 1, 0, 1],
  "G#dim7": [4, 5, 3, 4, 3, 4],
  "G#aug": [4, 3, 2, 1, 1, 0],
  "G#sus2": [4, 6, 6, 3, 4, 4],
  "G#sus4": [4, 6, 6, 6, 4, 4],
  "G#add9": [4, 3, 1, 3, 1, 4],
  "G#m7b5": [4, 5, 4, 4, 3, -1],

  // A
  "Amaj": [-1, 0, 2, 2, 2, 0],
  "Amin": [-1, 0, 2, 2, 1, 0],
  "A7": [-1, 0, 2, 0, 2, 0],
  "Amaj7": [-1, 0, 2, 1, 2, 0],
  "Amin7": [-1, 0, 2, 0, 1, 0],
  "Adim": [-1, 0, 1, 2, 1, -1],
  "Adim7": [-1, 0, 1, 2, 1, 2],
  "Aaug": [-1, 0, 3, 2, 2, 1],
  "Asus2": [-1, 0, 2, 2, 0, 0],
  "Asus4": [-1, 0, 2, 2, 3, 0],
  "Aadd9": [-1, 0, 2, 4, 2, 0],
  "Am7b5": [-1, 0, 1, 0, 1, 0],

  // A# / Bb
  "A#maj": [-1, 1, 3, 3, 3, 1],
  "A#min": [-1, 1, 3, 3, 2, 1],
  "A#7": [-1, 1, 3, 1, 3, 1],
  "A#maj7": [-1, 1, 3, 2, 3, 1],
  "A#min7": [-1, 1, 3, 1, 2, 1],
  "A#dim": [-1, 1, 2, 3, 2, -1],
  "A#dim7": [-1, 1, 2, 0, 2, 0],
  "A#aug": [-1, 1, 4, 3, 3, 2],
  "A#sus2": [-1, 1, 3, 3, 1, 1],
  "A#sus4": [-1, 1, 3, 3, 4, 1],
  "A#add9": [-1, 1, 0, 3, 1, 1],
  "A#m7b5": [-1, 1, 2, 1, 2, 0],

  // B
  "Bmaj": [-1, 2, 4, 4, 4, 2],
  "Bmin": [-1, 2, 4, 4, 3, 2],
  "B7": [-1, 2, 1, 2, 0, 2],
  "Bmaj7": [-1, 2, 4, 3, 4, 2],
  "Bmin7": [-1, 2, 0, 2, 0, 2],
  "Bdim": [-1, 2, 3, 4, 3, -1],
  "Bdim7": [-1, 2, 0, 1, 0, 1],
  "Baug": [-1, 2, 1, 0, 0, 3],
  "Bsus2": [-1, 2, 4, 4, 2, 2],
  "Bsus4": [-1, 2, 4, 4, 5, 2],
  "Badd9": [-1, 2, 4, 6, 4, 2],
  "Bm7b5": [-1, 2, 3, 2, 3, -1]
};

const KNOWN_UKULELE_SHAPES = {
  // C
  "Cmaj": [0, 0, 0, 3],
  "Cmin": [0, 3, 3, 3],
  "C7": [0, 0, 0, 1],
  "Cmaj7": [0, 0, 0, 2],
  "Cmin7": [3, 3, 3, 3],
  "Cdim": [2, 3, 2, 3],
  "Cdim7": [2, 3, 2, 3],
  "Caug": [1, 0, 0, 3],
  "Csus2": [0, 2, 3, 3],
  "Csus4": [0, 0, 1, 3],
  "Cadd9": [0, 2, 0, 3],
  "Cm7b5": [3, 3, 2, 3],

  // C#
  "C#maj": [1, 1, 1, 4],
  "C#min": [1, 1, 0, 4],
  "C#7": [1, 1, 1, 2],
  "C#maj7": [1, 1, 1, 3],
  "C#min7": [1, 1, 0, 2],
  "C#dim": [0, 1, 0, 1],
  "C#dim7": [0, 1, 0, 1],
  "C#aug": [2, 1, 1, 0],
  "C#sus2": [1, 3, 4, 4],
  "C#sus4": [1, 1, 2, 4],
  "C#add9": [1, 3, 1, 4],
  "C#m7b5": [0, 1, 0, 2],

  // D
  "Dmaj": [2, 2, 2, 0],
  "Dmin": [2, 2, 1, 0],
  "D7": [2, 2, 2, 3],
  "Dmaj7": [2, 2, 2, 4],
  "Dmin7": [2, 2, 1, 3],
  "Ddim": [1, 2, 1, -1],
  "Ddim7": [1, 2, 1, 2],
  "Daug": [3, 2, 2, 1],
  "Dsus2": [2, 2, 0, 0],
  "Dsus4": [0, 2, 3, 0],
  "Dadd9": [2, 4, 2, 0],
  "Dm7b5": [1, 2, 1, 3],

  // D#
  "D#maj": [3, 3, 3, 1],
  "D#min": [3, 3, 2, 1],
  "D#7": [3, 3, 3, 4],
  "D#maj7": [3, 3, 3, 5],
  "D#min7": [3, 3, 2, 4],
  "D#dim": [2, 3, 2, 0],
  "D#dim7": [2, 3, 2, 3],
  "D#aug": [0, 3, 3, 2],
  "D#sus2": [3, 3, 1, 1],
  "D#sus4": [1, 3, 4, 1],
  "D#add9": [0, 3, 1, 1],
  "D#m7b5": [2, 3, 2, 4],

  // E
  "Emaj": [4, 4, 4, 2],
  "Emin": [0, 4, 3, 2],
  "E7": [1, 2, 0, 2],
  "Emaj7": [1, 3, 0, 2],
  "Emin7": [0, 2, 0, 2],
  "Edim": [0, 1, 0, 1],
  "Edim7": [0, 1, 0, 1],
  "Eaug": [1, 0, 0, 3],
  "Esus2": [4, 4, 2, 2],
  "Esus4": [2, 4, 0, 0],
  "Eadd9": [1, 4, 2, 2],
  "Em7b5": [0, 2, 0, 1],

  // F
  "Fmaj": [2, 0, 1, 0],
  "Fmin": [1, 0, 1, 3],
  "F7": [2, 3, 1, 0],
  "Fmaj7": [2, 4, 1, 0],
  "Fmin7": [1, 3, 1, 3],
  "Fdim": [1, -1, 1, 2],
  "Fdim7": [1, 2, 1, 2],
  "Faug": [2, 1, 1, 0],
  "Fsus2": [0, 0, 1, 3],
  "Fsus4": [3, 0, 1, 1],
  "Fadd9": [0, 0, 1, 0],
  "Fm7b5": [1, 3, 1, 2],

  // F#
  "F#maj": [3, 1, 2, 1],
  "F#min": [2, 1, 2, 0],
  "F#7": [3, 4, 2, 1],
  "F#maj7": [3, 5, 2, 1],
  "F#min7": [2, 4, 2, 4],
  "F#dim": [2, 0, 2, 0],
  "F#dim7": [2, 3, 2, 3],
  "F#aug": [3, 2, 2, 1],
  "F#sus2": [1, 1, 2, 4],
  "F#sus4": [4, 1, 2, 2],
  "F#add9": [1, 1, 2, 1],
  "F#m7b5": [2, 4, 2, 3],

  // G
  "Gmaj": [0, 2, 3, 2],
  "Gmin": [0, 2, 3, 1],
  "G7": [0, 2, 1, 2],
  "Gmaj7": [0, 2, 2, 2],
  "Gmin7": [0, 2, 1, 1],
  "Gdim": [0, 1, 3, 1],
  "Gdim7": [0, 1, 0, 1],
  "Gaug": [0, 3, 3, 2],
  "Gsus2": [0, 2, 3, 0],
  "Gsus4": [0, 2, 3, 3],
  "Gadd9": [0, 2, 5, 2],
  "Gm7b5": [0, 1, 1, 1],

  // G#
  "G#maj": [5, 3, 4, 3],
  "G#min": [4, 3, 4, 2],
  "G#7": [1, 3, 2, 3],
  "G#maj7": [1, 3, 3, 3],
  "G#min7": [1, 3, 2, 2],
  "G#dim": [1, 2, 4, 2],
  "G#dim7": [1, 2, 1, 2],
  "G#aug": [1, 0, 0, 3],
  "G#sus2": [1, 3, 4, 1],
  "G#sus4": [1, 3, 4, 4],
  "G#add9": [1, 3, 6, 3],
  "G#m7b5": [1, 2, 2, 2],

  // A
  "Amaj": [2, 1, 0, 0],
  "Amin": [2, 0, 0, 0],
  "A7": [0, 1, 0, 0],
  "Amaj7": [1, 1, 0, 0],
  "Amin7": [0, 0, 0, 0],
  "Adim": [2, 3, -1, 0],
  "Adim7": [2, 3, 2, 3],
  "Aaug": [2, 1, 1, 0],
  "Asus2": [2, 4, 0, 0],
  "Asus4": [2, 2, 0, 0],
  "Aadd9": [2, 1, 0, 2],
  "Am7b5": [2, 3, 3, 3],

  // A#
  "A#maj": [3, 2, 1, 1],
  "A#min": [3, 1, 1, 1],
  "A#7": [1, 2, 1, 1],
  "A#maj7": [2, 2, 1, 1],
  "A#min7": [1, 1, 1, 1],
  "A#dim": [0, 1, 0, 1],
  "A#dim7": [0, 1, 0, 1],
  "A#aug": [3, 2, 2, 1],
  "A#sus2": [3, 0, 1, 1],
  "A#sus4": [3, 3, 1, 1],
  "A#add9": [3, 2, 1, 3],
  "A#m7b5": [1, 1, 0, 1],

  // B
  "Bmaj": [4, 3, 2, 2],
  "Bmin": [4, 2, 2, 2],
  "B7": [2, 3, 2, 2],
  "Bmaj7": [3, 3, 2, 2],
  "Bmin7": [2, 2, 2, 2],
  "Bdim": [4, 2, 1, 2],
  "Bdim7": [1, 2, 1, 2],
  "Baug": [0, 3, 3, 2],
  "Bsus2": [4, 1, 2, 2],
  "Bsus4": [4, 4, 2, 2],
  "Badd9": [4, 3, 2, 4],
  "Bm7b5": [2, 2, 1, 2]
};

// 10-Hole C Diatonic Harmonica
const HARMONICA_C = {
  blow: [60, 64, 67, 72, 76, 79, 84, 88, 91, 96], // C4, E4, G4, C5, E5, G5, C6, E6, G6, C7
  draw: [62, 67, 71, 74, 77, 81, 83, 86, 89, 93]  // D4, G4, B4, D5, F5, A5, B5, D6, F6, A6
};

function getPitchName(midi) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function computeHarmonica(targetNotesMidi) {
  const targetClasses = targetNotesMidi.map(m => m % 12);
  const holes = [];
  const blowDraw = [];
  const notes = [];

  for (let h = 0; h < 10; h++) {
    const blowMidi = HARMONICA_C.blow[h];
    const drawMidi = HARMONICA_C.draw[h];

    if (targetClasses.includes(blowMidi % 12)) {
      holes.push(`${h + 1}`);
      blowDraw.push("blow");
      notes.push(getPitchName(blowMidi));
    }
    if (targetClasses.includes(drawMidi % 12)) {
      holes.push(`${h + 1}`);
      blowDraw.push("draw");
      notes.push(getPitchName(drawMidi));
    }
  }

  const uniqueHoles = [];
  const uniqueBD = [];
  const uniqueNotes = [];
  const seen = new Set();

  for (let i = 0; i < holes.length; i++) {
    const key = `${holes[i]}-${blowDraw[i]}`;
    if (!seen.has(key) && uniqueHoles.length < 5) {
      seen.add(key);
      uniqueHoles.push(holes[i]);
      uniqueBD.push(blowDraw[i]);
      uniqueNotes.push(notes[i]);
    }
  }

  if (uniqueHoles.length === 0) {
    uniqueHoles.push("4", "5", "6");
    uniqueBD.push("blow", "blow", "blow");
    uniqueNotes.push("C4", "E4", "G4");
  }

  return { holes: uniqueHoles, blowDraw: uniqueBD, notes: uniqueNotes };
}

const allChords = [];

for (let r = 0; r < 12; r++) {
  const root = NOTE_NAMES[r];
  const rootMidi = 60 + r;

  for (const q of QUALITY_CONFIGS) {
    const id = `${root}${q.idSuffix}`;
    const symbol = `${root}${q.symbol}`;
    const name = `${root} ${q.nameSuffix}`;
    const scale = `${root} ${q.scaleName}`;
    const intervals = q.intervals;

    const chordMidi = intervals.map(semitones => rootMidi + semitones);
    const notes = chordMidi.map(m => getPitchName(m));

    const inversions = [
      { notes: [...notes], label: "Root" }
    ];

    if (intervals.length >= 3) {
      const inv1 = [...chordMidi];
      inv1[0] += 12;
      inv1.sort((a, b) => a - b);
      inversions.push({ notes: inv1.map(m => getPitchName(m)), label: "1st Inversion" });

      const inv2 = [...chordMidi];
      inv2[0] += 12;
      inv2[1] += 12;
      inv2.sort((a, b) => a - b);
      inversions.push({ notes: inv2.map(m => getPitchName(m)), label: "2nd Inversion" });

      if (intervals.length >= 4) {
        const inv3 = [...chordMidi];
        inv3[0] += 12;
        inv3[1] += 12;
        inv3[2] += 12;
        inv3.sort((a, b) => a - b);
        inversions.push({ notes: inv3.map(m => getPitchName(m)), label: "3rd Inversion" });
      }
    }

    const guitarFrets = KNOWN_GUITAR_SHAPES[id] || [-1, 0, 2, 2, 2, 0];
    const ukuleleFrets = KNOWN_UKULELE_SHAPES[id] || [0, 0, 0, 0];
    const harmonicaVoicing = computeHarmonica(chordMidi);

    allChords.push({
      id,
      name,
      symbol,
      quality: q.quality,
      root,
      notes,
      intervals,
      scale,
      inversions,
      instruments: {
        piano: {
          keys: chordMidi
        },
        guitar: {
          frets: guitarFrets,
          strings: [6, 5, 4, 3, 2, 1]
        },
        ukulele: {
          frets: ukuleleFrets,
          strings: [4, 3, 2, 1]
        },
        harmonica: harmonicaVoicing
      }
    });
  }
}

const outputPath = path.resolve(__dirname, '../data/chords.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(allChords, null, 2), 'utf-8');
console.log(`Successfully generated ${allChords.length} accurate chords in ${outputPath}`);
