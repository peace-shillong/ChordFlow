import { noteNameToMidi, midiToNoteName, INTERVAL_NAMES, getInversionNotes } from "./chord.js";
export class DiagramRenderer {
    constructor() {
        this.clickTargets = [];
    }
    /**
     * Set up canvas dimensions with devicePixelRatio for ultra crisp retina rendering
     */
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
    /**
     * Render instrument diagram onto a canvas
     */
    render(canvas, chord, instrument, options = {}) {
        const isDark = options.theme !== "light";
        const width = options.width || (canvas.parentElement ? canvas.parentElement.clientWidth : 340);
        const height = options.height || 260;
        const ctx = this.prepareCanvas(canvas, width, height);
        this.clickTargets = [];
        ctx.clearRect(0, 0, width, height);
        switch (instrument) {
            case "guitar":
                this.renderGuitar(ctx, width, height, chord, options.capo || 0, options.tuningStrings, options.toggles, isDark);
                break;
            case "ukulele":
                this.renderUkulele(ctx, width, height, chord, options.capo || 0, options.tuningStrings, options.toggles, isDark);
                break;
            case "piano":
                this.renderPiano(ctx, width, height, chord, options.inversionIndex || 0, options.toggles, isDark);
                break;
            case "harmonica":
                this.renderHarmonica(ctx, width, height, chord, options.toggles, isDark);
                break;
        }
    }
    // --- GUITAR DIAGRAM ---
    renderGuitar(ctx, w, h, chord, capo = 0, tuningStrings = [40, 45, 50, 55, 59, 64], toggles, isDark = true) {
        const numStrings = 6;
        const numFrets = 5;
        const frets = chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];
        // Find highest and lowest played fret
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
        // Title / position indicator
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = subtextColor;
        ctx.textAlign = "left";
        if (baseFret > 1) {
            ctx.fillText(`${baseFret}fr`, padX - 35, padY + fretSpacing * 0.7);
        }
        if (capo > 0) {
            ctx.fillStyle = capoColor;
            ctx.textAlign = "right";
            ctx.fillText(`Capo ${capo}`, w - padX + 5, padY - 26);
        }
        // Fretboard Background Box
        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)";
        ctx.beginPath();
        ctx.roundRect(padX - 4, padY, gridW + 8, gridH, 6);
        ctx.fill();
        // Nut (if baseFret === 1)
        if (baseFret === 1) {
            ctx.strokeStyle = nutColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(padX - 4, padY);
            ctx.lineTo(padX + gridW + 4, padY);
            ctx.stroke();
        }
        // Fret lines
        ctx.strokeStyle = fretColor;
        ctx.lineWidth = 1.5;
        for (let f = 1; f <= numFrets; f++) {
            const y = padY + f * fretSpacing;
            ctx.beginPath();
            ctx.moveTo(padX, y);
            ctx.lineTo(padX + gridW, y);
            ctx.stroke();
        }
        // String lines
        for (let s = 0; s < numStrings; s++) {
            const x = padX + s * stringSpacing;
            const thickness = 2.4 - s * 0.28;
            ctx.strokeStyle = isDark ? `rgba(203, 213, 225, ${0.7 - s * 0.05})` : `rgba(71, 85, 105, ${0.8 - s * 0.05})`;
            ctx.lineWidth = Math.max(1, thickness);
            ctx.beginPath();
            ctx.moveTo(x, padY);
            ctx.lineTo(x, padY + gridH);
            ctx.stroke();
        }
        // Capo Bar Overlay
        if (capo > 0 && capo >= baseFret && capo < baseFret + numFrets) {
            const capoFretIndex = capo - baseFret + 1;
            const capoY = padY + (capoFretIndex - 0.5) * fretSpacing;
            ctx.fillStyle = capoColor;
            ctx.beginPath();
            ctx.roundRect(padX - 8, capoY - 6, gridW + 16, 12, 6);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`CAPO ${capo}`, padX + gridW / 2, capoY + 3);
        }
        // String Tuning Labels at Bottom
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = subtextColor;
        ctx.textAlign = "center";
        for (let s = 0; s < numStrings; s++) {
            const x = padX + s * stringSpacing;
            const openMidi = tuningStrings[s] || (40 + s * 5);
            const noteName = midiToNoteName(openMidi).replace(/\d+/, "");
            ctx.fillText(noteName, x, padY + gridH + 16);
        }
        // Finger Dots & Mute/Open Markers
        for (let s = 0; s < numStrings; s++) {
            const fret = frets[s];
            const x = padX + s * stringSpacing;
            const openMidi = (tuningStrings[s] || 40) + capo;
            if (fret === -1) {
                ctx.font = "bold 13px system-ui, sans-serif";
                ctx.fillStyle = isDark ? "#ef4444" : "#dc2626";
                ctx.textAlign = "center";
                ctx.fillText("✕", x, padY - 12);
            }
            else if (fret === 0) {
                ctx.strokeStyle = isDark ? "#10b981" : "#059669";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
                ctx.stroke();
                this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "guitar" });
            }
            else if (fret > 0) {
                const fretRel = fret - baseFret + 1;
                if (fretRel >= 1 && fretRel <= numFrets) {
                    const y = padY + (fretRel - 0.5) * fretSpacing;
                    const midi = (tuningStrings[s] || 40) + fret + capo;
                    const noteName = midiToNoteName(midi).replace(/\d+/, "");
                    ctx.fillStyle = dotColor;
                    ctx.beginPath();
                    ctx.arc(x, y, 11, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(79, 70, 229, 0.3)";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.fillStyle = dotTextColor;
                    ctx.font = "bold 10px system-ui, sans-serif";
                    ctx.textAlign = "center";
                    let label = "";
                    if (toggles?.showNotes) {
                        label = noteName;
                    }
                    else if (toggles?.showIntervals) {
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
    }
    // --- UKULELE DIAGRAM ---
    renderUkulele(ctx, w, h, chord, capo = 0, tuningStrings = [67, 60, 64, 69], toggles, isDark = true) {
        const numStrings = 4;
        const numFrets = 4;
        const frets = chord.instruments.ukulele?.frets || [0, 0, 0, 0];
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
        const capoColor = isDark ? "rgba(236, 72, 153, 0.85)" : "rgba(219, 39, 119, 0.85)";
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
            ctx.lineWidth = 1.8;
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
            const openMidi = tuningStrings[s] || 60;
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
            }
            else if (fret === 0) {
                ctx.strokeStyle = isDark ? "#10b981" : "#059669";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, padY - 16, 6, 0, Math.PI * 2);
                ctx.stroke();
                this.clickTargets.push({ x, y: padY - 16, radius: 10, midi: openMidi, instrument: "ukulele" });
            }
            else if (fret > 0 && fret <= numFrets) {
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
                let label = "";
                if (toggles?.showNotes) {
                    label = noteName;
                }
                else if (toggles?.showIntervals) {
                    const semitonesFromRoot = (midi % 12 - noteNameToMidi(chord.root + "4") % 12 + 12) % 12;
                    label = INTERVAL_NAMES[semitonesFromRoot] || "";
                }
                if (label) {
                    ctx.fillText(label, x, y + 3.5);
                }
                this.clickTargets.push({ x, y, radius: 13, midi, instrument: "ukulele" });
            }
        }
    }
    // --- PIANO KEYBOARD DIAGRAM ---
    renderPiano(ctx, w, h, chord, inversionIndex = 0, toggles, isDark = true) {
        const startMidi = 48; // C3
        const numWhiteKeys = 15; // C3 to C5
        const activeMidiSet = new Set();
        const invNotes = getInversionNotes(chord, inversionIndex);
        invNotes.forEach(n => {
            activeMidiSet.add(noteNameToMidi(n));
        });
        const padX = 14;
        const keyboardW = w - padX * 2;
        const whiteKeyW = keyboardW / numWhiteKeys;
        // Natural realistic key aspect ratio (~4.6:1) instead of stretched full height
        const whiteKeyH = Math.min(115, Math.max(88, Math.round(whiteKeyW * 4.6)));
        const blackKeyW = Math.round(whiteKeyW * 0.62);
        const blackKeyH = Math.round(whiteKeyH * 0.63);
        // Centered vertically with room for top rail
        const padY = Math.max(24, Math.round((h - whiteKeyH) / 2));
        const activeWhiteColor = isDark ? "#6366f1" : "#4f46e5";
        const activeBlackColor = isDark ? "#ec4899" : "#db2777";
        // 1. Draw Top Fallboard / Felt Strip
        ctx.fillStyle = isDark ? "#1e293b" : "#334155";
        ctx.beginPath();
        ctx.roundRect(padX - 4, padY - 12, keyboardW + 8, 12, [5, 5, 0, 0]);
        ctx.fill();
        // Red acoustic felt lining
        ctx.fillStyle = "#991b1b";
        ctx.fillRect(padX - 2, padY - 3, keyboardW + 4, 3);
        // Subtle drop shadow under piano
        ctx.fillStyle = isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)";
        ctx.beginPath();
        ctx.roundRect(padX - 2, padY, keyboardW + 4, whiteKeyH + 4, 6);
        ctx.fill();
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
        // 2. White Keys
        for (const k of whiteKeys) {
            const isActive = activeMidiSet.has(k.midi);
            ctx.fillStyle = isActive
                ? activeWhiteColor
                : isDark
                    ? "#f8fafc"
                    : "#ffffff";
            ctx.strokeStyle = isDark ? "#475569" : "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w - 1, k.h, [0, 0, 4, 4]);
            ctx.fill();
            ctx.stroke();
            if (isActive) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 10px system-ui, sans-serif";
                ctx.textAlign = "center";
                const noteName = midiToNoteName(k.midi).replace(/\d+/, "");
                let label = noteName;
                if (toggles?.showIntervals) {
                    const semitonesFromRoot = (k.midi % 12 - noteNameToMidi(chord.root + "4") % 12 + 12) % 12;
                    label = INTERVAL_NAMES[semitonesFromRoot] || noteName;
                }
                ctx.fillText(label, k.x + k.w / 2, k.y + k.h - 10);
            }
            this.clickTargets.push({
                x: k.x + k.w / 2,
                y: k.y + k.h * 0.75,
                radius: k.w / 2,
                midi: k.midi,
                instrument: "piano"
            });
        }
        // 3. Black Keys (Layered above white keys)
        for (const k of blackKeys) {
            const isActive = activeMidiSet.has(k.midi);
            ctx.fillStyle = isActive
                ? activeBlackColor
                : isDark
                    ? "#0f172a"
                    : "#1e293b";
            ctx.strokeStyle = isDark ? "#020617" : "#0f172a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3, 3]);
            ctx.fill();
            ctx.stroke();
            if (isActive) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 9px system-ui, sans-serif";
                ctx.textAlign = "center";
                const noteName = midiToNoteName(k.midi).replace(/\d+/, "");
                let label = noteName;
                if (toggles?.showIntervals) {
                    const semitonesFromRoot = (k.midi % 12 - noteNameToMidi(chord.root + "4") % 12 + 12) % 12;
                    label = INTERVAL_NAMES[semitonesFromRoot] || noteName;
                }
                ctx.fillText(label, k.x + k.w / 2, k.y + k.h - 8);
            }
            this.clickTargets.push({
                x: k.x + k.w / 2,
                y: k.y + k.h * 0.5,
                radius: k.w / 2,
                midi: k.midi,
                instrument: "piano"
            });
        }
    }
    // --- HARMONICA DIAGRAM ---
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
            // Blow Block
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
            // Draw Block
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
            this.clickTargets.push({
                x: hx,
                y: blowY + holeH / 2,
                radius: holeW / 2,
                midi: HARMONICA_C_BLOW[i - 1],
                instrument: "harmonica"
            });
            this.clickTargets.push({
                x: hx,
                y: drawY + holeH / 2,
                radius: holeW / 2,
                midi: HARMONICA_C_DRAW[i - 1],
                instrument: "harmonica"
            });
        }
    }
}
export const diagrams = new DiagramRenderer();
//# sourceMappingURL=diagrams.js.map