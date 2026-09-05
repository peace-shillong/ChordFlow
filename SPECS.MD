# ChordFlow — Technical Specifications

## 1. File Structure
/
├── index.html
├── css/main.css
├── ts/
│   ├── main.ts          # bootstrap, state, router
│   ├── types.ts         # all TS interfaces
│   ├── audio.ts         # Web Audio engine
│   ├── chord.ts         # chord lookup, capo/tuning math
│   ├── progression.ts   # progression state & playback scheduler
│   ├── diagrams.ts      # Canvas chord diagram renderer
│   ├── ui.ts            # DOM rendering, mode switching, toggles
│   ├── export.ts        # JSON / PNG / PDF export + JSON import
│   └── circle.ts        # Circle of Fifths widget (Phase 5)
├── data/
│   ├── chords.json
│   ├── progressions.json
│   ├── instruments.json
│   └── strumPatterns.json
├── tsconfig.json
└── package.json         # devDeps: typescript; scripts: build, serve

## 2. TypeScript Interfaces (types.ts)

interface Chord {
  id: string;            // "Cmaj"
  name: string;          // "C Major"
  symbol: string;        // "C"
  quality: "major"|"minor"|"7th"|"maj7"|"min7"|"dim"|"aug"|"m7b5";
  root: string;          // "C"
  notes: string[];       // ["C4","E4","G4"]
  intervals: number[];   // [0,4,7]
  scale: string;         // "C Major"
  inversions: { notes: string[]; label: string }[];
  instruments: {
    piano:    { keys: number[] };
    guitar:   { frets: number[] };   // -1 = mute, 0 = open
    ukulele:  { frets: number[] };
    harmonica:{ holes: string[] };   // "4-", "4=", "5+"
  };
}

interface Progression {
  id: string;
  name: string;
  key: string;
  chords: string[];      // chord IDs, length 4–7
  beatsPerChord: number;
  tempo: number;         // BPM
  style?: string;
  strumPatternId?: string;
}

interface Instrument {
  id: "piano"|"guitar"|"ukulele"|"harmonica";
  name: string;
  strings?: number[];    // MIDI note numbers for open strings
  tunings?: { id: string; name: string; strings: number[] }[];
  fretRange: [number, number];
  capoRange: [number, number];
}

interface StrumPattern {
  id: string;
  name: string;
  pattern: string[];     // ["D","","U","","D","U","D","U"]
  accent?: number[];     // beat indices with accent
}

interface AppState {
  mode: "clean"|"advanced";
  activeInstrument: Instrument["id"];
  selectedChord: string | null;
  progression: string[];
  activeChordIndex: number;
  capo: number;
  tuning: string;
  strumPattern: string | null;
  tempo: number;
  isPlaying: boolean;
  toggles: {
    showNotes: boolean;
    showIntervals: boolean;
    showScaleDegrees: boolean;
    showStrum: boolean;
    showCircle: boolean;
    showInversions: boolean;
  };
  theme: "light"|"dark"|"system";
}

## 3. Data Specifications

### chords.json — minimum v1 (Phase 1)
12 major + 12 minor = 24 chords. Each must have correct fret positions for guitar (standard tuning EADGBE) and ukulele (GCEA). Piano = MIDI key numbers. Harmonica = 10-hole diatonic in C.

### progressions.json — seed list
- I-IV-V (C F G)
- I-V-vi-IV (C G Am F)
- ii-V-I (Dm7 G7 Cmaj7)
- 12-bar blues in C
- 50s / Dorado (Am Dm E7 Am)
- Axis of Evil (I-vi-IV-V)
- And 4+ more

### instruments.json
- Guitar: Standard, Drop D, DADGAD, Open G, Open D, Open C
- Ukulele: Standard GCEA, C tuning (ACEA), D tuning (ADFA)
- Piano: 88-key, no tuning changes
- Harmonica: 10-hole diatonic (C, G, A, D, F)

### strumPatterns.json
- Basic: D D U U D U
- Island: D DU UDU
- Reggae: (off-beat) U U U U
- Ballad: D DU UDU DU UDU
- Rock: D DU DDU
- Jazz swing: D. U. D. U. (dotted)

## 4. Audio Engine (audio.ts)

- Single `AudioContext`, created on first user interaction
- `playNote(midi: number, instrument: InstrumentId, time?: number)`:
  - Piano: sine osc, ADSR (A:5ms D:200ms S:0.3 R:300ms)
  - Guitar: 2 osc (sawtooth), detune ±3 cents, short decay, lowpass filter 2kHz
  - Ukulele: 2 osc (triangle), brighter, shorter decay
  - Harmonica: sine + LFO vibrato 5Hz depth 10 cents
- `playChord(midiNotes: number[], instrument: InstrumentId, time?: number)`
- `playProgression(chords: Chord[], bpm: number, beatsPerChord: number, callback)`
  - Schedules via `AudioContext.currentTime`
  - Calls `callback(index)` on each chord change for UI sync
- `stop()` — cancel all scheduled, close oscillators

## 5. Diagram Renderer (diagrams.ts)

- `renderGuitarDiagram(canvas, frets: number[], capo: number, tuning: number[])`
- `renderPianoDiagram(canvas, keys: number[])`
- `renderUkuleleDiagram(canvas, frets: number[], capo: number, tuning: number[])`
- `renderHarmonicaDiagram(canvas, holes: string[])`
- All render to a `<canvas>` sized to fit container (use `devicePixelRatio` for crispness)
- Visual: rounded fretboard, string lines, dot markers for fingers, "X"/"O" for mute/open
- Piano: white/black key layout, highlight pressed keys
- Harmonica: 10-hole grid, blow (top) / draw (bottom) labels
- Render target: <50ms per diagram

## 6. UI / Layout

### DOM Structure (index.html)
- `<header>` — app name, mode toggle (Clean/Advanced), theme toggle
- `<main>`
  - `<section id="instrument-tabs">` — 4 segmented buttons
  - `<section id="chord-grid">` — scrollable grid of chord cards
  - `<section id="diagram-area">` — canvas + chord name + Play button
  - `<section id="progression-area">` — horizontal scroll of chord cards + controls
  - `<section id="controls">` — tempo, capo, tuning, strum (Advanced only)
- `<footer>` — Export buttons (JSON, PNG, PDF), Import button

### Clean Mode
- Visible: instrument tabs, chord grid, diagram, Play button, progression cards (name only)
- Hidden: all controls, notes, intervals, strum, circle, inversions
- Chord cards show: symbol + instrument diagram only

### Advanced Mode
- All Clean Mode + per-feature toggles in a settings drawer:
  - ☑ Notes on diagram
  - ☑ Interval numbers
  - ☑ Scale degrees (I, ii, V…)
  - ☑ Strum pattern display
  - ☑ Circle of Fifths
  - ☑ Inversion selector
  - ☑ Tempo / BPM slider
  - ☑ Key signature

### Responsive
- `< 480px`: single column, progression horizontal scroll, large touch targets (≥48px)
- `480–768px`: single column, slightly larger diagrams
- `≥ 768px`: 2-column (diagram left 60%, progression right 40%)
- `≥ 1024px`: 3-column option (chord grid | diagram | progression)

### Design Tokens (CSS Custom Properties)
--bg: #f8f9fa / #1a1a2e (light/dark)
--surface: #ffffff / #16213e
--text: #1a1a2e / #eaeaea
--accent: #4361ee / #e94560
--radius: 10px
--shadow: 0 2px 8px rgba(0,0,0,.08)
--transition: 200ms ease
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

## 7. Export Module (export.ts)

- `exportJSON(state: AppState)`: Blob download `.json`
- `exportPNG(state: AppState)`: render progression + diagrams to offscreen Canvas → `toDataURL('image/png')` → download
- `exportPDF(state: AppState)`: jsPDF — one page per chord, diagram + name + strum
- `importJSON(file: File)`: parse, validate schema, load into state

## 8. Accessibility
- All interactive elements: `role`, `aria-label`, `aria-pressed` (toggles), `aria-live` (active chord announcement)
- Keyboard: Tab through chord grid, Enter to select, Arrow keys to navigate progression
- `:focus-visible` outline (2px accent, offset 2px)
- Color contrast ≥ 4.5:1 (WCAG AA)
- `prefers-reduced-motion`: disable auto-advance animation

## 9. Constraints
- Zero runtime npm deps (jsPDF via CDN `<script>` is the only exception)
- `tsconfig`: `"strict": true`, `"target": "ES2020"`, `"module": "ES2020"`, `"noUnusedLocals": true`
- No `any` type
- All chord fret data must be verified against standard references
- Must pass: no console errors, no layout overflow at 375px, all TS compiles clean   