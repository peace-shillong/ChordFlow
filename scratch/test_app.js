import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const chordsPath = path.resolve(__dirname, '../data/chords.json');
const instPath = path.resolve(__dirname, '../data/instruments.json');
const strumPath = path.resolve(__dirname, '../data/strumPatterns.json');
const progPath = path.resolve(__dirname, '../data/progressions.json');

const chords = JSON.parse(fs.readFileSync(chordsPath, 'utf-8'));
const instruments = JSON.parse(fs.readFileSync(instPath, 'utf-8'));
const strumPatterns = JSON.parse(fs.readFileSync(strumPath, 'utf-8'));
const progressions = JSON.parse(fs.readFileSync(progPath, 'utf-8'));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log("=== Running ChordFlow System Validation Suite ===");

// 1. Chords Dataset
console.log("\n1. Testing Chords Dataset (144+ chords):");
assert(Array.isArray(chords) && chords.length >= 144, `Chord count >= 144 (found ${chords.length})`);

const chordIdMap = new Set(chords.map(c => c.id));
assert(chordIdMap.has("Cmaj"), "Includes C Major (Cmaj)");
assert(chordIdMap.has("Amin"), "Includes A Minor (Amin)");
assert(chordIdMap.has("G7"), "Includes G7");
assert(chordIdMap.has("Cmaj7"), "Includes Cmaj7");
assert(chordIdMap.has("Dmin7"), "Includes Dmin7");
assert(chordIdMap.has("F#dim"), "Includes F#dim");
assert(chordIdMap.has("Bdim7"), "Includes Bdim7");
assert(chordIdMap.has("Aaug"), "Includes Aaug");
assert(chordIdMap.has("Csus2"), "Includes Csus2");
assert(chordIdMap.has("Dsus4"), "Includes Dsus4");
assert(chordIdMap.has("Cadd9"), "Includes Cadd9");
assert(chordIdMap.has("Cm7b5"), "Includes Cm7b5");

let invalidInstruments = 0;
let invalidNotes = 0;
for (const chord of chords) {
  if (!chord.instruments || !chord.instruments.piano || !chord.instruments.guitar || !chord.instruments.ukulele || !chord.instruments.harmonica) {
    invalidInstruments++;
  }
  if (!Array.isArray(chord.notes) || chord.notes.length === 0) {
    invalidNotes++;
  }
}
assert(invalidInstruments === 0, `All chords have full instrument definitions for Piano, Guitar, Ukulele, Harmonica`);
assert(invalidNotes === 0, `All chords have non-empty notes arrays`);

// 2. Progressions Dataset
console.log("\n2. Testing Progressions Dataset:");
assert(Array.isArray(progressions) && progressions.length >= 20, `Progression count >= 20 (found ${progressions.length})`);

let invalidProgChords = 0;
for (const prog of progressions) {
  assert(prog.chords.length >= 4 && prog.chords.length <= 7, `${prog.name} has 4–7 chords (${prog.chords.length})`);
  for (const cId of prog.chords) {
    if (!chordIdMap.has(cId)) {
      console.error(`Unknown chord ${cId} in progression ${prog.id}`);
      invalidProgChords++;
    }
  }
}
assert(invalidProgChords === 0, `All progression chords exist in chord database`);

// 3. Instruments Dataset
console.log("\n3. Testing Instruments Dataset:");
assert(instruments.length === 4, `Found 4 instruments: Piano, Guitar, Ukulele, Harmonica`);
const guitar = instruments.find(i => i.id === "guitar");
assert(guitar && guitar.tunings.length >= 5, `Guitar includes multiple tunings (Standard, Drop D, DADGAD, Open G/D)`);
const ukulele = instruments.find(i => i.id === "ukulele");
assert(ukulele && ukulele.tunings.length >= 3, `Ukulele includes standard, low G, D-tuning`);

// 4. Strum Patterns
console.log("\n4. Testing Strum Patterns Dataset:");
assert(strumPatterns.length >= 6, `Found ${strumPatterns.length} strumming patterns`);
assert(strumPatterns.some(s => s.id === "basic"), `Includes Basic Down-Up pattern`);
assert(strumPatterns.some(s => s.id === "pop_rock"), `Includes Pop/Rock drive pattern`);
assert(strumPatterns.some(s => s.id === "island"), `Includes Island pattern`);
assert(strumPatterns.some(s => s.id === "swing"), `Includes Jazz Swing pattern`);

console.log(`\n=== Validation Summary: ${passed} Passed, ${failed} Failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
