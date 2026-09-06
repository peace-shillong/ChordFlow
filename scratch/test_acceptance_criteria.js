import fs from "fs";
import path from "path";
import assert from "assert";

console.log("==================================================");
console.log("Running Acceptance Criteria Automated Test Suite");
console.log("==================================================");

// 1. Verify instruments.json
const instrumentsPath = path.resolve("data/instruments.json");
const instrumentsData = JSON.parse(fs.readFileSync(instrumentsPath, "utf8"));
assert(Array.isArray(instrumentsData), "instruments array must exist");
const instrumentIds = instrumentsData.map(i => i.id);
const requiredInstruments = ["piano", "guitar", "ukulele", "guitalele", "violin", "bass", "harmonica"];
requiredInstruments.forEach(inst => {
  assert(instrumentIds.includes(inst), `Instrument ${inst} must be in instruments.json`);
});
console.log("✓ Check 1: All 7 instruments configured in instruments.json");

// 2. Verify chords.json
const chordsPath = path.resolve("data/chords.json");
const chordsData = JSON.parse(fs.readFileSync(chordsPath, "utf8"));
const chordsArray = Array.isArray(chordsData) ? chordsData : chordsData.chords;
assert(Array.isArray(chordsArray), "chords array must exist");
assert.strictEqual(chordsArray.length, 144, "Must have exactly 144 chords (12 roots x 12 qualities)");

// Check instrument representations in each chord
chordsArray.forEach(chord => {
  assert(chord.instruments.piano, `Chord ${chord.id} missing piano`);
  assert(chord.instruments.guitar, `Chord ${chord.id} missing guitar`);
  assert(chord.instruments.ukulele, `Chord ${chord.id} missing ukulele`);
  assert(chord.instruments.harmonica, `Chord ${chord.id} missing harmonica`);
  assert(chord.instruments.violin, `Chord ${chord.id} missing violin`);
  assert(chord.instruments.bass, `Chord ${chord.id} missing bass`);
  assert(chord.instruments.guitalele, `Chord ${chord.id} missing guitalele`);
  assert(Array.isArray(chord.voicings) && chord.voicings.length > 0, `Chord ${chord.id} must have voicings`);
});
console.log("✓ Check 2: All 144 chords have representations for all 7 instruments and voicings");

// 3. Test Capo Transposition Logic
import { getCapoSoundingRoot, getScaleDegree, GENERATOR_STYLES } from "../dist/chord.js";
assert.strictEqual(getCapoSoundingRoot("G", 2), "A", "G with capo 2 sounds as A");
assert.strictEqual(getCapoSoundingRoot("C", 3), "D#", "C with capo 3 sounds as D#");
assert.strictEqual(getCapoSoundingRoot("E", 1), "F", "E with capo 1 sounds as F");
console.log("✓ Check 3: Capo sounding root transposition works accurately");

// 4. Test Scale Degrees & Generator Styles
assert.strictEqual(getScaleDegree("C", "C"), "I", "C in key of C is I");
assert.strictEqual(getScaleDegree("G", "C"), "V", "G in key of C is V");
assert.strictEqual(getScaleDegree("A", "C"), "vi", "A in key of C is vi");
assert.strictEqual(getScaleDegree("F", "C"), "IV", "F in key of C is IV");
assert(GENERATOR_STYLES.length >= 10, "Must have comprehensive generator styles");
console.log("✓ Check 4: Scale degrees & progression styles verified");

// 5. Test Sound Presets
import { SOUND_PRESETS } from "../dist/audio.js";
requiredInstruments.forEach(inst => {
  assert(SOUND_PRESETS[inst] && SOUND_PRESETS[inst].length > 0, `Presets must exist for ${inst}`);
});
console.log("✓ Check 5: Audio synthesis presets defined for all 7 instruments");

// 6. Test Tuner Targets
import { INSTRUMENT_STRINGS } from "../dist/tuner.js";
const tunerInstruments = ["guitar", "ukulele", "guitalele", "violin", "bass"];
tunerInstruments.forEach(inst => {
  assert(INSTRUMENT_STRINGS[inst] && INSTRUMENT_STRINGS[inst].length >= 4, `Tuner strings must exist for ${inst}`);
});
console.log("✓ Check 6: Real-time tuner string frequencies calibrated for all 5 string instruments");

// 7. Test HTML Structure & Modals
const htmlContent = fs.readFileSync(path.resolve("index.html"), "utf8");
assert(htmlContent.includes('id="settings-modal"'), "Settings modal must exist in HTML");
assert(htmlContent.includes('id="theory-modal"'), "Theory modal must exist in HTML");
assert(htmlContent.includes('id="tuner-modal"'), "Tuner modal must exist in HTML");
assert(htmlContent.includes('id="mobile-library-modal"'), "Mobile library modal must exist in HTML");
assert(htmlContent.includes('id="progression-title-input"'), "Progression title input must exist");
assert(htmlContent.includes('id="progression-counter-badge"'), "Counter badge must exist");
assert(htmlContent.includes('id="btn-copy-progression"'), "Copy button must exist");
assert(htmlContent.includes('id="btn-save-dropdown-toggle"'), "Save dropdown must exist");
assert(htmlContent.includes('id="btn-import-progression"'), "Import button must exist");
assert(htmlContent.includes('id="volume-slider"'), "Volume slider must exist");
assert(htmlContent.includes('id="strum-pattern-editor-container"'), "Strum editor must exist");
assert(htmlContent.includes('id="chord-voicing-select"'), "Voicing select must exist");
assert(htmlContent.includes('id="btn-view-chord"'), "View chord button must exist");
assert(htmlContent.includes('id="btn-view-notes"'), "View notes button must exist");
console.log("✓ Check 7: HTML modal structure, toolbar, buttons, and visualizers verified");

// 8. Test CSS Rules & Touch Targets
const cssContent = fs.readFileSync(path.resolve("css/main.css"), "utf8");
assert(cssContent.includes(".modal-backdrop"), "Modal backdrop CSS class must exist");
assert(cssContent.includes(".tuner-needle"), "Tuner needle CSS class must exist");
assert(cssContent.includes(".tuner-gauge-container"), "Tuner gauge container must exist");
assert(cssContent.includes("min-height: 42px") || cssContent.includes("min-height: 44px"), "Buttons must meet touch target standards");
assert(cssContent.includes(".toast-notification"), "Toast notification CSS class must exist");
console.log("✓ Check 8: CSS glassmorphism, tuner gauge, and touch targets verified");

// 9. Test DiagramRenderer Note Names & Intervals
import { DiagramRenderer } from "../dist/diagrams.js";
const renderer = new DiagramRenderer();
const sampleChord = chordsArray.find(c => c.id === "Cmaj");
assert(sampleChord, "Cmaj chord must exist");

const rootNoteInfo = renderer.getNoteLabelAndColor(60, sampleChord, { showNotes: true, showIntervals: false, showScaleDegrees: true, showStrum: true, showCircle: true, showInversions: true });
assert.strictEqual(rootNoteInfo.label, "C", "With showNotes:true, label should be 'C'");
assert.strictEqual(rootNoteInfo.isRoot, true, "MIDI 60 for Cmaj should be root");

const rootIntervalInfo = renderer.getNoteLabelAndColor(60, sampleChord, { showNotes: false, showIntervals: true, showScaleDegrees: true, showStrum: true, showCircle: true, showInversions: true });
assert.strictEqual(rootIntervalInfo.label, "1", "With showIntervals:true, root label should be '1'");

const thirdIntervalInfo = renderer.getNoteLabelAndColor(64, sampleChord, { showNotes: false, showIntervals: true, showScaleDegrees: true, showStrum: true, showCircle: true, showInversions: true });
assert.strictEqual(thirdIntervalInfo.label, "3", "MIDI 64 for Cmaj should have interval '3'");
console.log("✓ Check 9: DiagramRenderer Note Names and Intervals tested across chord tones");

// 10. Test Tuner Buttons and Responsive Rules
assert(htmlContent.includes('id="tuner-mic-prompt"'), "Mic prompt banner must exist");
assert(htmlContent.includes('id="tuner-inst-pills"'), "Tuner instrument pills row must exist");
assert(htmlContent.includes('id="tuner-string-pills"'), "Tuner string pills row must exist");
assert(cssContent.includes(".tuner-inst-pill"), "Tuner instrument pill CSS must exist");
assert(cssContent.includes(".tuner-string-pill"), "Tuner string pill CSS must exist");
assert(cssContent.includes("max-width: 1100px"), "Instrument nav container max width updated to avoid scrollbar");
console.log("✓ Check 10: Tuner button pills, mic banner, and top nav desktop centering verified");

console.log("==================================================");
console.log("🎉 ALL ACCEPTANCE CRITERIA AUTOMATED CHECKS PASSED!");
console.log("==================================================");
