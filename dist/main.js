import { ChordDatabase } from "./chord.js";
import { progression } from "./progression.js";
import { UIManager } from "./ui.js";
async function bootstrap() {
    const loadingOverlay = document.getElementById("loading-overlay");
    try {
        const db = new ChordDatabase();
        await db.loadAll();
        progression.setDatabase(db);
        const savedProgression = progression.getChords();
        const initialState = {
            mode: "clean", // Spec: Clean Mode is default for beginners
            activeInstrument: "guitar",
            selectedChord: savedProgression[0] || "Cmaj",
            selectedInversionIndex: 0,
            progression: savedProgression,
            activeChordIndex: 0,
            capo: 0,
            tuning: "standard",
            strumPattern: "basic",
            tempo: progression.getTempo(),
            isPlaying: false,
            toggles: {
                showNotes: true,
                showIntervals: false,
                showScaleDegrees: true,
                showStrum: true,
                showCircle: true,
                showInversions: true
            },
            theme: "dark"
        };
        const ui = new UIManager(db, initialState);
        ui.init();
        // Hide loading screen
        if (loadingOverlay) {
            loadingOverlay.classList.add("hidden");
            setTimeout(() => loadingOverlay.remove(), 400);
        }
    }
    catch (err) {
        console.error("Initialization error:", err);
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 20px;">
          <h2>Failed to load ChordFlow</h2>
          <p>${err.message}</p>
          <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Retry</button>
        </div>
      `;
        }
    }
}
// Start application when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
}
else {
    bootstrap();
}
//# sourceMappingURL=main.js.map