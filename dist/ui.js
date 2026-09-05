import { getCapoSoundingRoot, getScaleDegree } from "./chord.js";
import { audio } from "./audio.js";
import { diagrams } from "./diagrams.js";
import { progression } from "./progression.js";
import { circleOfFifths } from "./circle.js";
import { exporter } from "./export.js";
export class UIManager {
    constructor(db, initialState) {
        this.db = db;
        this.state = initialState;
    }
    init() {
        this.cacheElements();
        this.bindEvents();
        this.populateFiltersAndPresets();
        this.applyTheme(this.state.theme);
        this.applyMode(this.state.mode);
        this.renderActiveChord();
        this.renderProgressionCards();
        this.renderChordGrid();
        this.renderStrumTicker();
        // Initialize Circle of Fifths
        circleOfFifths.init("circle-of-fifths-container", (chordId) => {
            this.selectChord(chordId);
        }, (chordId) => {
            this.addChordToProgression(chordId);
        });
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
        this.mainCanvas = document.getElementById("main-diagram-canvas");
        this.chordTitleEl = document.getElementById("active-chord-title");
        this.chordSubtitleEl = document.getElementById("active-chord-subtitle");
        this.chordNotesEl = document.getElementById("active-chord-notes");
        this.nextChordEl = document.getElementById("next-chord-preview");
        this.progressionCardsEl = document.getElementById("progression-cards-strip");
        this.chordGridEl = document.getElementById("chord-library-grid");
        this.rootFilterEl = document.getElementById("root-filter-container");
        this.qualityFilterEl = document.getElementById("quality-filter-select");
        this.searchInputEl = document.getElementById("chord-search-input");
        this.capoSliderEl = document.getElementById("capo-slider");
        this.capoValueEl = document.getElementById("capo-value-display");
        this.tuningSelectEl = document.getElementById("tuning-select");
        this.strumSelectEl = document.getElementById("strum-pattern-select");
        this.strumTickerEl = document.getElementById("strum-visualizer-ticker");
        this.tempoSliderEl = document.getElementById("tempo-slider");
        this.tempoValueEl = document.getElementById("tempo-value-display");
        this.playBtnEl = document.getElementById("btn-play-progression");
        this.loopBtnEl = document.getElementById("btn-toggle-loop");
        this.metronomeBtnEl = document.getElementById("btn-toggle-metronome");
        this.presetSelectEl = document.getElementById("preset-progression-select");
        this.inversionContainerEl = document.getElementById("inversion-pills-container");
        this.advancedDrawerEl = document.getElementById("advanced-settings-drawer");
    }
    bindEvents() {
        // Mode toggle
        document.querySelectorAll(".mode-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                const mode = tab.getAttribute("data-mode");
                this.setMode(mode);
            });
        });
        // Theme toggle
        document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
            const nextTheme = this.state.theme === "dark" ? "light" : this.state.theme === "light" ? "system" : "dark";
            this.setTheme(nextTheme);
        });
        // Instrument segmented tabs
        document.querySelectorAll(".instrument-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                const inst = tab.getAttribute("data-instrument");
                this.setInstrument(inst);
            });
        });
        // Play Chord Button
        document.getElementById("btn-play-active-chord")?.addEventListener("click", () => {
            this.playActiveChord();
        });
        // Progression Playback Controls
        this.playBtnEl?.addEventListener("click", () => {
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
        // Capo Slider
        this.capoSliderEl?.addEventListener("input", () => {
            const capo = parseInt(this.capoSliderEl.value, 10);
            this.state.capo = capo;
            this.capoValueEl.textContent = capo === 0 ? "None (0)" : `Fret ${capo}`;
            this.renderActiveChord();
        });
        // Tuning Select
        this.tuningSelectEl?.addEventListener("change", () => {
            this.state.tuning = this.tuningSelectEl.value;
            this.renderActiveChord();
        });
        // Strum Pattern Select
        this.strumSelectEl?.addEventListener("change", () => {
            this.state.strumPattern = this.strumSelectEl.value;
            const pattern = this.db.getStrumPattern(this.state.strumPattern);
            progression.setStrumPattern(pattern || null);
            this.renderStrumTicker();
        });
        // Preset Progressions Select
        this.presetSelectEl?.addEventListener("change", () => {
            const presetId = this.presetSelectEl.value;
            if (presetId) {
                const p = this.db.getProgression(presetId);
                if (p) {
                    progression.setProgression(p.chords, p.tempo, p.beatsPerChord);
                    if (p.strumPatternId) {
                        this.strumSelectEl.value = p.strumPatternId;
                        this.state.strumPattern = p.strumPatternId;
                        progression.setStrumPattern(this.db.getStrumPattern(p.strumPatternId) || null);
                        this.renderStrumTicker();
                    }
                }
            }
        });
        // Search and Quality Filter
        this.searchInputEl?.addEventListener("input", () => {
            this.renderChordGrid();
        });
        this.qualityFilterEl?.addEventListener("change", () => {
            this.renderChordGrid();
        });
        // Interactive Canvas Note Clicking
        const handleCanvasClick = (e) => {
            const target = diagrams.getClickTarget(this.mainCanvas, e);
            if (target) {
                audio.playNote(target.midi, target.instrument, undefined, 1.2);
                this.createRippleEffect(e.clientX, e.clientY);
            }
        };
        this.mainCanvas?.addEventListener("click", handleCanvasClick);
        // Advanced Toggles
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
                const circleSection = document.getElementById("circle-section");
                if (circleSection) {
                    circleSection.style.display = this.state.toggles.showCircle ? "block" : "none";
                }
            });
        });
        // Export Buttons
        document.getElementById("btn-export-json")?.addEventListener("click", () => {
            exporter.exportJSON(this.state);
        });
        document.getElementById("btn-export-png")?.addEventListener("click", () => {
            const chordObjs = this.state.progression
                .map(id => this.db.getChordById(id))
                .filter((c) => Boolean(c));
            const strum = this.db.getStrumPattern(this.state.strumPattern || "");
            exporter.exportPNG(this.state, chordObjs, strum);
        });
        document.getElementById("btn-export-pdf")?.addEventListener("click", () => {
            const chordObjs = this.state.progression
                .map(id => this.db.getChordById(id))
                .filter((c) => Boolean(c));
            const strum = this.db.getStrumPattern(this.state.strumPattern || "");
            exporter.exportPDF(this.state, chordObjs, strum);
        });
        // Import Button & Hidden File Picker
        const fileInput = document.getElementById("json-file-input");
        document.getElementById("btn-import-json")?.addEventListener("click", () => {
            fileInput.click();
        });
        fileInput?.addEventListener("change", async () => {
            if (fileInput.files && fileInput.files[0]) {
                try {
                    const imported = await exporter.importJSON(fileInput.files[0]);
                    progression.setProgression(imported.progression, imported.tempo);
                    if (imported.activeInstrument)
                        this.setInstrument(imported.activeInstrument);
                    if (typeof imported.capo === "number") {
                        this.state.capo = imported.capo;
                        this.capoSliderEl.value = `${imported.capo}`;
                        this.capoValueEl.textContent = imported.capo === 0 ? "None (0)" : `Fret ${imported.capo}`;
                    }
                    alert("Progression imported successfully!");
                }
                catch (err) {
                    alert(`Import failed: ${err.message}`);
                }
                fileInput.value = "";
            }
        });
        // Global Keyboard Shortcuts
        window.addEventListener("keydown", (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)
                return;
            if (e.code === "Space") {
                e.preventDefault();
                progression.togglePlay();
            }
            else if (e.code === "Enter") {
                e.preventDefault();
                this.playActiveChord();
            }
            else if (e.code === "ArrowLeft") {
                e.preventDefault();
                const prevIdx = (this.state.activeChordIndex - 1 + this.state.progression.length) % this.state.progression.length;
                progression.setActiveIndex(prevIdx);
            }
            else if (e.code === "ArrowRight") {
                e.preventDefault();
                const nextIdx = (this.state.activeChordIndex + 1) % this.state.progression.length;
                progression.setActiveIndex(nextIdx);
            }
        });
        // Responsive window resize
        window.addEventListener("resize", () => {
            this.renderActiveChord();
        });
    }
    populateFiltersAndPresets() {
        // 1. Root pills
        const roots = ["All", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
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
        // 2. Strum patterns
        const strums = this.db.getStrumPatterns();
        this.strumSelectEl.innerHTML = "";
        strums.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.pattern.filter(Boolean).join(" ")})`;
            this.strumSelectEl.appendChild(opt);
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
        // 4. Tunings
        this.updateTuningsDropdown();
    }
    updateTuningsDropdown() {
        const inst = this.db.getInstrument(this.state.activeInstrument);
        this.tuningSelectEl.innerHTML = "";
        if (inst && inst.tunings && inst.tunings.length > 0) {
            inst.tunings.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.id;
                opt.textContent = t.name;
                this.tuningSelectEl.appendChild(opt);
            });
            this.tuningSelectEl.parentElement.style.display = "block";
        }
        else {
            this.tuningSelectEl.parentElement.style.display = "none";
        }
    }
    // --- Theme & Mode Switching ---
    setMode(mode) {
        this.state.mode = mode;
        this.applyMode(mode);
    }
    applyMode(mode) {
        document.querySelectorAll(".mode-tab").forEach(tab => {
            tab.classList.toggle("active", tab.getAttribute("data-mode") === mode);
        });
        const isAdvanced = mode === "advanced";
        this.appRoot.classList.toggle("mode-advanced", isAdvanced);
        this.appRoot.classList.toggle("mode-clean", !isAdvanced);
        if (this.advancedDrawerEl) {
            this.advancedDrawerEl.style.display = isAdvanced ? "block" : "none";
        }
        const circleSection = document.getElementById("circle-section");
        if (circleSection) {
            circleSection.style.display = isAdvanced && this.state.toggles.showCircle ? "block" : "none";
        }
        const controlsSection = document.getElementById("advanced-controls-bar");
        if (controlsSection) {
            controlsSection.style.display = isAdvanced ? "grid" : "none";
        }
        this.renderActiveChord();
        this.renderProgressionCards();
        this.renderStrumTicker();
    }
    setTheme(theme) {
        this.state.theme = theme;
        this.applyTheme(theme);
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
            themeBtn.setAttribute("title", `Theme: ${theme}`);
        }
        this.renderActiveChord();
    }
    setInstrument(inst) {
        this.state.activeInstrument = inst;
        progression.setInstrument(inst);
        document.querySelectorAll(".instrument-tab").forEach(tab => {
            tab.classList.toggle("active", tab.getAttribute("data-instrument") === inst);
        });
        // Hide or show Capo control (only Guitar and Ukulele)
        const capoRow = document.getElementById("capo-control-group");
        if (capoRow) {
            capoRow.style.display = (inst === "guitar" || inst === "ukulele") ? "flex" : "none";
        }
        this.updateTuningsDropdown();
        this.renderActiveChord();
        this.renderProgressionCards();
    }
    selectChord(chordId) {
        this.state.selectedChord = chordId;
        this.state.selectedInversionIndex = 0;
        this.renderActiveChord();
        this.playActiveChord();
    }
    addChordToProgression(chordId) {
        const success = progression.addChord(chordId);
        if (!success) {
            alert("Progression limit reached (maximum 7 chords).");
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
        if (this.state.capo > 0 && (this.state.activeInstrument === "guitar" || this.state.activeInstrument === "ukulele")) {
            const soundingRoot = getCapoSoundingRoot(chord.root, this.state.capo);
            capoInfo = ` • Sounds as ${soundingRoot}${chord.symbol.replace(chord.root, "")} (Capo ${this.state.capo})`;
        }
        this.chordSubtitleEl.textContent = `${chord.name}${capoInfo}`;
        this.chordNotesEl.textContent = `Notes: ${chord.notes.join(" - ")} | Scale: ${chord.scale}`;
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
            inversionIndex: this.state.selectedInversionIndex
        });
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
        this.progressionCardsEl.innerHTML = "";
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
            // Select and highlight on card click
            card.addEventListener("click", (e) => {
                const target = e.target;
                if (target.closest(".prog-remove-btn") || target.closest(".prog-move-btn") || target.closest(".prog-play-card-btn")) {
                    return;
                }
                progression.setActiveIndex(index);
                this.selectChord(chordId);
            });
            // Remove button
            card.querySelector("[data-remove]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.removeChord(index);
            });
            // Move left
            card.querySelector("[data-move-left]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.moveChord(index, index - 1);
            });
            // Move right
            card.querySelector("[data-move-right]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                progression.moveChord(index, index + 1);
            });
            // Play card
            card.querySelector("[data-play]")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.playChordById(chordId);
            });
            this.progressionCardsEl.appendChild(card);
        });
        // Add "+" Card at end if < 7 chords
        if (chords.length < 7) {
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
        // Smooth scroll active card into view on mobile
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
        if (!this.state.toggles.showStrum || this.state.mode === "clean") {
            this.strumTickerEl.style.display = "none";
            return;
        }
        this.strumTickerEl.style.display = "flex";
        const pattern = this.db.getStrumPattern(this.state.strumPattern || "");
        if (!pattern)
            return;
        this.strumTickerEl.innerHTML = "";
        pattern.pattern.forEach((stroke, i) => {
            const beatBox = document.createElement("div");
            const isAccent = pattern.accent?.includes(i);
            beatBox.className = `strum-beat ${isAccent ? "accent" : ""} ${stroke ? "has-stroke" : "empty"}`;
            beatBox.setAttribute("data-strum-step", `${i}`);
            beatBox.innerHTML = `
        <span class="strum-arrow">${stroke === "D" ? "↓" : stroke === "U" ? "↑" : "•"}</span>
        <span class="strum-label">${stroke || "-"}</span>
      `;
            this.strumTickerEl.appendChild(beatBox);
        });
    }
    animateBeat(beat, isAccent) {
        // Pulse metronome indicator
        const metroDot = document.getElementById("metronome-pulse-indicator");
        if (metroDot) {
            metroDot.classList.add("pulse");
            if (isAccent)
                metroDot.classList.add("accent");
            setTimeout(() => {
                metroDot.classList.remove("pulse", "accent");
            }, 120);
        }
        // Pulse strum visualizer beat
        const strumBeats = this.strumTickerEl.querySelectorAll(".strum-beat");
        const targetIdx = (beat * 2) % (strumBeats.length || 1);
        strumBeats.forEach((b, idx) => {
            b.classList.toggle("current", idx === targetIdx || idx === targetIdx + 1);
        });
    }
    updatePlayButton() {
        if (this.playBtnEl) {
            this.playBtnEl.classList.toggle("playing", this.state.isPlaying);
            this.playBtnEl.innerHTML = this.state.isPlaying
                ? '<span class="btn-icon">⏸</span><span>Pause</span>'
                : '<span class="btn-icon">▶</span><span>Play Progression</span>';
        }
    }
    playActiveChord() {
        const chordId = this.state.selectedChord || this.state.progression[this.state.activeChordIndex] || "Cmaj";
        this.playChordById(chordId);
    }
    playChordById(chordId) {
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
            case "harmonica":
                notes = [60, 64, 67];
                break;
        }
        audio.playChord(notes, this.state.activeInstrument, undefined, true);
        // Visual press animation on play button
        const btn = document.getElementById("btn-play-active-chord");
        if (btn) {
            btn.classList.add("btn-pressed");
            setTimeout(() => btn.classList.remove("btn-pressed"), 200);
        }
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