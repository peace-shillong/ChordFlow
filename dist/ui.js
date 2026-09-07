import { getCapoSoundingRoot, getScaleDegree, GENERATOR_STYLES } from "./chord.js";
import { audio, SOUND_PRESETS } from "./audio.js";
import { diagrams } from "./diagrams.js";
import { progression } from "./progression.js";
import { circleOfFifths } from "./circle.js";
import { exporter } from "./export.js";
import { tuner } from "./tuner.js";
import { trackPageView, trackEvent } from "./analytics.js";
export class UIManager {
    constructor(db, initialState) {
        this.selectedGeneratorStyleId = "jp_royal_road";
        this.selectedGeneratorCategory = "All";
        this.deferredPrompt = null;
        // Strum Pattern State (16 subdivisions)
        this.appliedStrumSteps = [];
        this.editorStrumSteps = [];
        this.db = db;
        this.state = initialState;
    }
    init() {
        this.cacheElements();
        this.initStrumPatternState();
        this.bindEvents();
        this.populateFiltersAndPresets();
        this.initTuner();
        this.applyTheme(this.state.theme);
        progression.setMaxChords(this.state.mode === "clean" ? 8 : 16);
        this.applyMode(this.state.mode);
        this.updateGeneratorStyleDisplay();
        this.updateTransposeDisplay();
        this.updateAudioSliders();
        this.renderActiveChord();
        this.renderProgressionCards();
        this.renderChordGrid();
        this.renderStrumTicker();
        this.renderStrumEditor();
        // Initialize Circle of Fifths inside Theory Modal
        circleOfFifths.init("circle-of-fifths-container", (chordId) => {
            this.selectChord(chordId);
        }, (chordId) => {
            this.addChordToProgression(chordId);
        });
        // Sync Progression Title
        if (this.progressionTitleInputEl) {
            this.progressionTitleInputEl.value = progression.getTitle();
        }
        // Subscribe to progression events
        progression.addListener({
            onChordChange: (index, chordId) => {
                this.state.activeChordIndex = index;
                this.highlightActiveProgressionCard(index);
                this.updateNextChordIndicator();
                if (chordId) {
                    this.state.selectedChord = chordId;
                    this.renderActiveChord();
                }
            },
            onBeatChange: (beat, isAccent) => {
                this.animateBeat(beat, isAccent);
            },
            onStateChange: (isPlaying) => {
                this.state.isPlaying = isPlaying;
                this.updatePlayButton();
            },
            onListChange: (chords) => {
                this.state.progression = chords;
                this.renderProgressionCards();
                this.updateNextChordIndicator();
            }
        });
    }
    cacheElements() {
        this.appRoot = document.getElementById("app");
        this.toastEl = document.getElementById("toast-notification");
        // Modals
        this.settingsModalEl = document.getElementById("settings-modal");
        this.theoryModalEl = document.getElementById("theory-modal");
        this.tunerModalEl = document.getElementById("tuner-modal");
        this.mobileLibraryModalEl = document.getElementById("mobile-library-modal");
        this.mobileLibraryContainerEl = document.getElementById("mobile-library-container");
        this.aboutModalEl = document.getElementById("about-modal");
        this.btnOpenAboutEl = document.getElementById("btn-open-about");
        this.btnCloseAboutEl = document.getElementById("btn-close-about");
        this.btnCloseAboutFooterEl = document.getElementById("btn-close-about-footer");
        // Progression Header & Toolbar
        this.progressionTitleInputEl = document.getElementById("progression-title-input");
        this.progressionCounterBadgeEl = document.getElementById("progression-counter-badge");
        this.progressionCardsEl = document.getElementById("progression-cards-strip");
        this.nextChordEl = document.getElementById("next-chord-preview");
        this.presetSelectEl = document.getElementById("preset-progression-select");
        this.saveDropdownMenuEl = document.getElementById("save-dropdown-menu");
        // Transport Controls
        this.playBtnEl = document.getElementById("btn-play-progression");
        this.loopBtnEl = document.getElementById("btn-toggle-loop");
        this.metronomeBtnEl = document.getElementById("btn-toggle-metronome");
        this.tempoSliderEl = document.getElementById("tempo-slider");
        this.tempoValueEl = document.getElementById("tempo-value-display");
        this.volumeSliderEl = document.getElementById("volume-slider");
        this.volumeValueEl = document.getElementById("volume-value-display");
        this.volumeIconBtnEl = document.getElementById("volume-icon-btn");
        // Transpose Controls
        this.btnTransposeDownEl = document.getElementById("btn-transpose-down");
        this.btnTransposeUpEl = document.getElementById("btn-transpose-up");
        this.btnTransposeResetEl = document.getElementById("btn-transpose-reset");
        this.transposeValueDisplayEl = document.getElementById("transpose-value-display");
        // Strum Visualizers & Editor Elements
        this.strumTickerEl = document.getElementById("strum-visualizer-ticker");
        this.strumEditorContainerEl = document.getElementById("strum-pattern-editor-container");
        this.strumEditorGridEl = document.getElementById("strum-editor-grid");
        this.editorStrumSelectEl = document.getElementById("editor-strum-select");
        this.btnApplyStrumEl = document.getElementById("btn-apply-strum");
        this.btnResetStrumEl = document.getElementById("btn-reset-strum");
        // Audio Reset Controls
        this.btnResetAudioInstEl = document.getElementById("btn-reset-audio-instrument");
        this.btnResetAllAudioEl = document.getElementById("btn-reset-all-audio");
        // Chord Preview & Diagram
        this.mainCanvas = document.getElementById("main-diagram-canvas");
        this.chordTitleEl = document.getElementById("active-chord-title");
        this.chordSubtitleEl = document.getElementById("active-chord-subtitle");
        this.chordNotesEl = document.getElementById("active-chord-notes");
        this.voicingSelectEl = document.getElementById("chord-voicing-select");
        this.viewChordBtnEl = document.getElementById("btn-view-chord");
        this.viewNotesBtnEl = document.getElementById("btn-view-notes");
        this.inversionContainerEl = document.getElementById("inversion-pills-container");
        // Chord Library & Search
        this.chordGridEl = document.getElementById("chord-library-grid");
        this.rootFilterEl = document.getElementById("root-filter-container");
        this.qualityFilterEl = document.getElementById("quality-filter-select");
        this.searchInputEl = document.getElementById("chord-search-input");
        // Progression Generator & Modal
        this.generatorTargetEl = document.getElementById("generator-target-chord");
        this.btnOpenGeneratorStylesEl = document.getElementById("btn-open-generator-styles");
        this.btnGenerateEl = document.getElementById("btn-generate-progression");
        this.generatorStylesModalEl = document.getElementById("generator-styles-modal");
        this.btnCloseGeneratorStylesEl = document.getElementById("btn-close-generator-styles");
        this.generatorSelectedStyleNameEl = document.getElementById("generator-selected-style-name");
        this.generatorSelectedStyleDescEl = document.getElementById("generator-selected-style-desc");
        this.generatorModalSelectedNameEl = document.getElementById("generator-modal-selected-name");
        this.generatorModalSelectedMetaEl = document.getElementById("generator-modal-selected-meta");
        this.btnModalGenerateProgressionEl = document.getElementById("btn-modal-generate-progression");
        this.btnCancelGeneratorStylesEl = document.getElementById("btn-cancel-generator-styles");
        this.generatorStylesGridEl = document.getElementById("generator-styles-grid");
        this.generatorCategoryPillsEl = document.getElementById("generator-category-filter-pills");
        this.generatorStyleSearchEl = document.getElementById("generator-style-search");
        this.generatorModalTargetChordEl = document.getElementById("generator-modal-target-chord");
        // Settings Modal Controls
        this.capoSliderEl = document.getElementById("capo-slider");
        this.capoValueEl = document.getElementById("capo-value-display");
        // this.tuningSelectEl = document.getElementById("tuning-select") as HTMLSelectElement;
        this.strumSelectEl = document.getElementById("strum-pattern-select");
        this.soundPresetSelectEl = document.getElementById("sound-preset-select");
        this.btnInstallPwaEl = document.getElementById("btn-install-pwa");
        this.pwaInstallStatusTextEl = document.getElementById("pwa-install-status-text");
        // Audio Synthesis Sliders
        this.sliderLpfEl = document.getElementById("slider-lpf");
        this.valLpfEl = document.getElementById("val-lpf");
        this.sliderHpfEl = document.getElementById("slider-hpf");
        this.valHpfEl = document.getElementById("val-hpf");
        this.sliderDecayEl = document.getElementById("slider-decay");
        this.valDecayEl = document.getElementById("val-decay");
        this.sliderDetuneEl = document.getElementById("slider-detune");
        this.valDetuneEl = document.getElementById("val-detune");
        this.sliderReverbEl = document.getElementById("slider-reverb");
        this.valReverbEl = document.getElementById("val-reverb");
    }
    mapPatternTo16Subdivisions(pattern) {
        const result = new Array(16).fill("");
        if (!pattern || pattern.length === 0)
            return result;
        if (pattern.length === 16) {
            return [...pattern];
        }
        else if (pattern.length === 8) {
            for (let i = 0; i < 8; i++) {
                result[i * 2] = pattern[i] || "";
            }
        }
        else if (pattern.length === 6) {
            const map6 = [0, 3, 5, 8, 11, 13];
            map6.forEach((slot, i) => {
                result[slot] = pattern[i] || "";
            });
        }
        else {
            for (let i = 0; i < 16; i++) {
                const srcIdx = Math.floor((i * pattern.length) / 16);
                if (i % Math.max(1, Math.round(16 / pattern.length)) === 0) {
                    result[i] = pattern[srcIdx] || "";
                }
            }
        }
        return result;
    }
    initStrumPatternState() {
        try {
            const savedStrum = localStorage.getItem("chordflow-active-strum");
            if (savedStrum) {
                const parsed = JSON.parse(savedStrum);
                if (parsed && Array.isArray(parsed.pattern) && parsed.pattern.length > 0) {
                    this.appliedStrumSteps = this.mapPatternTo16Subdivisions(parsed.pattern);
                    this.editorStrumSteps = [...this.appliedStrumSteps];
                    progression.setStrumPattern({
                        id: parsed.id || "custom",
                        name: parsed.name || "Custom Pattern",
                        pattern: [...this.appliedStrumSteps],
                        accent: parsed.accent || [0, 4, 8, 12]
                    });
                    return;
                }
            }
        }
        catch {
            // Ignore
        }
        // Default to basic preset mapped to 16 subdivisions
        const basic = this.db.getStrumPattern("basic");
        this.appliedStrumSteps = this.mapPatternTo16Subdivisions(basic?.pattern || ["D", "", "D", "U", "D", "", "D", "U"]);
        this.editorStrumSteps = [...this.appliedStrumSteps];
        progression.setStrumPattern({
            id: "basic",
            name: basic?.name || "Basic Down-Up",
            pattern: [...this.appliedStrumSteps],
            accent: [0, 4, 8, 12]
        });
    }
    bindEvents() {
        // 1. Mode Switcher (Clean vs Advanced)
        document.querySelectorAll(".mode-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                const mode = tab.getAttribute("data-mode");
                this.setMode(mode);
            });
        });
        // 2. Theme Toggle (Persisted to localStorage)
        document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || this.state.theme;
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            this.setTheme(nextTheme);
        });
        // 3. Modals Open / Close
        this.bindModalEvents();
        // 4. Instrument Tabs (7 Instruments)
        document.querySelectorAll(".instrument-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                const inst = tab.getAttribute("data-instrument");
                this.setInstrument(inst);
            });
        });
        // 5. Progression Title & Toolbar
        this.progressionTitleInputEl?.addEventListener("input", () => {
            progression.setTitle(this.progressionTitleInputEl.value);
        });
        // Copy Progression
        document.getElementById("btn-copy-progression")?.addEventListener("click", () => {
            const symbols = progression.getChords().map(id => {
                const c = this.db.getChordById(id);
                return c?.symbol || id;
            });
            const text = symbols.join(" - ");
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(() => { });
            }
            this.showToast("Progression copied to clipboard! 📋");
        });
        // Save Dropdown Toggle
        document.getElementById("btn-save-dropdown-toggle")?.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = this.saveDropdownMenuEl.style.display === "block";
            this.saveDropdownMenuEl.style.display = isVisible ? "none" : "block";
        });
        // Close Dropdown on outside click
        document.addEventListener("click", () => {
            if (this.saveDropdownMenuEl) {
                this.saveDropdownMenuEl.style.display = "none";
            }
        });
        // Save as JSON
        document.getElementById("btn-save-json")?.addEventListener("click", () => {
            exporter.exportJSON(this.state, progression.getTitle());
            this.showToast("Saved progression as JSON! 💾");
            trackEvent("export", { format: "json", chord_count: this.state.progression.length.toString() });
        });
        // Save as PDF
        document.getElementById("btn-save-pdf")?.addEventListener("click", () => {
            const chordObjs = this.state.progression
                .map(id => this.db.getChordById(id))
                .filter((c) => Boolean(c));
            const strum = this.db.getStrumPattern(this.state.strumPattern || "");
            exporter.exportPDF(this.state, chordObjs, strum, progression.getTitle());
            this.showToast("Exporting printable PDF... 📄");
            trackEvent("export", { format: "pdf", chord_count: this.state.progression.length.toString() });
        });
        // Save as PNG
        document.getElementById("btn-save-png")?.addEventListener("click", () => {
            const chordObjs = this.state.progression
                .map(id => this.db.getChordById(id))
                .filter((c) => Boolean(c));
            const strum = this.db.getStrumPattern(this.state.strumPattern || "");
            exporter.exportPNG(this.state, chordObjs, strum, progression.getTitle());
            this.showToast("Exporting progression image... 🖼️");
            trackEvent("export", { format: "png", chord_count: this.state.progression.length.toString() });
        });
        // Import Button & Hidden File Picker
        const fileInput = document.getElementById("json-file-input");
        document.getElementById("btn-import-progression")?.addEventListener("click", () => {
            fileInput.click();
        });
        fileInput?.addEventListener("change", async () => {
            if (fileInput.files && fileInput.files[0]) {
                try {
                    const imported = await exporter.importJSON(fileInput.files[0]);
                    progression.setProgression(imported.progression, imported.tempo, undefined, imported.title);
                    if (imported.title && this.progressionTitleInputEl) {
                        this.progressionTitleInputEl.value = imported.title;
                    }
                    if (imported.activeInstrument)
                        this.setInstrument(imported.activeInstrument);
                    if (typeof imported.capo === "number") {
                        this.state.capo = imported.capo;
                        this.capoSliderEl.value = `${imported.capo}`;
                        this.capoValueEl.textContent = imported.capo === 0 ? "None (0)" : `Fret ${imported.capo}`;
                    }
                    this.showToast("Progression imported successfully! 📂");
                    trackEvent("import", { format: "json", chord_count: imported.progression.length.toString() });
                }
                catch (err) {
                    alert(`Import failed: ${err.message}`);
                }
                fileInput.value = "";
            }
        });
        // 6. Play Active Chord Button
        document.getElementById("btn-play-active-chord")?.addEventListener("click", () => {
            this.playActiveChord();
        });
        // 7. Progression Playback Transport Controls
        this.playBtnEl?.addEventListener("click", () => {
            if (!this.state.isPlaying) {
                trackEvent("play_progression", {
                    chord_count: progression.getChords().length.toString(),
                    tempo: progression.getTempo().toString(),
                    instrument: this.state.activeInstrument,
                    strum_pattern: this.state.strumPattern || "basic"
                });
            }
            progression.togglePlay();
        });
        document.getElementById("btn-stop-progression")?.addEventListener("click", () => {
            progression.stop();
        });
        this.loopBtnEl?.addEventListener("click", () => {
            const isLoop = progression.toggleLoop();
            this.loopBtnEl.classList.toggle("active", isLoop);
        });
        this.metronomeBtnEl?.addEventListener("click", () => {
            const isMetro = progression.toggleMetronome();
            this.metronomeBtnEl.classList.toggle("active", isMetro);
        });
        // Transpose Buttons
        this.btnTransposeDownEl?.addEventListener("click", () => {
            this.transposeProgressionBy(-1);
        });
        this.btnTransposeUpEl?.addEventListener("click", () => {
            this.transposeProgressionBy(1);
        });
        this.btnTransposeResetEl?.addEventListener("click", () => {
            this.resetTranspose();
        });
        // Tempo Slider
        this.tempoSliderEl?.addEventListener("input", () => {
            const bpm = parseInt(this.tempoSliderEl.value, 10);
            this.state.tempo = bpm;
            this.tempoValueEl.textContent = `${bpm} BPM`;
            progression.setTempo(bpm);
        });
        // Tap Tempo Button
        let lastTapTime = 0;
        const tapDeltas = [];
        document.getElementById("btn-tap-tempo")?.addEventListener("click", () => {
            const now = performance.now();
            if (lastTapTime > 0) {
                const delta = now - lastTapTime;
                if (delta < 2000) {
                    tapDeltas.push(delta);
                    if (tapDeltas.length > 4)
                        tapDeltas.shift();
                    const avgDelta = tapDeltas.reduce((a, b) => a + b, 0) / tapDeltas.length;
                    const calculatedBpm = Math.round(60000 / avgDelta);
                    const clamped = Math.max(40, Math.min(240, calculatedBpm));
                    this.tempoSliderEl.value = `${clamped}`;
                    this.state.tempo = clamped;
                    this.tempoValueEl.textContent = `${clamped} BPM`;
                    progression.setTempo(clamped);
                }
                else {
                    tapDeltas.length = 0;
                }
            }
            lastTapTime = now;
        });
        // Volume Slider & Mute
        this.volumeSliderEl?.addEventListener("input", () => {
            const vol = parseInt(this.volumeSliderEl.value, 10) / 100;
            audio.setVolume(vol);
            this.volumeValueEl.textContent = `${Math.round(vol * 100)}%`;
            this.volumeIconBtnEl.textContent = vol === 0 ? "🔇" : vol < 0.5 ? "🔉" : "🔊";
        });
        this.volumeIconBtnEl?.addEventListener("click", () => {
            const isMuted = audio.toggleMute();
            this.volumeIconBtnEl.textContent = isMuted ? "🔇" : "🔊";
            this.volumeValueEl.textContent = isMuted ? "0%" : `${Math.round(audio.getVolume() * 100)}%`;
        });
        // 8. Voicing Selector & View Mode Toggle
        this.voicingSelectEl?.addEventListener("change", () => {
            this.state.selectedVoicingId = this.voicingSelectEl.value;
            this.renderActiveChord();
        });
        this.viewChordBtnEl?.addEventListener("click", () => {
            this.setDisplayView("chord");
        });
        this.viewNotesBtnEl?.addEventListener("click", () => {
            this.setDisplayView("notes");
        });
        // 9. Capo Slider
        this.capoSliderEl?.addEventListener("input", () => {
            const capo = parseInt(this.capoSliderEl.value, 10);
            this.state.capo = capo;
            this.capoValueEl.textContent = capo === 0 ? "None (0)" : `Fret ${capo}`;
            this.renderActiveChord();
            this.renderProgressionCards();
        });
        // 10. Tuning Select
        // this.tuningSelectEl?.addEventListener("change", () => {
        //   this.state.tuning = this.tuningSelectEl.value;
        //   this.renderActiveChord();
        // });
        // 11. Strum Pattern Select (Settings Modal)
        this.strumSelectEl?.addEventListener("change", () => {
            this.state.strumPattern = this.strumSelectEl.value;
            const preset = this.db.getStrumPattern(this.state.strumPattern);
            if (preset) {
                const mapped = this.mapPatternTo16Subdivisions(preset.pattern);
                this.appliedStrumSteps = [...mapped];
                this.editorStrumSteps = [...mapped];
                const activeStrum = {
                    id: preset.id,
                    name: preset.name,
                    pattern: [...mapped],
                    accent: [0, 4, 8, 12]
                };
                progression.setStrumPattern(activeStrum);
                try {
                    localStorage.setItem("chordflow-active-strum", JSON.stringify(activeStrum));
                }
                catch {
                    // Ignore
                }
                if (this.editorStrumSelectEl) {
                    this.editorStrumSelectEl.value = preset.id;
                }
                this.renderStrumTicker();
                this.renderStrumEditor();
            }
        });
        // Strum Pattern Preset Dropdown (Strum Editor)
        this.editorStrumSelectEl?.addEventListener("change", () => {
            const presetId = this.editorStrumSelectEl.value;
            const preset = this.db.getStrumPattern(presetId);
            if (preset) {
                this.editorStrumSteps = this.mapPatternTo16Subdivisions(preset.pattern);
                this.renderStrumEditor();
            }
        });
        // Apply Strum Pattern Button
        this.btnApplyStrumEl?.addEventListener("click", () => {
            this.appliedStrumSteps = [...this.editorStrumSteps];
            const activeStrum = {
                id: "custom",
                name: "Custom Pattern",
                pattern: [...this.appliedStrumSteps],
                accent: [0, 4, 8, 12]
            };
            progression.setStrumPattern(activeStrum);
            try {
                localStorage.setItem("chordflow-active-strum", JSON.stringify(activeStrum));
            }
            catch {
                // Ignore
            }
            this.renderStrumTicker();
            this.showToast("Strum pattern applied");
        });
        // Reset Strum Pattern Button (Discards Unsaved Grid Edits)
        this.btnResetStrumEl?.addEventListener("click", () => {
            this.editorStrumSteps = [...this.appliedStrumSteps];
            this.renderStrumEditor();
            this.showToast("Strum pattern edits discarded");
        });
        // Audio Reset to Default for Active Instrument Button
        this.btnResetAudioInstEl?.addEventListener("click", () => {
            audio.resetInstrument(this.state.activeInstrument);
            this.updateAudioSliders();
            if (this.soundPresetSelectEl) {
                this.soundPresetSelectEl.value = audio.getPreset(this.state.activeInstrument);
            }
            this.showToast("Sound reset to default");
        });
        // Audio Reset All Instruments Button
        this.btnResetAllAudioEl?.addEventListener("click", () => {
            audio.resetAll();
            this.updateAudioSliders();
            if (this.soundPresetSelectEl) {
                this.soundPresetSelectEl.value = audio.getPreset(this.state.activeInstrument);
            }
            this.showToast("All audio settings reset to default");
        });
        // 12. Preset Progressions Select
        this.presetSelectEl?.addEventListener("change", () => {
            const presetId = this.presetSelectEl.value;
            if (presetId) {
                const p = this.db.getProgression(presetId);
                if (p) {
                    progression.setProgression(p.chords, p.tempo, p.beatsPerChord, p.name);
                    if (this.progressionTitleInputEl) {
                        this.progressionTitleInputEl.value = p.name;
                    }
                    if (p.strumPatternId) {
                        this.strumSelectEl.value = p.strumPatternId;
                        this.state.strumPattern = p.strumPatternId;
                        const sp = this.db.getStrumPattern(p.strumPatternId);
                        if (sp) {
                            const mapped = this.mapPatternTo16Subdivisions(sp.pattern);
                            this.appliedStrumSteps = [...mapped];
                            this.editorStrumSteps = [...mapped];
                            const activeStrum = {
                                id: sp.id,
                                name: sp.name,
                                pattern: [...mapped],
                                accent: [0, 4, 8, 12]
                            };
                            progression.setStrumPattern(activeStrum);
                            try {
                                localStorage.setItem("chordflow-active-strum", JSON.stringify(activeStrum));
                            }
                            catch {
                                // Ignore
                            }
                            if (this.editorStrumSelectEl) {
                                this.editorStrumSelectEl.value = sp.id;
                            }
                            this.renderStrumTicker();
                            this.renderStrumEditor();
                        }
                    }
                }
            }
        });
        // 13. Search and Quality Filter
        this.searchInputEl?.addEventListener("input", () => {
            this.renderChordGrid();
        });
        this.qualityFilterEl?.addEventListener("change", () => {
            this.renderChordGrid();
        });
        // 14. Progression Auto-Generator Button
        this.btnGenerateEl?.addEventListener("click", () => {
            this.generateProgressionForSelectedStyle();
            const styleObj = GENERATOR_STYLES.find(s => s.id === this.selectedGeneratorStyleId) || GENERATOR_STYLES[0];
            this.playActiveChord();
            this.btnGenerateEl.classList.add("btn-pressed");
            setTimeout(() => this.btnGenerateEl.classList.remove("btn-pressed"), 220);
            this.progressionCardsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            this.showToast(`Generated: ${styleObj.name} ⚡`);
        });
        // 15. Generator Styles Modal Triggers & Search
        this.btnOpenGeneratorStylesEl?.addEventListener("click", () => {
            this.openGeneratorStylesModal();
        });
        this.btnCloseGeneratorStylesEl?.addEventListener("click", () => {
            this.closeGeneratorStylesModal();
        });
        this.generatorStylesModalEl?.addEventListener("click", (e) => {
            if (e.target === this.generatorStylesModalEl) {
                this.closeGeneratorStylesModal();
            }
        });
        this.generatorStyleSearchEl?.addEventListener("input", () => {
            this.renderGeneratorStylesModal();
        });
        // 16. Canvas Note Clicking & Piano Octave Scrolling
        const handleCanvasClick = (e) => {
            const target = diagrams.getClickTarget(this.mainCanvas, e);
            if (target) {
                if (target.instrument === "piano" && (target.midi === -100 || target.midi === 100)) {
                    diagrams.panPiano(target.midi === -100 ? -12 : 12);
                    this.renderActiveChord();
                    this.showToast(target.midi === -100 ? "Piano scrolled to previous octave ◀" : "Piano scrolled to next octave ▶");
                    return;
                }
                audio.playNote(target.midi, target.instrument, undefined, 1.2);
                this.createRippleEffect(e.clientX, e.clientY);
            }
        };
        this.mainCanvas?.addEventListener("click", handleCanvasClick);
        // 17. Sound Presets & Audio Synthesis Sliders
        this.soundPresetSelectEl?.addEventListener("change", () => {
            const presetId = this.soundPresetSelectEl.value;
            audio.setPreset(this.state.activeInstrument, presetId);
            this.playActiveChord();
        });
        this.bindAudioSliders();
        // 18. Theory Overlays Checkboxes
        const toggleBindings = [
            ["toggle-notes", "showNotes"],
            ["toggle-intervals", "showIntervals"],
            ["toggle-scale-degrees", "showScaleDegrees"],
            ["toggle-strum", "showStrum"],
            ["toggle-circle", "showCircle"],
            ["toggle-inversions", "showInversions"]
        ];
        toggleBindings.forEach(([elemId, key]) => {
            const checkbox = document.getElementById(elemId);
            checkbox?.addEventListener("change", () => {
                this.state.toggles[key] = checkbox.checked;
                this.renderActiveChord();
                this.renderProgressionCards();
                this.renderStrumTicker();
            });
        });
        // 19. Global Keyboard Shortcuts (Number Keys 1–8, Space, Enter, Arrows, Escape)
        this.bindKeyboardShortcuts();
        // 20. Responsive window resize
        window.addEventListener("resize", () => {
            this.renderActiveChord();
        });
    }
    bindModalEvents() {
        // Settings Modal
        document.getElementById("btn-open-settings")?.addEventListener("click", () => {
            if (this.settingsModalEl)
                this.settingsModalEl.style.display = "flex";
            this.updateAudioSliders();
            this.updatePwaInstallState();
            trackPageView("/ChordFlow/settings", "ChordFlow - Settings");
        });
        document.getElementById("btn-close-settings")?.addEventListener("click", () => {
            if (this.settingsModalEl)
                this.settingsModalEl.style.display = "none";
        });
        this.settingsModalEl?.addEventListener("click", (e) => {
            if (e.target === this.settingsModalEl)
                this.settingsModalEl.style.display = "none";
        });
        // PWA Install Listeners
        this.initPwaInstallHandler();
        // Theory Modal
        document.getElementById("btn-open-theory")?.addEventListener("click", () => {
            if (this.theoryModalEl)
                this.theoryModalEl.style.display = "flex";
            circleOfFifths.render();
            trackPageView("/ChordFlow/theory", "ChordFlow - Music Theory & Circle of Fifths");
        });
        document.getElementById("btn-close-theory")?.addEventListener("click", () => {
            if (this.theoryModalEl)
                this.theoryModalEl.style.display = "none";
        });
        this.theoryModalEl?.addEventListener("click", (e) => {
            if (e.target === this.theoryModalEl)
                this.theoryModalEl.style.display = "none";
        });
        // Tuner Modal
        document.getElementById("btn-open-tuner")?.addEventListener("click", () => {
            tuner.open();
            trackPageView("/ChordFlow/tuner", "ChordFlow - Instrument Tuner");
            trackEvent("tuner_used", { instrument: this.state.activeInstrument });
        });
        document.getElementById("btn-close-tuner")?.addEventListener("click", () => {
            tuner.close();
        });
        this.tunerModalEl?.addEventListener("click", (e) => {
            if (e.target === this.tunerModalEl)
                tuner.close();
        });
        // Mobile Library Modal
        document.getElementById("btn-mobile-open-library")?.addEventListener("click", () => {
            this.openMobileLibrary();
            trackPageView("/ChordFlow/library", "ChordFlow - Chord Library");
        });
        document.getElementById("btn-close-mobile-library")?.addEventListener("click", () => {
            if (this.mobileLibraryModalEl)
                this.mobileLibraryModalEl.style.display = "none";
        });
        this.mobileLibraryModalEl?.addEventListener("click", (e) => {
            if (e.target === this.mobileLibraryModalEl)
                this.mobileLibraryModalEl.style.display = "none";
        });
        // Generator Styles Modal
        document.getElementById("btn-close-generator-styles")?.addEventListener("click", () => {
            this.closeGeneratorStylesModal();
        });
        this.btnCancelGeneratorStylesEl?.addEventListener("click", () => {
            this.closeGeneratorStylesModal();
        });
        this.btnModalGenerateProgressionEl?.addEventListener("click", () => {
            this.generateProgressionForSelectedStyle();
            this.closeGeneratorStylesModal();
            const styleObj = GENERATOR_STYLES.find(s => s.id === this.selectedGeneratorStyleId) || GENERATOR_STYLES[0];
            this.playActiveChord();
            this.btnGenerateEl?.classList.add("btn-pressed");
            setTimeout(() => this.btnGenerateEl?.classList.remove("btn-pressed"), 220);
            this.progressionCardsEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            this.showToast(`Generated: ${styleObj.name} (${styleObj.bpm || 120} BPM) ⚡`);
        });
        // About App Modal Listeners
        this.btnOpenAboutEl?.addEventListener("click", () => {
            this.openAboutModal();
        });
        this.btnCloseAboutEl?.addEventListener("click", () => {
            this.closeAboutModal();
        });
        this.btnCloseAboutFooterEl?.addEventListener("click", () => {
            this.closeAboutModal();
        });
        this.aboutModalEl?.addEventListener("click", (e) => {
            if (e.target === this.aboutModalEl) {
                this.closeAboutModal();
            }
        });
    }
    initPwaInstallHandler() {
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.updatePwaInstallState();
        });
        window.addEventListener("appinstalled", () => {
            this.deferredPrompt = null;
            this.updatePwaInstallState();
            this.showToast("ChordFlow successfully installed! 🎉");
        });
        this.btnInstallPwaEl?.addEventListener("click", async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const choiceResult = await this.deferredPrompt.userChoice;
                if (choiceResult && choiceResult.outcome === "accepted") {
                    this.showToast("Installing ChordFlow... ⚡");
                }
                this.deferredPrompt = null;
                this.updatePwaInstallState();
            }
            else {
                const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
                if (isStandalone) {
                    this.showToast("ChordFlow is already running as an installed app! 🎉");
                }
                else {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    if (isIOS) {
                        this.showToast("To install on iOS: Tap Share (⎙) in Safari, then 'Add to Home Screen' (+)", 5000);
                    }
                    else {
                        this.showToast("To install: Click the Install icon (⊕) in your browser address bar.", 5000);
                    }
                }
            }
        });
        this.updatePwaInstallState();
    }
    updatePwaInstallState() {
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
        if (isStandalone) {
            if (this.btnInstallPwaEl) {
                this.btnInstallPwaEl.disabled = true;
                this.btnInstallPwaEl.innerHTML = `<span>✓</span><span>Installed</span>`;
            }
            if (this.pwaInstallStatusTextEl) {
                this.pwaInstallStatusTextEl.textContent = "ChordFlow is running as an installed standalone app.";
            }
        }
        else if (this.deferredPrompt) {
            if (this.btnInstallPwaEl) {
                this.btnInstallPwaEl.disabled = false;
                this.btnInstallPwaEl.innerHTML = `<span>⬇️</span><span>Install App</span>`;
            }
            if (this.pwaInstallStatusTextEl) {
                this.pwaInstallStatusTextEl.textContent = "Ready to install! Click below to add ChordFlow to your home screen or desktop.";
            }
        }
        else {
            if (this.btnInstallPwaEl) {
                this.btnInstallPwaEl.disabled = false;
                this.btnInstallPwaEl.innerHTML = `<span>⬇️</span><span>Install App</span>`;
            }
            if (this.pwaInstallStatusTextEl) {
                this.pwaInstallStatusTextEl.textContent = "Install as a standalone PWA for offline practice and zero latency.";
            }
        }
    }
    openMobileLibrary() {
        if (!this.mobileLibraryModalEl || !this.mobileLibraryContainerEl)
            return;
        this.mobileLibraryModalEl.style.display = "flex";
        // Clone or render chord library inside mobile container
        this.mobileLibraryContainerEl.innerHTML = "";
        const allChords = this.db.getAllChords();
        const grid = document.createElement("div");
        grid.className = "chord-grid";
        allChords.forEach(chord => {
            const card = document.createElement("div");
            card.className = `lib-chord-card ${chord.id === this.state.selectedChord ? "selected" : ""}`;
            card.innerHTML = `
        <div class="lib-chord-symbol">${chord.symbol}</div>
        <div class="lib-chord-name">${chord.name}</div>
        <button class="lib-add-btn" title="Add to Progression">+</button>
      `;
            card.addEventListener("click", () => {
                this.selectChord(chord.id);
                this.mobileLibraryModalEl.style.display = "none";
            });
            card.querySelector(".lib-add-btn")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.addChordToProgression(chord.id);
                this.mobileLibraryModalEl.style.display = "none";
            });
            grid.appendChild(card);
        });
        this.mobileLibraryContainerEl.appendChild(grid);
    }
    bindAudioSliders() {
        const updateAudio = () => {
            const inst = this.state.activeInstrument;
            const lpf = parseInt(this.sliderLpfEl.value, 10);
            const hpf = parseInt(this.sliderHpfEl.value, 10);
            const decay = parseFloat(this.sliderDecayEl.value);
            const detune = parseInt(this.sliderDetuneEl.value, 10);
            const reverb = parseInt(this.sliderReverbEl.value, 10) / 100;
            this.valLpfEl.textContent = `${lpf} Hz`;
            this.valHpfEl.textContent = `${hpf} Hz`;
            this.valDecayEl.textContent = `${decay.toFixed(1)} s`;
            this.valDetuneEl.textContent = `${detune > 0 ? "+" : ""}${detune} cents`;
            this.valReverbEl.textContent = `${Math.round(reverb * 100)}%`;
            audio.setAudioSettings(inst, { lpf, hpf, decay, detune, reverb });
        };
        this.sliderLpfEl?.addEventListener("input", updateAudio);
        this.sliderHpfEl?.addEventListener("input", updateAudio);
        this.sliderDecayEl?.addEventListener("input", updateAudio);
        this.sliderDetuneEl?.addEventListener("input", updateAudio);
        this.sliderReverbEl?.addEventListener("input", updateAudio);
    }
    updateAudioSliders() {
        const settings = audio.getAudioSettings(this.state.activeInstrument);
        if (this.sliderLpfEl) {
            this.sliderLpfEl.value = `${settings.lpf}`;
            this.valLpfEl.textContent = `${settings.lpf} Hz`;
        }
        if (this.sliderHpfEl) {
            this.sliderHpfEl.value = `${settings.hpf}`;
            this.valHpfEl.textContent = `${settings.hpf} Hz`;
        }
        if (this.sliderDecayEl) {
            this.sliderDecayEl.value = `${settings.decay}`;
            const decayMs = Math.round(settings.decay * 1000);
            this.valDecayEl.textContent = `${decayMs} ms`;
        }
        if (this.sliderDetuneEl) {
            this.sliderDetuneEl.value = `${settings.detune}`;
            this.valDetuneEl.textContent = `${settings.detune > 0 ? "+" : ""}${settings.detune} cents`;
        }
        if (this.sliderReverbEl) {
            this.sliderReverbEl.value = `${Math.round(settings.reverb * 100)}`;
            this.valReverbEl.textContent = `${Math.round(settings.reverb * 100)}%`;
        }
    }
    bindKeyboardShortcuts() {
        window.addEventListener("keydown", (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement)
                return;
            if (e.repeat)
                return; // Prevent infinite re-triggering when key is held down
            // Escape = Close all open modals
            if (e.code === "Escape") {
                this.closeAllModals();
                return;
            }
            // Transpose Shortcuts: '+' / '=' / 'NumpadAdd' = Transpose Up (+1), '-' / '_' / 'NumpadSubtract' = Transpose Down (-1)
            if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.transposeProgressionBy(1);
                    return;
                }
            }
            if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.transposeProgressionBy(-1);
                    return;
                }
            }
            // Space = Toggle Play / Pause
            if (e.code === "Space") {
                e.preventDefault();
                progression.togglePlay();
                return;
            }
            // Enter = Play Active Chord
            if (e.code === "Enter") {
                e.preventDefault();
                this.playActiveChord();
                return;
            }
            // Arrow Left / Right = Step Progression or Scroll Piano Octave
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                if (this.state.activeInstrument === "piano") {
                    diagrams.panPiano(-12);
                    this.renderActiveChord();
                    this.showToast("Piano scrolled to previous octave ◀");
                }
                else {
                    const chords = progression.getChords();
                    if (chords.length > 0) {
                        const prevIdx = (this.state.activeChordIndex - 1 + chords.length) % chords.length;
                        progression.setActiveIndex(prevIdx);
                    }
                }
                return;
            }
            else if (e.code === "ArrowRight") {
                e.preventDefault();
                if (this.state.activeInstrument === "piano") {
                    diagrams.panPiano(12);
                    this.renderActiveChord();
                    this.showToast("Piano scrolled to next octave ▶");
                }
                else {
                    const chords = progression.getChords();
                    if (chords.length > 0) {
                        const nextIdx = (this.state.activeChordIndex + 1) % chords.length;
                        progression.setActiveIndex(nextIdx);
                    }
                }
                return;
            }
            // '?' or 'A' = Toggle About & Shortcuts Modal
            if (e.key === "?" || (e.code === "KeyA" && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                e.preventDefault();
                if (this.aboutModalEl && this.aboutModalEl.style.display === "flex") {
                    this.closeAboutModal();
                }
                else {
                    this.openAboutModal();
                }
                return;
            }
            // 'T' = Toggle Tuner Modal
            if (e.code === "KeyT" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (this.tunerModalEl && this.tunerModalEl.style.display === "flex") {
                    tuner.close();
                }
                else {
                    tuner.open();
                }
                return;
            }
            // 'M' = Toggle Music Theory Modal
            if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (this.theoryModalEl && this.theoryModalEl.style.display === "flex") {
                    this.theoryModalEl.style.display = "none";
                }
                else {
                    if (this.theoryModalEl)
                        this.theoryModalEl.style.display = "flex";
                }
                return;
            }
            // 'S' = Toggle Settings Modal
            if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (this.settingsModalEl && this.settingsModalEl.style.display === "flex") {
                    this.settingsModalEl.style.display = "none";
                }
                else {
                    if (this.settingsModalEl)
                        this.settingsModalEl.style.display = "flex";
                }
                return;
            }
            // Number Keys 1–8 (and 9, 0)
            const numMatch = e.code.match(/^(?:Digit|Numpad)([1-9]|0)$/);
            if (numMatch) {
                let num = parseInt(numMatch[1], 10);
                if (num === 0)
                    num = 10;
                const index = num - 1;
                const chords = progression.getChords();
                if (index < chords.length) {
                    e.preventDefault();
                    const chordId = chords[index];
                    this.state.activeChordIndex = index;
                    this.state.selectedChord = chordId;
                    progression.setActiveIndex(index);
                    const direction = e.shiftKey ? "down_up" : "down";
                    this.playChordById(chordId, direction);
                }
            }
        });
    }
    initTuner() {
        tuner.init();
    }
    populateFiltersAndPresets() {
        // 1. Root pills
        const roots = ["All", "C", "D", "E", "F", "G", "A", "B", "C#", "D#", "E#", "F#", "G#", "A#", "B#"];
        this.rootFilterEl.innerHTML = "";
        roots.forEach((root, idx) => {
            const pill = document.createElement("button");
            pill.className = `root-pill ${idx === 0 ? "active" : ""}`;
            pill.textContent = root;
            pill.setAttribute("data-root", root.toLowerCase());
            pill.addEventListener("click", () => {
                this.rootFilterEl.querySelectorAll(".root-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                this.renderChordGrid();
            });
            this.rootFilterEl.appendChild(pill);
        });
        // 2. Strum patterns (Settings modal & Strum editor dropdowns)
        const strums = this.db.getStrumPatterns();
        this.strumSelectEl.innerHTML = "";
        if (this.editorStrumSelectEl) {
            this.editorStrumSelectEl.innerHTML = "";
        }
        strums.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.pattern.filter(Boolean).join(" ")})`;
            this.strumSelectEl.appendChild(opt);
            if (this.editorStrumSelectEl) {
                const optEd = document.createElement("option");
                optEd.value = s.id;
                optEd.textContent = s.name;
                this.editorStrumSelectEl.appendChild(optEd);
            }
        });
        // 3. Preset progressions
        const presets = this.db.getProgressions();
        this.presetSelectEl.innerHTML = '<option value="">-- Load a Sample Progression --</option>';
        presets.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.name} [${p.style || "Pop"}]`;
            this.presetSelectEl.appendChild(opt);
        });
        // 4. Tunings & Sound Presets
        // this.updateTuningsDropdown();
        this.updateSoundPresetsDropdown();
        // 5. Generator Styles
        this.updateGeneratorStyleDisplay();
    }
    getStrumPatternName(id) {
        if (!id)
            return "Standard Strum";
        const p = this.db.getStrumPattern(id);
        return p ? p.name : id;
    }
    updateGeneratorStyleDisplay() {
        const style = GENERATOR_STYLES.find(s => s.id === this.selectedGeneratorStyleId) || GENERATOR_STYLES[0];
        const bpm = style.bpm || 120;
        const strumName = this.getStrumPatternName(style.strumPatternId);
        if (this.generatorSelectedStyleNameEl) {
            this.generatorSelectedStyleNameEl.textContent = style.name;
        }
        if (this.generatorSelectedStyleDescEl) {
            this.generatorSelectedStyleDescEl.textContent = `${style.category} • ${bpm} BPM • ${strumName}`;
        }
        if (this.generatorModalSelectedNameEl) {
            this.generatorModalSelectedNameEl.textContent = style.name;
        }
        if (this.generatorModalSelectedMetaEl) {
            this.generatorModalSelectedMetaEl.textContent = `${bpm} BPM • ${style.category} • ${strumName}`;
        }
        if (this.generatorModalTargetChordEl) {
            const chordId = this.state.selectedChord || this.state.progression[this.state.activeChordIndex] || "Cmaj";
            const chord = this.db.getChordById(chordId) || this.db.getAllChords()[0];
            if (chord) {
                this.generatorModalTargetChordEl.textContent = `${chord.name} (${chord.symbol})`;
            }
        }
    }
    openGeneratorStylesModal() {
        if (!this.generatorStylesModalEl)
            return;
        this.updateGeneratorStyleDisplay();
        this.renderGeneratorStylesModal();
        this.generatorStylesModalEl.style.display = "flex";
        if (this.generatorStyleSearchEl) {
            this.generatorStyleSearchEl.value = "";
            this.generatorStyleSearchEl.focus();
        }
        trackPageView("/ChordFlow/styles", "ChordFlow - Progression Styles & Formulas");
    }
    closeGeneratorStylesModal() {
        if (this.generatorStylesModalEl) {
            this.generatorStylesModalEl.style.display = "none";
        }
    }
    openAboutModal() {
        if (this.aboutModalEl) {
            this.aboutModalEl.style.display = "flex";
            trackPageView("/ChordFlow/about", "ChordFlow - About & Shortcuts");
        }
    }
    closeAboutModal() {
        if (this.aboutModalEl) {
            this.aboutModalEl.style.display = "none";
        }
    }
    closeAllModals() {
        if (this.settingsModalEl)
            this.settingsModalEl.style.display = "none";
        if (this.theoryModalEl)
            this.theoryModalEl.style.display = "none";
        if (this.tunerModalEl)
            tuner.close();
        if (this.mobileLibraryModalEl)
            this.mobileLibraryModalEl.style.display = "none";
        if (this.generatorStylesModalEl)
            this.generatorStylesModalEl.style.display = "none";
        if (this.aboutModalEl)
            this.aboutModalEl.style.display = "none";
    }
    renderGeneratorStylesModal() {
        if (!this.generatorStylesGridEl || !this.generatorCategoryPillsEl)
            return;
        // Render Category Filter Pills
        const categories = ["All", ...Array.from(new Set(GENERATOR_STYLES.map(s => s.category)))];
        this.generatorCategoryPillsEl.innerHTML = "";
        categories.forEach(cat => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = `generator-cat-pill ${cat === this.selectedGeneratorCategory ? "active" : ""}`;
            pill.textContent = cat;
            pill.addEventListener("click", () => {
                this.selectedGeneratorCategory = cat;
                this.renderGeneratorStylesModal();
            });
            this.generatorCategoryPillsEl.appendChild(pill);
        });
        // Filter styles by category and search term
        const query = (this.generatorStyleSearchEl?.value || "").toLowerCase().trim();
        const filteredStyles = GENERATOR_STYLES.filter(s => {
            const matchCat = this.selectedGeneratorCategory === "All" || s.category === this.selectedGeneratorCategory;
            const matchQuery = !query ||
                s.name.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query) ||
                s.id.toLowerCase().includes(query);
            return matchCat && matchQuery;
        });
        // Render Style Cards
        this.generatorStylesGridEl.innerHTML = "";
        const activeChordId = this.state.selectedChord || this.state.progression[this.state.activeChordIndex] || "Cmaj";
        const activeChord = this.db.getChordById(activeChordId) || this.db.getAllChords()[0];
        if (filteredStyles.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "generator-modal-empty";
            emptyMsg.innerHTML = `
        <div class="empty-icon">🔍</div>
        <p>No styles or formulas found matching "<strong>${query}</strong>"</p>
        <button class="empty-reset-btn" type="button">Clear Search</button>
      `;
            emptyMsg.querySelector(".empty-reset-btn")?.addEventListener("click", () => {
                if (this.generatorStyleSearchEl)
                    this.generatorStyleSearchEl.value = "";
                this.selectedGeneratorCategory = "All";
                this.renderGeneratorStylesModal();
            });
            this.generatorStylesGridEl.appendChild(emptyMsg);
            return;
        }
        filteredStyles.forEach(s => {
            const isSelected = s.id === this.selectedGeneratorStyleId;
            const strumName = this.getStrumPatternName(s.strumPatternId);
            const generatedChordIds = this.db.generateProgressionForChord(activeChordId, s.id);
            const chordSymbols = generatedChordIds.map(cid => {
                const c = this.db.getChordById(cid);
                return c ? c.symbol : cid;
            });
            const card = document.createElement("div");
            card.className = `generator-style-card ${isSelected ? "selected" : ""}`;
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute("data-style-id", s.id);
            card.setAttribute("aria-pressed", isSelected ? "true" : "false");
            const stepsHtml = chordSymbols.map((sym, idx) => `
        <span class="generator-formula-chord-pill" title="Step ${idx + 1}">${sym}</span>
        ${idx < chordSymbols.length - 1 ? '<span class="generator-formula-arrow">→</span>' : ""}
      `).join("");
            card.innerHTML = `
        <div class="generator-style-card-header">
          <div class="generator-style-card-title-group">
            <h4 class="generator-style-card-title">${s.name}</h4>
            <div class="generator-style-badges">
              <span class="generator-style-cat-tag">${s.category}</span>
              <span class="generator-style-tempo-tag">⏱️ ${s.bpm || 120} BPM</span>
              <span class="generator-style-strum-tag">🎸 ${strumName}</span>
            </div>
          </div>
          ${isSelected ? '<span class="generator-style-selected-indicator">✓ Active</span>' : ""}
        </div>
        <p class="generator-style-card-desc">${s.description}</p>
        <div class="generator-style-formula-preview">
          <span class="generator-formula-preview-label">Chords on ${activeChord ? activeChord.symbol : "Root"}:</span>
          <div class="generator-formula-steps-row">${stepsHtml}</div>
        </div>
        <div class="generator-style-card-footer">
          <button type="button" class="btn-card-select-style ${isSelected ? "active" : ""}">
            ${isSelected ? "✓ Selected" : "Select Style"}
          </button>
          <button type="button" class="btn-card-generate-now" title="Select and generate chords starting on ${activeChord ? activeChord.symbol : 'active chord'}">
            <span>⚡ Generate Now</span>
          </button>
        </div>
      `;
            card.addEventListener("click", () => {
                this.selectGeneratorStyle(s.id, false);
            });
            card.querySelector(".btn-card-select-style")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectGeneratorStyle(s.id, false);
            });
            card.querySelector(".btn-card-generate-now")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectGeneratorStyle(s.id, true);
            });
            this.generatorStylesGridEl.appendChild(card);
        });
    }
    selectGeneratorStyle(styleId, autoGenerate = false) {
        this.selectedGeneratorStyleId = styleId;
        this.updateGeneratorStyleDisplay();
        const styleObj = GENERATOR_STYLES.find(s => s.id === styleId) || GENERATOR_STYLES[0];
        if (autoGenerate) {
            this.generateProgressionForSelectedStyle();
            this.closeGeneratorStylesModal();
            this.playActiveChord();
            this.progressionCardsEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            this.showToast(`Generated: ${styleObj.name} (${styleObj.bpm || 120} BPM) ⚡`);
        }
        else {
            // Update visual selection in modal cards without closing modal
            if (this.generatorStylesGridEl) {
                const cards = this.generatorStylesGridEl.querySelectorAll(".generator-style-card");
                cards.forEach(card => {
                    const cid = card.getAttribute("data-style-id");
                    const isSelected = cid === styleId;
                    card.classList.toggle("selected", isSelected);
                    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
                    const indicator = card.querySelector(".generator-style-selected-indicator");
                    if (indicator)
                        indicator.remove();
                    if (isSelected) {
                        const header = card.querySelector(".generator-style-card-header");
                        const newInd = document.createElement("span");
                        newInd.className = "generator-style-selected-indicator";
                        newInd.textContent = "✓ Active";
                        header?.appendChild(newInd);
                    }
                    const selBtn = card.querySelector(".btn-card-select-style");
                    if (selBtn) {
                        selBtn.classList.toggle("active", isSelected);
                        selBtn.textContent = isSelected ? "✓ Selected" : "Select Style";
                    }
                });
            }
        }
    }
    generateProgressionForSelectedStyle() {
        const selectedChordId = this.state.selectedChord || "Cmaj";
        const styleObj = GENERATOR_STYLES.find(s => s.id === this.selectedGeneratorStyleId) || GENERATOR_STYLES[0];
        const targetTempo = styleObj.bpm || 120;
        const newChords = this.db.generateProgressionForChord(selectedChordId, styleObj.id);
        this.state.tempo = targetTempo;
        progression.setProgression(newChords, targetTempo, undefined, styleObj.name);
        progression.setTempo(targetTempo);
        if (this.progressionTitleInputEl) {
            this.progressionTitleInputEl.value = styleObj.name;
        }
        if (this.tempoSliderEl) {
            this.tempoSliderEl.value = `${targetTempo}`;
        }
        if (this.tempoValueEl) {
            this.tempoValueEl.textContent = `${targetTempo} BPM`;
        }
        // Automatically generate and apply the matching Strumming Pattern for the selected Style
        const strumId = styleObj.strumPatternId || "basic";
        this.state.strumPattern = strumId;
        const sp = this.db.getStrumPattern(strumId);
        if (sp) {
            const mapped = this.mapPatternTo16Subdivisions(sp.pattern);
            this.appliedStrumSteps = [...mapped];
            this.editorStrumSteps = [...mapped];
            const activeStrum = {
                id: sp.id,
                name: sp.name,
                pattern: [...mapped],
                accent: sp.accent || [0, 4, 8, 12]
            };
            progression.setStrumPattern(activeStrum);
            try {
                localStorage.setItem("chordflow-active-strum", JSON.stringify(activeStrum));
            }
            catch {
                // Ignore
            }
            if (this.strumSelectEl) {
                this.strumSelectEl.value = sp.id;
            }
            if (this.editorStrumSelectEl) {
                this.editorStrumSelectEl.value = sp.id;
            }
            this.renderStrumTicker();
            this.renderStrumEditor();
        }
        trackEvent("generator_used", {
            style_id: styleObj.id,
            chord_count: newChords.length.toString(),
            tempo: targetTempo.toString()
        });
    }
    // --- Transposition Methods ---
    transposeProgressionBy(delta) {
        if (progression.getIsPlaying()) {
            progression.stop();
        }
        const currentChords = progression.getChords();
        if (currentChords.length === 0)
            return;
        let missingCount = 0;
        const transposedChords = currentChords.map(id => {
            const trans = this.db.transposeChord(id, delta);
            if (!trans) {
                missingCount++;
                return id;
            }
            return trans;
        });
        if (missingCount > 0) {
            this.showToast(`Warning: ${missingCount} chord(s) not found in library`);
        }
        const activeIdx = this.state.activeChordIndex;
        // Transpose active selected chord if present
        if (this.state.selectedChord) {
            const transSelected = this.db.transposeChord(this.state.selectedChord, delta);
            if (transSelected) {
                this.state.selectedChord = transSelected;
            }
        }
        // Update state transpose offset (range -12 to +12, wrapping)
        let currentOffset = this.state.transposeOffset || 0;
        let newOffset = currentOffset + delta;
        if (newOffset > 12)
            newOffset = -12 + (newOffset - 13);
        else if (newOffset < -12)
            newOffset = 12 - (-newOffset - 13);
        this.state.transposeOffset = newOffset;
        try {
            localStorage.setItem("chordflow-transpose", this.state.transposeOffset.toString());
        }
        catch {
            // Ignore
        }
        // Update progression title if auto-generated with key
        const currentTitle = progression.getTitle();
        const updatedTitle = this.transposeTitleKey(currentTitle, delta);
        if (updatedTitle !== currentTitle) {
            progression.setTitle(updatedTitle);
            if (this.progressionTitleInputEl) {
                this.progressionTitleInputEl.value = updatedTitle;
            }
        }
        // Update progression state with new chord IDs
        progression.setProgression(transposedChords, progression.getTempo(), progression.getBeatsPerChord(), updatedTitle);
        if (activeIdx >= 0 && activeIdx < transposedChords.length) {
            progression.setActiveIndex(activeIdx);
        }
        this.updateTransposeDisplay();
        this.renderProgressionCards();
        this.renderActiveChord();
        this.updateNextChordIndicator();
        const sign = delta > 0 ? "+" : "";
        const totalLabel = this.formatTransposeLabel(this.state.transposeOffset);
        this.showToast(`Transposed ${sign}${delta} semitone (${totalLabel}) 🎵`);
        trackEvent("transpose", {
            direction: delta > 0 ? "up" : "down",
            delta,
            new_offset: this.state.transposeOffset
        });
    }
    resetTranspose() {
        const currentOffset = this.state.transposeOffset || 0;
        if (currentOffset === 0) {
            this.showToast("Transposition already at original (0)");
            return;
        }
        if (progression.getIsPlaying()) {
            progression.stop();
        }
        const currentChords = progression.getChords();
        const reverseDelta = -currentOffset;
        const transposedChords = currentChords.map(id => {
            return this.db.transposeChord(id, reverseDelta) || id;
        });
        const activeIdx = this.state.activeChordIndex;
        if (this.state.selectedChord) {
            const transSelected = this.db.transposeChord(this.state.selectedChord, reverseDelta);
            if (transSelected) {
                this.state.selectedChord = transSelected;
            }
        }
        this.state.transposeOffset = 0;
        try {
            localStorage.setItem("chordflow-transpose", "0");
        }
        catch {
            // Ignore
        }
        // Reset progression title if it had key
        const currentTitle = progression.getTitle();
        const updatedTitle = this.transposeTitleKey(currentTitle, reverseDelta);
        if (updatedTitle !== currentTitle) {
            progression.setTitle(updatedTitle);
            if (this.progressionTitleInputEl) {
                this.progressionTitleInputEl.value = updatedTitle;
            }
        }
        progression.setProgression(transposedChords, progression.getTempo(), progression.getBeatsPerChord(), updatedTitle);
        if (activeIdx >= 0 && activeIdx < transposedChords.length) {
            progression.setActiveIndex(activeIdx);
        }
        this.updateTransposeDisplay();
        this.renderProgressionCards();
        this.renderActiveChord();
        this.updateNextChordIndicator();
        this.showToast("Transposition reset to original (0) ↺");
        trackEvent("transpose", {
            direction: "reset",
            delta: reverseDelta,
            new_offset: 0
        });
    }
    formatTransposeLabel(offset) {
        if (offset > 0)
            return `+${offset}`;
        return `${offset}`;
    }
    updateTransposeDisplay() {
        if (this.transposeValueDisplayEl) {
            const offset = this.state.transposeOffset || 0;
            this.transposeValueDisplayEl.textContent = this.formatTransposeLabel(offset);
            this.transposeValueDisplayEl.classList.toggle("transposed", offset !== 0);
        }
    }
    transposeTitleKey(title, delta) {
        const regex = /(\bin\s+)([A-G][#b]?)(.*)/i;
        const match = title.match(regex);
        if (match) {
            const prefix = match[1];
            const root = match[2];
            const rest = match[3];
            const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const ENHARMONIC = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#", "E#": "F", "B#": "C" };
            const normalized = ENHARMONIC[root] || root;
            const idx = NOTE_NAMES.indexOf(normalized);
            if (idx !== -1) {
                const newIdx = ((idx + delta) % 12 + 12) % 12;
                const newRoot = NOTE_NAMES[newIdx];
                return title.replace(regex, `${prefix}${newRoot}${rest}`);
            }
        }
        return title;
    }
    // private updateTuningsDropdown(): void {
    //   const inst = this.db.getInstrument(this.state.activeInstrument);
    //   this.tuningSelectEl.innerHTML = "";
    //   if (inst && inst.tunings && inst.tunings.length > 0) {
    //     inst.tunings.forEach(t => {
    //       const opt = document.createElement("option");
    //       opt.value = t.id;
    //       opt.textContent = t.name;
    //       this.tuningSelectEl.appendChild(opt);
    //     });
    //     this.tuningSelectEl.parentElement!.style.display = "block";
    //   } else {
    //     this.tuningSelectEl.parentElement!.style.display = "none";
    //   }
    // }
    updateSoundPresetsDropdown() {
        if (!this.soundPresetSelectEl)
            return;
        const presets = SOUND_PRESETS[this.state.activeInstrument] || [];
        this.soundPresetSelectEl.innerHTML = "";
        presets.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.label;
            this.soundPresetSelectEl.appendChild(opt);
        });
        this.soundPresetSelectEl.value = audio.getPreset(this.state.activeInstrument);
    }
    // --- Theme & Mode Switching ---
    setMode(mode) {
        this.state.mode = mode;
        try {
            localStorage.setItem("chordflow-mode", mode);
        }
        catch {
            // Ignore
        }
        progression.setMaxChords(mode === "clean" ? 8 : 16);
        this.applyMode(mode);
        trackEvent("mode_change", { mode });
    }
    applyMode(mode) {
        document.querySelectorAll(".mode-tab").forEach(tab => {
            tab.classList.toggle("active", tab.getAttribute("data-mode") === mode);
        });
        const isAdvanced = mode === "advanced";
        this.appRoot.classList.toggle("mode-advanced", isAdvanced);
        this.appRoot.classList.toggle("mode-clean", !isAdvanced);
        if (this.strumEditorContainerEl) {
            this.strumEditorContainerEl.style.display = isAdvanced ? "block" : "none";
        }
        const soundGroup = document.querySelector(".sound-preset-group");
        if (soundGroup) {
            soundGroup.style.display = isAdvanced ? "block" : "none";
        }
        const audioSliders = document.querySelector(".custom-audio-sliders-panel");
        if (audioSliders) {
            audioSliders.style.display = isAdvanced ? "block" : "none";
        }
        this.renderActiveChord();
        this.renderProgressionCards();
        this.renderStrumTicker();
    }
    setTheme(theme) {
        this.state.theme = theme;
        let effectiveTheme = theme;
        if (theme === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        try {
            localStorage.setItem("chordflow-theme", effectiveTheme);
        }
        catch {
            // Ignore
        }
        this.applyTheme(effectiveTheme);
    }
    applyTheme(theme) {
        let effectiveTheme = theme;
        if (theme === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", effectiveTheme);
        const themeBtn = document.getElementById("btn-theme-toggle");
        if (themeBtn) {
            themeBtn.innerHTML = effectiveTheme === "dark" ? "🌙" : "☀️";
            themeBtn.setAttribute("title", `Theme: ${effectiveTheme}`);
        }
        this.renderActiveChord();
    }
    setInstrument(inst) {
        this.state.activeInstrument = inst;
        progression.setInstrument(inst);
        document.querySelectorAll(".instrument-tab").forEach(tab => {
            tab.classList.toggle("active", tab.getAttribute("data-instrument") === inst);
        });
        // Capo control group (Guitar, Ukulele, Guitalele)
        const capoRow = document.getElementById("capo-control-group");
        if (capoRow) {
            capoRow.style.display = (inst === "guitar" || inst === "ukulele" || inst === "guitalele") ? "flex" : "none";
        }
        // this.updateTuningsDropdown();
        this.updateSoundPresetsDropdown();
        this.updateAudioSliders();
        this.renderActiveChord();
        this.renderProgressionCards();
        trackEvent("instrument_change", { instrument: inst });
    }
    setDisplayView(view) {
        this.state.displayView = view;
        this.viewChordBtnEl?.classList.toggle("active", view === "chord");
        this.viewNotesBtnEl?.classList.toggle("active", view === "notes");
        this.renderActiveChord();
    }
    selectChord(chordId, updateActiveProgressionSlot = true) {
        this.state.selectedChord = chordId;
        this.state.selectedInversionIndex = 0;
        // Update currently active chord slot in progression if enabled
        if (updateActiveProgressionSlot && this.state.progression.length > 0) {
            const activeIdx = this.state.activeChordIndex;
            if (activeIdx >= 0 && activeIdx < this.state.progression.length) {
                progression.setChordAt(activeIdx, chordId);
            }
        }
        this.renderActiveChord();
        this.playActiveChord();
    }
    addChordToProgression(chordId) {
        const success = progression.addChord(chordId);
        if (!success) {
            if (this.state.mode === "clean") {
                alert("Progression limit reached (maximum 8 chords in Clean mode). Switch to Advanced mode for up to 16 chords.");
            }
            else {
                alert("Progression limit reached (maximum 16 chords).");
            }
        }
        else {
            this.state.selectedChord = chordId;
            this.state.selectedInversionIndex = 0;
            this.renderActiveChord();
            this.playActiveChord();
        }
    }
    // --- Rendering Functions ---
    renderActiveChord() {
        const chordId = this.state.selectedChord || this.state.progression[this.state.activeChordIndex] || "Cmaj";
        const chord = this.db.getChordById(chordId) || this.db.getAllChords()[0];
        if (!chord)
            return;
        // Chord Title & Subtitle
        this.chordTitleEl.textContent = chord.symbol;
        let capoInfo = "";
        if (this.state.capo > 0 && (this.state.activeInstrument === "guitar" || this.state.activeInstrument === "ukulele" || this.state.activeInstrument === "guitalele")) {
            const soundingRoot = getCapoSoundingRoot(chord.root, this.state.capo);
            capoInfo = ` • Sounds as ${soundingRoot}${chord.symbol.replace(chord.root, "")} (Capo ${this.state.capo})`;
        }
        this.chordSubtitleEl.textContent = `${chord.name}${capoInfo}`;
        this.chordNotesEl.textContent = `Notes: ${chord.notes.join(" - ")} | Scale: ${chord.scale}`;
        // Update Progression Generator target badge & Modal Target
        if (this.generatorTargetEl) {
            this.generatorTargetEl.textContent = `${chord.name} (${chord.symbol})`;
        }
        if (this.generatorModalTargetChordEl) {
            this.generatorModalTargetChordEl.textContent = `${chord.name} (${chord.symbol})`;
        }
        if (this.generatorStylesModalEl && this.generatorStylesModalEl.style.display !== "none") {
            this.renderGeneratorStylesModal();
        }
        // Populate Voicings Dropdown
        this.populateVoicingsDropdown(chord);
        // Inversions
        this.renderInversionPills(chord);
        // Get tuning strings if applicable
        let tuningStrings;
        const instObj = this.db.getInstrument(this.state.activeInstrument);
        if (instObj?.tunings) {
            const activeTuning = instObj.tunings.find(t => t.id === this.state.tuning) || instObj.tunings[0];
            tuningStrings = activeTuning?.strings;
        }
        // Render Canvas Diagram
        const isDark = document.documentElement.getAttribute("data-theme") !== "light";
        diagrams.render(this.mainCanvas, chord, this.state.activeInstrument, {
            capo: this.state.capo,
            tuningStrings,
            toggles: this.state.toggles,
            theme: isDark ? "dark" : "light",
            inversionIndex: this.state.selectedInversionIndex,
            voicingId: this.state.selectedVoicingId || "open",
            viewMode: this.state.displayView || "chord"
        });
    }
    populateVoicingsDropdown(chord) {
        if (!this.voicingSelectEl)
            return;
        this.voicingSelectEl.innerHTML = "";
        const voicings = chord.voicings?.map(v => ({ id: v.id, label: v.label })) || [
            { id: "open", label: "Open Position" },
            { id: "barre_e", label: "Barre (E-Shape)" },
            { id: "barre_a", label: "Barre (A-Shape)" },
            { id: "spread", label: "Spread / Jazz Voicing" }
        ];
        voicings.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.id;
            opt.textContent = v.label;
            this.voicingSelectEl.appendChild(opt);
        });
        if (this.state.selectedVoicingId) {
            this.voicingSelectEl.value = this.state.selectedVoicingId;
        }
    }
    renderInversionPills(chord) {
        if (!this.inversionContainerEl)
            return;
        if (!this.state.toggles.showInversions || this.state.mode === "clean" || !chord.inversions || chord.inversions.length <= 1) {
            this.inversionContainerEl.style.display = "none";
            return;
        }
        this.inversionContainerEl.style.display = "flex";
        this.inversionContainerEl.innerHTML = "";
        chord.inversions.forEach((inv, idx) => {
            const pill = document.createElement("button");
            pill.className = `inversion-pill ${idx === this.state.selectedInversionIndex ? "active" : ""}`;
            pill.textContent = inv.label;
            pill.addEventListener("click", () => {
                this.state.selectedInversionIndex = idx;
                this.renderActiveChord();
                this.playActiveChord();
            });
            this.inversionContainerEl.appendChild(pill);
        });
    }
    renderProgressionCards() {
        const chords = progression.getChords();
        const maxChords = this.state.mode === "clean" ? 8 : 16;
        this.progressionCardsEl.innerHTML = "";
        // Update counter badge
        if (this.progressionCounterBadgeEl) {
            this.progressionCounterBadgeEl.textContent = `${chords.length} / ${maxChords}`;
        }
        chords.forEach((chordId, index) => {
            const chord = this.db.getChordById(chordId);
            const isActive = index === this.state.activeChordIndex;
            const isNext = index === progression.getNextIndex() && chords.length > 1;
            const card = document.createElement("div");
            card.className = `prog-card ${isActive ? "active" : ""} ${isNext ? "is-next" : ""}`;
            card.setAttribute("data-index", `${index}`);
            let scaleDegreeBadge = "";
            if (this.state.toggles.showScaleDegrees && this.state.mode === "advanced") {
                const keyRoot = chords[0] ? (this.db.getChordById(chords[0])?.root || "C") : "C";
                const degree = getScaleDegree(chord?.root || "C", keyRoot);
                scaleDegreeBadge = `<span class="prog-degree">${degree}</span>`;
            }
            card.innerHTML = `
        <div class="prog-card-header">
          <span class="prog-index">#${index + 1}</span>
          ${scaleDegreeBadge}
          <button class="prog-remove-btn" title="Remove chord" data-remove="${index}">✕</button>
        </div>
        <div class="prog-card-body">
          <div class="prog-symbol">${chord?.symbol || chordId}</div>
          <div class="prog-name">${chord?.name || ""}</div>
        </div>
        <div class="prog-card-footer">
          <button class="prog-move-btn" title="Move Left" data-move-left="${index}" ${index === 0 ? "disabled" : ""}>◀</button>
          <button class="prog-play-card-btn" title="Play Chord" data-play="${chordId}">▶</button>
          <button class="prog-move-btn" title="Move Right" data-move-right="${index}" ${index === chords.length - 1 ? "disabled" : ""}>▶</button>
        </div>
      `;
            card.addEventListener("click", (e) => {
                const target = e.target;
                if (target.closest(".prog-remove-btn") || target.closest(".prog-move-btn") || target.closest(".prog-play-card-btn")) {
                    return;
                }
                progression.setActiveIndex(index);
                this.selectChord(chordId, false);
            });
            card.querySelector("[data-remove]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.removeChord(index);
            });
            card.querySelector("[data-move-left]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.moveChord(index, index - 1);
            });
            card.querySelector("[data-move-right]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.moveChord(index, index + 1);
            });
            card.querySelector("[data-play]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.playChordById(chordId);
            });
            this.progressionCardsEl.appendChild(card);
        });
        // Add "+" Card at end if below max limit
        if (chords.length < maxChords) {
            const addCard = document.createElement("button");
            addCard.className = "prog-add-card";
            addCard.innerHTML = `<span class="add-icon">+</span><span>Add Chord</span>`;
            addCard.addEventListener("click", () => {
                const currentSelected = this.state.selectedChord || "Cmaj";
                this.addChordToProgression(currentSelected);
            });
            this.progressionCardsEl.appendChild(addCard);
        }
    }
    highlightActiveProgressionCard(activeIndex) {
        const cards = this.progressionCardsEl.querySelectorAll(".prog-card");
        cards.forEach((c, idx) => {
            c.classList.toggle("active", idx === activeIndex);
            c.classList.toggle("is-next", idx === progression.getNextIndex() && cards.length > 1);
        });
        const activeEl = cards[activeIndex];
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }
    updateNextChordIndicator() {
        const chords = progression.getChords();
        if (chords.length <= 1) {
            this.nextChordEl.innerHTML = `<span class="next-label">Next Chord:</span> <span class="next-name">--</span>`;
            return;
        }
        const nextIdx = progression.getNextIndex();
        const nextChordId = chords[nextIdx];
        const nextChord = this.db.getChordById(nextChordId);
        this.nextChordEl.innerHTML = `
      <span class="next-badge">Next →</span>
      <span class="next-symbol">${nextChord?.symbol || nextChordId}</span>
      <span class="next-name">${nextChord?.name || ""}</span>
    `;
    }
    renderChordGrid() {
        const activeRootPill = this.rootFilterEl.querySelector(".root-pill.active");
        const root = activeRootPill?.getAttribute("data-root") || "all";
        const quality = this.qualityFilterEl.value;
        const query = this.searchInputEl.value;
        const filtered = this.db.filterChords(root, quality, query);
        this.chordGridEl.innerHTML = "";
        if (filtered.length === 0) {
            this.chordGridEl.innerHTML = '<div class="no-chords">No chords found matching criteria.</div>';
            return;
        }
        filtered.forEach(chord => {
            const card = document.createElement("div");
            card.className = `lib-chord-card ${chord.id === this.state.selectedChord ? "selected" : ""}`;
            card.innerHTML = `
        <div class="lib-chord-symbol">${chord.symbol}</div>
        <div class="lib-chord-name">${chord.name}</div>
        <button class="lib-add-btn" title="Add to Progression" data-add="${chord.id}">+</button>
      `;
            card.addEventListener("click", (e) => {
                const target = e.target;
                if (target.closest(".lib-add-btn"))
                    return;
                this.selectChord(chord.id);
                this.renderChordGrid();
            });
            card.querySelector(".lib-add-btn")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.addChordToProgression(chord.id);
            });
            this.chordGridEl.appendChild(card);
        });
    }
    renderStrumTicker() {
        if (!this.strumTickerEl)
            return;
        if (!this.state.toggles.showStrum) {
            this.strumTickerEl.style.display = "none";
            return;
        }
        this.strumTickerEl.style.display = "flex";
        const pattern = this.appliedStrumSteps.length === 16
            ? this.appliedStrumSteps
            : (progression.getActiveStrumPattern()?.pattern || this.mapPatternTo16Subdivisions(["D", "", "D", "U", "D", "", "D", "U"]));
        this.strumTickerEl.innerHTML = "";
        pattern.forEach((stroke, i) => {
            const beatBox = document.createElement("div");
            const isAccent = (i % 4 === 0);
            const isRest = !stroke || stroke === "" || stroke === "rest";
            beatBox.className = `strum-beat ${isAccent ? "accent" : ""} ${!isRest ? "has-stroke" : "empty"}`;
            beatBox.setAttribute("data-strum-step", `${i}`);
            let arrow = "·";
            let label = "Rest";
            if (stroke === "D") {
                arrow = "↓";
                label = "D";
            }
            else if (stroke === "U") {
                arrow = "↑";
                label = "U";
            }
            else if (stroke === "D+U") {
                arrow = "↓↑";
                label = "D+U";
            }
            beatBox.innerHTML = `
        <span class="strum-arrow">${arrow}</span>
        <span class="strum-label">${label}</span>
      `;
            this.strumTickerEl.appendChild(beatBox);
        });
    }
    renderStrumEditor() {
        if (!this.strumEditorGridEl)
            return;
        this.strumEditorGridEl.innerHTML = "";
        this.editorStrumSteps.forEach((step, idx) => {
            const cell = document.createElement("button");
            const isRest = !step || step === "" || step === "rest";
            cell.className = `strum-editor-cell ${!isRest ? "active" : ""}`;
            cell.type = "button";
            cell.setAttribute("data-slot", `${idx}`);
            let symbol = "·";
            if (step === "D")
                symbol = "↓ D";
            else if (step === "U")
                symbol = "↑ U";
            else if (step === "D+U")
                symbol = "↓↑ D+U";
            cell.innerHTML = `
        <span class="cell-num">${idx + 1}</span>
        <span class="cell-val">${symbol}</span>
      `;
            cell.addEventListener("click", () => {
                // Cycle: "" (Rest) -> "D" -> "U" -> "D+U" -> ""
                const nextMap = { "": "D", "D": "U", "U": "D+U", "D+U": "" };
                this.editorStrumSteps[idx] = nextMap[this.editorStrumSteps[idx] || ""] || "";
                this.renderStrumEditor();
            });
            this.strumEditorGridEl.appendChild(cell);
        });
    }
    animateBeat(beat, isAccent) {
        const metroDot = document.getElementById("metronome-pulse-indicator");
        if (metroDot) {
            metroDot.classList.add("pulse");
            if (isAccent)
                metroDot.classList.add("accent");
            setTimeout(() => {
                metroDot.classList.remove("pulse", "accent");
            }, 120);
        }
        const strumBeats = this.strumTickerEl.querySelectorAll(".strum-beat");
        if (strumBeats.length > 0) {
            const beatsPerChord = progression.getBeatsPerChord() || 4;
            const subsPerBeat = Math.max(1, Math.round(strumBeats.length / beatsPerChord));
            const tempo = progression.getTempo();
            const subIntervalMs = (60000 / tempo) / subsPerBeat;
            for (let s = 0; s < subsPerBeat; s++) {
                const slotIndex = (beat * subsPerBeat + s) % strumBeats.length;
                setTimeout(() => {
                    if (this.state.isPlaying) {
                        strumBeats.forEach((b, idx) => {
                            b.classList.toggle("current", idx === slotIndex);
                        });
                    }
                }, s * subIntervalMs);
            }
        }
    }
    updatePlayButton() {
        if (this.playBtnEl) {
            this.playBtnEl.classList.toggle("playing", this.state.isPlaying);
            this.playBtnEl.innerHTML = this.state.isPlaying
                ? '<span class="btn-icon">⏸</span><span>Pause</span>'
                : '<span class="btn-icon">▶</span><span>Play</span>';
        }
    }
    playActiveChord() {
        const chordId = this.state.selectedChord || this.state.progression[this.state.activeChordIndex] || "Cmaj";
        this.playChordById(chordId);
    }
    playChordById(chordId, direction = "down") {
        const chord = this.db.getChordById(chordId);
        if (!chord)
            return;
        let notes = [];
        switch (this.state.activeInstrument) {
            case "piano":
                notes = chord.instruments.piano?.keys || [60, 64, 67];
                break;
            case "guitar": {
                const frets = chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];
                const openStrings = [40, 45, 50, 55, 59, 64];
                frets.forEach((f, idx) => {
                    if (f >= 0)
                        notes.push(openStrings[idx] + f + this.state.capo);
                });
                break;
            }
            case "ukulele": {
                const frets = chord.instruments.ukulele?.frets || [0, 0, 0, 0];
                const openStrings = [67, 60, 64, 69];
                frets.forEach((f, idx) => {
                    if (f >= 0)
                        notes.push(openStrings[idx] + f + this.state.capo);
                });
                break;
            }
            case "guitalele": {
                const frets = chord.instruments.guitalele?.frets || [0, 0, 2, 2, 2, 0];
                const openStrings = [45, 50, 55, 60, 64, 69];
                frets.forEach((f, idx) => {
                    if (f >= 0)
                        notes.push(openStrings[idx] + f + this.state.capo);
                });
                break;
            }
            case "violin": {
                if (chord.instruments.violin?.doubleStops && chord.instruments.violin.doubleStops.length > 0) {
                    const ds = chord.instruments.violin.doubleStops[0];
                    const openStrings = [55, 62, 69, 76];
                    notes = [openStrings[0] + (ds[0] >= 0 ? ds[0] : 0), openStrings[1] + (ds[1] >= 0 ? ds[1] : 0)];
                }
                else {
                    notes = chord.instruments.violin?.notes || [60, 64, 67];
                }
                break;
            }
            case "bass": {
                if (chord.instruments.bass?.notes && chord.instruments.bass.notes.length > 0) {
                    notes = chord.instruments.bass.notes;
                }
                else {
                    const frets = chord.instruments.bass?.frets || [0, -1, -1, -1];
                    const openStrings = [28, 33, 38, 43];
                    frets.forEach((f, idx) => {
                        if (f >= 0)
                            notes.push(openStrings[idx] + f);
                    });
                    if (notes.length === 0)
                        notes = [28, 35];
                }
                break;
            }
            case "harmonica":
                notes = [60, 64, 67];
                break;
        }
        if (this.state.activeInstrument === "harmonica") {
            notes.forEach((n, idx) => {
                audio.playNote(n, "harmonica", audio.getCurrentTime() + idx * 0.12, 0.8);
            });
        }
        else {
            audio.playChord(notes, this.state.activeInstrument, undefined, true, direction);
        }
        trackEvent("play_chord", {
            chord: chordId,
            instrument: this.state.activeInstrument,
            direction
        });
        const btn = document.getElementById("btn-play-active-chord");
        if (btn) {
            btn.classList.add("btn-pressed");
            setTimeout(() => btn.classList.remove("btn-pressed"), 200);
        }
    }
    showToast(message, durationMs = 2500) {
        if (!this.toastEl)
            return;
        this.toastEl.textContent = message;
        this.toastEl.style.display = "block";
        this.toastEl.classList.add("toast-show");
        setTimeout(() => {
            this.toastEl.classList.remove("toast-show");
            setTimeout(() => {
                this.toastEl.style.display = "none";
            }, 300);
        }, durationMs);
    }
    createRippleEffect(x, y) {
        const ripple = document.createElement("div");
        ripple.className = "tap-ripple";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 500);
    }
}
//# sourceMappingURL=ui.js.map