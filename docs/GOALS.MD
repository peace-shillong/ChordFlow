# ChordFlow — Project Plan

## Goal
Build a mobile-first, minimalist SPA for chord preview & progression practice. Target: beginners (Clean Mode) with an Advanced Mode toggle for deeper theory.

## Tech Stack (strict)
- HTML5 / CSS3 / TypeScript (strict) / JSON / Web Audio API / Canvas API
- No frameworks. No build tools beyond `tsc`. Single CDN script allowed (jsPDF).
- Static site — must work from `file://` or any static server.

## Architecture
- Single `index.html`, CSS custom properties for theming, modular TS files
- State: plain TS objects + `localStorage` for user progressions
- Data: local JSON files fetched at runtime
- Audio: Web Audio API synthesis (no audio files)
- Rendering: Canvas for chord diagrams, DOM for UI chrome

## Phases

### Phase 1 — Foundation
- [ ] Project scaffold (file structure, tsconfig, package.json)
- [ ] `data/chords.json` — 12 major + 12 minor chords (one per root) with all 4 instruments
- [ ] `data/instruments.json` — tunings, string configs
- [ ] Basic UI shell: header, instrument tabs, chord grid, diagram area
- [ ] Canvas chord diagram renderer (guitar + piano first)
- [ ] Web Audio: play single note, play chord

### Phase 2 — Progression Builder
- [ ] `data/progressions.json` — 10+ seeded progressions
- [ ] Progression builder UI (add/remove/reorder 4–7 chords)
- [ ] Active chord highlight + "Next →" indicator
- [ ] Auto-advance playback with BPM
- [ ] Ukulele + Harmonica diagram renderers

### Phase 3 — Advanced Features
- [ ] Capo slider (0–6) with diagram recalculation
- [ ] Tuning selector (guitar: Standard, Drop D, DADGAD, Open G/D; ukulele: GCEA, C, D)
- [ ] Strum patterns (`data/strumPatterns.json`) + visual metronome
- [ ] Style presets (Rock, Pop, Jazz, Folk)

### Phase 4 — Export & Polish
- [ ] Export: JSON download, PNG (Canvas → toDataURL), PDF (jsPDF)
- [ ] Import: JSON file picker
- [ ] Clean Mode / Advanced Mode toggle + per-feature visibility toggles
- [ ] Dark/light theme (respects `prefers-color-scheme`)
- [ ] Responsive polish (375px → 1024px+)
- [ ] ARIA labels, keyboard nav, focus styles

### Phase 5 — Data Expansion
- [ ] Expand `chords.json` to full 144+ chords (all qualities × 12 roots)
- [ ] Circle of Fifths interactive widget (Advanced Mode)
- [ ] Inversion selector
- [ ] Scale degree display (I, ii, V, vi…)

## Milestones
| Milestone | After Phase | Demo-able? |
|-----------|-----------|-----------|
| M1: See & hear a chord | 1 | ✅ |
| M2: Build & play a progression | 2 | ✅ |
| M3: Capo, tuning, strum | 3 | ✅ |
| M4: Export + theming + a11y | 4 | ✅ |
| M5: Full chord library + theory | 5 | ✅ |   