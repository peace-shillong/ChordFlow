export interface CircleKeyData {
  index: number; // 0 = C, 1 = G, 2 = D ... 11 = F
  major: string;
  minor: string;
  majorChordId: string;
  minorChordId: string;
  accidentals: string; // "0", "1#", "2#", "1b", etc.
  diatonic: {
    I: string;
    ii: string;
    iii: string;
    IV: string;
    V: string;
    vi: string;
    viidim: string;
  };
}

export const CIRCLE_KEYS: CircleKeyData[] = [
  {
    index: 0,
    major: "C",
    minor: "Am",
    majorChordId: "Cmaj",
    minorChordId: "Amin",
    accidentals: "0",
    diatonic: { I: "Cmaj", ii: "Dmin", iii: "Emin", IV: "Fmaj", V: "Gmaj", vi: "Amin", viidim: "Bdim" }
  },
  {
    index: 1,
    major: "G",
    minor: "Em",
    majorChordId: "Gmaj",
    minorChordId: "Emin",
    accidentals: "1 ♯",
    diatonic: { I: "Gmaj", ii: "Amin", iii: "Bmin", IV: "Cmaj", V: "Dmaj", vi: "Emin", viidim: "F#dim" }
  },
  {
    index: 2,
    major: "D",
    minor: "Bm",
    majorChordId: "Dmaj",
    minorChordId: "Bmin",
    accidentals: "2 ♯",
    diatonic: { I: "Dmaj", ii: "Emin", iii: "F#min", IV: "Gmaj", V: "Amaj", vi: "Bmin", viidim: "C#dim" }
  },
  {
    index: 3,
    major: "A",
    minor: "F#m",
    majorChordId: "Amaj",
    minorChordId: "F#min",
    accidentals: "3 ♯",
    diatonic: { I: "Amaj", ii: "Bmin", iii: "C#min", IV: "Dmaj", V: "Emaj", vi: "F#min", viidim: "G#dim" }
  },
  {
    index: 4,
    major: "E",
    minor: "C#m",
    majorChordId: "Emaj",
    minorChordId: "C#min",
    accidentals: "4 ♯",
    diatonic: { I: "Emaj", ii: "F#min", iii: "G#min", IV: "Amaj", V: "Bmaj", vi: "C#min", viidim: "D#dim" }
  },
  {
    index: 5,
    major: "B",
    minor: "G#m",
    majorChordId: "Bmaj",
    minorChordId: "G#min",
    accidentals: "5 ♯",
    diatonic: { I: "Bmaj", ii: "C#min", iii: "D#min", IV: "Emaj", V: "F#maj", vi: "G#min", viidim: "A#dim" }
  },
  {
    index: 6,
    major: "F♯ / G♭",
    minor: "D#m",
    majorChordId: "F#maj",
    minorChordId: "D#min",
    accidentals: "6 ♯ / 6 ♭",
    diatonic: { I: "F#maj", ii: "G#min", iii: "A#min", IV: "Bmaj", V: "C#maj", vi: "D#min", viidim: "Fdim" }
  },
  {
    index: 7,
    major: "D♭",
    minor: "B♭m",
    majorChordId: "C#maj",
    minorChordId: "A#min",
    accidentals: "5 ♭",
    diatonic: { I: "C#maj", ii: "D#min", iii: "Fmin", IV: "F#maj", V: "G#maj", vi: "A#min", viidim: "Cdim" }
  },
  {
    index: 8,
    major: "A♭",
    minor: "Fm",
    majorChordId: "G#maj",
    minorChordId: "Fmin",
    accidentals: "4 ♭",
    diatonic: { I: "G#maj", ii: "A#min", iii: "Cmin", IV: "C#maj", V: "D#maj", vi: "Fmin", viidim: "Gdim" }
  },
  {
    index: 9,
    major: "E♭",
    minor: "Cm",
    majorChordId: "D#maj",
    minorChordId: "Cmin",
    accidentals: "3 ♭",
    diatonic: { I: "D#maj", ii: "Fmin", iii: "Gmin", IV: "G#maj", V: "A#maj", vi: "Cmin", viidim: "Ddim" }
  },
  {
    index: 10,
    major: "B♭",
    minor: "Gm",
    majorChordId: "A#maj",
    minorChordId: "Gmin",
    accidentals: "2 ♭",
    diatonic: { I: "A#maj", ii: "Cmin", iii: "Dmin", IV: "D#maj", V: "Fmaj", vi: "Gmin", viidim: "Adim" }
  },
  {
    index: 11,
    major: "F",
    minor: "Dm",
    majorChordId: "Fmaj",
    minorChordId: "Dmin",
    accidentals: "1 ♭",
    diatonic: { I: "Fmaj", ii: "Gmin", iii: "Amin", IV: "A#maj", V: "Cmaj", vi: "Dmin", viidim: "Edim" }
  }
];

export class CircleOfFifthsWidget {
  private container: HTMLElement | null = null;
  private selectedIndex: number = 0;
  private onSelectCallback: ((chordId: string) => void) | null = null;
  private onAddCallback: ((chordId: string) => void) | null = null;

  public init(
    containerId: string,
    onSelectChord: (chordId: string) => void,
    onAddChord: (chordId: string) => void
  ): void {
    this.container = document.getElementById(containerId);
    this.onSelectCallback = onSelectChord;
    this.onAddCallback = onAddChord;
    this.render();
  }

  public setSelectedIndex(index: number): void {
    this.selectedIndex = (index + 12) % 12;
    this.render();
  }

  public render(): void {
    if (!this.container) return;

    const currentKey = CIRCLE_KEYS[this.selectedIndex];
    const diatonic = currentKey.diatonic;

    // SVG Wheel calculation
    const size = 280;
    const center = size / 2;
    const outerR = 125;
    const middleR = 85;
    const innerR = 48;

    let svgSectors = "";

    for (let i = 0; i < 12; i++) {
      const k = CIRCLE_KEYS[i];
      const isSelected = i === this.selectedIndex;
      const isNeighbor = Math.abs(i - this.selectedIndex) === 1 || Math.abs(i - this.selectedIndex) === 11;

      // Angle: 12 at top (i=0 is top, angle = -90 deg)
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const angleNext = ((i + 1) * 30 - 90) * (Math.PI / 180);
      const midAngle = (i * 30 + 15 - 90) * (Math.PI / 180);

      // Major Outer Segment Arc
      const x1 = center + outerR * Math.cos(angle);
      const y1 = center + outerR * Math.sin(angle);
      const x2 = center + outerR * Math.cos(angleNext);
      const y2 = center + outerR * Math.sin(angleNext);
      const x3 = center + middleR * Math.cos(angleNext);
      const y3 = center + middleR * Math.sin(angleNext);
      const x4 = center + middleR * Math.cos(angle);
      const y4 = center + middleR * Math.sin(angle);

      const pathData = `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${middleR} ${middleR} 0 0 0 ${x4} ${y4} Z`;

      // Text coordinates
      const textMajorR = (outerR + middleR) / 2;
      const txMaj = center + textMajorR * Math.cos(midAngle);
      const tyMaj = center + textMajorR * Math.sin(midAngle) + 4;

      const textMinorR = (middleR + innerR) / 2;
      const txMin = center + textMinorR * Math.cos(midAngle);
      const tyMin = center + textMinorR * Math.sin(midAngle) + 4;

      const fill = isSelected ? "var(--accent)" : isNeighbor ? "rgba(99, 102, 241, 0.25)" : "var(--surface-variant)";
      const stroke = isSelected ? "#ffffff" : "var(--border)";
      const textColor = isSelected ? "#ffffff" : "var(--text)";

      svgSectors += `
        <g class="circle-sector ${isSelected ? 'active' : ''}" data-index="${i}" style="cursor: pointer;">
          <path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected ? 2 : 1}" />
          <text x="${txMaj}" y="${tyMaj}" text-anchor="middle" font-size="12" font-weight="700" fill="${textColor}">${k.major}</text>
          <text x="${txMin}" y="${tyMin}" text-anchor="middle" font-size="10" font-weight="500" fill="${textColor}" opacity="0.8">${k.minor}</text>
        </g>
      `;
    }

    this.container.innerHTML = `
      <div class="circle-wrapper">
        <div class="circle-svg-container">
          <svg viewBox="0 0 ${size} ${size}" class="circle-svg">
            <circle cx="${center}" cy="${center}" r="${outerR}" fill="none" stroke="var(--border)" stroke-width="1"/>
            <circle cx="${center}" cy="${center}" r="${middleR}" fill="none" stroke="var(--border)" stroke-width="1"/>
            <circle cx="${center}" cy="${center}" r="${innerR}" fill="var(--surface)" stroke="var(--border)" stroke-width="1"/>
            ${svgSectors}
            <g class="circle-center-label">
              <text x="${center}" y="${center - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent)">${currentKey.major} Key</text>
              <text x="${center}" y="${center + 10}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${currentKey.accidentals}</text>
            </g>
          </svg>
        </div>

        <div class="circle-diatonic-panel">
          <h4 class="diatonic-title">Diatonic Chords in ${currentKey.major} Major</h4>
          <div class="diatonic-chords-grid">
            <div class="diatonic-card primary">
              <div class="roman">Tonic (I)</div>
              <button class="diatonic-btn" data-chord="${diatonic.I}">${diatonic.I}</button>
              <button class="diatonic-add" data-add="${diatonic.I}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card primary">
              <div class="roman">Subdominant (IV)</div>
              <button class="diatonic-btn" data-chord="${diatonic.IV}">${diatonic.IV}</button>
              <button class="diatonic-add" data-add="${diatonic.IV}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card primary">
              <div class="roman">Dominant (V)</div>
              <button class="diatonic-btn" data-chord="${diatonic.V}">${diatonic.V}</button>
              <button class="diatonic-add" data-add="${diatonic.V}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card">
              <div class="roman">Supertonic (ii)</div>
              <button class="diatonic-btn" data-chord="${diatonic.ii}">${diatonic.ii}</button>
              <button class="diatonic-add" data-add="${diatonic.ii}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card">
              <div class="roman">Mediant (iii)</div>
              <button class="diatonic-btn" data-chord="${diatonic.iii}">${diatonic.iii}</button>
              <button class="diatonic-add" data-add="${diatonic.iii}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card">
              <div class="roman">Submediant (vi)</div>
              <button class="diatonic-btn" data-chord="${diatonic.vi}">${diatonic.vi}</button>
              <button class="diatonic-add" data-add="${diatonic.vi}" title="Add to Progression">+</button>
            </div>
            <div class="diatonic-card">
              <div class="roman">Leading (vii°)</div>
              <button class="diatonic-btn" data-chord="${diatonic.viidim}">${diatonic.viidim}</button>
              <button class="diatonic-add" data-add="${diatonic.viidim}" title="Add to Progression">+</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for sectors
    this.container.querySelectorAll(".circle-sector").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-index") || "0", 10);
        this.setSelectedIndex(idx);
      });
    });

    // Add event listeners for diatonic chord previews
    this.container.querySelectorAll(".diatonic-btn").forEach(el => {
      el.addEventListener("click", () => {
        const chordId = el.getAttribute("data-chord");
        if (chordId && this.onSelectCallback) {
          this.onSelectCallback(chordId);
        }
      });
    });

    // Add event listeners for '+' add buttons
    this.container.querySelectorAll(".diatonic-add").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const chordId = el.getAttribute("data-add");
        if (chordId && this.onAddCallback) {
          this.onAddCallback(chordId);
        }
      });
    });
  }
}

export const circleOfFifths = new CircleOfFifthsWidget();
