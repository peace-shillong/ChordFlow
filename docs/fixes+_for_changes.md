# ChordFlow — Bug Fixes & Strum Pattern Integration

> **Instructions:** Implement the following 3 changes. Do not break existing functionality.
> After each section, confirm completion.

---

## 1. Theme Persistence (localStorage)

**Problem:** Light/Dark theme resets on every page reload.

**Fix:**
- On app load, read `localStorage.getItem('chordflow-theme')`.
  - If value is `"light"` or `"dark"`, apply it immediately (before first paint to avoid flash).
  - If no value exists, fall back to `prefers-color-scheme`.
- On theme toggle, write the new value: `localStorage.setItem('chordflow-theme', 'light' | 'dark')`.
- Add a `<script>` in `<head>` (before CSS) that reads localStorage and sets a `data-theme` attribute on `<html>` to prevent FOUC (flash of unstyled theme):
  ```html
  <script>
    (function() {
      const t = localStorage.getItem('chordflow-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
  ```
- CSS should use `[data-theme="dark"]` and `[data-theme="light"]` selectors instead of `@media (prefers-color-scheme: ...)`.

---

## 2. Audio Synthesis Reset Button

**Problem:** Once a user adjusts sound parameters (filters, decay, detune, reverb, volume), there's no way to restore defaults.

**Fix:**
- Add a **"Reset to Default"** button (↺ icon + text) in the Sound Adjustments panel (Advanced Mode, Instrument & Settings modal).
- On click:
  1. Reset all sliders/knobs for the **currently active instrument** to their hardcoded default values:
     | Parameter | Default |
     |-----------|---------|
     | Low-pass filter | 12000 Hz |
     | High-pass filter | 80 Hz |
     | Decay / Release | 300 ms |
     | Detune | 0 cents |
     | Reverb amount | 20% |
     | Volume | 80% |
  2. Reset the **sound preset** to the instrument's default preset (e.g., "Grand Piano" for piano, "Acoustic (Steel)" for guitar).
  3. Remove the instrument's custom settings from `localStorage` (key: `chordflow-audio-{instrumentId}`).
  4. Show a brief toast: `"Sound reset to default"`.
- The reset button should be **per-instrument** (only resets the active instrument, not all).
- Add a small **"Reset All"** text link below it that clears audio settings for all instruments.

---

## 3. Strum Pattern Editor — Full Integration

### 3.1 — Problem
The Strum Pattern Editor in Advanced Mode is disconnected from the rest of the app. It doesn't reflect the currently selected pattern, changes don't propagate to the visualizer or playback, and there's no clear apply flow.

### 3.2 — Required Behavior (Advanced Mode)

**Strum Pattern Editor (16 subdivisions):**

1. **On open:** The editor grid (16 slots) must **pre-fill** with the currently active strum pattern (the one selected in the Instrument & Settings modal). Map the pattern's D/U/rest values into the 16 subdivision slots.
   - Example: If "Basic" pattern is `["D","","U","","D","U","D","U"]` (8 beats), map it into 16 subdivisions (each beat = 2 subdivisions).

2. **Dropdown selector:** Above the editor grid, show a **dropdown** of all available strum patterns (from `strumPatterns.json`). Selecting one from the dropdown:
   - Pre-fills the 16-slot grid with that pattern.
   - User can then modify individual slots by clicking/tapping them (cycles: D → U → D+U → Rest → D).

3. **"Apply" button:** Below the grid.
   - On press:
     - Saves the edited 16-slot pattern as the **active strum pattern** in app state.
     - Updates the **Strum Visualizer/Ticker** (the animated indicator that shows D/U arrows scrolling with the beat) to reflect the new pattern.
     - Updates **playback**: the next time the progression plays (or immediately if currently playing), the strumming follows the new pattern.
     - Persists the pattern to `localStorage` (key: `chordflow-active-strum`).
   - Show toast: `"Strum pattern applied"`.

4. **"Reset" button** (next to Apply): Reverts the grid to the last applied pattern (discards unsaved edits in the grid).

**Strum Visualizer/Ticker:**
- Must always reflect the **currently applied** pattern (not the raw selected preset).
- Animates in sync with BPM, highlighting the active subdivision.
- Shows D (↓), U (↑), D+U (↓↑), and Rest (·) symbols.

**Strumming Playback:**
- When "Play Progression" or a number key is pressed, the strum direction (D, U, D+U) for each beat follows the **applied pattern**.
- If the pattern has rests, no sound is played on that subdivision.

### 3.3 — Beginner (Clean) Mode

- The **Strum Visualizer/Ticker** must be **visible** in Beginner Mode (below the progression cards).
- It shows the currently applied pattern as simple D/U arrows — **read-only**, no editor.
- It animates in sync with playback.
- The user does NOT see the editor grid or dropdown in Beginner Mode.

### 3.4 — Data Flow Summary

```
Settings Modal (Strum Pattern dropdown)
        │
        ▼
  App State: activeStrumPattern (16 slots)
        │
        ├──► Strum Pattern Editor (Advanced: pre-fills grid)
        │         │
        │    [User edits slots]
        │         │
        │    [Apply button] ──► Updates App State
        │                           │
        ├──► Strum Visualizer/Ticker ◄── (reads App State)
        │
        └──► Playback Engine ◄────────── (reads App State)
```

All three (Editor, Visualizer, Playback) read from and write to the **same single source of truth** in app state.

### 3.5 — Acceptance Criteria

- [ ] Theme persists across page reloads via localStorage
- [ ] No theme flash on load (FOUC-free)
- [ ] Reset button restores default audio params for active instrument
- [ ] "Reset All" clears all instruments' audio settings
- [ ] Strum Pattern Editor pre-fills with currently active pattern
- [ ] Dropdown selection pre-fills the editor grid
- [ ] User can click individual slots to cycle D → U → D+U → Rest
- [ ] Apply button updates visualizer + playback + persists to localStorage
- [ ] Reset button in editor discards unsaved grid edits
- [ ] Strum Visualizer is visible in Beginner Mode (read-only)
- [ ] Strum Visualizer is NOT visible in Advanced Mode when editor is open (avoid duplication) — or show both if space allows
- [ ] Playback respects rests (silence on rest subdivisions)
- [ ] All three components (editor, visualizer, playback) stay in sync
