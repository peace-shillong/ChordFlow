# 🎵 ChordFlow — Interactive Multi-Instrument Chord Studio & Progression Builder

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Polyphonic%20Synthesis-FF6B6B?style=flat-square&logo=w3c&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Capable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D%20Rendering-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Zero Runtime Dependencies](https://img.shields.io/badge/Dependencies-Zero%20Runtime%20Bundler-10B981?style=flat-square)](https://github.com/)

> **ChordFlow** is a modern, high-performance Progressive Web Application (PWA) and interactive Web Audio chord previewer, progression builder, chromatic instrument tuner, and music theory workspace. Built for songwriters, composers, producers, educators, and multi-instrumentalists.

---

## 📸 Screenshots Showcase

### 1. Guitar Studio & Progression Sequencer (Clean Mode)
![ChordFlow Home Screen - Guitar Studio](screenshots/1.%20Home%20Screen.png)

---

### 2. 88-Key Interactive Piano Keyboard with Octave Navigation
![ChordFlow Home Screen - Piano Studio](screenshots/2.%20Home%20Screen%20-%20Piano.png)

---

### 3. Progression Styles & Formulas Modal (16 Curated Formulas + BPM Sync)
![Chord Progression Generation Modal](screenshots/3.%20Chord%20Progression%20Generation%20Modal.png)

---

### 4. Advanced Instrument & Audio Synthesis Controls
![Advanced Instrument Settings & Audio Sliders](screenshots/4.%20Advance%20Instrument%20Settings.png)

---

### 5. Interactive Music Theory & Circle of Fifths Studio
![Interactive Music Theory & Circle of Fifths](screenshots/5.%20Interactive%20Music%20Theory.png)

---

### 6. Real-Time Chromatic Tuner with Microphone Pitch Detection
![Real-Time Chromatic Tuner](screenshots/6.%20Tuner.png)

---

## 🌟 Core Features & Highlights

### 🎸 1. 7 Realistic Multi-Instruments & Accurate Tunings
ChordFlow renders responsive, high-DPI Canvas 2D diagrams with realistic string layouts, fret markers, finger position dots, open/muted string indicators, and harmonic note names:
- **Acoustic / Electric Guitar**: 6 Strings (`E2 - A2 - D3 - G3 - B3 - E4`)
- **Piano Keyboard**: Polyphonic 88-key mapped keyboard with visible octave title banner and `◀` / `▶` octave scrolling
- **Ukulele**: 4 Strings Standard Soprano/Concert (`G4 - C4 - E4 - A4`)
- **Guitalele**: 6 Strings Requinto tuning (`A2 - D3 - G3 - C4 - E4 - A4`)
- **Violin**: 4 Strings Orchestral tuning (`G3 - D4 - A4 - E5`)
- **Bass Guitar**: 4 Strings Standard Bass (`E1 - A1 - D2 - G2`)
- **Harmonica**: 10-Hole Diatonic Harmonica in Key of C with blow (`B`) and draw (`D`) indicators

---

### 🎼 2. 144 Interactive Chords & Multi-Voicing Engine
- **12 Chromatic Roots**: `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`
- **12 Chord Qualities**: Major, Minor, Dominant 7th, Major 7th, Minor 7th, Diminished, Augmented, Sus2, Sus4, Major 6th, Minor 6th, and Add9
- **Voicing Variations**: Open position, barre chords, drop voicings, triad inversions, and high-register fingerings
- **Dynamic Display Modes**: Toggle between **Chord View** (finger placement & fretboard diagrams) and **Notes View** (exact musical note names & intervals)

---

### ⚡ 3. Progression Generator with 16 World-Class Formulas
Select any chord as root and automatically generate complete, musically coherent harmonic progressions with matching tempo and strumming patterns:
| Formula Name | Roman Numerals / Structure | Category | Curated BPM | Strum Pattern |
| :--- | :--- | :--- | :---: | :--- |
| **Royal Road / 王道進行** | `IV - V - iii - vi` | Japanese & City Pop | **128** | Pop / Rock Drive |
| **Just The Two of Us / 丸サ進行** | `IVmaj7 - III7 - vi - I7` | Japanese & City Pop | **96** | Fingerpicking |
| **J-Rock Drive / 疾走進行** | `vi - IV - V - I` | Japanese & City Pop | **165** | Driving 8ths |
| **Komuro / 小室進行** | `vi - IV - V - I` | Japanese & City Pop | **132** | Pop / Rock Drive |
| **Canon / カノン進行** | `I - V - vi - iii - IV - I - IV - V` | Japanese & City Pop | **78** | Fingerpicking Ballad |
| **Diatonic Circle Cycle** | `I - IV - vii° - iii - vi - ii - V - I` | Circle of Fifths | **110** | Ballad |
| **Jazz Cycle (ii-V Subs)** | `Imaj7 - IV7 - viiø7 - III7 - vi7 - ii7 - V7 - I`| Circle of Fifths | **130** | Jazz Swing |
| **Chromatic Descending** | `i - i(maj7) - i7 - i6 - iv - V7` | Circle of Fifths | **88** | Fingerpicking |
| **Axis of Awesome** | `I - V - vi - IV` | Pop & Songwriting | **120** | Pop / Rock Drive |
| **50s Doo-Wop** | `I - vi - IV - V` | Pop & Songwriting | **104** | 6/8 Slow Waltz |
| **Emotive Minor Pop** | `vi - IV - I - V` | Pop & Songwriting | **116** | Ballad |
| **Jazz Major ii-V-I** | `ii7 - V7 - Imaj7` | Jazz & Neo-Soul | **125** | Jazz Swing |
| **Neo-Soul Progression** | `ii9 - V13 - Imaj9 - VI7alt` | Jazz & Neo-Soul | **82** | Fingerpicking |
| **12-Bar Blues** | `I - I - I - I - IV - IV - I - I - V - IV - I - V`| Rock, Blues & Flamenco | **105** | Driving 8ths |
| **Andalusian Cadence** | `i - VII - VI - V` | Rock, Blues & Flamenco | **136** | Flamenco Rumba |
| **Classic Rock Anthem** | `I - bVII - IV` | Rock, Blues & Flamenco | **122** | Driving 8ths |

---

### 🥁 4. 16-Subdivision Strumming Engine & Playback Ticker
- **Interactive 16-Step Pattern Grid**: Configure Down-strums (`↓`), Up-strums (`↑`), Muted chucks (`x`), and Accented beats.
- **Real-Time Synchronized Ticker**: Live visual beat tracker highlighting the exact active 16th-note subdivision in sync with audio output.
- **Preset Library**: Basic Folk, Pop/Rock Drive, Ballad Strum, Driving 8ths, Flamenco Rumba, Jazz Swing, Fingerpicking, and 6/8 Waltz.

---

### 🎯 5. Real-Time Chromatic Tuner
- **Audio Pitch Detection**: Custom real-time pitch detection engine utilizing the **YIN / Autocorrelation algorithm** directly from microphone input (`getUserMedia`).
- **Visual Deviation Meter**: High-precision gauge with cent offset (`-50` to `+50` cents), target pitch, and frequency readout in Hz.
- **Instrument String Buttons**: Quick string selector buttons for Guitar, Ukulele, Guitalele, Violin, and Bass.
- **Smart Auto-Advance**: Automatically detects when a string is tuned within tolerance 3 consecutive times and seamlessly advances to the next string.

---

### 🎡 6. Circle of Fifths & Music Theory Studio
- **12-Key Chromatic Wheel**: Visual representation of Major Keys, Relative Minors, and Key Signatures (Sharps/Flats).
- **Diatonic Harmonization**: Instantly displays the primary and secondary triads (`I`, `ii`, `iii`, `IV`, `V`, `vi`, `vii°`).
- **Modal Interchange & Borrowed Chords**: Explore parallel minor chords, subdominant minors, and secondary dominants.
- **Scale Degree Formula Viewer**: Interactive breakdown of chord tones (Root `1`, Minor/Major `3`, Perfect/Diminished `5`, `7`, `9`, etc.).

---

### 🎛️ 7. Web Audio Polyphonic Synthesizer
- **Multi-Oscillator Tone Engine**: Custom instrument models simulating string plucking, piano hammer strikes, bowed strings, and harmonica reed vibrations.
- **Sound Design Controls**:
  - **Low-Pass Filter (LPF)**: Adjustable cutoff (100 Hz to 12,000 Hz) to control brightness.
  - **High-Pass Filter (HPF)**: Adjustable cutoff (20 Hz to 2,000 Hz) to remove low-end rumble.
  - **Decay Time**: Envelope release shaping (0.1s to 5.0s) for percussive plucks or sustaining ambient chords.
- **Capo Transposition**: Virtual capo (Frets 0–12) with instant pitch shift.

---

### 🎚️ 8. Dual Workflow Modes with State Persistence
- **Clean Mode (Beginner)**: Focused, distraction-free interface holding up to 8 progression steps, essential controls, and streamlined navigation.
- **Advanced Mode (Theory & Production)**: Expanded 16-chord capacity, multi-voicing picker, inversion matrix, full audio synthesis controls, and detailed music theory tags.
- **Automatic Persistence**: User mode selection and custom strumming patterns persist seamlessly across browser sessions via `localStorage`.

---

### 📄 9. Export & Sharing Capabilities
- **Printable PDF Chord Chart**: High-resolution, vector-rendered chord sheet exported directly via `jsPDF` with title, tempo, and chord symbols.
- **MIDI File Export**: Generates Standard MIDI File (Format 0) containing accurate note pitches, durations, and tempo metadata.
- **JSON & Text Export**: Formatted JSON data interchange or copy-to-clipboard chord sequences.

---

### 📱 10. Progressive Web App (PWA) Offline Engine
- **Installable Native Experience**: Install ChordFlow directly onto macOS, Windows, Linux, iOS, and Android home screens.
- **100% Offline Capability**: Built-in Service Worker (`sw.js`) pre-caches all HTML, CSS, JavaScript modules, JSON chord datasets, and audio generators for instant zero-latency loading without an internet connection.

---

## ⌨️ Keyboard Shortcuts Reference

| Key / Combination | Action | Detailed Description |
| :--- | :--- | :--- |
| <kbd>Space</kbd> | **Play / Pause** | Toggle playback of the current chord progression |
| <kbd>Enter</kbd> | **Play Chord** | Audition / strum the currently selected chord |
| <kbd>1</kbd> – <kbd>8</kbd> | **Trigger Chord** | Instantly select and play chord card 1 through 8 |
| <kbd>Shift</kbd> + <kbd>1</kbd>–<kbd>8</kbd> | **Down-Up Strum** | Trigger chord step with a rapid down-up strum sequence |
| <kbd>←</kbd> / <kbd>→</kbd> | **Step Progression** | Navigate to previous / next chord in the progression |
| <kbd>←</kbd> / <kbd>→</kbd> *(Piano)* | **Scroll Octave** | Scroll the Piano keyboard left or right by ±1 Octave (12 semitones) |
| <kbd>?</kbd> or <kbd>A</kbd> | **About & Help** | Open the About ChordFlow & Shortcuts Documentation modal |
| <kbd>T</kbd> | **Tuner** | Open the Real-Time Chromatic Instrument Tuner |
| <kbd>M</kbd> | **Music Theory** | Open the Music Theory & Circle of Fifths Explorer |
| <kbd>S</kbd> | **Settings** | Open Instrument & Audio Synthesis Controls |
| <kbd>Esc</kbd> | **Close Modals** | Close any active modal window or overlay |

---

## 📂 Project Architecture

```
ChordFlow/
├── index.html                   # Main single-page application entry point & modal definitions
├── manifest.webmanifest         # PWA Web App Manifest (metadata, theme colors, icons)
├── sw.js                        # Service Worker (PWA offline caching & runtime cache)
├── package.json                 # Project configuration & build scripts
├── tsconfig.json                # TypeScript compiler configuration (ES2022 target)
├── css/
│   └── main.css                 # Modern CSS3 stylesheet (glassmorphism, CSS variables, dark/light theme)
├── data/
│   ├── chords.json              # Comprehensive database of 144 chords & 7 instrument fingerings
│   ├── instruments.json         # Instrument tuning specifications, strings, and audio profiles
│   ├── progressions.json        # Built-in genre and song progression presets
│   └── strumPatterns.json       # Preset 16-subdivision strumming patterns
├── dist/                        # Compiled JavaScript ES Modules (output from tsc)
│   ├── audio.js                 # Web Audio synthesis engine & biquad filter pipeline
│   ├── chord.js                 # ChordDatabase, voicing models & 16 generation formulas
│   ├── db.js                    # Asynchronous data loading & query engine
│   ├── diagrams.js              # High-DPI HTML5 Canvas 2D diagram renderers
│   ├── export.js                # PDF (jsPDF), MIDI, and JSON export utilities
│   ├── instruments.js           # Instrument configuration manager
│   ├── main.js                  # Application bootstrap & Service Worker registration
│   ├── progression.js           # Progression sequencer, transport engine & event dispatcher
│   ├── theory.js                # Circle of Fifths renderer & harmonic analysis engine
│   ├── tuner.js                 # YIN / Autocorrelation pitch detection & chromatic tuner
│   ├── types.js                 # TypeScript interfaces, types, and state definitions
│   └── ui.js                    # DOM event handlers, modal managers & view controllers
├── icons/                       # PWA application icons
│   ├── icon.svg                 # High-resolution vector master icon
│   ├── icon-192.png             # 192x192 PNG app icon
│   ├── icon-512.png             # 512x512 PNG app icon
│   ├── icon-maskable-512.png    # 512x512 Maskable PNG icon for Android
│   └── apple-touch-icon.png     # 180x180 Apple Touch Icon for iOS
├── screenshots/                 # High-resolution application screenshots
└── ts/                          # TypeScript source files (compiled to dist/)
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/peace-shillong/ChordFlow.git
   cd ChordFlow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build TypeScript source**:
   ```bash
   npm run build
   ```

4. **Start the local development server**:
   ```bash
   npm run serve
   ```
   Open `http://localhost:5173` in your browser.

5. **Watch mode during development**:
   ```bash
   npm run watch
   ```

---

## 📱 Progressive Web App (PWA) Installation

- **Desktop (Google Chrome / Microsoft Edge / Brave)**:
  Click the **Install ChordFlow** icon (`⊕`) in the right corner of the browser address bar.
- **iOS (Safari)**:
  Tap the **Share** button (`⎙`) in Safari and select **Add to Home Screen**.
- **Android (Chrome)**:
  Tap the menu (`⋮`) and select **Install app** or **Add to Home screen**.

Once installed, ChordFlow launches in a clean, standalone window without browser chrome and functions completely offline.

---

## 📄 License & Credits

- **License**: MIT License. Open source and free for personal, educational, and commercial musical use.
- **Sound & Architecture**: Engineered with modern Web Audio API and HTML5 Canvas standards.
