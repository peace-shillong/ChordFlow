import { Chord, InstrumentId, AppToggles, DisplayView, VoicingOption } from "./types.js";
import { noteNameToMidi, midiToNoteName, INTERVAL_NAMES, getInversionNotes } from "./chord.js";

export interface ClickTarget {
  x: number;
  y: number;
  radius: number;
  midi: number;
  instrument: InstrumentId;
}

export class DiagramRenderer {
  private clickTargets: ClickTarget[] = [];
  private pianoManualPan: number = 0; // manual offset in semitones

  public prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    return ctx;
  }

  public getClickTarget(canvas: HTMLCanvasElement, event: MouseEvent | Touch): ClickTarget | null {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (const target of this.clickTargets) {
      const dx = x - target.x;
      const dy = y - target.y;
      if (Math.hypot(dx, dy) <= target.radius + 6) {
        return target;
      }
    }
    return null;
  }

  public panPiano(delta: number): void {
    this.pianoManualPan = Math.max(-24, Math.min(24, this.pianoManualPan + delta));
  }

  public resetPianoPan(): void {
    this.pianoManualPan = 0;
  }

  public render(
    canvas: HTMLCanvasElement,
    chord: Chord,
    instrument: InstrumentId,
    options: {
      capo?: number;
      tuningStrings?: number[];
      toggles?: AppToggles;
      theme?: "light" | "dark";
      inversionIndex?: number;
      voicingId?: string;
      viewMode?: DisplayView;
      width?: number;
      height?: number;
    } = {}
  ): void {
    const isDark = options.theme !== "light";
    const width = options.width || (canvas.parentElement ? canvas.parentElement.clientWidth : 340);
    const height = options.height || 260;

    const ctx = this.prepareCanvas(canvas, width, height);
    this.clickTargets = [];
    ctx.clearRect(0, 0, width, height);

    const viewMode = options.viewMode || (instrument === "harmonica" || instrument === "violin" || instrument === "bass" ? "notes" : "chord");
    const voicing = chord.voicings?.find(v => v.id === options.voicingId) || chord.voicings?.[0];

    switch (instrument) {
      case "guitar":
        this.renderGuitar(ctx, width, height, chord, options.capo || 0, options.tuningStrings, voicing, viewMode, options.toggles, isDark);
        break;
      case "ukulele":
        this.renderUkulele(ctx, width, height, chord, options.capo || 0, options.tuningStrings, voicing, viewMode, options.toggles, isDark);
        break;
      case "guitalele":
        this.renderGuitalele(ctx, width, height, chord, options.capo || 0, options.tuningStrings, voicing, viewMode, options.toggles, isDark);
        break;
      case "piano":
        this.renderPiano(ctx, width, height, chord, options.inversionIndex || 0, voicing, viewMode, options.toggles, isDark);
        break;
      case "violin":
        this.renderViolin(ctx, width, height, chord, options.tuningStrings, voicing, viewMode, options.toggles, isDark);
        break;
      case "bass":
        this.renderBass(ctx, width, height, chord, options.tuningStrings, voicing, viewMode, options.toggles, isDark);
        break;
      case "harmonica":
        this.renderHarmonica(ctx, width, height, chord, options.toggles, isDark);
        break;
    }
  }

  public renderGuitar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    capo: number = 0,
    tuningStrings: number[] = [40, 45, 50, 55, 59, 64],
    voicing?: VoicingOption,
    viewMode: DisplayView = "chord",
    toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const numStrings = 6;
    const numFrets = 5;
    const frets = voicing?.guitar || chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];

    const positiveFrets = frets.filter(f => f > 0);
    const maxFret = positiveFrets.length > 0 ? Math.max(...positiveFrets) : 0;
    const baseFret = maxFret > 5 ? Math.min(...positiveFrets) : 1;

    const padX = 50;
    const padY = 46;
    const gridW = w - padX * 2;
    const gridH = h - padY * 2 - 10;

    const stringSpacing = gridW / (numStrings - 1);
    const fretSpacing = gridH / numFrets;

    const subtextColor = isDark ? "#94a3b8" : "#64748b";
    const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
    const nutColor = isDark ? "#f8fafc" : "#1e293b";
    const dotColor = isDark ? "#6366f1" : "#4f46e5";
    const dotTextColor = "#ffffff";
    const capoColor = isDark ? "rgba(236, 72, 153, 0.85)" : "rgba(219, 39, 119, 0.85)";

    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "left";
    if (baseFret > 1) {
      ctx.fillText(`${baseFret}fr`, padX - 35, padY + fretSpacing * 0.7);
    }

    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)";
    ctx.beginPath();
    ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
    ctx.fill();

    if (baseFret === 1) {
      ctx.strokeStyle = nutColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(padX - 4, padY);
      ctx.lineTo(padX + gridW + 4, padY);
      ctx.stroke();
    }

    ctx.strokeStyle = fretColor;
    ctx.lineWidth = 1.5;
    for (let f = 1; f <= numFrets; f++) {
      const y = padY + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + gridW, y);
      ctx.stroke();
    }

    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.strokeStyle = isDark ? "rgba(203, 213, 225, 0.7)" : "rgba(71, 85, 105, 0.8)";
      ctx.lineWidth = 1.5 + (5 - s) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + gridH);
      ctx.stroke();
    }

    if (capo > 0 && capo <= numFrets) {
      const capoY = padY + (capo - 0.5) * fretSpacing;
      ctx.fillStyle = capoColor;
      ctx.beginPath();
      ctx.roundRect(padX - 8, capoY - 5, gridW + 16, 10, 5);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`CAPO ${capo}`, padX + gridW / 2, capoY + 3);
    }

    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      const openMidi = (tuningStrings[s] || 40) + capo;
      const noteName = midiToNoteName(openMidi).replace(/\d+/, "");
      ctx.fillText(noteName, x, padY + gridH + 16);
    }

    for (let s = 0; s < numStrings; s++) {
      const rawFret = frets[s];
      const fret = rawFret > 0 && baseFret > 1 ? rawFret - baseFret + 1 : rawFret;
      const x = padX + s * stringSpacing;
      const openMidi = (tuningStrings[s] || 40) + capo;

      if (rawFret === -1) {
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = isDark ? "#ef4444" : "#dc2626";
        ctx.textAlign = "center";
        ctx.fillText("✕", x, padY - 12);
      } else if (rawFret === 0) {
        ctx.strokeStyle = isDark ? "#10b981" : "#059669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
        ctx.stroke();

        this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "guitar" });
      } else if (fret > 0 && fret <= numFrets) {
        const y = padY + (fret - 0.5) * fretSpacing;
        const midi = (tuningStrings[s] || 40) + rawFret + capo;
        const noteName = midiToNoteName(midi).replace(/\d+/, "");

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = dotTextColor;
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";

        let label = "";
        if (toggles?.showNotes || viewMode === "notes") {
          label = noteName;
        } else if (toggles?.showIntervals) {
          const semitonesFromRoot = (midi % 12 - noteNameToMidi(chord.root + "4") % 12 + 12) % 12;
          label = INTERVAL_NAMES[semitonesFromRoot] || "";
        }

        if (label) {
          ctx.fillText(label, x, y + 3.5);
        }

        this.clickTargets.push({ x, y, radius: 13, midi, instrument: "guitar" });
      }
    }
  }

  public renderUkulele(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    capo: number = 0,
    tuningStrings: number[] = [67, 60, 64, 69],
    voicing?: VoicingOption,
    viewMode: DisplayView = "chord",
    toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const numStrings = 4;
    const numFrets = 4;
    const frets = voicing?.ukulele || chord.instruments.ukulele?.frets || [0, 0, 0, 3];

    const padX = 64;
    const padY = 46;
    const gridW = w - padX * 2;
    const gridH = h - padY * 2 - 10;

    const stringSpacing = gridW / (numStrings - 1);
    const fretSpacing = gridH / numFrets;

    const subtextColor = isDark ? "#94a3b8" : "#64748b";
    const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
    const nutColor = isDark ? "#f8fafc" : "#1e293b";
    const dotColor = isDark ? "#06b6d4" : "#0891b2";
    const dotTextColor = "#ffffff";

    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)";
    ctx.beginPath();
    ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
    ctx.fill();

    ctx.strokeStyle = nutColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(padX - 4, padY);
    ctx.lineTo(padX + gridW + 4, padY);
    ctx.stroke();

    ctx.strokeStyle = fretColor;
    ctx.lineWidth = 1.5;
    for (let f = 1; f <= numFrets; f++) {
      const y = padY + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + gridW, y);
      ctx.stroke();
    }

    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.strokeStyle = isDark ? "rgba(203, 213, 225, 0.7)" : "rgba(71, 85, 105, 0.8)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + gridH);
      ctx.stroke();
    }

    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      const openMidi = (tuningStrings[s] || 60) + capo;
      const noteName = midiToNoteName(openMidi).replace(/\d+/, "");
      ctx.fillText(noteName, x, padY + gridH + 16);
    }

    for (let s = 0; s < numStrings; s++) {
      const fret = frets[s];
      const x = padX + s * stringSpacing;
      const openMidi = (tuningStrings[s] || 60) + capo;

      if (fret === -1) {
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = isDark ? "#ef4444" : "#dc2626";
        ctx.textAlign = "center";
        ctx.fillText("✕", x, padY - 12);
      } else if (fret === 0) {
        ctx.strokeStyle = isDark ? "#10b981" : "#059669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
        ctx.stroke();
        this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "ukulele" });
      } else if (fret > 0 && fret <= numFrets) {
        const y = padY + (fret - 0.5) * fretSpacing;
        const midi = (tuningStrings[s] || 60) + fret + capo;
        const noteName = midiToNoteName(midi).replace(/\d+/, "");

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = dotTextColor;
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(viewMode === "notes" || toggles?.showNotes ? noteName : `${fret}`, x, y + 3.5);

        this.clickTargets.push({ x, y, radius: 13, midi, instrument: "ukulele" });
      }
    }
  }

  public renderGuitalele(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    capo: number = 0,
    tuningStrings: number[] = [45, 50, 55, 60, 64, 69],
    voicing?: VoicingOption,
    viewMode: DisplayView = "chord",
    toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    this.renderGuitar(ctx, w, h, chord, capo, tuningStrings, voicing, viewMode, toggles, isDark);
  }

  public renderPiano(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    inversionIndex: number = 0,
    voicing?: VoicingOption,
    _viewMode: DisplayView = "chord",
    _toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const activeMidiSet = new Set<number>();
    const invNotes = voicing?.piano || getInversionNotes(chord, inversionIndex).map(n => noteNameToMidi(n));
    invNotes.forEach(m => activeMidiSet.add(m));

    const activeList = Array.from(activeMidiSet);
    const minMidi = activeList.length > 0 ? Math.min(...activeList) : 60;
    const maxMidi = activeList.length > 0 ? Math.max(...activeList) : 67;
    const centerMidi = Math.round((minMidi + maxMidi) / 2);

    let autoStartMidi = Math.max(36, Math.min(72, centerMidi - 10));
    while ([1, 3, 6, 8, 10].includes(autoStartMidi % 12)) {
      autoStartMidi--;
    }

    const startMidi = autoStartMidi + this.pianoManualPan;
    const numWhiteKeys = 15;

    const padX = 20;
    const keyboardW = w - padX * 2;
    const whiteKeyW = keyboardW / numWhiteKeys;
    const whiteKeyH = Math.min(115, Math.max(88, Math.round(whiteKeyW * 4.6)));
    const blackKeyW = Math.round(whiteKeyW * 0.62);
    const blackKeyH = Math.round(whiteKeyH * 0.63);
    const padY = Math.max(26, Math.round((h - whiteKeyH) / 2));

    const activeWhiteColor = isDark ? "#6366f1" : "#4f46e5";
    const activeBlackColor = isDark ? "#ec4899" : "#db2777";

    ctx.fillStyle = isDark ? "#1e293b" : "#334155";
    ctx.beginPath();
    ctx.roundRect(padX - 4, padY - 12, keyboardW + 8, 12, [5, 5, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#991b1b";
    ctx.fillRect(padX - 2, padY - 3, keyboardW + 4, 3);

    ctx.fillStyle = isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)";
    ctx.beginPath();
    ctx.roundRect(padX - 2, padY, keyboardW + 4, whiteKeyH + 4, 6);
    ctx.fill();

    const whiteKeys: { midi: number; x: number; y: number; w: number; h: number }[] = [];
    const blackKeys: { midi: number; x: number; y: number; w: number; h: number }[] = [];

    let currentMidi = startMidi;
    let whiteIndex = 0;
    while (whiteIndex < numWhiteKeys) {
      const isBlack = [1, 3, 6, 8, 10].includes(currentMidi % 12);
      if (isBlack) {
        const prevWhiteX = padX + (whiteIndex - 1) * whiteKeyW;
        const bx = prevWhiteX + whiteKeyW - blackKeyW / 2;
        blackKeys.push({ midi: currentMidi, x: bx, y: padY, w: blackKeyW, h: blackKeyH });
      } else {
        const wx = padX + whiteIndex * whiteKeyW;
        whiteKeys.push({ midi: currentMidi, x: wx, y: padY, w: whiteKeyW, h: whiteKeyH });
        whiteIndex++;
      }
      currentMidi++;
    }

    for (const k of whiteKeys) {
      const isActive = activeMidiSet.has(k.midi);
      ctx.fillStyle = isActive ? activeWhiteColor : isDark ? "#f8fafc" : "#ffffff";
      ctx.strokeStyle = isDark ? "#475569" : "#cbd5e1";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(k.x, k.y, k.w - 1, k.h, [0, 0, 4, 4]);
      ctx.fill();
      ctx.stroke();
      this.clickTargets.push({ x: k.x + k.w / 2, y: k.y + k.h * 0.75, radius: k.w / 2, midi: k.midi, instrument: "piano" });
    }

    for (const k of blackKeys) {
      const isActive = activeMidiSet.has(k.midi);
      ctx.fillStyle = isActive ? activeBlackColor : isDark ? "#0f172a" : "#1e293b";
      ctx.strokeStyle = isDark ? "#020617" : "#0f172a";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3, 3]);
      ctx.fill();
      ctx.stroke();
      this.clickTargets.push({ x: k.x + k.w / 2, y: k.y + k.h * 0.5, radius: k.w / 2, midi: k.midi, instrument: "piano" });
    }

    ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("◀", 4, padY + whiteKeyH / 2);
    ctx.textAlign = "right";
    ctx.fillText("▶", w - 4, padY + whiteKeyH / 2);
  }

  public renderViolin(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    tuningStrings: number[] = [55, 62, 69, 76],
    voicing?: VoicingOption,
    _viewMode: DisplayView = "notes",
    _toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const numStrings = 4;
    const numFrets = 4;
    const frets = voicing?.violin || chord.instruments.violin?.frets || [0, 2, 0, 0];

    const padX = 64;
    const padY = 46;
    const gridW = w - padX * 2;
    const gridH = h - padY * 2 - 10;

    const stringSpacing = gridW / (numStrings - 1);
    const fretSpacing = gridH / numFrets;

    const subtextColor = isDark ? "#94a3b8" : "#64748b";
    const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
    const nutColor = isDark ? "#d97706" : "#b45309";
    const dotColor = isDark ? "#8b5cf6" : "#7c3aed";

    ctx.fillStyle = isDark ? "#18181b" : "#27272a";
    ctx.beginPath();
    ctx.roundRect(padX - 6, padY, gridW + 12, gridH, 8);
    ctx.fill();

    ctx.strokeStyle = nutColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(padX - 6, padY);
    ctx.lineTo(padX + gridW + 6, padY);
    ctx.stroke();

    ctx.strokeStyle = fretColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let f = 1; f <= numFrets; f++) {
      const y = padY + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + gridW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const stringNames = ["G3", "D4", "A4", "E5"];
    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.strokeStyle = isDark ? "#e4e4e7" : "#f4f4f5";
      ctx.lineWidth = 1.2 + (3 - s) * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + gridH);
      ctx.stroke();
    }

    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.fillText(stringNames[s], x, padY + gridH + 16);
    }

    for (let s = 0; s < numStrings; s++) {
      const fret = frets[s];
      const x = padX + s * stringSpacing;
      const openMidi = tuningStrings[s] || 55;

      if (fret === 0) {
        ctx.strokeStyle = isDark ? "#10b981" : "#059669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
        ctx.stroke();
        this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "violin" });
      } else if (fret > 0) {
        const y = padY + (fret - 0.5) * fretSpacing;
        const midi = openMidi + fret;
        const noteName = midiToNoteName(midi).replace(/\d+/, "");

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(noteName, x, y + 3.5);

        this.clickTargets.push({ x, y, radius: 13, midi, instrument: "violin" });
      }
    }
  }

  public renderBass(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    tuningStrings: number[] = [28, 33, 38, 43],
    voicing?: VoicingOption,
    _viewMode: DisplayView = "notes",
    _toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const numStrings = 4;
    const numFrets = 5;
    const frets = voicing?.bass || chord.instruments.bass?.frets || [0, 2, 2, 0];

    const padX = 64;
    const padY = 46;
    const gridW = w - padX * 2;
    const gridH = h - padY * 2 - 10;

    const stringSpacing = gridW / (numStrings - 1);
    const fretSpacing = gridH / numFrets;

    const subtextColor = isDark ? "#94a3b8" : "#64748b";
    const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
    const nutColor = isDark ? "#f8fafc" : "#1e293b";
    const rootColor = isDark ? "#f59e0b" : "#d97706";
    const fifthColor = isDark ? "#3b82f6" : "#2563eb";

    ctx.fillStyle = isDark ? "#1e1e24" : "#f1f5f9";
    ctx.beginPath();
    ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
    ctx.fill();

    ctx.strokeStyle = nutColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(padX - 4, padY);
    ctx.lineTo(padX + gridW + 4, padY);
    ctx.stroke();

    ctx.strokeStyle = fretColor;
    ctx.lineWidth = 1.5;
    for (let f = 1; f <= numFrets; f++) {
      const y = padY + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + gridW, y);
      ctx.stroke();
    }

    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.strokeStyle = isDark ? "#94a3b8" : "#475569";
      ctx.lineWidth = 2.5 + (3 - s) * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + gridH);
      ctx.stroke();
    }

    const stringNames = ["E1", "A1", "D2", "G2"];
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    for (let s = 0; s < numStrings; s++) {
      const x = padX + s * stringSpacing;
      ctx.fillText(stringNames[s], x, padY + gridH + 16);
    }

    for (let s = 0; s < numStrings; s++) {
      const fret = frets[s];
      const x = padX + s * stringSpacing;
      const openMidi = tuningStrings[s] || 28;

      if (fret === 0) {
        ctx.strokeStyle = isDark ? "#10b981" : "#059669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
        ctx.stroke();
        this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "bass" });
      } else if (fret > 0 && fret <= numFrets) {
        const y = padY + (fret - 0.5) * fretSpacing;
        const midi = openMidi + fret;
        const noteName = midiToNoteName(midi).replace(/\d+/, "");
        const isRoot = (midi % 12) === (noteNameToMidi(chord.root + "4") % 12);

        ctx.fillStyle = isRoot ? rootColor : fifthColor;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(noteName, x, y + 3.5);

        this.clickTargets.push({ x, y, radius: 14, midi, instrument: "bass" });
      }
    }
  }

  public renderHarmonica(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chord: Chord,
    toggles?: AppToggles,
    isDark: boolean = true
  ): void {
    const numHoles = 10;
    const harmonica = chord.instruments.harmonica || { holes: ["4", "5", "6"], blowDraw: ["blow", "blow", "blow"] };

    const activeHoleSet = new Set<string>();
    const activeHolesList = harmonica.holes || [];
    const activeBlowDrawList = harmonica.blowDraw || [];

    activeHolesList.forEach((hole, idx) => {
      const bd = activeBlowDrawList[idx] || (hole.includes("-") ? "draw" : "blow");
      const cleanHole = hole.replace(/\D/g, "");
      activeHoleSet.add(`${cleanHole}:${bd}`);
    });

    const padX = 20;
    const padY = 32;
    const harmW = w - padX * 2;
    const harmH = h - padY * 2;

    const holeSpacing = harmW / numHoles;
    const subtextColor = isDark ? "#94a3b8" : "#64748b";
    const bodyColor = isDark ? "#1e293b" : "#e2e8f0";
    const blowActive = isDark ? "#10b981" : "#059669";
    const drawActive = isDark ? "#f43f5e" : "#e11d48";

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = isDark ? "#334155" : "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, padY, harmW, harmH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "left";
    ctx.fillText("↑ BLOW", padX + 6, padY - 10);
    ctx.fillText("↓ DRAW", padX + 6, padY + harmH + 18);

    const HARMONICA_C_BLOW = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
    const HARMONICA_C_DRAW = [62, 67, 71, 74, 77, 81, 83, 86, 89, 93];

    for (let i = 1; i <= numHoles; i++) {
      const hx = padX + (i - 1) * holeSpacing + holeSpacing / 2;
      const holeW = holeSpacing * 0.72;
      const holeH = harmH * 0.32;

      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillStyle = subtextColor;
      ctx.textAlign = "center";
      ctx.fillText(`${i}`, hx, padY + harmH / 2 + 4);

      const isBlowActive = activeHoleSet.has(`${i}:blow`);
      const blowY = padY + 10;
      ctx.fillStyle = isBlowActive ? blowActive : isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)";
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(hx - holeW / 2, blowY, holeW, holeH, 4);
      ctx.fill();
      ctx.stroke();

      if (isBlowActive) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px system-ui, sans-serif";
        const blowNote = toggles?.showNotes ? midiToNoteName(HARMONICA_C_BLOW[i - 1]).replace(/\d+/, "") : "▲";
        ctx.fillText(blowNote, hx, blowY + holeH / 2 + 3);
      }

      const isDrawActive = activeHoleSet.has(`${i}:draw`);
      const drawY = padY + harmH - 10 - holeH;
      ctx.fillStyle = isDrawActive ? drawActive : isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)";

      ctx.beginPath();
      ctx.roundRect(hx - holeW / 2, drawY, holeW, holeH, 4);
      ctx.fill();
      ctx.stroke();

      if (isDrawActive) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px system-ui, sans-serif";
        const drawNote = toggles?.showNotes ? midiToNoteName(HARMONICA_C_DRAW[i - 1]).replace(/\d+/, "") : "▼";
        ctx.fillText(drawNote, hx, drawY + holeH / 2 + 3);
      }

      this.clickTargets.push({ x: hx, y: blowY + holeH / 2, radius: holeW / 2, midi: HARMONICA_C_BLOW[i - 1], instrument: "harmonica" });
      this.clickTargets.push({ x: hx, y: drawY + holeH / 2, radius: holeW / 2, midi: HARMONICA_C_DRAW[i - 1], instrument: "harmonica" });
    }
  }
}

export const diagrams = new DiagramRenderer();
