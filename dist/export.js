import { DiagramRenderer } from "./diagrams.js";
export class ExportEngine {
    constructor() {
        this.diagramRenderer = new DiagramRenderer();
    }
    /**
     * Export progression and settings as JSON file
     */
    exportJSON(state, title = "Progression") {
        const data = {
            appName: "ChordFlow",
            version: "1.0",
            timestamp: new Date().toISOString(),
            title,
            progression: state.progression,
            tempo: state.tempo,
            activeInstrument: state.activeInstrument,
            capo: state.capo,
            tuning: state.tuning,
            strumPattern: state.strumPattern,
            toggles: state.toggles
        };
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chordflow-${title.toLowerCase().replace(/\s+/g, "_")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    /**
     * Import JSON file and validate structure
     */
    async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result;
                    const parsed = JSON.parse(content);
                    if (!parsed || !Array.isArray(parsed.progression) || parsed.progression.length === 0) {
                        throw new Error("Invalid ChordFlow JSON format: missing 'progression' array.");
                    }
                    resolve({
                        title: typeof parsed.title === "string" ? parsed.title : undefined,
                        progression: parsed.progression.slice(0, 16),
                        tempo: typeof parsed.tempo === "number" ? parsed.tempo : undefined,
                        activeInstrument: parsed.activeInstrument,
                        capo: typeof parsed.capo === "number" ? parsed.capo : undefined,
                        tuning: parsed.tuning
                    });
                }
                catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }
    /**
     * Export beautiful high-resolution PNG image of the entire progression
     */
    async exportPNG(state, chordObjects, strumPatternObj, title = "Chord Progression") {
        const numChords = chordObjects.length;
        if (numChords === 0)
            return;
        // Dimensions: 300px per chord column, plus margins
        const cardW = 240;
        const cardH = 320;
        const pad = 40;
        const headerH = 120;
        const totalW = Math.max(800, pad * 2 + numChords * (cardW + 20));
        const totalH = headerH + cardH + pad * 2;
        const canvas = document.createElement("canvas");
        canvas.width = totalW * 2; // 2x for Retina sharpness
        canvas.height = totalH * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.scale(2, 2);
        // Dark Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, totalW, totalH);
        bgGrad.addColorStop(0, "#0f172a");
        bgGrad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, totalW, totalH);
        // Top Header Banner
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("ChordFlow", pad, pad + 20);
        ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(title, pad, pad + 48);
        // Metadata details
        ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#38bdf8";
        const instLabel = state.activeInstrument.toUpperCase();
        const bpmLabel = `${state.tempo} BPM`;
        const capoLabel = state.capo > 0 ? `• Capo ${state.capo}` : "";
        const strumLabel = strumPatternObj ? `• Strum: ${strumPatternObj.name}` : "";
        ctx.fillText(`Instrument: ${instLabel} • ${bpmLabel} ${capoLabel} ${strumLabel}`, pad, pad + 76);
        // Render Each Chord Card
        const startY = headerH + pad;
        const cardSpacing = (totalW - pad * 2 - numChords * cardW) / Math.max(1, numChords - 1);
        for (let i = 0; i < numChords; i++) {
            const chord = chordObjects[i];
            const cardX = pad + i * (cardW + cardSpacing);
            // Card Background
            ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cardX, startY, cardW, cardH, 12);
            ctx.fill();
            ctx.stroke();
            // Chord Title & Quality
            ctx.fillStyle = "#6366f1";
            ctx.font = "bold 24px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(chord.symbol, cardX + cardW / 2, startY + 36);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px system-ui, sans-serif";
            ctx.fillText(chord.name, cardX + cardW / 2, startY + 54);
            // Offscreen Mini Diagram Canvas
            const diagCanvas = document.createElement("canvas");
            diagCanvas.width = 200;
            diagCanvas.height = 220;
            this.diagramRenderer.render(diagCanvas, chord, state.activeInstrument, {
                capo: state.capo,
                toggles: state.toggles,
                theme: "dark",
                width: 200,
                height: 220
            });
            // Draw diagram into master canvas
            ctx.drawImage(diagCanvas, cardX + (cardW - 200) / 2, startY + 68, 200, 220);
        }
        // Trigger PNG Download
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `chordflow-${title.toLowerCase().replace(/\s+/g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    /**
     * Export Printable PDF using jsPDF
     */
    async exportPDF(state, chordObjects, strumPatternObj, title = "Chord Progression Sheet") {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("jsPDF library is still loading. Please try again in a moment.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        // Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 35, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("ChordFlow", margin, 18);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(title, margin, 26);
        // Metadata Line
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(`Instrument: ${state.activeInstrument.toUpperCase()}   |   Tempo: ${state.tempo} BPM   |   Capo: ${state.capo}`, margin, 46);
        if (strumPatternObj) {
            doc.text(`Strum Pattern: ${strumPatternObj.name} (${strumPatternObj.pattern.filter(Boolean).join(" ")})`, margin, 52);
        }
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, 56, pageWidth - margin, 56);
        // Chords Grid in 2 columns or 3 columns
        const cols = 2;
        const cardW = (pageWidth - margin * 2 - (cols - 1) * 10) / cols;
        const cardH = 75;
        let startY = 62;
        for (let i = 0; i < chordObjects.length; i++) {
            const chord = chordObjects[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = margin + col * (cardW + 10);
            const y = startY + row * (cardH + 8);
            if (y + cardH > pageHeight - 15) {
                // Page overflow handle (new page if needed)
                doc.addPage();
                startY = 20;
            }
            // Card Border Box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.roundedRect(x, y, cardW, cardH, 3, 3, "FD");
            // Chord Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text(chord.symbol, x + 10, y + 14);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(chord.name, x + 10, y + 20);
            doc.text(`Notes: ${chord.notes.join(", ")}`, x + 10, y + 26);
            // Render Chord Diagram to Canvas and embed in PDF
            const diagCanvas = document.createElement("canvas");
            diagCanvas.width = 160;
            diagCanvas.height = 180;
            this.diagramRenderer.render(diagCanvas, chord, state.activeInstrument, {
                capo: state.capo,
                toggles: state.toggles,
                theme: "light",
                width: 160,
                height: 180
            });
            const imgData = diagCanvas.toDataURL("image/png");
            doc.addImage(imgData, "PNG", x + cardW - 48, y + 6, 42, 48);
        }
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Generated with ChordFlow — Pure Web Audio & Music Theory SPA", margin, pageHeight - 10);
        doc.save(`chordflow-${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
    }
}
export const exporter = new ExportEngine();
//# sourceMappingURL=export.js.map