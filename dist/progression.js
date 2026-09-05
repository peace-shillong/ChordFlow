import { audio } from "./audio.js";
export class ProgressionManager {
    constructor() {
        this.chords = ["Cmaj", "Gmaj", "Amin", "Fmaj"];
        this.activeIndex = 0;
        this.tempo = 120;
        this.beatsPerChord = 4;
        this.isPlaying = false;
        this.isLooping = true;
        this.isMetronomeEnabled = true;
        this.timerId = null;
        this.nextBeatTime = 0;
        this.currentBeatInChord = 0;
        this.listeners = new Set();
        this.db = null;
        this.activeInstrument = "guitar";
        this.activeStrumPattern = null;
        this.loadFromStorage();
    }
    setDatabase(db) {
        this.db = db;
    }
    setInstrument(inst) {
        this.activeInstrument = inst;
    }
    setStrumPattern(pattern) {
        this.activeStrumPattern = pattern;
    }
    addListener(listener) {
        this.listeners.add(listener);
    }
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    getChords() {
        return [...this.chords];
    }
    getActiveIndex() {
        return this.activeIndex;
    }
    getNextIndex() {
        if (this.chords.length === 0)
            return 0;
        return (this.activeIndex + 1) % this.chords.length;
    }
    getTempo() {
        return this.tempo;
    }
    setTempo(bpm) {
        this.tempo = Math.max(40, Math.min(240, bpm));
    }
    getBeatsPerChord() {
        return this.beatsPerChord;
    }
    setBeatsPerChord(beats) {
        this.beatsPerChord = Math.max(1, Math.min(8, beats));
    }
    getIsPlaying() {
        return this.isPlaying;
    }
    getIsLooping() {
        return this.isLooping;
    }
    toggleLoop() {
        this.isLooping = !this.isLooping;
        return this.isLooping;
    }
    toggleMetronome() {
        this.isMetronomeEnabled = !this.isMetronomeEnabled;
        return this.isMetronomeEnabled;
    }
    addChord(chordId) {
        if (this.chords.length >= 7) {
            return false; // Spec: 4-7 chords
        }
        this.chords.push(chordId);
        this.saveToStorage();
        this.notifyListChange();
        return true;
    }
    removeChord(index) {
        if (this.chords.length <= 1) {
            return false;
        }
        this.chords.splice(index, 1);
        if (this.activeIndex >= this.chords.length) {
            this.activeIndex = Math.max(0, this.chords.length - 1);
        }
        this.saveToStorage();
        this.notifyListChange();
        this.notifyChordChange();
        return true;
    }
    moveChord(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.chords.length || toIndex < 0 || toIndex >= this.chords.length) {
            return;
        }
        const [moved] = this.chords.splice(fromIndex, 1);
        this.chords.splice(toIndex, 0, moved);
        if (this.activeIndex === fromIndex) {
            this.activeIndex = toIndex;
        }
        this.saveToStorage();
        this.notifyListChange();
    }
    setProgression(chords, tempo, beatsPerChord) {
        this.chords = chords.slice(0, 7);
        if (tempo)
            this.tempo = tempo;
        if (beatsPerChord)
            this.beatsPerChord = beatsPerChord;
        this.activeIndex = 0;
        this.currentBeatInChord = 0;
        this.saveToStorage();
        this.notifyListChange();
        this.notifyChordChange();
    }
    setActiveIndex(index) {
        if (index >= 0 && index < this.chords.length) {
            this.activeIndex = index;
            this.currentBeatInChord = 0;
            this.notifyChordChange();
        }
    }
    // --- Playback Sequencer Engine ---
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        }
        else {
            this.play();
        }
        return this.isPlaying;
    }
    play() {
        if (this.isPlaying || this.chords.length === 0)
            return;
        this.isPlaying = true;
        this.currentBeatInChord = 0;
        this.nextBeatTime = audio.getCurrentTime() + 0.05;
        this.notifyStateChange();
        this.notifyChordChange();
        this.scheduleNextBeat();
    }
    pause() {
        this.isPlaying = false;
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        audio.stop();
        this.notifyStateChange();
    }
    stop() {
        this.pause();
        this.activeIndex = 0;
        this.currentBeatInChord = 0;
        this.notifyChordChange();
    }
    scheduleNextBeat() {
        if (!this.isPlaying)
            return;
        const secondsPerBeat = 60.0 / this.tempo;
        const now = audio.getCurrentTime();
        while (this.nextBeatTime < now + 0.1) {
            const isFirstBeatOfChord = this.currentBeatInChord === 0;
            // Metronome Click
            if (this.isMetronomeEnabled) {
                audio.playClick(isFirstBeatOfChord, this.nextBeatTime);
            }
            // Strum pattern rhythm or chord strike on beat 1
            if (isFirstBeatOfChord) {
                const chordId = this.chords[this.activeIndex];
                const chordObj = this.db?.getChordById(chordId);
                if (chordObj) {
                    const midiNotes = this.getChordMidiForInstrument(chordObj, this.activeInstrument);
                    audio.playChord(midiNotes, this.activeInstrument, this.nextBeatTime, true);
                }
            }
            else if (this.activeStrumPattern && this.activeStrumPattern.pattern) {
                // If strum pattern has a stroke on this beat subdivision
                const pattern = this.activeStrumPattern.pattern;
                const patternIndex = (this.currentBeatInChord * 2) % pattern.length;
                const stroke = pattern[patternIndex];
                if (stroke === "D" || stroke === "U") {
                    const chordId = this.chords[this.activeIndex];
                    const chordObj = this.db?.getChordById(chordId);
                    if (chordObj) {
                        const midiNotes = this.getChordMidiForInstrument(chordObj, this.activeInstrument);
                        audio.playChord(midiNotes, this.activeInstrument, this.nextBeatTime, false);
                    }
                }
            }
            // UI Notifications
            const beatForUi = this.currentBeatInChord;
            const accentForUi = isFirstBeatOfChord;
            setTimeout(() => {
                if (this.isPlaying) {
                    this.notifyBeatChange(beatForUi, accentForUi);
                }
            }, Math.max(0, (this.nextBeatTime - now) * 1000));
            // Advance beat counter
            this.currentBeatInChord++;
            if (this.currentBeatInChord >= this.beatsPerChord) {
                this.currentBeatInChord = 0;
                this.activeIndex++;
                if (this.activeIndex >= this.chords.length) {
                    if (this.isLooping) {
                        this.activeIndex = 0;
                    }
                    else {
                        this.stop();
                        return;
                    }
                }
                setTimeout(() => {
                    if (this.isPlaying) {
                        this.notifyChordChange();
                    }
                }, Math.max(0, (this.nextBeatTime - now) * 1000));
            }
            this.nextBeatTime += secondsPerBeat;
        }
        this.timerId = window.setTimeout(() => this.scheduleNextBeat(), 25);
    }
    getChordMidiForInstrument(chord, inst) {
        switch (inst) {
            case "piano":
                return chord.instruments.piano?.keys || [60, 64, 67];
            case "guitar": {
                const frets = chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];
                const openStrings = [40, 45, 50, 55, 59, 64];
                const notes = [];
                frets.forEach((f, idx) => {
                    if (f >= 0) {
                        notes.push(openStrings[idx] + f);
                    }
                });
                return notes;
            }
            case "ukulele": {
                const frets = chord.instruments.ukulele?.frets || [0, 0, 0, 0];
                const openStrings = [67, 60, 64, 69];
                const notes = [];
                frets.forEach((f, idx) => {
                    if (f >= 0) {
                        notes.push(openStrings[idx] + f);
                    }
                });
                return notes;
            }
            case "harmonica":
                return [60, 64, 67];
        }
    }
    notifyChordChange() {
        const chordId = this.chords[this.activeIndex] || "";
        for (const l of this.listeners) {
            l.onChordChange(this.activeIndex, chordId);
        }
    }
    notifyBeatChange(beat, isAccent) {
        for (const l of this.listeners) {
            l.onBeatChange(beat, isAccent);
        }
    }
    notifyStateChange() {
        for (const l of this.listeners) {
            l.onStateChange(this.isPlaying);
        }
    }
    notifyListChange() {
        for (const l of this.listeners) {
            l.onListChange([...this.chords]);
        }
    }
    saveToStorage() {
        try {
            localStorage.setItem("chordflow_progression", JSON.stringify({
                chords: this.chords,
                tempo: this.tempo,
                beatsPerChord: this.beatsPerChord
            }));
        }
        catch {
            // Ignore storage errors
        }
    }
    loadFromStorage() {
        try {
            const saved = localStorage.getItem("chordflow_progression");
            if (saved) {
                const data = JSON.parse(saved);
                if (Array.isArray(data.chords) && data.chords.length >= 1) {
                    this.chords = data.chords.slice(0, 7);
                }
                if (typeof data.tempo === "number")
                    this.tempo = data.tempo;
                if (typeof data.beatsPerChord === "number")
                    this.beatsPerChord = data.beatsPerChord;
            }
        }
        catch {
            // Fallback to default
        }
    }
}
export const progression = new ProgressionManager();
//# sourceMappingURL=progression.js.map