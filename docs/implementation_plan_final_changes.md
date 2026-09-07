# Implementation Plan: Transposition Controls & Google Analytics (GA4) Integration

Implement **Section 1: Progression Transposition Controls** (real-time semitone shifting, reset, keyboard shortcuts, localStorage persistence, diagram and audio synchronization) and **Section 2: Google Analytics (GA4) Integration** (measurement tag, SPA virtual page views, custom interaction events, privacy notices, and manual setup instructions for GitHub Pages).

---

## User Review & Manual Action Required

> [!IMPORTANT]
> ### 📋 Manual Action: Setting up Google Analytics (GA4) for GitHub Pages
> Since you have not yet created the GA4 property/stream for this repository:
> 1. **Go to Google Analytics** ([analytics.google.com](https://analytics.google.com/)) and create a new **GA4 Property** named `ChordFlow`.
> 2. Under **Data Streams**, choose **Web**.
> 3. Enter your Website URL (e.g. `https://peace-shillong.github.io/ChordFlow`) and Stream name `ChordFlow Web`.
> 4. Copy your **Measurement ID** (formatted as `G-XXXXXXXXXX`).
> 5. Open [index.html](file:///Users/peace/Work/2026/ChordFlow/index.html) and replace `G-XXXXXXXXXX` in the `<script>` tag with your real Measurement ID.
>
> In the code, we will place the placeholder `G-XXXXXXXXXX` along with the comment:
> `<!-- TODO: Replace G-XXXXXXXXXX with your actual GA4 Measurement ID -->`

---

## Proposed Changes

### 1. Transposition Controls (Chord Progression Card)

#### [MODIFY] [index.html](file:///Users/peace/Work/2026/ChordFlow/index.html)
- Add a pill-shaped Transpose control inside the `.playback-controls-bar` near transport buttons:
  - `btn-transpose-down` (`−` button, min 44×44px touch target)
  - `transpose-value-display` (Label showing `"0"`, `"+1"`, `"-2"`, etc.)
  - `btn-transpose-up` (`+` button, min 44×44px touch target)
  - `btn-transpose-reset` (`↺` reset button to restore transposition to 0)
- Update `#about-modal` to include `+` / `-` in the Keyboard Shortcuts table, and add open-source & analytics privacy disclosures:
  *"This is a free and open source app. This site uses Google Analytics for anonymous usage statistics."*

#### [MODIFY] [ts/types.ts](file:///Users/peace/Work/2026/ChordFlow/ts/types.ts)
- Add `transposeOffset: number` to `AppState`.
- Add global `gtag` and `dataLayer` type declarations on `Window`.

#### [MODIFY] [ts/chord.ts](file:///Users/peace/Work/2026/ChordFlow/ts/chord.ts)
- Implement `transposeChord(chordId: string, offset: number): string | null` in `ChordDatabase`.
- Implement `transposeProgression(chordIds: string[], offset: number): string[]` in `ChordDatabase`.
- Handle enharmonic root transpositions seamlessly across chromatic roots (`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`).

#### [MODIFY] [ts/progression.ts](file:///Users/peace/Work/2026/ChordFlow/ts/progression.ts)
- Add `getTransposeOffset()` and `setTransposeOffset(offset: number)`.
- Support transposing all progression steps, halting active playback cleanly before transposing, and updating progression listeners.

#### [MODIFY] [ts/ui.ts](file:///Users/peace/Work/2026/ChordFlow/ts/ui.ts)
- Cache transpose elements (`#btn-transpose-down`, `#btn-transpose-up`, `#btn-transpose-reset`, `#transpose-value-display`).
- Implement `transpose(delta: number)` and `resetTranspose()`:
  - Updates `state.transposeOffset` within `[-12, +12]`.
  - Transposes all chords in the progression.
  - Updates badge display (e.g. `"+2"`, `"-3"`, `"0"`).
  - Updates progression cards, active diagram, audio synth, and next-chord indicator.
  - Updates auto-generated title if it contained root (e.g., `"I-IV-V in C"` → `"I-IV-V in D"`).
  - Saves offset to `localStorage` under `chordflow-transpose`.
- Wire keyboard shortcuts:
  - `+` or `=` (or `Shift` + `=`) → Transpose up by +1 semitone.
  - `-` or `_` (or `Shift` + `-`) → Transpose down by -1 semitone.
  - Ignored when typing in text inputs or select dropdowns, preventing conflict with numbers `1`–`8`.
- Restore `chordflow-transpose` on boot.

#### [MODIFY] [css/main.css](file:///Users/peace/Work/2026/ChordFlow/css/main.css)
- Style `.transpose-control-group`, `.transpose-pill`, `.transpose-btn`, `.transpose-value`, and `.transpose-reset-btn`.
- Guarantee `min-width: 44px` / `min-height: 44px` touch targets for mobile accessibility.

---

### 2. Google Analytics (GA4) Integration

#### [NEW] [ts/analytics.ts](file:///Users/peace/Work/2026/ChordFlow/ts/analytics.ts)
- Create robust, safe analytics helpers:
  - `trackPageView(path: string)`: Sends `page_view` virtual pageview.
  - `trackEvent(action: string, params?: Record<string, any>)`: Safely dispatches custom events with try/catch and `typeof gtag === 'function'` guards so it never throws if GA is blocked by an ad-blocker or offline.

#### [MODIFY] [index.html](file:///Users/peace/Work/2026/ChordFlow/index.html)
- Add GA4 asynchronous gtag script in `<head>` with `G-XXXXXXXXXX` placeholder and `anonymize_ip: true`.

#### [MODIFY] [ts/ui.ts](file:///Users/peace/Work/2026/ChordFlow/ts/ui.ts) & [ts/main.ts](file:///Users/peace/Work/2026/ChordFlow/ts/main.ts)
- Attach `trackEvent` and `trackPageView` hooks:
  - `play_chord`: `{ chord: chordId, instrument: activeInstrument }`
  - `play_progression`: `{ chord_count: number, tempo: number, instrument: activeInstrument }`
  - `transpose`: `{ direction: 'up' | 'down' | 'reset', offset: number }`
  - `export`: `{ format: 'pdf' | 'json' | 'png' }`
  - `import`: `{ format: 'json' }`
  - `mode_change`: `{ mode: 'clean' | 'advanced' }`
  - `instrument_change`: `{ instrument: instrumentId }`
  - `tuner_used`: `{ instrument: instrumentId }`
  - Virtual modal views: `/ChordFlow/`, `/ChordFlow/settings`, `/ChordFlow/theory`, `/ChordFlow/tuner`, `/ChordFlow/about`, `/ChordFlow/styles`.

---

## Verification Plan

### Automated Tests
1. **TypeScript Build**: `npm run build` (`tsc`) passes with 0 errors.
2. **Transposition Unit Tests**:
   - Transpose individual chords across all qualities and roots (`Cmaj` + 2 → `Dmaj`, `Bmin` + 1 → `Cmin`, `G#7` - 1 → `G7`).
   - Transpose 4-chord, 8-chord, 16-chord progressions.
   - Test wrapping boundaries at ±12 semitones.
   - Test localStorage save/restore on reload.
   - Test reset button returning offset to 0.
   - Test keyboard shortcuts `+` and `-` without interfering with chord triggers `1`–`8`.
3. **Analytics Tests**:
   - Verify `trackEvent` and `trackPageView` execute gracefully as no-ops when `gtag` is missing (offline / ad-blocker).
   - Verify `index.html` contains the GA4 snippet and placeholder comment.
   - Verify modal pageviews and event dispatches are hooked into UI interactions.
4. **Full Regression Test Suite**:
   - Re-run all existing test suites (`test_modal_generate_and_tempo.js`, `test_two_fixes_full_dom.js`, `test_three_new_features.js`, `test_acceptance_criteria.js`, `test_pwa_about_readme.js`).

### Manual Verification
- Test transpose buttons live in the browser, verify chord diagram changes pitch and sound, check localStorage persistence, test reset button, verify GA tags and network requests.
