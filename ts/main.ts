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

    const savedMode = (localStorage.getItem("chordflow-mode") as "clean" | "advanced") || "clean";
    progression.setMaxChords(savedMode === "clean" ? 8 : 16);

    const initialState: AppState = {
      mode: savedMode,
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

    // Register PWA Service Worker for offline support
    registerServiceWorker();
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

function registerServiceWorker(): void {
  if ("serviceWorker" in navigator && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    });
  }
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
