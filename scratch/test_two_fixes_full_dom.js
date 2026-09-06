import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("=== Running Comprehensive DOM & Logic Simulation ===");

// 1. Verify build output
const mainJs = fs.readFileSync(path.resolve('./dist/main.js'), 'utf-8');
const uiJs = fs.readFileSync(path.resolve('./dist/ui.js'), 'utf-8');
const progressionJs = fs.readFileSync(path.resolve('./dist/progression.js'), 'utf-8');
const chordJs = fs.readFileSync(path.resolve('./dist/chord.js'), 'utf-8');
const indexHtml = fs.readFileSync(path.resolve('./index.html'), 'utf-8');
const mainCss = fs.readFileSync(path.resolve('./css/main.css'), 'utf-8');

// Assertions in main.js
assert(mainJs.includes('progression.setMaxChords(savedMode === "clean" ? 8 : 16)'), "main.js must set max chords on boot");
console.log("✓ main.js sets max chords on boot based on saved mode");

// Assertions in ui.js
assert(uiJs.includes('progression.setMaxChords(this.state.mode === "clean" ? 8 : 16)'), "ui.js init must set max chords");
assert(uiJs.includes('generator-styles-modal'), "ui.js must bind generator-styles-modal");
assert(uiJs.includes('openGeneratorStylesModal'), "ui.js must have openGeneratorStylesModal");
assert(uiJs.includes('closeGeneratorStylesModal'), "ui.js must have closeGeneratorStylesModal");
assert(uiJs.includes('renderGeneratorStylesModal'), "ui.js must have renderGeneratorStylesModal");
assert(uiJs.includes('generateProgressionForSelectedStyle'), "ui.js must have generateProgressionForSelectedStyle");
assert(uiJs.includes('closeAllModals'), "ui.js must have closeAllModals");
console.log("✓ ui.js includes all required modal and maxChords logic");

// Assertions in index.html
assert(indexHtml.includes('id="btn-open-generator-styles"'), "index.html must have btn-open-generator-styles");
assert(indexHtml.includes('id="generator-styles-modal"'), "index.html must have generator-styles-modal");
assert(indexHtml.includes('id="generator-category-filter-pills"'), "index.html must have generator-category-filter-pills");
assert(indexHtml.includes('id="generator-style-search"'), "index.html must have generator-style-search");
assert(indexHtml.includes('id="generator-styles-grid"'), "index.html must have generator-styles-grid");
assert(indexHtml.includes('id="generator-modal-target-chord"'), "index.html must have generator-modal-target-chord");
assert(!indexHtml.includes('<select id="generator-style-select"'), "Old dropdown must not exist in index.html");
console.log("✓ index.html structure verified");

// Assertions in main.css
assert(mainCss.includes('.generator-style-trigger-btn'), "main.css must style generator-style-trigger-btn");
assert(mainCss.includes('.generator-styles-modal-card'), "main.css must style generator-styles-modal-card");
assert(mainCss.includes('.generator-cat-pill'), "main.css must style generator-cat-pill");
assert(mainCss.includes('.generator-style-card'), "main.css must style generator-style-card");
assert(mainCss.includes('.generator-formula-chord-pill'), "main.css must style generator-formula-chord-pill");
assert(mainCss.includes('.btn-card-generate-now'), "main.css must style btn-card-generate-now");
console.log("✓ main.css styling rules verified");

// Test progression manager limit logic
const { ProgressionManager } = await import('../dist/progression.js');
const pm = new ProgressionManager();

// Test clean mode
pm.setMaxChords(8);
pm.setProgression(["Cmaj"]);
for (let i = 2; i <= 8; i++) {
  assert.strictEqual(pm.addChord("Cmaj"), true);
}
assert.strictEqual(pm.addChord("Cmaj"), false, "Clean mode cannot exceed 8 chords");

// Test switching to advanced mode
pm.setMaxChords(16);
for (let i = 9; i <= 16; i++) {
  assert.strictEqual(pm.addChord("Cmaj"), true, `Advanced mode can add chord #${i}`);
}
assert.strictEqual(pm.getChords().length, 16, "Must hold 16 chords in advanced mode");
assert.strictEqual(pm.addChord("Cmaj"), false, "Advanced mode cannot exceed 16 chords");

console.log("✓ ProgressionManager 8/16 chord limit logic verified");

console.log("\n🎉 ALL DOM & LOGIC SIMULATION CHECKS PASSED!");
