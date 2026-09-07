# ChordFlow — Transpose & Analytics

> **Instructions:** Implement the following 2 features. Do not break existing functionality.
> Confirm each section after completion.

---

## 1. Transpose Button — Chord Progression Card

### 1.1 — UI
- Add a **Transpose control** in the Chord Progression card, near the transport buttons (Stop / Repeat / Tap).
- Layout: A small pill-shaped group with three elements side by side:
  - `−` button (transpose down by 1 semitone)
  - A label showing current offset: `"0"` (or `"+2"`, `"-3"`, etc.)
  - `+` button (transpose up by 1 semitone)
- Style: Same visual language as the Stop/Repeat/Tap buttons (min 44×44px, rounded, visible border).
- The label updates live as the user presses the buttons.
- Add a small **reset** icon (↺) next to the group that resets transpose to `0`.
- On mobile, ensure the buttons are tappable (min 44px touch target).

### 1.2 — Behavior
- Each press of `+` transposes **all chords** in the current progression **up by 1 semitone**.
- Each press of `−` transposes **all chords** **down by 1 semitone**.
- Range: −12 to +12 (wraps around the chromatic scale).
- On transpose:
  1. Recalculate each chord's root: `newRoot = (oldRoot + offset + 12) % 12`
  2. Look up the transposed chord in `chords.json` (same quality, new root).
  3. Update the progression state with the new chord IDs.
  4. Re-render all progression cards (chord names, symbols).
  5. Re-render the active chord's diagram in the Chord Diagram card.
  6. Update the progression title if it was auto-generated (e.g., "I-IV-V in C" → "I-IV-V in D").
  7. If the user had a custom title, leave it unchanged.
- **Keyboard shortcuts:**
  - `+` key (or `Shift` + `=`) → transpose up
  - `-` key (or `Shift` + `-`) → transpose down
  - These should NOT conflict with number keys (1–8) used for chord playback.
  - Only active when the progression card is in focus or when not typing in an input field.

### 1.3 — Transposition Logic (TypeScript)

```typescript
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function transposeChord(chordId: string, offset: number): string {
  const chord = getChordById(chordId);
  const rootIndex = NOTE_NAMES.indexOf(chord.root);
  const newRootIndex = ((rootIndex + offset) % 12 + 12) % 12;
  const newRoot = NOTE_NAMES[newRootIndex];
  return `${newRoot}${chord.quality}`;  // e.g., "C" + "maj" → "Dmaj"
}

function transposeProgression(chordIds: string[], offset: number): string[] {
  return chordIds.map(id => transposeChord(id, offset));
}
```

- The `AppState` should store `transposeOffset: number` (default `0`).
- On load, read from `localStorage` (`chordflow-transpose`) and re-apply if non-zero.
- Transpose offset is **NOT** saved in JSON export (the exported progression contains the already-transposed chord names).

### 1.4 — Edge Cases
- If a transposed chord ID doesn't exist in `chords.json` (shouldn't happen if all 12×7 chords exist), show a warning toast: `"Chord X not found in library"` and skip that chord.
- Transpose should work in **both** Beginner and Advanced modes.
- If the user is currently playing the progression, stop playback before transposing, then the user can replay.

### 1.5 — Acceptance Criteria
- [ ] `+` / `−` buttons transpose all chords in the progression by 1 semitone
- [ ] Label shows current offset (e.g., "+3", "-2", "0")
- [ ] Keyboard `+` and `-` keys work (when not in an input field)
- [ ] Reset button returns offset to 0 and restores original chords
- [ ] Progression cards, diagram, and audio all update on transpose
- [ ] Works in both Beginner and Advanced modes
- [ ] Transpose offset persists in localStorage (survives page reload)
- [ ] No conflict with number key shortcuts (1–8)

---

## 2. Google Analytics (GA4)

### 2.1 — Setup
- I have not yet added a property om GA4. So i will add it in the same repo and will use the subdirectory path when setting up the data stream. and put this step in the implementation plan so I know what I have to do manually.
- Use a **placeholder** for the Measurement ID: `G-XXXXXXXXXX`
- Add a comment in the code: `<!-- TODO: Replace G-XXXXXXXXXX with your actual GA4 Measurement ID -->`
- Since the site is a **SPA** (no full page reloads), configure GA4 to track **virtual page views** for any client-side navigation (if applicable). For this app (single view, no router), a single `config` call is sufficient.

### 2.3 — SPA View Tracking (optional, for future)
- If the app ever adds client-side routing or modal-based "pages", add a helper:

```typescript
// In main.ts or a dedicated analytics.ts
function trackPageView(path: string) {
  (window as any).gtag?.('event', 'page_view', {
    page_path: path
  });
}
```

- Call `trackPageView('/ChordFlow/')` on initial load (already handled by `config`).
- If modals (Settings, Music Theory, Tuner) are considered "views", optionally track them:
  ```typescript
  trackPageView('/ChordFlow/settings');
  trackPageView('/ChordFlow/theory');
  trackPageView('/ChordFlow/tuner');
  ```

### 2.4 — Custom Events (optional but recommended)
Track key user interactions for analytics:

```typescript
function trackEvent(action: string, params?: Record<string, string>) {
  (window as any).gtag?.('event', action, params);
}

// Usage examples:
trackEvent('play_chord', { chord: 'Cmaj', instrument: 'guitar' });
trackEvent('play_progression', { chord_count: '5', tempo: '120' });
trackEvent('transpose', { direction: 'up', offset: '+2' });
trackEvent('export', { format: 'pdf' });
trackEvent('import', { format: 'json' });
trackEvent('mode_change', { mode: 'advanced' });
trackEvent('tuner_used', { instrument: 'guitar' });
```

- Add these `trackEvent()` calls at the relevant interaction points in the existing code.
- Wrap in a try/catch or check `typeof gtag === 'function'` to avoid errors if GA fails to load (e.g., offline, ad-blocker).

### 2.5 — GitHub Pages Specifics
- The site will be hosted in github pages (subdirectory).
- I already have a `github.io` repo for the root domain. This is another repo but i have not yet push this repo to github Pages.

### 2.6 — Privacy
- `anonymize_ip: true` is set (IP is truncated before storage).
- No PII is collected (no user accounts, no forms).
- Add a small note in the app footer or an "About" modal: *"This site uses Google Analytics for anonymous usage statistics."*

In The About Modal Add: This is a free and open source app.

### 2.7 — Acceptance Criteria
- [ ] No console errors when GA script is blocked (ad-blocker) or fails to load
- [ ] Custom events fire on: play chord, play progression, transpose, export, import, mode change, tuner use
- [ ] `trackEvent` is a no-op if `gtag` is not defined
- [ ] Comment clearly marks where to replace the Measurement ID



