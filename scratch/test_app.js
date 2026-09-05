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
// 5. Progression Generator & Filter Tests
console.log("\n5. Testing Progression Generator & Root Filter Algorithm:");
import('../dist/chord.js').then(({ GENERATOR_STYLES, NOTE_NAMES, ENHARMONIC_EQUIVALENTS, normalizeRoot, ChordDatabase }) => {
  assert(GENERATOR_STYLES.length >= 10, `Found ${GENERATOR_STYLES.length} progression generator styles`);

  function testGenerate(startChordId, styleId) {
    const startChord = chords.find(c => c.id === startChordId) || chords[0];
    const style = GENERATOR_STYLES.find(s => s.id === styleId) || GENERATOR_STYLES[0];
    const rootNorm = ENHARMONIC_EQUIVALENTS[startChord.root] || startChord.root;
    let rootIndex = NOTE_NAMES.indexOf(rootNorm);
    if (rootIndex === -1) rootIndex = 0;

    const result = [];
    for (const step of style.formula) {
      const stepRootIndex = (rootIndex + step.semitones) % 12;
      const stepRoot = NOTE_NAMES[stepRootIndex];
      const targetId = `${stepRoot}${step.quality}`;
      const found = chordIdMap.has(targetId) ? targetId : `${stepRoot}maj`;
      result.push(found);
    }
    return result;
  }

  // Test Japanese Royal Road from C
  const royalRoadC = testGenerate("Cmaj", "jp_royal_road");
  assert(royalRoadC[0] === "Cmaj", `Royal Road starting chord is Cmaj (${royalRoadC.join(" -> ")})`);
  assert(royalRoadC.length >= 4 && royalRoadC.length <= 7, `Royal Road generated 4-7 chords`);

  // Test Circle of Fifths from G
  const circleG = testGenerate("Gmaj", "circle_full_7");
  assert(circleG[0] === "Gmaj", `Circle of Fifths starting chord is Gmaj (${circleG.join(" -> ")})`);
  assert(circleG.length === 7, `Circle of Fifths generated 7 chords`);

  // Test Pop 4-Chord from D
  const popD = testGenerate("Dmaj", "pop_axis_4");
  assert(popD[0] === "Dmaj", `Pop 4-chord starting chord is Dmaj (${popD.join(" -> ")})`);

  // Test Just The Two of Us from F
  const jtwoF = testGenerate("Fmaj", "jp_just_two_us");
  assert(jtwoF[0] === "Fmaj7", `Just The Two of Us starting chord is Fmaj7 (${jtwoF.join(" -> ")})`);

  // 6. Test Root Filtering & Enharmonics
  console.log("\n6. Testing Root Filter & Search Resolution:");
  function mockFilter(root, quality, query) {
    return chords.filter(chord => {
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

  const cChordsLower = mockFilter("c", "all", "");
  assert(cChordsLower.length === 12, `Root filter 'c' returns all 12 C chords (found ${cChordsLower.length})`);
  
  const cChordsUpper = mockFilter("C", "all", "");
  assert(cChordsUpper.length === 12, `Root filter 'C' returns all 12 C chords (found ${cChordsUpper.length})`);

  const gChords = mockFilter("g", "all", "");
  assert(gChords.length === 12, `Root filter 'g' returns all 12 G chords (found ${gChords.length})`);

  const dbChords = mockFilter("Db", "all", "");
  assert(dbChords.length === 12, `Root filter 'Db' (enharmonic C#) returns 12 chords (found ${dbChords.length})`);

  const cSharpChords = mockFilter("C#", "all", "");
  assert(cSharpChords.length === 12, `Root filter 'C#' returns 12 chords (found ${cSharpChords.length})`);

  const cMajOnly = mockFilter("C", "major", "");
  assert(cMajOnly.length === 1 && cMajOnly[0].id === "Cmaj", `Filtering C + major returns exactly Cmaj`);

  console.log(`\n=== Validation Summary: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) process.exit(1);
});
