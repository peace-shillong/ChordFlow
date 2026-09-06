import { Chord, InstrumentId, StrumPattern } from "./types.js";
import { ChordDatabase } from "./chord.js";
import { audio } from "./audio.js";

export interface ProgressionListener {
  onChordChange: (index: number, chordId: string) => void;
  onBeatChange: (beat: number, isAccent: boolean) => void;
  onStateChange: (isPlaying: boolean) => void;
  onListChange: (chords: string[]) => void;
}

export class ProgressionManager {
  private chords: string[] = ["Cmaj", "Gmaj", "Amin", "Fmaj"];
  private title: string = "My Progression";
  private activeIndex: number = 0;
  private tempo: number = 120;
  private beatsPerChord: number = 4;
  private isPlaying: boolean = false;
  private isLooping: boolean = true;
  private isMetronomeEnabled: boolean = true;
  private maxChords: number = 8; // 8 for clean mode, 16 for advanced mode

  private timerId: number | null = null;
  private nextBeatTime: number = 0;
  private currentBeatInChord: number = 0;
  private listeners: Set<ProgressionListener> = new Set();
  private db: ChordDatabase | null = null;
  private activeInstrument: InstrumentId = "guitar";
  private activeStrumPattern: StrumPattern | null = null;

  constructor() {
    this.loadFromStorage();
  }

  public setDatabase(db: ChordDatabase): void {
    this.db = db;
  }

  public setInstrument(inst: InstrumentId): void {
    this.activeInstrument = inst;
  }

  public setStrumPattern(pattern: StrumPattern | null): void {
    this.activeStrumPattern = pattern;
  }

  public getActiveStrumPattern(): StrumPattern | null {
    return this.activeStrumPattern;
  }

  public addListener(listener: ProgressionListener): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: ProgressionListener): void {
    this.listeners.delete(listener);
  }

  public getChords(): string[] {
    return [...this.chords];
  }

  public getTitle(): string {
    return this.title;
  }

  public setTitle(title: string): void {
    this.title = title || "My Progression";
    this.saveToStorage();
  }

  public getMaxChords(): number {
    return this.maxChords;
  }

  public setMaxChords(limit: number): void {
    this.maxChords = Math.max(4, Math.min(16, limit));
  }

  public getActiveIndex(): number {
    return this.activeIndex;
  }

  public getNextIndex(): number {
    if (this.chords.length === 0) return 0;
    return (this.activeIndex + 1) % this.chords.length;
  }

  public getTempo(): number {
    return this.tempo;
  }

  public setTempo(bpm: number): void {
    this.tempo = Math.max(40, Math.min(240, bpm));
  }

  public getBeatsPerChord(): number {
    return this.beatsPerChord;
  }

  public setBeatsPerChord(beats: number): void {
    this.beatsPerChord = Math.max(1, Math.min(8, beats));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  public toggleLoop(): boolean {
    this.isLooping = !this.isLooping;
    return this.isLooping;
  }

  public toggleMetronome(): boolean {
    this.isMetronomeEnabled = !this.isMetronomeEnabled;
    return this.isMetronomeEnabled;
  }

  public addChord(chordId: string): boolean {
    if (this.chords.length >= this.maxChords) {
      return false;
    }
    this.chords.push(chordId);
    this.activeIndex = this.chords.length - 1;
    this.saveToStorage();
    this.notifyListChange();
    this.notifyChordChange();
    return true;
  }

  public setChordAt(index: number, chordId: string): boolean {
    if (index >= 0 && index < this.chords.length) {
      this.chords[index] = chordId;
      this.activeIndex = index;
      this.saveToStorage();
      this.notifyListChange();
      this.notifyChordChange();
      return true;
    }
    return false;
  }

  public removeChord(index: number): boolean {
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

  public moveChord(fromIndex: number, toIndex: number): void {
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

  public setProgression(chords: string[], tempo?: number, beatsPerChord?: number, title?: string): void {
    this.chords = chords.slice(0, this.maxChords);
    if (tempo) this.tempo = tempo;
    if (beatsPerChord) this.beatsPerChord = beatsPerChord;
    if (title) this.title = title;
    this.activeIndex = 0;
    this.currentBeatInChord = 0;
    this.saveToStorage();
    this.notifyListChange();
    this.notifyChordChange();
  }

  public setActiveIndex(index: number): void {
    if (index >= 0 && index < this.chords.length) {
      this.activeIndex = index;
      this.currentBeatInChord = 0;
      this.notifyChordChange();
    }
  }

  // --- Playback Sequencer Engine ---

  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public play(): void {
    if (this.isPlaying || this.chords.length === 0) return;
    this.isPlaying = true;
    this.currentBeatInChord = 0;
    this.nextBeatTime = audio.getCurrentTime() + 0.05;

    this.notifyStateChange();
    this.notifyChordChange();
    this.scheduleNextBeat();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    audio.stop();
    this.notifyStateChange();
  }

  public stop(): void {
    this.pause();
    this.activeIndex = 0;
    this.currentBeatInChord = 0;
    this.notifyChordChange();
  }

  private scheduleNextBeat(): void {
    if (!this.isPlaying) return;

    const secondsPerBeat = 60.0 / this.tempo;
    const now = audio.getCurrentTime();

    while (this.nextBeatTime < now + 0.1) {
      const isFirstBeatOfChord = this.currentBeatInChord === 0;

      // Metronome Click
      if (this.isMetronomeEnabled) {
        audio.playClick(isFirstBeatOfChord, this.nextBeatTime);
      }

      // Play chord/notes according to strum subdivisions or beat 1
      const chordId = this.chords[this.activeIndex];
      const chordObj = this.db?.getChordById(chordId);

      if (chordObj) {
        const midiNotes = this.getChordMidiForInstrument(chordObj, this.activeInstrument);

        if (this.activeStrumPattern && this.activeStrumPattern.pattern && this.activeStrumPattern.pattern.length > 0) {
          const pattern = this.activeStrumPattern.pattern;
          const numSlots = pattern.length;
          const subsPerBeat = Math.max(1, Math.round(numSlots / this.beatsPerChord));
          const subDuration = secondsPerBeat / subsPerBeat;

          for (let s = 0; s < subsPerBeat; s++) {
            const slotIdx = (this.currentBeatInChord * subsPerBeat + s) % numSlots;
            const stroke = pattern[slotIdx];
            const strokeTime = this.nextBeatTime + s * subDuration;

            if (this.activeInstrument === "harmonica") {
              if (stroke === "D" || stroke === "D+U" || (isFirstBeatOfChord && s === 0 && stroke !== "")) {
                midiNotes.forEach((note, idx) => {
                  audio.playNote(note, "harmonica", strokeTime + idx * 0.05, 0.4);
                });
              } else if (stroke === "U") {
                midiNotes.slice().reverse().forEach((note, idx) => {
                  audio.playNote(note, "harmonica", strokeTime + idx * 0.05, 0.4);
                });
              }
              // Silence on rests ("")
            } else {
              if (stroke === "D") {
                audio.playChord(midiNotes, this.activeInstrument, strokeTime, true, "down");
              } else if (stroke === "U") {
                audio.playChord(midiNotes, this.activeInstrument, strokeTime, true, "up");
              } else if (stroke === "D+U") {
                audio.playChord(midiNotes, this.activeInstrument, strokeTime, true, "down_up");
              }
              // Silence on rests ("")
            }
          }
        } else {
          if (isFirstBeatOfChord) {
            if (this.activeInstrument === "harmonica") {
              midiNotes.forEach((note, idx) => {
                audio.playNote(note, "harmonica", this.nextBeatTime + idx * 0.12, 0.8);
              });
            } else {
              audio.playChord(midiNotes, this.activeInstrument, this.nextBeatTime, true, "down");
            }
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
          } else {
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

  private getChordMidiForInstrument(chord: Chord, inst: InstrumentId): number[] {
    switch (inst) {
      case "piano":
        return chord.instruments.piano?.keys || [60, 64, 67];
      case "guitar": {
        const frets = chord.instruments.guitar?.frets || [-1, 0, 2, 2, 2, 0];
        const openStrings = [40, 45, 50, 55, 59, 64];
        const notes: number[] = [];
        frets.forEach((f, idx) => {
          if (f >= 0) notes.push(openStrings[idx] + f);
        });
        return notes;
      }
      case "ukulele": {
        const frets = chord.instruments.ukulele?.frets || [0, 0, 0, 0];
        const openStrings = [67, 60, 64, 69];
        const notes: number[] = [];
        frets.forEach((f, idx) => {
          if (f >= 0) notes.push(openStrings[idx] + f);
        });
        return notes;
      }
      case "guitalele": {
        const frets = chord.instruments.guitalele?.frets || [0, 0, 2, 2, 2, 0];
        const openStrings = [45, 50, 55, 60, 64, 69];
        const notes: number[] = [];
        frets.forEach((f, idx) => {
          if (f >= 0) notes.push(openStrings[idx] + f);
        });
        return notes;
      }
      case "violin": {
        if (chord.instruments.violin?.doubleStops && chord.instruments.violin.doubleStops.length > 0) {
          const ds = chord.instruments.violin.doubleStops[0];
          const openStrings = [55, 62, 69, 76];
          return [openStrings[0] + (ds[0] >= 0 ? ds[0] : 0), openStrings[1] + (ds[1] >= 0 ? ds[1] : 0)];
        }
        return chord.instruments.violin?.notes || [60, 64, 67];
      }
      case "bass": {
        if (chord.instruments.bass?.notes && chord.instruments.bass.notes.length > 0) {
          return chord.instruments.bass.notes;
        }
        const frets = chord.instruments.bass?.frets || [0, -1, -1, -1];
        const openStrings = [28, 33, 38, 43];
        const notes: number[] = [];
        frets.forEach((f, idx) => {
          if (f >= 0) notes.push(openStrings[idx] + f);
        });
        return notes.length > 0 ? notes : [28, 35];
      }
      case "harmonica":
        return [60, 64, 67];
    }
  }

  private notifyChordChange(): void {
    const chordId = this.chords[this.activeIndex] || "";
    for (const l of this.listeners) {
      l.onChordChange(this.activeIndex, chordId);
    }
  }

  private notifyBeatChange(beat: number, isAccent: boolean): void {
    for (const l of this.listeners) {
      l.onBeatChange(beat, isAccent);
    }
  }

  private notifyStateChange(): void {
    for (const l of this.listeners) {
      l.onStateChange(this.isPlaying);
    }
  }

  private notifyListChange(): void {
    for (const l of this.listeners) {
      l.onListChange([...this.chords]);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem("chordflow_progression", JSON.stringify({
        chords: this.chords,
        title: this.title,
        tempo: this.tempo,
        beatsPerChord: this.beatsPerChord
      }));
    } catch {
      // Ignore storage errors
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem("chordflow_progression");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.chords) && data.chords.length >= 1) {
          this.chords = data.chords.slice(0, 16);
        }
        if (typeof data.title === "string") this.title = data.title;
        if (typeof data.tempo === "number") this.tempo = data.tempo;
        if (typeof data.beatsPerChord === "number") this.beatsPerChord = data.beatsPerChord;
      }
    } catch {
      // Fallback to default
    }
  }
}

export const progression = new ProgressionManager();

