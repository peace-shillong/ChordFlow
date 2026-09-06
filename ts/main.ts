import { AppState } from "./types.js";
import { ChordDatabase } from "./chord.js";
import { progression } from "./progression.js";
import { UIManager } from "./ui.js";

async function bootstrap(): Promise<void> {
  const loadingOverlay = document.getElementById("loading-overlay");

  try {
    const db = new ChordDatabase();
    await db.loadAll();

    progression.setDatabase(db);

    const savedProgression = progression.getChords();

    const savedTheme = (localStorage.getItem("chordflow-theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    const initialState: AppState = {
      mode: "clean", // Spec: Clean Mode is default for beginners
      activeInstrument: "guitar",
      displayView: "chord",
      selectedChord: savedProgression[0] || "Cmaj",
      selectedInversionIndex: 0,
      selectedVoicingId: "open",
      progression: savedProgression,
      progressionTitle: progression.getTitle(),
      activeChordIndex: 0,
      capo: 0,
      tuning: "standard",
      strumPattern: "basic",
      tempo: progression.getTempo(),
      volume: 0.8,
      isPlaying: false,
      soundPreset: "acoustic_steel",
      audioSettings: {},
      toggles: {
        showNotes: true,
        showIntervals: false,
        showScaleDegrees: true,
        showStrum: true,
        showCircle: true,
        showInversions: true
      },
      theme: savedTheme
    };

    const ui = new UIManager(db, initialState);
    ui.init();

    // Hide loading screen
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
      setTimeout(() => loadingOverlay.remove(), 400);
    }
  } catch (err) {
    console.error("Initialization error:", err);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 20px;">
          <h2>Failed to load ChordFlow</h2>
          <p>${(err as Error).message}</p>
          <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  }
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
