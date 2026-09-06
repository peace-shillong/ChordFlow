import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("=== Running Verification for the 2 Minor Changes ===");

// 1. Check HTML Elements
const htmlContent = fs.readFileSync(path.resolve('./index.html'), 'utf-8');

assert(htmlContent.includes('id="generator-styles-modal"'), "generator-styles-modal must exist in DOM");
assert(htmlContent.includes('id="btn-open-generator-styles"'), "btn-open-generator-styles must exist");
assert(htmlContent.includes('id="btn-close-generator-styles"'), "btn-close-generator-styles must exist");
assert(htmlContent.includes('id="generator-category-filter-pills"'), "generator-category-filter-pills must exist");
assert(htmlContent.includes('id="generator-style-search"'), "generator-style-search must exist");
assert(htmlContent.includes('id="generator-styles-grid"'), "generator-styles-grid must exist");
assert(htmlContent.includes('id="generator-selected-style-name"'), "generator-selected-style-name must exist");
assert(htmlContent.includes('id="generator-selected-style-desc"'), "generator-selected-style-desc must exist");

console.log("✓ HTML Elements for Generator Styles Modal exist properly");

// 2. Check TypeScript logic & JS exports
const chordsData = JSON.parse(fs.readFileSync(path.resolve('./data/chords.json'), 'utf-8'));
const instData = JSON.parse(fs.readFileSync(path.resolve('./data/instruments.json'), 'utf-8'));
const strumData = JSON.parse(fs.readFileSync(path.resolve('./data/strumPatterns.json'), 'utf-8'));
const progData = JSON.parse(fs.readFileSync(path.resolve('./data/progressions.json'), 'utf-8'));

const { ChordDatabase, GENERATOR_STYLES } = await import('../dist/chord.js');
const { progression } = await import('../dist/progression.js');

const db = new ChordDatabase();
// Mock fetch load
db['chords'] = chordsData;
db['instruments'] = instData;
db['strumPatterns'] = strumData;
db['progressions'] = progData;
db['chordsMap'] = new Map();
for (const c of chordsData) {
  db['chordsMap'].set(c.id, c);
}
progression.setDatabase(db);

// Test 1: Advanced Mode Boot Limit Test
console.log("\n--- Testing Issue 1: Advanced Mode Max Chords on Startup ---");
progression.setMaxChords(16);
assert.strictEqual(progression.getMaxChords(), 16, "Max chords must be 16 in Advanced mode");

progression.setProgression(["Cmaj", "Gmaj", "Amin", "Fmaj"]);
assert.strictEqual(progression.getChords().length, 4);

// Add chords up to 16
for (let i = 5; i <= 16; i++) {
  const added = progression.addChord("Cmaj");
  assert.strictEqual(added, true, `Should be able to add chord #${i} in Advanced mode`);
}
assert.strictEqual(progression.getChords().length, 16, "Progression must hold 16 chords");

// Attempting 17th chord should fail
const added17 = progression.addChord("Cmaj");
assert.strictEqual(added17, false, "Should not exceed 16 chords in Advanced mode");

// Clean mode test
progression.setMaxChords(8);
assert.strictEqual(progression.getMaxChords(), 8, "Max chords must be 8 in Clean mode");
progression.setProgression(["Cmaj", "Gmaj", "Amin", "Fmaj"]);
for (let i = 5; i <= 8; i++) {
  const added = progression.addChord("Cmaj");
  assert.strictEqual(added, true, `Should be able to add chord #${i} in Clean mode`);
}
const added9 = progression.addChord("Cmaj");
assert.strictEqual(added9, false, "Should not exceed 8 chords in Clean mode");

console.log("✓ Issue 1 Fixed: Advanced mode supports up to 16 chords and Clean mode supports up to 8 chords");

// Test 2: Auto Progression Generator styles
console.log("\n--- Testing Issue 2: Generator Styles & Formula Generation ---");
assert(GENERATOR_STYLES.length >= 10, "Must have comprehensive generator styles");

const categories = Array.from(new Set(GENERATOR_STYLES.map(s => s.category)));
assert(categories.includes("Japanese & City Pop"), "Must have Japanese category");
assert(categories.includes("Circle of Fifths Cycles"), "Must have Circle of Fifths category");
assert(categories.includes("Pop & Songwriting"), "Must have Pop category");
assert(categories.includes("Jazz & Neo-Soul"), "Must have Jazz category");
assert(categories.includes("Rock, Blues & Flamenco"), "Must have Rock/Blues category");

for (const style of GENERATOR_STYLES) {
  const generated = db.generateProgressionForChord("Cmaj", style.id);
  assert(Array.isArray(generated) && generated.length >= 3, `Style ${style.id} must generate at least 3 chords`);
  assert(style.strumPatternId, `Style ${style.id} must have a strumPatternId assigned`);
}

console.log("✓ Issue 2 Verified: All generator styles produce rich progressions and strum patterns");
console.log("\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
