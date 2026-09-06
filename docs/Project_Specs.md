# ChordFlow — Chord Previewer & Progression Builder (SPA)

## Project Overview
Build a mobile-first, minimalist, modern Single Page Application (SPA) called "ChordFlow" that lets users:
- Select 4–7 chords from a library
- Preview each chord on Piano (keyboard), Guitar, Ukulele, or Harmonica (toggleable)
- View a Chord Progression with clear "next chord" indicators
- Hear the chords/notes played via Web Audio API
- Save & load progressions as JSON, PNG image, or PDF

Target audience: **Beginners first** (Clean Mode), with **Advanced Mode** unlocking deeper music theory.

## Tech Stack (STRICT — no frameworks, no build tools beyond tsc)
- HTML5 (semantic, single `index.html`)
- CSS3 (CSS Custom Properties, Grid, Flexbox, `@media` for mobile-first)
- TypeScript (strict mode, compiled to ES2020, single `main.ts` entry or small module split)
- JSON (all chord data, progressions, instrument configs — loaded via `fetch` from local `.json` files)
- Web Audio API (for sound synthesis — no external audio files)
- Canvas API (for rendering chord diagrams & image export)
- No React, no Vue, no Svelte, no jQuery, no Bootstrap. Pure vanilla.

## Data Model (JSON)

### `data/chords.json`
Each chord object:
```json
{
  "id": "Cmaj",
  "name": "C Major",
  "symbol": "C",
  "quality": "major",
  "root": "C",
  "notes": ["C4","E4","G4"],
  "intervals": [0, 4, 7],
  "scale": "C Major",
  "inversions": [
    { "notes": ["C4","E4","G4"], "label": "Root" },
    { "notes": ["E4","G4","C5"], "label": "1st Inversion" },
    { "notes": ["G4","C5","E5"], "label": "2nd Inversion" }
  ],
  "instruments": {
    "piano": { "keys": [60, 64, 67], "diagram": "piano-Cmaj.svg" },
    "guitar": { "frets": [-1,3,2,0,1,0], "strings": [6,5,4,3,2,1], "diagram": "guitar-Cmaj.svg" },
    "ukulele": { "frets": [0,0,0,0], "strings": [4,3,2,1], "diagram": "ukulele-Cmaj.svg" },
    "harmonica": { "holes": ["4-", "4=", "4+", "5-"], "blowDraw": ["blow","draw","blow","blow"] }
  }
}
```
Include at minimum: All 12 major, minor, 7th, maj7, min7, dim, aug chords per root = 144+ chords.

### `data/progressions.json`
```json
{
  "id": "iimaj-vii-iv-v",
  "name": "Jazz II-V-I",
  "key": "C",
  "chords": ["Dm7","G7","Cmaj7"],
  "beatsPerChord": 4,
  "tempo": 120,
  "style": "swing"
}
```
Seed with 20+ common progressions (I-IV-V, ii-V-I, 12-bar blues, 50s progression, etc.). Reference: https://autochords.com/

### `data/instruments.json`
Tuning, string counts, fret ranges, default capo positions, available tunings (standard, drop D, DADGAD, etc.)

### `data/strumPatterns.json`
```json
{ "id": "basic", "name": "Basic Down-Up", "pattern": ["D","","U","","D","U","D","U"], "bpm": 120 }
```

## Features

### 1. Chord Library & Previewer
- Grid/list of all chords, searchable & filterable by root, quality, instrument
- Click a chord → shows visual diagram for the **selected instrument** (Piano / Guitar / Ukulele / Harmonica)
- **Instrument toggle**: 4 tabs or segmented control; only the active instrument's diagram is shown
- Tap/click a note on the diagram → plays that single note (Web Audio API, sine + slight envelope)
- "Play Chord" button → plays all notes simultaneously

### 2. Chord Progression Builder
- User selects 4–7 chords (add/remove/reorder via drag or up/down buttons)
- Progression displayed as a horizontal row of chord cards (mobile: horizontal scroll)
- **Active chord** is highlighted (larger, accent color); an arrow or "Next →" indicator shows the following chord
- Auto-advance timer (configurable BPM) cycles through the progression, highlighting each chord in sequence
- "Play Progression" button plays chords in sequence with correct timing
- Pre-loaded sample progressions from `progressions.json` (one-tap load)

### 3. Capo
- Slider (0–6) for guitar/ukulele
- Recalculates & re-renders chord diagrams with capo offset
- Shows effective key after capo

### 4. Tuning
- Dropdown for guitar: Standard (EADGBE), Drop D, DADGAD, D Tuning, Open G, Open D, etc.
- For ukulele: Standard (GCEA), C Tuning, D Tuning
- Recalculates fret positions on diagram change

### 5. Strum Pattern & Style
- Select a strum pattern (Basic, Island, Reggae, Ballad, etc.)
- Visual metronome/strum indicator synced to BPM
- Style presets (Rock, Pop, Jazz, Folk) that bundle strum + tempo + chord voicings

### 6. Export / Save / Load
- **JSON**: Download current progression as `.json`; import via file picker
- **PNG**: Render progression (chord names + diagrams) to `<canvas>`, download as image
- **PDF**: Use `jsPDF` (single CDN script) to generate a printable PDF with chord names, diagrams, and strum pattern

## UI / UX

### Clean Mode (Default — Beginner)
- On load: shows **only** the selected instrument's chord diagram + chord name + "Play" button
- Progression shown as large, simple chord cards in a row
- No intervals, no scale info, no strum notation
- Minimal chrome: one header, one main area, one bottom toolbar
- Large touch targets (min 48px), high contrast, generous whitespace

### Advanced Mode (Toggle in Settings)
- Adds (each independently toggleable via a settings panel):
  - Note names on diagram
  - Interval numbers (1, 3, 5, 7)
  - Scale degree in key (I, ii, V, vi…)
  - Strum pattern notation below progression
  - Circle of Fifths reference (interactive, reference: https://www.musicca.com/circle-of-fifths)
  - Inversion selector
  - BPM / tempo control
  - Key signature display

### Design Language
- **Minimalist**: max 2 accent colors (suggest: `#1a1a2e` dark bg + `#e94560` accent, or light mode `#f8f9fa` + `#4361ee`)
- **Modern**: rounded corners (8–12px), subtle shadows, smooth transitions (200ms ease), no heavy borders
- **Mobile-first**: single column on mobile, progression scrolls horizontally; on desktop (≥768px) show 2-column layout (chord detail left, progression right)
- Dark/light mode toggle (respects `prefers-color-scheme`)

## Audio (Web Audio API)
- Synthesize notes using `OscillatorNode` (sine or triangle) + `GainNode` envelope (attack 5ms, decay 200ms, sustain 0.3, release 300ms)
- Piano: single oscillator per note, frequency from MIDI note number
- Guitar: simulate pluck with short decay + slight detune (2 oscillators, ±3 cents)
- Ukulele: similar to guitar, brighter timbre
- Harmonica: add subtle vibrato (LFO at 5Hz on frequency)
- "Play Chord" triggers all notes simultaneously
- "Play Progression" schedules notes with `AudioContext.currentTime` for accurate timing

## File Structure
```
/
├── index.html
├── css/
│   └── main.css
├── ts/
│   ├── main.ts          (app bootstrap, router/state)
│   ├── audio.ts         (Web Audio engine)
│   ├── chord.ts         (chord data types & lookup)
│   ├── progression.ts   (progression state & playback)
│   ├── ui.ts            (DOM rendering, mode switching)
│   ├── diagrams.ts      (Canvas/SVG chord diagram renderer)
│   ├── export.ts        (JSON/PNG/PDF export)
│   └── types.ts         (shared TypeScript interfaces)
├── data/
│   ├── chords.json
│   ├── progressions.json
│   ├── instruments.json
│   └── strumPatterns.json
├── tsconfig.json
└── package.json         (only devDeps: typescript; scripts: tsc, serve)
```

## Constraints & Quality
- **Zero runtime dependencies** (only `jsPDF` via CDN for PDF export is allowed as a single `<script>` tag)
- All TypeScript in `strict` mode; no `any`
- Accessible: ARIA labels on interactive elements, keyboard navigable, `:focus-visible` styles
- Performance: chord diagrams render in <50ms; no layout thrash; use `requestAnimationFrame` for animations
- Responsive breakpoints: `480px` (phone), `768px` (tablet), `1024px` (desktop)
- No external fonts — use system font stack
- All chord data must be correct (verify fret positions against standard references)

## Build & Run
- `npm run build` → `tsc` outputs to `dist/`
- `npm run serve` → `npx serve dist/` (or any static server)
- Must work when opened as static files (no server-side rendering, no API calls beyond local `fetch('./data/chords.json')`)

## Acceptance Criteria
1. [ ] User can select an instrument and see correct chord diagrams for any chord
2. [ ] User can build a 4–7 chord progression and see "next chord" indicator
3. [ ] Tapping "Play" produces correct audio for the chord
4. [ ] Clean Mode shows only diagram + name + play; Advanced Mode reveals toggles for notes, intervals, strum, circle of fifths
5. [ ] Capo and tuning changes update diagrams correctly
6. [ ] Export to JSON, PNG, and PDF all produce valid files
7. [ ] Layout is fully functional on a 375px-wide viewport (iPhone SE)
8. [ ] No console errors; all TypeScript compiles with `strict: true`


