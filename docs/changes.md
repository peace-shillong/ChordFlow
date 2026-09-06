# ChordFlow — Changes & Feature Requests

> **Instructions to IDE:** Read this file in full. Each section below is a batch of changes.
> Implement them in the order listed. After each batch, confirm completion before proceeding.
> All changes must maintain existing functionality — do not break working features.
> Maintain Clean Mode / Advanced Mode separation as described.

---

## 1. Chord Library Card

### 1.1 — Root Filter Buttons
- **Change:** Make the root note filter buttons (C, D, E, F, G, A, B, C#, D#, E#, F#, G#, A#, B#) **bigger** (increase font-size and padding).
- **Arrange in order:** `C, D, E, F, G, A, B, C#, D#, E#, F#, G#, A#, B#`
- Display as a single horizontal scrollable row (or 2 rows on narrow screens) above the chord grid.
- Active filter should be visually highlighted (accent color background).

### 1.2 — Chord List Height (Desktop & Tablet)
- **Change:** On **desktop** (≥768px) and **tablet** (≥480px landscape), limit the chord list height to **exactly 3 rows** of chord cards.
- Keep the current card design (symbol, quality badge, instrument icon).
- Add a **vertical scrollbar** within the list container so the user can scroll to see remaining chords.
- This ensures the entire app (library + progression + diagram) fits in **one viewport** without page scroll.
- On mobile (<480px portrait), keep the current behavior (library is a modal — see Section 6).

---

## 2. Chord Progression Card

### 2.1 — Max Chord Count by Mode
- **Beginner (Clean) Mode:** Allow max **8** chords in a progression.
- **Advanced Mode:** Allow max **16** chords in a progression.
- Show a subtle counter: `5 / 8` or `12 / 16`.
- Disable the "Add Chord" button when limit is reached.

### 2.2 — Custom Progression Title
- Add an **editable text input** at the top of the Chord Progression card for the user to name their progression.
- Placeholder: `"My Progression"`
- This title should be included in all exports (JSON, PNG, PDF) as the document title.
- If the user loads a pre-seeded progression, auto-fill the title from `progressions.json`.

### 2.3 — Move Save/Import Buttons into Progression Card
- **Remove** the Save, Import JSON, PDF, and PNG buttons from the footer.
- **Add** a compact toolbar **inside** the Chord Progression card (top-right or bottom of the card):
  - 💾 **Save** button → opens a dropdown:
    - Save as JSON
    - Save as PDF
    - Save as PNG (Image)
  - 📂 **Import** button → file picker for `.json`
- This saves vertical space in the footer and keeps actions contextual.

### 2.4 — Improve Stop / Repeat / Tap Button Styling
- Make these three transport buttons **bigger** (min 44×44px touch target).
- Use distinct icons: ⏹ Stop, 🔁 Repeat, 🎵 Tap Tempo.
- Add a subtle background pill/capsule shape with visible border.
- Active state (e.g., Repeat is ON) should show a filled accent background.
- Ensure they are clearly visible and not confused with other controls.

### 2.5 — Volume Control
- Add a **volume slider** (0–100%) to the Chord Progression card transport area.
- Icon: 🔊 (mute at 0%).
- This controls the master output gain for all instrument playback.
- Persist the value in `localStorage`.

### 2.6 — Copy Progression as Text
- Add a **Copy** icon button (📋) in the progression card toolbar.
- On click: copies the chord names to clipboard, space-separated.
  - Example: `"C G Am F"` or `"Dm7 G7 Cmaj7 Fmaj7"`
- Show a brief toast: `"Copied!"`
- In Advanced Mode, optionally include scale degrees: `"I V vi IV (Key of C)"`

### 2.7 — Strum Pattern by Mode
- **Beginner (Clean) Mode:**
  - Display the **current strum pattern** as a simple visual (D/U arrows with beat dots) below the progression.
  - Read-only — user cannot edit.
- **Advanced Mode:**
  - Show a **Strum Pattern Editor**: a grid of beat slots where the user can set D, U, D+U, or rest.
  - Allow selecting from pre-loaded patterns or creating a custom one.
  - Strum pattern is saved with the progression in JSON export.

---

## 3. Playing Chords — Keyboard Shortcuts

### 3.1 — Number Keys 1–8 for Direct Chord Play
- Keys `1` through `8` (and `9`–`0` for positions 9–16 in Advanced Mode) play the corresponding chord in the progression.
- **Behavior by modifier:**
  | Key Combo | Action (String Instruments) | Action (Piano/Harmonica) |
  |-----------|----------------------------|--------------------------|
  | `1`–`8` | Play chord as **down strum** | Play chord (all notes) |
  | `Shift` + `1`–`8` | Play chord as **up strum** | Play chord (all notes) |
  | Hold `Shift` + `1`–`8` | Play **down-up** (or D+U) based on selected strum pattern style | Play chord with slight arpeggio |

- The strum direction/style follows the **Strum Pattern** currently selected in Instrument & Settings.
- For non-string instruments (piano, harmonica), number keys simply play the chord/notes.

### 3.2 — Existing Shortcuts (Keep)
- `Space` / `Enter` → Play active chord
- `←` / `→` → Previous / Next chord in progression
- Ensure no conflict between number keys and other shortcuts.

---

## 4. Advanced Mode — Sound Presets & Adjustments

### 4.1 — Instrument Sound Presets
Add a **Sound Preset** dropdown in the Instrument & Settings card (Advanced Mode only):

| Instrument | Presets |
|-----------|---------|
| Piano | Grand Piano, Electric Piano, Organ, Lofi Piano, Music Box |
| Guitar | Acoustic (Steel), Acoustic (Nylon), Electric Clean, Electric Distort, Jazz Archtop |
| Ukulele | Standard, Tenor, Baritone |
| Violin | Standard, Violin (Dampened) |
| Bass | Acoustic/Upright, Electric Clean, Electric Finger, Slap |
| Harmonica | Standard, Draw Bar, Octave |

Each preset adjusts the Web Audio synthesis parameters (waveform, filter, envelope, detune, reverb send).

### 4.2 — Custom Sound Adjustments (Advanced)
Expose a small panel with sliders/knobs:
- **Low-pass filter** (200 Hz – 20 kHz)
- **High-pass filter** (20 Hz – 2 kHz)
- **Decay / Release** (50 ms – 3 s)
- **Detune** (±25 cents)
- **Reverb amount** (0–100%)
- **Volume per instrument** (0–100%)

Persist custom settings in `localStorage` per instrument.

---

## 5. Chord Diagram Card

### 5.1 — Auto-Scrolling Keyboard (Piano) Diagram
- **Problem:** Some chords span from C3 to E4 or start at E5, making notes fall outside the visible canvas.
- **Fix:** The piano diagram canvas should **auto-scroll/pan** to center on the chord's note range.
  - Calculate the min and max MIDI note of the chord.
  - Offset the rendering so the chord is centered in the visible area.
  - Add a subtle scroll indicator (← →) if the chord extends beyond the visible window.
  - Allow the user to manually scroll the keyboard left/right with mouse drag or swipe.

### 5.2 — Chord Voicing / Alternative Fingerings Dropdown
- Add a **dropdown** in the Chord Diagram card: `"Voicing: Default"` → user can select alternative ways to play the same chord.
  - Example for Guitar: G major → Open G, 3rd fret G, 5th fret G, Barre G
  - Example for Piano: C major → Root position, 1st inversion, 2nd inversion, Spread voicing
  - Example for Ukulele: C major → Open C, 3rd fret C
- **Data requirement:** Each chord in `chords.json` must have a `voicings` array:
  ```json
  "voicings": [
    { "id": "open", "label": "Open", "guitar": [3,2,0,0,0,3], "piano": [60,64,67] },
    { "id": "3fret", "label": "3rd Fret", "guitar": [-1,-1,0,2,1,0], "piano": [64,67,72] },
    { "id": "barre", "label": "Barre (5th)", "guitar": [3,3,5,5,4,3], "piano": [72,76,79] }
  ]
  ```
- **If voicing data is missing** from the existing JSON, **generate it** by referencing the sites listed in References (Section 10) and links in instruments.docx or search online if not found. Prioritize: Guitar (open + 2 barre positions), Piano (3 inversions + spread), Ukulele (open + 1 barre).
- On voicing change, re-render the diagram and update the audio (play the new voicing).

---

## 6. Clean UI / UX — Responsive Layout

### 6.1 — Tablet & Mobile Horizontal = Desktop Layout
- **Tablet (≥480px) and Mobile Landscape (≥600px height < 768px width):**
  - Use the **same 3-column layout** as desktop:
    - Column 1: Chord Library
    - Column 2: Chord Progression
    - Column 3: Chord Diagram
  - Columns can be narrower but maintain the same structure.
- **Mobile Portrait (<480px):**
  - Show **2 columns only**: Chord Progression + Chord Diagram.
  - **Chord Library becomes a modal** (bottom sheet or full-screen overlay).
  - The modal opens when the user taps the **"Add / Change Chord"** button in the Chord Progression card.
  - This button is **only visible on mobile** (hidden on tablet/desktop where the library is always visible).
  - Modal has: search, root filter, chord grid, and a "Select" action that closes the modal and adds the chord.

### 6.2 — Instrument & Settings + Music Theory as Modals
- **Remove** the Instrument & Settings card and Music Theory Overlays card from the main layout.
- Replace with **icon buttons** in the header or a floating action bar:
  - ⚙️ Icon → opens **Instrument & Settings modal** (capo, tuning, strum, sound presets, volume)
  - 🎼 Icon → opens **Music Theory modal** (circle of fifths, scale degrees, intervals)
- Modals should be:
  - Centered on desktop/tablet (max-width 500px)
  - Bottom sheet on mobile
  - Dismissible via backdrop click, X button, or Escape key
- This **saves significant vertical space** in the main view.

---

## 7. Capo & Transposition (String Instruments)

### 7.1 — Capo-Aware Chord Display
- When Capo is ON (position > 0) for Guitar, Ukulele, or Guitalele:
  - **Chord Diagram Card:** Show the diagram **relative to the capo** (i.e., fret 0 = capo position). Display a small "Capo: 2" label on the diagram.
  - **Chord Progression Card:** Show the **transposed chord names** (the key the song is actually in with capo).
    - Example: Capo 2 + playing "G" shape = actual key is **A**. Display: `G (Capo 2) → A`
  - **Chord Library:** Optionally show a "With Capo 2" badge on chords that become new keys.
- The transposition math: `actual_key = open_key + capo_semitones`
- When the user changes capo, **re-render all affected diagrams and progression labels** immediately.

---

## 8. New Instruments

### 8.1 — Violin
- **Add Violin** as a 5th instrument tab.
- 4 strings: G3, D4, A4, E5 (standard tuning).
- **Primary display mode: Single notes** (scale tones of the chord), not full chords.
- **Secondary display mode: Chords** (for the few chords violin can play) — toggle between "Notes" and "Chords" view.
- Diagram: Fretboard with 4 strings, positions marked for each note of the chord/scale.
- Sound: Sine wave with slight vibrato (LFO 6Hz, depth 15 cents), longer sustain.
- Tuning options: Standard (GD AE), D tuning (GDAD).

### 8.2 — Bass (Electric/Upright)
- **Add Bass** as a 6th instrument tab.
- 4 strings: E1, A1, D2, G2 (standard tuning).
- **Primary display mode: Single notes** (root, 5th, octave, passing tones).
- Diagram: Fretboard with 4 strings, thicker strings, positions 0–12.
- Sound: Sine + slight sawtooth blend, longer attack, lower frequency range.
- Tuning options: Standard (EADG), Drop D (DADG), F tuning (FADF).
- **Guitalele** (5-string: A, D, G, C, E, A — top 4 = GCEA, 5th string = A one octave up):
  - Add as a 7th instrument tab OR as a tuning option under Guitar.
  - Standard tuning: **ADGCEA** (6 strings, similar to ukulele + 2 lower strings).
  - Diagram: 6-string fretboard, fret range 0–8.

### 8.3 — Instrument-Specific Display Logic
| Instrument | Default View | Alternative View | Notes |
|-----------|-------------|-----------------|-------|
| Piano | Chord (keys) | Single notes (arpeggio) | Auto-scroll keyboard |
| Guitar | Chord (fretboard) | Single notes (scale) | Capo-aware |
| Ukulele | Chord (fretboard) | Single notes (scale) | Capo-aware |
| Guitalele | Chord (fretboard) | Single notes (scale) | Capo-aware |
| Harmonica | **Single notes** (holes) | Chord (rare) | Note-by-note, not full chord |
| Violin | **Single notes** (fretboard) | Chord (few) | Vibrato sound |
| Bass | **Single notes** (fretboard) | Chord (rare) | Root + 5th focus |

- Add a **View Toggle** button in the Chord Diagram card: `[ Chord | Notes ]`
- For Harmonica, Violin, and Bass, default to "Notes" view.
- For Guitar, Piano, Ukulele, default to "Chord" view.

### 8.4 — Harmonica-Specific Progression Display
- Since harmonica plays **notes, not chords**, the progression display should:
  - Show the **notes to play** for each chord position (e.g., "4- 4= 4+" for C major).
  - Optionally show the **melodic line** (root → 3rd → 5th → root) as a sequence of hole numbers.
  - The "Play" button plays the notes sequentially (not simultaneously) for a more natural harmonica feel.
  - In Advanced Mode, show the scale degree of each note.

---

## 9. New Feature — Tuner

### 9.1 — Tuner Modal
- Add a **Tuner** icon button (🎯) in the header or floating action bar.
- Opens a **Tuner Modal** with:
  - **Instrument selector:** Guitar, Violin, Ukulele, Bass, Guitalele
  - **Mic input** (Web Audio API `getUserMedia` + `AnalyserNode`)
  - **Pitch detection** (autocorrelation or YIN algorithm)
  - **Display:**
    - Current detected note (e.g., "A4")
    - Target note (cycles through the instrument's strings)
    - Cent deviation (e.g., "+12 cents sharp" / "-8 cents flat")
    - Visual needle/gauge (centered = in tune)
    - Color feedback: Red (far) → Yellow (close) → Green (in tune)
  - **"Next String" button** or auto-advance after 2 seconds in tune.
  - Show the **standard tuning** for the selected instrument:
    - Guitar: E2, A2, D3, G3, B3, E4
    - Ukulele: G4, C4, E4, A4
    - Guitalele: A2, D3, G3, C4, E4, A4
    - Violin: G3, D4, A4, E5
    - Bass: E1, A1, D2, G2

### 9.2 — Technical Notes
- Use `navigator.mediaDevices.getUserMedia({ audio: true })` for mic access.
- Pitch detection: implement YIN or autocorrelation in a Web Worker to avoid blocking UI.
- Show a "Mic Permission Required" message if user denies access.
- Tuner works independently of the main app state.

---

## 10. References (for data generation & verification)

Use these sites to generate/verify chord diagrams, voicings, scales, and instrument data:

- https://www.all-guitar-chords.com/
- https://www.8notes.com/
- https://www.8notes.com/theory/
- https://www.8notes.com/all/lessons/
- https://www.8notes.com/all/licks_and_riffs/
- https://www.8notes.com/guitar_scales/C.asp
- https://www.8notes.com/piano_scales/
- https://www.8notes.com/ukulele_chord_chart/
- https://www.8notes.com/guitar_chord_chart/
- https://autochords.com/
- https://www.musicca.com

> **Note to IDE:** If `chords.json` is missing voicings, alternate fingerings, or data for new instruments (Violin, Bass, Guitalele), generate the data by referencing the above sites or any other website online. Ensure all fret positions, note names, and intervals are musically correct.

---

## 11. Acceptance Criteria (post-changes)

- [ ] Root filter buttons are bigger and in correct order (C through B#)
- [ ] Chord list is 3 rows tall on desktop/tablet with internal scroll
- [ ] Beginner mode allows 8 chords; Advanced allows 16
- [ ] Progression title is editable and included in exports
- [ ] Save/Import buttons are inside the Progression card (not footer)
- [ ] Stop/Repeat/Tap buttons are larger with clear styling
- [ ] Volume slider works and persists
- [ ] Copy button copies chord names as space-separated text
- [ ] Strum pattern is visible in Beginner mode; editable in Advanced
- [ ] Keys 1–8 play chords; Shift+1–8 plays up strum; Hold Shift+1–8 plays D+U
- [ ] Sound presets available in Advanced mode (Piano, Guitar, etc.)
- [ ] Low/high pass, decay, detune, reverb sliders work
- [ ] Piano diagram auto-scrolls to center the chord
- [ ] Voicing dropdown shows alternative fingerings and re-renders
- [ ] Tablet landscape uses 3-column layout (same as desktop)
- [ ] Mobile portrait shows 2 columns; library opens as modal via "Add Chord" button
- [ ] Instrument & Settings and Music Theory are modals (icon-triggered)
- [ ] Capo transposes chord names in progression and adjusts diagrams
- [ ] Violin, Bass, and Guitalele are playable with correct diagrams & sound
- [ ] Harmonica shows single notes (holes) by default, not full chords
- [ ] Violin/Bass default to "Notes" view; Guitar/Piano/Ukulele default to "Chord" view
- [ ] View Toggle (Chord/Notes) works for all instruments
- [ ] Tuner modal works with mic for all 5 instruments
- [ ] No console errors; all TS compiles clean in strict mode
- [ ] Works at 375px width without overflow


- After Changes.md is done it took 20 mins to complete from 7PM - 7:20PM
- Great Results but a few things we need to do
1. The Show Note Names on Diagram and Show Interval Numbers (1, 3, 5, 7) from the  Music Theory & Circle of Fifths modal checkbox are not working, when they are checked the Chord Diagram should show the note name or the Number, right now it is only showing the note name in the String Instruments, the piano note and numbers are not shown like before adding these new changes.
2. The Tuner Needs to have a message that says please allow mic to start the tuner. Instead of Dropdown to select an instrument use buttons Guitar Violin Ukulele Bass Guitalele in the first row and also buttons in the second row which will display the selected string the user wants to tune, When the user plays the corrent tune for the string 3 times, then the tuner auto selects the next sttring for the instrument making the UX more better.
3. Playing while press and holding the shift key down, then a number is not good, for the following
| Hold `Shift` + `1`–`8` | Play **down-up** (or D+U) based on selected strum pattern style | Play chord with slight arpeggio |
since if user press and holds the number key also the chord gets played infinitely, it should stick till 4 bars only
4. The Top bar which shows the instrument list has a horizontal scrollbar which is not good UX, let that row fill the entire row and the instruments be centered aligned so I don't need to scroll in desktop mode
5. For Tablets, the Horizontal view is perfect. In portrait view the Chord Library shuold not fill the entire row, instead it should show the Chord Progression and Chord Diagram in the same row with 50% width each and the chord library can be displayed in the next row. This view can also be applied to mobile view in horizal layout.
6. In The Chord Diagram Card, The Notes button netx to the Chord button doesn't seem to do anything or work properly check it out and tell me what is the purpose of this button.


Few things to do after changes mod is completed
1. Theme Light/Dark should be save in localstorage of browser so next time user visits the theme will be take from there
2. Audio Synthesis Parameters - have a button to reset the settings to the default for each instrument if a user has made his changes.
3. In Advance mode the Strum Pattern Editor (16 Subdivisions) should show the current strum pattern selected from the settings modal Strum Pattern in the editor so that it can be edited and applied by pressing an apply button, so the strum-visualizer-ticker will display the updated pattern and the updated strumming pattern will also be played for the current chord progression, The Strum Pattern Editor should also allow user to change the existing strumming pattern by selecting the options from one of the drop down options, The Strum Pattern Editor, Visualer and the strumming play are related to each other. In Beginner mode, the Strumming Pattern Visualer should be visible to the user.

3 minor fixes
The app is great, let's do a few things: 
1. The Auto-Generate Progression - Should also generate the strumming pattern as per the selected Style / Formula when user generates a new Progression. 
2. Selected mode Beginner/Advance Mode should be stored in localStorage so that next time user opens the SPA the preferred mode will be loaded. 
3. The Chord Diagram for the Piano, if the user has press the arrow key to scroll to the previous/next Octave the Octave should be shown for e.g 4 when C4 is visible, give proper title for the visible Octave in the Keyboard. Let's make these three changes without breaking any of the working features 

More Minor Changes 
1. On load if user has selected Advanced mode by default user will not be able to add chords when he reached 8/16 even though he is on Advance Mode enaabled.
"Progression limit reached (maximum 16 chords). Switch to Advanced mode for up to 16 chords."
2. Display the Style / Formula for Auto Chord Progression in a modal instead of a dropdown list 
3. Instrument Tuning is not working for strings - may be removed  - Manual

After these minor fixes I am almost done now
- left with making this into a PWA
- testing it on live server and 
- generating a ReadMe, with images and About Modal

What I saw in this version that is ready to deploy and I won't make any more changes:
Future Enhancements or maybe not: 
1. Auto Generate Chord Progression - when user generates the chord progression, the tempo is not generated as per the style but kept with the current tempo. 
2. Capo on String instruments: I expected The Capo when turned on should change the chords in the chord progression and show the correct diagram for the correct chord that has been transposed to, but it didn't work, so let's leave this out for now. 


