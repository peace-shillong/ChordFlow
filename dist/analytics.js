/**
 * Google Analytics (GA4) Safe Wrapper for ChordFlow SPA
 */
export function trackPageView(path, title) {
    try {
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", "page_view", {
                page_path: path,
                page_title: title || (typeof document !== "undefined" ? document.title : "ChordFlow") || "ChordFlow"
            });
        }
    }
    catch (err) {
        // Safe no-op if ad-blocker or offline
    }
}
export function trackEvent(action, params) {
    try {
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", action, params);
        }
    }
    catch (err) {
        // Safe no-op if ad-blocker or offline
    }
}
//# sourceMappingURL=analytics.js.map