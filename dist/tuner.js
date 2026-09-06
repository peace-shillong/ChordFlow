import { NOTE_NAMES } from "./chord.js";
export const INSTRUMENT_STRINGS = {
    guitar: [
        { name: "6: E2", midi: 40, freq: 82.41 },
        { name: "5: A2", midi: 45, freq: 110.00 },
        { name: "4: D3", midi: 50, freq: 146.83 },
        { name: "3: G3", midi: 55, freq: 196.00 },
        { name: "2: B3", midi: 59, freq: 246.94 },
        { name: "1: E4", midi: 64, freq: 329.63 }
    ],
    violin: [
        { name: "4: G3", midi: 55, freq: 196.00 },
        { name: "3: D4", midi: 62, freq: 293.66 },
        { name: "2: A4", midi: 69, freq: 440.00 },
        { name: "1: E5", midi: 76, freq: 659.25 }
    ],
    ukulele: [
        { name: "4: G4", midi: 67, freq: 392.00 },
        { name: "3: C4", midi: 60, freq: 261.63 },
        { name: "2: E4", midi: 64, freq: 329.63 },
        { name: "1: A4", midi: 69, freq: 440.00 }
    ],
    bass: [
        { name: "4: E1", midi: 28, freq: 41.20 },
        { name: "3: A1", midi: 33, freq: 55.00 },
        { name: "2: D2", midi: 38, freq: 73.42 },
        { name: "1: G2", midi: 43, freq: 98.00 }
    ],
    guitalele: [
        { name: "6: A2", midi: 45, freq: 110.00 },
        { name: "5: D3", midi: 50, freq: 146.83 },
        { name: "4: G3", midi: 55, freq: 196.00 },
        { name: "3: C4", midi: 60, freq: 261.63 },
        { name: "2: E4", midi: 64, freq: 329.63 },
        { name: "1: A4", midi: 69, freq: 440.00 }
    ]
};
export class TunerController {
    constructor() {
        this.audioCtx = null;
        this.mediaStream = null;
        this.analyser = null;
        this.isListening = false;
        this.animFrameId = null;
        this.selectedInstrument = "guitar";
        this.selectedStringIndex = 0;
        this.inTuneConsecutiveHits = 0;
        this.isAutoAdvancing = false;
        // DOM elements
        this.modalEl = null;
        this.micPromptEl = null;
        this.instPillsContainerEl = null;
        this.stringPillsContainerEl = null;
        this.noteDisplayEl = null;
        this.freqDisplayEl = null;
        this.centsDisplayEl = null;
        this.needleEl = null;
        this.statusEl = null;
    }
    init() {
        this.cacheDom();
        this.bindEvents();
        this.renderInstrumentPills();
        this.renderStringPills();
    }
    cacheDom() {
        this.modalEl = document.getElementById("tuner-modal");
        this.micPromptEl = document.getElementById("tuner-mic-prompt");
        this.instPillsContainerEl = document.getElementById("tuner-inst-pills");
        this.stringPillsContainerEl = document.getElementById("tuner-string-pills");
        this.noteDisplayEl = document.getElementById("tuner-detected-note");
        this.freqDisplayEl = document.getElementById("tuner-detected-freq");
        this.centsDisplayEl = document.getElementById("tuner-cents-deviation");
        this.needleEl = document.getElementById("tuner-needle");
        this.statusEl = document.getElementById("tuner-status-msg");
    }
    bindEvents() {
        document.getElementById("btn-open-tuner")?.addEventListener("click", () => {
            this.open();
        });
        document.getElementById("btn-close-tuner")?.addEventListener("click", () => {
            this.close();
        });
    }
    renderInstrumentPills() {
        if (!this.instPillsContainerEl)
            return;
        const pills = this.instPillsContainerEl.querySelectorAll(".tuner-inst-pill");
        pills.forEach(pill => {
            const inst = pill.getAttribute("data-tuner-inst");
            pill.classList.toggle("active", inst === this.selectedInstrument);
            pill.addEventListener("click", () => {
                if (inst) {
                    this.selectedInstrument = inst;
                    this.selectedStringIndex = 0;
                    this.inTuneConsecutiveHits = 0;
                    this.renderInstrumentPills();
                    this.renderStringPills();
                }
            });
        });
    }
    renderStringPills() {
        if (!this.stringPillsContainerEl)
            return;
        this.stringPillsContainerEl.innerHTML = "";
        const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
        strings.forEach((str, idx) => {
            const btn = document.createElement("button");
            btn.className = `tuner-string-pill ${idx === this.selectedStringIndex ? "active" : ""}`;
            btn.innerHTML = `
        <span class="str-name">${str.name}</span>
        <span class="str-freq">${str.freq.toFixed(1)}Hz</span>
      `;
            btn.addEventListener("click", () => {
                this.selectedStringIndex = idx;
                this.inTuneConsecutiveHits = 0;
                this.renderStringPills();
            });
            this.stringPillsContainerEl.appendChild(btn);
        });
    }
    async open() {
        if (!this.modalEl)
            return;
        this.modalEl.style.display = "flex";
        this.inTuneConsecutiveHits = 0;
        this.renderInstrumentPills();
        this.renderStringPills();
        await this.startListening();
    }
    close() {
        if (!this.modalEl)
            return;
        this.modalEl.style.display = "none";
        this.stopListening();
    }
    advanceString() {
        const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
        this.selectedStringIndex = (this.selectedStringIndex + 1) % strings.length;
        this.inTuneConsecutiveHits = 0;
        this.renderStringPills();
    }
    async startListening() {
        if (this.isListening)
            return;
        if (this.micPromptEl) {
            this.micPromptEl.textContent = "🎙️ Requesting microphone permission...";
            this.micPromptEl.className = "tuner-mic-prompt prompt-pending";
        }
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
            const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 4096;
            source.connect(this.analyser);
            this.isListening = true;
            if (this.micPromptEl) {
                this.micPromptEl.textContent = "🟢 Microphone active — Play a string to tune.";
                this.micPromptEl.className = "tuner-mic-prompt prompt-active";
            }
            if (this.statusEl)
                this.statusEl.textContent = "Listening...";
            this.updateLoop();
        }
        catch (err) {
            console.warn("Microphone access denied or error:", err);
            if (this.micPromptEl) {
                this.micPromptEl.textContent = "🔴 Microphone permission required for the tuner. Please allow mic access in your browser.";
                this.micPromptEl.className = "tuner-mic-prompt prompt-denied";
            }
            if (this.statusEl)
                this.statusEl.textContent = "Mic access blocked";
        }
    }
    stopListening() {
        this.isListening = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }
    updateLoop() {
        if (!this.isListening || !this.analyser)
            return;
        const buffer = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        if (rms > 0.015 && this.audioCtx) {
            const pitch = this.autoCorrelate(buffer, this.audioCtx.sampleRate);
            if (pitch > 20 && pitch < 2000) {
                this.processPitch(pitch);
            }
        }
        this.animFrameId = requestAnimationFrame(() => this.updateLoop());
    }
    autoCorrelate(buf, sampleRate) {
        const SIZE = buf.length;
        let r1 = 0;
        let r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < thres) {
                r1 = i;
                break;
            }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < thres) {
                r2 = SIZE - i;
                break;
            }
        }
        const trimmed = buf.slice(r1, r2);
        const c = new Float32Array(trimmed.length);
        for (let i = 0; i < trimmed.length; i++) {
            for (let j = 0; j < trimmed.length - i; j++) {
                c[i] = c[i] + trimmed[j] * trimmed[j + i];
            }
        }
        let d = 0;
        while (c[d] > c[d + 1])
            d++;
        let maxval = -1;
        let maxpos = -1;
        for (let i = d; i < trimmed.length; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;
        if (T0 > 0 && T0 < trimmed.length - 1) {
            const x1 = c[T0 - 1];
            const x2 = c[T0];
            const x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2;
            const b = (x3 - x1) / 2;
            if (a)
                T0 = T0 - b / (2 * a);
        }
        return sampleRate / T0;
    }
    playChime() {
        if (!this.audioCtx)
            return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1320, now + 0.1);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
        catch {
            // Ignore
        }
    }
    processPitch(freq) {
        if (this.isAutoAdvancing)
            return;
        const strings = INSTRUMENT_STRINGS[this.selectedInstrument] || INSTRUMENT_STRINGS.guitar;
        const target = strings[this.selectedStringIndex] || strings[0];
        const cents = Math.round(1200 * Math.log2(freq / target.freq));
        const clampedCents = Math.max(-50, Math.min(50, cents));
        const midiNum = Math.round(69 + 12 * Math.log2(freq / 440));
        const noteName = NOTE_NAMES[midiNum % 12] || "";
        const octave = Math.floor(midiNum / 12) - 1;
        if (this.noteDisplayEl)
            this.noteDisplayEl.textContent = `${noteName}${octave}`;
        if (this.freqDisplayEl)
            this.freqDisplayEl.textContent = `${freq.toFixed(1)} Hz (Target: ${target.freq.toFixed(1)} Hz)`;
        if (this.centsDisplayEl) {
            this.centsDisplayEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;
        }
        const angle = (clampedCents / 50) * 45;
        if (this.needleEl) {
            this.needleEl.style.transform = `rotate(${angle}deg)`;
            const absCents = Math.abs(cents);
            if (absCents <= 4) {
                this.needleEl.style.background = "#10b981";
                this.inTuneConsecutiveHits++;
                if (this.statusEl) {
                    this.statusEl.textContent = `🎯 In Tune! (${this.inTuneConsecutiveHits}/3)`;
                }
                // When in-tune confirmed 3 times (hits threshold ~24 analysis frames)
                if (this.inTuneConsecutiveHits >= 24 && !this.isAutoAdvancing) {
                    this.isAutoAdvancing = true;
                    this.playChime();
                    if (this.statusEl) {
                        this.statusEl.textContent = "🎉 In Tune! Advancing to next string...";
                    }
                    setTimeout(() => {
                        this.advanceString();
                        this.isAutoAdvancing = false;
                        this.inTuneConsecutiveHits = 0;
                        if (this.statusEl)
                            this.statusEl.textContent = "Ready for next string";
                    }, 900);
                }
            }
            else if (absCents <= 15) {
                this.needleEl.style.background = "#f59e0b";
                if (this.statusEl)
                    this.statusEl.textContent = cents > 0 ? "Tune Down ▾" : "Tune Up ▴";
                this.inTuneConsecutiveHits = 0;
            }
            else {
                this.needleEl.style.background = "#ef4444";
                if (this.statusEl)
                    this.statusEl.textContent = cents > 0 ? "Sharp (Tune Down ▾)" : "Flat (Tune Up ▴)";
                this.inTuneConsecutiveHits = 0;
            }
        }
    }
}
export const tuner = new TunerController();
//# sourceMappingURL=tuner.js.map