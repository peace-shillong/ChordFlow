# Implementation Plan: ChordFlow — Chord Previewer & Progression Builder SPA

This plan aligns the requirements from [Project_Specs.md](file:///Users/peace/Work/2026/ChordFlow/Project_Specs.md), [GOALS.MD](file:///Users/peace/Work/2026/ChordFlow/GOALS.MD), and [SPECS.MD](file:///Users/peace/Work/2026/ChordFlow/SPECS.MD) to build **ChordFlow**, a mobile-first, modern Single Page Application (SPA).

## Key Architecture & Tooling Decisions

> [!IMPORTANT]
> **No Global `tsc` Dependency**:
> As identified during environment verification, `tsc` is not globally installed on the system. We configure `package.json` with `typescript` as a local devDependency so compilation runs cleanly via `npm run build` (`tsc`) or `npx -y typescript tsc`. Additionally, the compiled output in `dist/` or `js/` (or ES modules) will ensure ChordFlow runs seamlessly as a static web app both via local HTTP servers (`npm run serve` / `npx serve .`) and static hosting.

> [!NOTE]
> **Strict Vanilla Stack**:
> - **Zero runtime frameworks** (no React, Vue, Svelte, jQuery, Bootstrap).
> - **HTML5 & Vanilla CSS3** with CSS custom properties, glassmorphism, responsive grid/flexbox, and seamless Dark/Light theming.
> - **TypeScript (Strict Mode)**: Target `ES2020`, `strict: true`, `noImplicitAny: true`, no `any` types.
> - **Web Audio API**: 100% synthesized sound for Piano, Guitar, Ukulele, Harmonica, and Metronome (no external audio assets).
> - **Canvas API**: High-DPI diagram rendering (<50ms per frame) with interactive note triggers.
> - **Export**: JSON download & import, high-res Canvas PNG snapshot, and PDF generation via jsPDF CDN script.

---

## Detailed Project Structure

```
/
├── index.html                  # Semantic HTML5 SPA shell & jsPDF script tag
├── css/
│   └── main.css                # CSS Custom Properties, layout, animations, dark/light themes
├── ts/
│   ├── types.ts                # Strict TypeScript interfaces matching SPECS.MD
│   ├── chord.ts                # Chord lookup, transpositions, capo & tuning math
│   ├── audio.ts                # Web Audio synthesis engine (Piano, Guitar, Ukulele, Harmonica, Click)
│   ├── diagrams.ts             # Canvas diagram renderer for 4 instruments + interactive hit-testing
│   ├── progression.ts          # Progression state management, sequencer, next-chord logic
│   ├── circle.ts               # Interactive SVG/Canvas Circle of Fifths widget & diatonic chords
│   ├── export.ts               # JSON export/import, Canvas PNG generator, jsPDF printable document
│   ├── ui.ts                   # DOM rendering, Clean/Advanced mode switches, settings drawer, modals
│   └── main.ts                 # Bootstrap, state initialization, keyboard navigation
├── data/
│   ├── chords.json             # 144+ chord definitions with voicings for all 4 instruments & inversions
│   ├── progressions.json       # 20+ curated progressions (Pop, Jazz, Blues, Flamenco, Rock, Ballads)
│   ├── instruments.json        # Tunings, string configs, capo limits, fret ranges
│   └── strumPatterns.json      # Strumming patterns & tempo presets
├── tsconfig.json               # TypeScript compiler config (strict: true, target: ES2020, module: ES2020)
└── package.json                # Project config with devDependencies (typescript) and scripts (build, serve)
```

---

## Implementation Phases & Proposed Changes

### Phase 1 — Project Foundation & Core Audio/Diagram Engine
- **`package.json` & `tsconfig.json`**: Configure TypeScript build scripts without global `tsc` reliance.
- **`ts/types.ts`**: Complete type definitions for `Chord`, `Progression`, `Instrument`, `StrumPattern`, `AppState`, and `ChordQuality`.
- **`data/instruments.json`**: Full tuning definitions for Guitar (Standard, Drop D, DADGAD, Open G, Open D, Half-step down), Ukulele (Standard GCEA, Low G, D Tuning), Piano, Harmonica (10-hole Richter diatonic in C).
- **`data/chords.json`**: Comprehensive chord database with 144+ chords (12 roots × Major, Minor, 7th, maj7, min7, dim, dim7, aug, sus2, sus4, add9, m7b5), piano keys, guitar & ukulele frets/fingering/barres, and harmonica holes/blow-draw indicators.
- **`ts/chord.ts`**: Dataset loader, search/filtering, capo offset calculations, tuning fret recalculations, and inversion notes.
- **`ts/audio.ts`**: Web Audio API polyphonic synthesizer:
  - Piano: Sine/triangle wave + ADSR envelope (A: 5ms, D: 200ms, S: 0.3, R: 300ms).
  - Guitar: Pluck simulation with dual detuned sawtooth oscillators (±3 cents) + lowpass filter (2kHz).
  - Ukulele: Bright triangle oscillators with short decay.
  - Harmonica: Sine/square blend + 5Hz LFO vibrato (10 cents depth).
  - Metronome / Click: Audio tick for progression tempo & strum sync.
  - Single note and full chord triggers.
- **`ts/diagrams.ts`**: High-DPI Canvas renderers:
  - Guitar: Vertical fretboard (nut, frets 1–5+, string lines, finger dots, O/X markers, barre arcs, capo bar).
  - Piano: Realistic keyboard (white/black keys, active key highlights, note names, interval tags).
  - Ukulele: 4-string fretboard with finger dots, capo bar, and open/mute markers.
  - Harmonica: 10-hole layout with blow (top) and draw (bottom) indicators and hole numbers.

### Phase 2 — Progression Builder & Playback Sequencer
- **`data/progressions.json`**: 20+ seeded progressions (Pop I-V-vi-IV, Jazz ii-V-I, 12-Bar Blues, 50s Doo-Wop, Andalusian Cadence, Pachelbel, etc.).
- **`ts/progression.ts`**:
  - Progression state management (4–7 chord limit, add from library, remove, reorder left/right/drag).
  - Active chord highlight with animated progress timer.
  - **"Next Chord →"** visual indicator banner and preview.
  - Accurate playback scheduler using `AudioContext.currentTime` with start, pause, stop, loop, and tempo control.

### Phase 3 — Strumming, Capo, Tunings & Theory Controls
- **`data/strumPatterns.json`**: 8 strum patterns (Basic Down-Up, Pop/Rock, Island, Ballad, Reggae Offbeat, Jazz Swing, 3/4 Waltz, 6/8 Slow Rock).
- **Capo & Tuning Engine**: Capo slider (0–6 frets) with real-time diagram transposition and effective sounding key display.
- **Strum Visualizer**: Bouncing arrow/rhythm ticker synced to audio metronome and BPM.

### Phase 4 — Clean Mode vs. Advanced Mode & Interactive UI
- **`css/main.css`**: Mobile-first responsive styling (375px iPhone SE to 1024px+ desktop), dark/light mode CSS tokens (`--bg`, `--surface`, `--text`, `--accent`), glassmorphism, focus-visible outlines.
- **`ts/ui.ts` & `index.html`**:
  - **Clean Mode (Beginner Default)**: Minimalist focus on active instrument diagram, chord name, Play button, and progression cards.
  - **Advanced Mode**: Unlocks theory drawer with individual toggles for:
    - Note names on diagrams
    - Interval numbers (1, 3, 5, 7)
    - Scale degrees (I, ii, V, vi…)
    - Strum pattern visualizer
    - Inversion selector (Root, 1st, 2nd, 3rd)
    - Tempo & BPM slider
    - Circle of Fifths toggle

### Phase 5 — Circle of Fifths & Multi-Format Export
- **`ts/circle.ts`**: Interactive SVG/Canvas Circle of Fifths widget displaying 12 major keys, 12 relative minor keys, key signatures (#/b count), diatonic neighbor chords (I, IV, V, ii, iii, vi, vii°), and 1-tap "Add to Progression" buttons.
- **`ts/export.ts`**:
  - **JSON**: Export current progression metadata and chord list as `.json` file; Import via file picker with schema validation.
  - **PNG**: Offscreen Canvas rendering of a high-resolution chord sheet (progression title, key, tempo, strum pattern, diagrams) downloaded as an image.
  - **PDF**: Generation of a printable PDF chart using `jsPDF` CDN.

---

## Verification Plan

### 1. Build & Compilation Verification
- Run `npm run build` using local TypeScript compiler.
- Ensure 0 errors, 0 warnings, strict mode compliance with no `any` types.

### 2. Functional & Browser Testing (via Browser Subagent)
- **Visual & Layout Test**: Open ChordFlow in headless browser; test 375px mobile viewport and 1024px desktop viewport to confirm zero layout overflow and touch target compliance (≥48px).
- **Instrument Switching**: Toggle between Piano, Guitar, Ukulele, and Harmonica; verify accurate canvas diagrams.
- **Audio Synthesis**: Test single note playback on clicking canvas notes, Play Chord button, and Play Progression playback.
- **Progression Management**: Add chords, verify 4–7 chord limits, test reorder buttons, and verify active chord and "Next Chord →" indicator.
- **Capo & Tuning**: Move Capo slider (0–6), select alternate guitar tunings (Drop D, DADGAD), and check diagram updates.
- **Circle of Fifths**: Test interactive key selection and diatonic chord insertion.
- **Exporting**: Test JSON export & import, PNG canvas image generation, and PDF generation.
