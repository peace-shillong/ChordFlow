import { noteNameToMidi, midiToNoteName, INTERVAL_NAMES, getInversionNotes } from "./chord.js";
export class DiagramRenderer {
    constructor() {
        this.clickTargets = [];
        this.pianoManualPan = 0; // manual offset in semitones
    }
    prepareCanvas(canvas, width, height) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
        return ctx;
    }
    getClickTarget(canvas, event) {
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
    panPiano(delta) {
        this.pianoManualPan = Math.max(-24, Math.min(24, this.pianoManualPan + delta));
    }
    resetPianoPan() {
        this.pianoManualPan = 0;
    }
    getNoteLabelAndColor(midi, chord, toggles, isDark = true) {
        const rootMidi = noteNameToMidi(chord.root + "4");
        const semitonesFromRoot = ((midi % 12) - (rootMidi % 12) + 12) % 12;
        const isRoot = semitonesFromRoot === 0;
        const isThird = semitonesFromRoot === 3 || semitonesFromRoot === 4;
        const isFifth = semitonesFromRoot === 7 || semitonesFromRoot === 6 || semitonesFromRoot === 8;
        const isSeventh = semitonesFromRoot === 10 || semitonesFromRoot === 11 || semitonesFromRoot === 9;
        let bg = isDark ? "#6366f1" : "#4f46e5";
        if (isRoot) {
            bg = isDark ? "#f59e0b" : "#d97706"; // Gold/Amber for root
        }
        else if (isThird) {
            bg = isDark ? "#38bdf8" : "#0284c7"; // Sky blue for 3rd
        }
        else if (isFifth) {
            bg = isDark ? "#10b981" : "#059669"; // Emerald for 5th
        }
        else if (isSeventh) {
            bg = isDark ? "#ec4899" : "#db2777"; // Pink for 7th
        }
        const noteName = midiToNoteName(midi).replace(/\d+/, "");
        const intervalName = INTERVAL_NAMES[semitonesFromRoot] || (isRoot ? "1" : `${semitonesFromRoot}`);
        let label = "";
        if (toggles?.showIntervals && toggles?.showNotes) {
            label = isRoot ? `${noteName}` : intervalName;
        }
        else if (toggles?.showIntervals) {
            label = intervalName;
        }
        else if (toggles?.showNotes) {
            label = noteName;
        }
        else {
            label = isRoot ? "1" : "";
        }
        return { label, bg, text: "#ffffff", isRoot };
    }
    render(canvas, chord, instrument, options = {}) {
        const isDark = options.theme !== "light";
        const width = options.width || (canvas.parentElement ? canvas.parentElement.clientWidth : 340);
        const height = options.height || 260;
        const ctx = this.prepareCanvas(canvas, width, height);
        this.clickTargets = [];
        ctx.clearRect(0, 0, width, height);
        const viewMode = options.viewMode || "chord";
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
    // --- Guitar Diagram ---
    renderGuitar(ctx, w, h, chord, capo = 0, tuningStrings = [40, 45, 50, 55, 59, 64], voicing, viewMode = "chord", toggles, isDark = true) {
        const numStrings = 6;
        const isNotesMode = viewMode === "notes";
        const numFrets = isNotesMode ? 12 : 5;
        const frets = voicing?.guitar || chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];
        const positiveFrets = frets.filter(f => f > 0);
        const maxFret = positiveFrets.length > 0 ? Math.max(...positiveFrets) : 0;
        const baseFret = !isNotesMode && maxFret > 5 ? Math.min(...positiveFrets) : 1;
        const padX = isNotesMode ? 32 : 50;
        const padY = isNotesMode ? 36 : 46;
        const gridW = w - padX * 2;
        const gridH = h - padY * 2 - 10;
        const stringSpacing = gridW / (numStrings - 1);
        const fretSpacing = gridH / numFrets;
        const subtextColor = isDark ? "#94a3b8" : "#64748b";
        const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
        const nutColor = isDark ? "#f8fafc" : "#1e293b";
        const capoColor = isDark ? "rgba(236, 72, 153, 0.85)" : "rgba(219, 39, 119, 0.85)";
        if (baseFret > 1 && !isNotesMode) {
            ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = subtextColor;
            ctx.textAlign = "left";
            ctx.fillText(`${baseFret}fr`, padX - 35, padY + fretSpacing * 0.7);
        }
        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)";
        ctx.beginPath();
        ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
        ctx.fill();
        if (baseFret === 1) {
            ctx.strokeStyle = nutColor;
            ctx.lineWidth = isNotesMode ? 4 : 6;
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
        if (capo > 0 && capo <= numFrets && !isNotesMode) {
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
        // String open notes names at bottom
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = subtextColor;
        ctx.textAlign = "center";
        for (let s = 0; s < numStrings; s++) {
            const x = padX + s * stringSpacing;
            const openMidi = (tuningStrings[s] || 40) + capo;
            const noteName = midiToNoteName(openMidi).replace(/\d+/, "");
            ctx.fillText(noteName, x, padY + gridH + 16);
        }
        // Target chord pitch classes
        const chordPitchClasses = new Set(chord.notes.map(n => noteNameToMidi(n) % 12));
        if (isNotesMode) {
            // --- Full Fretboard Chord Tone Map (Notes Mode) ---
            for (let s = 0; s < numStrings; s++) {
                const x = padX + s * stringSpacing;
                const openMidi = (tuningStrings[s] || 40) + capo;
                for (let f = 0; f <= numFrets; f++) {
                    const midi = openMidi + f;
                    if (chordPitchClasses.has(midi % 12)) {
                        const y = f === 0 ? padY - 14 : padY + (f - 0.5) * fretSpacing;
                        const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                        ctx.fillStyle = info.bg;
                        ctx.beginPath();
                        ctx.arc(x, y, f === 0 ? 8 : 7.5, 0, Math.PI * 2);
                        ctx.fill();
                        if (info.label) {
                            ctx.fillStyle = info.text;
                            ctx.font = "bold 8px system-ui, sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText(info.label, x, y + 2.8);
                        }
                        this.clickTargets.push({ x, y, radius: 10, midi, instrument: "guitar" });
                    }
                }
            }
        }
        else {
            // --- Specific Chord Voicing Shape (Chord Mode) ---
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
                }
                else if (rawFret === 0) {
                    const info = this.getNoteLabelAndColor(openMidi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, padY - 16, 9, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 9px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, padY - 13);
                    }
                    this.clickTargets.push({ x, y: padY - 16, radius: 11, midi: openMidi, instrument: "guitar" });
                }
                else if (fret > 0 && fret <= numFrets) {
                    const y = padY + (fret - 0.5) * fretSpacing;
                    const midi = (tuningStrings[s] || 40) + rawFret + capo;
                    const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, y, 11, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 10px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, y + 3.5);
                    }
                    this.clickTargets.push({ x, y, radius: 13, midi, instrument: "guitar" });
                }
            }
        }
    }
    // --- Ukulele Diagram ---
    renderUkulele(ctx, w, h, chord, capo = 0, tuningStrings = [67, 60, 64, 69], voicing, viewMode = "chord", toggles, isDark = true) {
        const numStrings = 4;
        const isNotesMode = viewMode === "notes";
        const numFrets = isNotesMode ? 12 : 5;
        const frets = voicing?.ukulele || chord.instruments.ukulele?.frets || [0, 0, 0, 3];
        const padX = isNotesMode ? 36 : 64;
        const padY = isNotesMode ? 36 : 46;
        const gridW = w - padX * 2;
        const gridH = h - padY * 2 - 10;
        const stringSpacing = gridW / (numStrings - 1);
        const fretSpacing = gridH / numFrets;
        const subtextColor = isDark ? "#94a3b8" : "#64748b";
        const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
        const nutColor = isDark ? "#f8fafc" : "#1e293b";
        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)";
        ctx.beginPath();
        ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
        ctx.fill();
        ctx.strokeStyle = nutColor;
        ctx.lineWidth = isNotesMode ? 4 : 6;
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
        const chordPitchClasses = new Set(chord.notes.map(n => noteNameToMidi(n) % 12));
        if (isNotesMode) {
            for (let s = 0; s < numStrings; s++) {
                const x = padX + s * stringSpacing;
                const openMidi = (tuningStrings[s] || 60) + capo;
                for (let f = 0; f <= numFrets; f++) {
                    const midi = openMidi + f;
                    if (chordPitchClasses.has(midi % 12)) {
                        const y = f === 0 ? padY - 14 : padY + (f - 0.5) * fretSpacing;
                        const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                        ctx.fillStyle = info.bg;
                        ctx.beginPath();
                        ctx.arc(x, y, f === 0 ? 8 : 7.5, 0, Math.PI * 2);
                        ctx.fill();
                        if (info.label) {
                            ctx.fillStyle = info.text;
                            ctx.font = "bold 8px system-ui, sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText(info.label, x, y + 2.8);
                        }
                        this.clickTargets.push({ x, y, radius: 10, midi, instrument: "ukulele" });
                    }
                }
            }
        }
        else {
            for (let s = 0; s < numStrings; s++) {
                const fret = frets[s];
                const x = padX + s * stringSpacing;
                const openMidi = (tuningStrings[s] || 60) + capo;
                if (fret === -1) {
                    ctx.font = "bold 13px system-ui, sans-serif";
                    ctx.fillStyle = isDark ? "#ef4444" : "#dc2626";
                    ctx.textAlign = "center";
                    ctx.fillText("✕", x, padY - 12);
                }
                else if (fret === 0) {
                    const info = this.getNoteLabelAndColor(openMidi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, padY - 16, 9, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 9px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, padY - 13);
                    }
                    this.clickTargets.push({ x, y: padY - 16, radius: 11, midi: openMidi, instrument: "ukulele" });
                }
                else if (fret > 0 && fret <= numFrets) {
                    const y = padY + (fret - 0.5) * fretSpacing;
                    const midi = (tuningStrings[s] || 60) + fret + capo;
                    const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, y, 11, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 10px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, y + 3.5);
                    }
                    this.clickTargets.push({ x, y, radius: 13, midi, instrument: "ukulele" });
                }
            }
        }
    }
    // --- Guitalele Diagram ---
    renderGuitalele(ctx, w, h, chord, capo = 0, tuningStrings = [45, 50, 55, 60, 64, 69], voicing, viewMode = "chord", toggles, isDark = true) {
        this.renderGuitar(ctx, w, h, chord, capo, tuningStrings, voicing, viewMode, toggles, isDark);
    }
    // --- Piano Diagram ---
    renderPiano(ctx, w, h, chord, inversionIndex = 0, voicing, viewMode = "chord", toggles, isDark = true) {
        const isNotesMode = viewMode === "notes";
        const chordPitchClasses = new Set(chord.notes.map(n => noteNameToMidi(n) % 12));
        const activeMidiSet = new Set();
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
        // Piano fallboard & red felt strip
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
        // Calculate visible Octaves & C Keys
        const whiteKeys = [];
        const blackKeys = [];
        let currentMidi = startMidi;
        let whiteIndex = 0;
        while (whiteIndex < numWhiteKeys) {
            const isBlack = [1, 3, 6, 8, 10].includes(currentMidi % 12);
            if (isBlack) {
                const prevWhiteX = padX + (whiteIndex - 1) * whiteKeyW;
                const bx = prevWhiteX + whiteKeyW - blackKeyW / 2;
                blackKeys.push({ midi: currentMidi, x: bx, y: padY, w: blackKeyW, h: blackKeyH });
            }
            else {
                const wx = padX + whiteIndex * whiteKeyW;
                whiteKeys.push({ midi: currentMidi, x: wx, y: padY, w: whiteKeyW, h: whiteKeyH });
                whiteIndex++;
            }
            currentMidi++;
        }
        const cKeys = whiteKeys.filter(k => k.midi % 12 === 0);
        const cOctaves = cKeys.map(k => Math.floor(k.midi / 12) - 1);
        const allOctaves = Array.from(new Set(whiteKeys.map(k => Math.floor(k.midi / 12) - 1))).sort((a, b) => a - b);
        const primaryOctave = cOctaves[0] !== undefined ? cOctaves[0] : allOctaves[0] || 4;
        // Top Visible Octave Title Banner
        const octaveText = cOctaves.length > 0
            ? `Octave ${cOctaves.join(" & ")} (C${cOctaves.join(", C")})`
            : `Octave ${primaryOctave}`;
        const bannerW = Math.min(240, keyboardW - 10);
        const bannerH = 20;
        const bannerX = (w - bannerW) / 2;
        const bannerY = Math.max(4, padY - 24);
        ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.18)" : "rgba(79, 70, 229, 0.1)";
        ctx.strokeStyle = isDark ? "rgba(99, 102, 241, 0.45)" : "rgba(79, 70, 229, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`🎹 Visible: ${octaveText}`, w / 2, bannerY + 14);
        // Draw White Keys
        for (const k of whiteKeys) {
            const isKeyActive = isNotesMode ? chordPitchClasses.has(k.midi % 12) : activeMidiSet.has(k.midi);
            const info = isKeyActive ? this.getNoteLabelAndColor(k.midi, chord, toggles, isDark) : null;
            ctx.fillStyle = isKeyActive && info ? info.bg : isDark ? "#f8fafc" : "#ffffff";
            ctx.strokeStyle = isDark ? "#475569" : "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w - 1, k.h, [0, 0, 4, 4]);
            ctx.fill();
            ctx.stroke();
            // Show C Octave Label (e.g. C4, C3, C5) on C keys
            if (k.midi % 12 === 0) {
                const octNum = Math.floor(k.midi / 12) - 1;
                ctx.fillStyle = isKeyActive && info ? "rgba(255,255,255,0.9)" : isDark ? "#818cf8" : "#4f46e5";
                ctx.font = "bold 9px system-ui, sans-serif";
                ctx.textAlign = "center";
                const cLabelY = isKeyActive && info && info.label ? k.y + k.h - 22 : k.y + k.h - 6;
                ctx.fillText(`C${octNum}`, k.x + (k.w - 1) / 2, cLabelY);
            }
            if (isKeyActive && info && info.label) {
                ctx.fillStyle = info.text;
                ctx.font = "bold 10px system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(info.label, k.x + (k.w - 1) / 2, k.y + k.h - 10);
            }
            this.clickTargets.push({ x: k.x + k.w / 2, y: k.y + k.h * 0.75, radius: k.w / 2, midi: k.midi, instrument: "piano" });
        }
        // Draw Black Keys
        for (const k of blackKeys) {
            const isKeyActive = isNotesMode ? chordPitchClasses.has(k.midi % 12) : activeMidiSet.has(k.midi);
            const info = isKeyActive ? this.getNoteLabelAndColor(k.midi, chord, toggles, isDark) : null;
            ctx.fillStyle = isKeyActive && info ? (info.isRoot ? info.bg : (isDark ? "#ec4899" : "#db2777")) : isDark ? "#0f172a" : "#1e293b";
            ctx.strokeStyle = isDark ? "#020617" : "#0f172a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3, 3]);
            ctx.fill();
            ctx.stroke();
            if (isKeyActive && info && info.label) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 9px system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(info.label, k.x + k.w / 2, k.y + k.h - 8);
            }
            this.clickTargets.push({ x: k.x + k.w / 2, y: k.y + k.h * 0.5, radius: k.w / 2, midi: k.midi, instrument: "piano" });
        }
        // Paging Arrows & Click Targets
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
        ctx.font = "bold 16px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("◀", 4, padY + whiteKeyH / 2 + 5);
        ctx.textAlign = "right";
        ctx.fillText("▶", w - 4, padY + whiteKeyH / 2 + 5);
        // Click targets for previous/next octave scrolling
        this.clickTargets.push({ x: 10, y: padY + whiteKeyH / 2, radius: 16, midi: -100, instrument: "piano" });
        this.clickTargets.push({ x: w - 10, y: padY + whiteKeyH / 2, radius: 16, midi: 100, instrument: "piano" });
    }
    // --- Violin Diagram ---
    renderViolin(ctx, w, h, chord, tuningStrings = [55, 62, 69, 76], voicing, viewMode = "notes", toggles, isDark = true) {
        const numStrings = 4;
        const isNotesMode = viewMode === "notes";
        const numFrets = isNotesMode ? 7 : 4;
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
        for (let f = 1; f <= numFrets; f++) {
            const y = padY + f * fretSpacing;
            ctx.beginPath();
            ctx.moveTo(padX, y);
            ctx.lineTo(padX + gridW, y);
            ctx.stroke();
        }
        for (let s = 0; s < numStrings; s++) {
            const x = padX + s * stringSpacing;
            ctx.strokeStyle = isDark ? "#e2e8f0" : "#94a3b8";
            ctx.lineWidth = 1.2 + (3 - s) * 0.5;
            ctx.beginPath();
            ctx.moveTo(x, padY);
            ctx.lineTo(x, padY + gridH);
            ctx.stroke();
        }
        const stringNames = ["G3", "D4", "A4", "E5"];
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = subtextColor;
        ctx.textAlign = "center";
        for (let s = 0; s < numStrings; s++) {
            const x = padX + s * stringSpacing;
            ctx.fillText(stringNames[s], x, padY + gridH + 16);
        }
        const chordPitchClasses = new Set(chord.notes.map(n => noteNameToMidi(n) % 12));
        if (isNotesMode) {
            for (let s = 0; s < numStrings; s++) {
                const x = padX + s * stringSpacing;
                const openMidi = tuningStrings[s] || 55;
                for (let f = 0; f <= numFrets; f++) {
                    const midi = openMidi + f;
                    if (chordPitchClasses.has(midi % 12)) {
                        const y = f === 0 ? padY - 14 : padY + (f - 0.5) * fretSpacing;
                        const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                        ctx.fillStyle = info.bg;
                        ctx.beginPath();
                        ctx.arc(x, y, f === 0 ? 8 : 7.5, 0, Math.PI * 2);
                        ctx.fill();
                        if (info.label) {
                            ctx.fillStyle = info.text;
                            ctx.font = "bold 8px system-ui, sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText(info.label, x, y + 2.8);
                        }
                        this.clickTargets.push({ x, y, radius: 10, midi, instrument: "violin" });
                    }
                }
            }
        }
        else {
            for (let s = 0; s < numStrings; s++) {
                const fret = frets[s];
                const x = padX + s * stringSpacing;
                const openMidi = tuningStrings[s] || 55;
                if (fret === 0) {
                    const info = this.getNoteLabelAndColor(openMidi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, padY - 16, 8, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 8px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, padY - 13);
                    }
                    this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "violin" });
                }
                else if (fret > 0 && fret <= numFrets) {
                    const y = padY + (fret - 0.5) * fretSpacing;
                    const midi = openMidi + fret;
                    const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, y, 11, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 10px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, y + 3.5);
                    }
                    this.clickTargets.push({ x, y, radius: 13, midi, instrument: "violin" });
                }
            }
        }
    }
    // --- Bass Diagram ---
    renderBass(ctx, w, h, chord, tuningStrings = [28, 33, 38, 43], voicing, viewMode = "notes", toggles, isDark = true) {
        const numStrings = 4;
        const isNotesMode = viewMode === "notes";
        const numFrets = isNotesMode ? 12 : 5;
        const frets = voicing?.bass || chord.instruments.bass?.frets || [0, 2, 2, 0];
        const padX = isNotesMode ? 36 : 64;
        const padY = isNotesMode ? 36 : 46;
        const gridW = w - padX * 2;
        const gridH = h - padY * 2 - 10;
        const stringSpacing = gridW / (numStrings - 1);
        const fretSpacing = gridH / numFrets;
        const subtextColor = isDark ? "#94a3b8" : "#64748b";
        const fretColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
        const nutColor = isDark ? "#f8fafc" : "#1e293b";
        ctx.fillStyle = isDark ? "#1e1e24" : "#f1f5f9";
        ctx.beginPath();
        ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
        ctx.fill();
        ctx.strokeStyle = nutColor;
        ctx.lineWidth = isNotesMode ? 4 : 6;
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
        const chordPitchClasses = new Set(chord.notes.map(n => noteNameToMidi(n) % 12));
        if (isNotesMode) {
            for (let s = 0; s < numStrings; s++) {
                const x = padX + s * stringSpacing;
                const openMidi = tuningStrings[s] || 28;
                for (let f = 0; f <= numFrets; f++) {
                    const midi = openMidi + f;
                    if (chordPitchClasses.has(midi % 12)) {
                        const y = f === 0 ? padY - 14 : padY + (f - 0.5) * fretSpacing;
                        const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                        ctx.fillStyle = info.bg;
                        ctx.beginPath();
                        ctx.arc(x, y, f === 0 ? 8 : 7.5, 0, Math.PI * 2);
                        ctx.fill();
                        if (info.label) {
                            ctx.fillStyle = info.text;
                            ctx.font = "bold 8px system-ui, sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText(info.label, x, y + 2.8);
                        }
                        this.clickTargets.push({ x, y, radius: 10, midi, instrument: "bass" });
                    }
                }
            }
        }
        else {
            for (let s = 0; s < numStrings; s++) {
                const fret = frets[s];
                const x = padX + s * stringSpacing;
                const openMidi = tuningStrings[s] || 28;
                if (fret === 0) {
                    const info = this.getNoteLabelAndColor(openMidi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, padY - 16, 9, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 9px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, padY - 13);
                    }
                    this.clickTargets.push({ x, y: padY - 16, radius: 11, midi: openMidi, instrument: "bass" });
                }
                else if (fret > 0 && fret <= numFrets) {
                    const y = padY + (fret - 0.5) * fretSpacing;
                    const midi = openMidi + fret;
                    const info = this.getNoteLabelAndColor(midi, chord, toggles, isDark);
                    ctx.fillStyle = info.bg;
                    ctx.beginPath();
                    ctx.arc(x, y, 12, 0, Math.PI * 2);
                    ctx.fill();
                    if (info.label) {
                        ctx.fillStyle = info.text;
                        ctx.font = "bold 10px system-ui, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(info.label, x, y + 3.5);
                    }
                    this.clickTargets.push({ x, y, radius: 14, midi, instrument: "bass" });
                }
            }
        }
    }
    // --- Harmonica Diagram ---
    renderHarmonica(ctx, w, h, chord, toggles, isDark = true) {
        const numHoles = 10;
        const harmonica = chord.instruments.harmonica || { holes: ["4", "5", "6"], blowDraw: ["blow", "blow", "blow"] };
        const activeHoleSet = new Set();
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
//# sourceMappingURL=diagrams.js.map