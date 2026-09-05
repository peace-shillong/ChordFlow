# ChordFlow — Single Page Application Walkthrough

**ChordFlow** is a modern, mobile-first Single Page Application (SPA) designed for musicians, songwriters, and learners to preview chords across four instruments (**Piano**, **Guitar**, **Ukulele**, **Harmonica**), construct and play 4–7 chord progressions with next-chord indicators, explore music theory (inversions, intervals, **Interactive Circle of Fifths**), and export progressions as **JSON**, **PNG images**, and printable **PDFs**.

---

## 🎨 3-Column Layout Architecture

| Column | Component | Features |
|---|---|---|
| **Left Column (Sidebar)** | **📚 Chord Library & Auto-Generator** | • Search input & filter pills (`All`, `C`, `C#`... `B`)<br>• Quality dropdown (`Major`, `Minor`, `7th`, `maj7`...)<br>• Scrollable chords grid with 1-tap `+` Add buttons<br>• **✨ Auto-Progression Generator**: Generates 4–7 chord progressions starting on the currently selected chord across 16 styles (Japanese / City Pop, Circle of Fifths, Pop, Jazz, Blues, Flamenco) |
| **Middle Column (Main)** | **🎼 Chord Progression Viewer & Builder** | • Progression Title & 22+ Sample Presets<br>• **"Next Chord →" indicator banner**<br>• Horizontal 4–7 chord card strip (drag/move/delete)<br>• Playback controls (Play/Pause, Stop, Loop, Metronome, Tempo, Tap Tempo)<br>• Strumming Pattern visualizer ticker<br>• Capo slider (`0–6`) & Tunings dropdown<br>• Music Theory overlays & **Interactive Circle of Fifths widget** |
| **Right Column (Sidebar)** | **🎸 Active Chord Diagram & Previewer** | • Active chord symbol, quality, and note names<br>• Inversion selector pills (`Root`, `1st`, `2nd`, `3rd`)<br>• **Realistic Proportional Piano Keyboard**: Shorter, natural ~4.6:1 key aspect ratio with top fallboard & red acoustic felt strip<br>• Guitar, Ukulele & Harmonica diagrams<br>• Clickable diagram notes with audio feedback<br>• "Play Chord" primary button |

---

## ⚡ ✨ Progression Auto-Generator (Left Sidebar)

Allows users to generate 4–7 chord progressions rooted on their selected chord:
- 🇯🇵 **Japanese & City Pop / Anime**:
  - **Royal Road / 王道進行 (IV-V-iii-vi / 4536)**: The most famous J-Pop / Anime progression.
  - **Just The Two of Us / 4-3-6-1**: Groovy City Pop & R&B progression with secondary dominant III7.
  - **J-Rock Drive (VI-VII-i-i)**: High energy anime opening cadence.
  - **Koakuma / Minor 4-5-6 (iv-v-vi)**: Melancholic Vocaloid ballad cadence.
- ⭕ **Circle of Fifths Cycles**:
  - **7-Chord Full Diatonic Circle** (`I-IV-vii°-iii-vi-ii-V`).
  - **Jazz Circle Cycle** (`ii7-V7-Imaj7-IVmaj7`).
  - **Minor Circle Turnaround** (`i-iv-bVII-bIII-bVI-iiø-V7`).
- 🎵 **Pop & Songwriting**:
  - **Pop 4-Chord Hit** (`I-V-vi-IV`).
  - **Emotional Hero** (`i-bVI-bIII-bVII`).
  - **50s Doo-Wop** (`I-vi-IV-V`).
  - **Pachelbel Canon**.
- 🎷 **Jazz & Neo-Soul**:
  - **Jazz Rhythm Changes** (`Imaj7-VI7-ii7-V7`).
  - **Neo-Soul Groove** (`i7-iv7-bVII7-bIIImaj7`).
- 🎸 **Rock, Blues & Flamenco**:
  - **12-Bar Blues** (`I7-IV7-I7-V7-IV7-I7`).
  - **Andalusian Cadence** (`i-bVII-bVI-V`).
  - **Mixolydian Rock** (`I-bVII-IV-I`).

---

## 🎹 Enhanced Piano Diagram Proportions

- Replaced vertically stretched keys with a realistic key aspect ratio (~4.6:1 for white keys, 63% for black keys).
- Added acoustic piano fallboard rail with rich crimson felt lining and drop shadows.
- Active chord keys highlight with vibrant gradients while displaying note names and interval numbers (`1, 3, 5...`).

---

## 🛠️ Verification & Test Results

```bash
npm run build
node scratch/test_app.js
```
- **Result**: `tsc` compiled with **0 errors and 0 warnings**.
- **Automated Validation Suite**: **50 / 50 test assertions passed** across datasets, generator formulas, and instrument models.
