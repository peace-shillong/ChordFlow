# ChordFlow — Single Page Application Walkthrough

**ChordFlow** is a modern, mobile-first Single Page Application (SPA) designed for musicians, songwriters, and learners to preview chords across four instruments (**Piano**, **Guitar**, **Ukulele**, **Harmonica**), construct and play 4–7 chord progressions with next-chord indicators, explore music theory (inversions, intervals, **Interactive Circle of Fifths**), and export progressions as **JSON**, **PNG images**, and printable **PDFs**.

---

## 🚀 Key Features Implemented

### 1. Multi-Instrument Chord Previewer
- **Four Switchable Instruments**:
  - **🎸 Guitar**: 6-string vertical fretboard diagram with nut, frets, finger circles, open ("O") and muted ("✕") markers, barre arcs, and dynamic capo overlays.
  - **🎹 Piano**: 2.5-octave realistic ivory and ebony keyboard with active note highlights, note name labels, and interval indicators.
  - **🪕 Ukulele**: 4-string diagram with custom tunings and capo support.
  - **🌬️ Harmonica**: 10-hole Richter diatonic harmonica with Blow (↑) and Draw (↓) indicators.
- **Interactive Note Triggers**: Clicking any note on the canvas diagram plays that single note with a visual ripple effect and Web Audio synthesis.
- **"Play Chord" Button**: Realistic multi-string arpeggiated strum or piano chord hit.

### 2. Comprehensive 144+ Chords Database
- Covers all **12 root notes** (`C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B` + enharmonic search support) across **12 chord qualities**:
  - `Major`, `Minor`, `7th`, `Major 7th (maj7)`, `Minor 7th (min7)`, `Diminished (dim)`, `Diminished 7th (dim7)`, `Augmented (aug)`, `Suspended 2nd (sus2)`, `Suspended 4th (sus4)`, `Add 9 (add9)`, and `Half-Diminished (m7b5)`.
- Full inversions (Root, 1st, 2nd, 3rd) and scale degree mappings.

### 3. Chord Progression Builder & Sequencer
- **4 to 7 Chord Constraints**: Add, remove, and reorder chords with move buttons (`◀`, `▶`) and 1-tap delete.
- **Active Chord Highlight**: Pulsating neon border and scale degree badge (e.g. `I`, `IV`, `V`, `vi`).
- **"Next Chord →" Indicator**: Prominent upcoming chord preview banner.
- **Audio Sequencer**: Accurate tempo timing using `AudioContext.currentTime`, with Play, Pause, Stop, Loop toggle, and Metronome click.
- **22+ Seeded Iconic Progressions**: 1-tap loading for Pop 4-Chord (`I-V-vi-IV`), Jazz (`ii-V-I`), 50s Doo-Wop, Delta Blues, Andalusian Cadence, Pachelbel Canon, Neo-Soul, Country, etc.

### 4. Clean Mode (Beginner) vs. Advanced Mode (Theory)
- **Clean Mode (Default)**: Distraction-free interface showing only the active chord diagram, instrument selector, chord progression, and play controls.
- **Advanced Mode**: Unlocks theory drawers and controls:
  - ☑ Show Note Names on diagram
  - ☑ Show Interval numbers (`1`, `b3`, `3`, `5`, `b7`, `7`)
  - ☑ Show Scale degrees (`I`, `ii`, `V`, `vi`…)
  - ☑ Interactive Strumming Pattern Ticker (bouncing visual metronome with 8 strum patterns)
  - ☑ Chord Inversions Selector (`Root`, `1st Inversion`, `2nd Inversion`)
  - ☑ Capo Slider (`0–6` frets) with live sounding root recalculation (e.g. *“Playing C shape sounds as D with Capo 2”*)
  - ☑ Custom Tunings (Guitar: Drop D, DADGAD, Open G, Open D, Half-Step Down; Ukulele: Low G, D-Tuning)

### 5. Interactive Circle of Fifths Widget
- SVG wheel showing 12 Major outer keys, 12 Relative Minor inner keys, and accidentals (#/b count).
- Selecting any key highlights the primary diatonic chords (**Tonic I**, **Subdominant IV**, **Dominant V**, **ii**, **iii**, **vi**, **vii°**) with 1-tap `+` buttons to add directly into the active progression.

### 6. Multi-Format Export & Import
- **JSON**: Download full progression metadata or import `.json` files via file picker with schema validation.
- **PNG**: Generates a high-resolution, poster-quality chord sheet image with title, tempo, strumming pattern, and diagrams via offscreen `<canvas>`.
- **Printable PDF**: Uses `jsPDF` CDN to render vector-sharp printable A4 chord charts.

### 7. UI / Aesthetics & Accessibility
- Dark Mode default (`#0b0d17` midnight gradient + glowing accents) and Light Mode (`#f1f5f9` + crisp indigo).
- Mobile-first responsive layout (375px phone to 1200px+ desktop).
- Accessible ARIA attributes, keyboard navigation (`Space` to play/pause, `Enter` to play chord, `←`/`→` to step chords).

---

## 🛠️ Verification & Test Results

### 1. TypeScript Strict Compilation
```bash
npm run build
```
- **Result**: `tsc` compiled successfully with **0 errors and 0 warnings** in strict mode with zero `any` types.

### 2. Comprehensive Test Suite
```bash
node scratch/test_app.js
```
- **Result**: **47 / 47 test assertions passed**:
  - `data/chords.json`: 144 chords verified with valid notes, piano keys, guitar frets, ukulele frets, and harmonica holes.
  - `data/progressions.json`: 22 progressions verified with valid 4–7 chord lengths.
  - `data/instruments.json` and `data/strumPatterns.json`: verified all tunings, strings, and rhythmic accents.

### 3. HTTP Server Verification
- Server running at `http://localhost:5173/` serves HTML, JavaScript modules, CSS, and JSON datasets with HTTP `200 OK`.

---

## 📦 How to Run Locally

1. **Build TypeScript**:
   ```bash
   npm run build
   ```
2. **Start Local Static Server**:
   ```bash
   npm run serve
   ```
   Open `http://localhost:5173` in your browser.
