/**
 * Google Analytics (GA4) Safe Wrapper for ChordFlow SPA
 */

export function trackPageView(path: string, title?: string): void {
  try {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path: path,
        page_title: title || (typeof document !== "undefined" ? document.title : "ChordFlow") || "ChordFlow"
      });
    }
  } catch (err) {
    // Safe no-op if ad-blocker or offline
  }
}

export function trackEvent(action: string, params?: Record<string, any>): void {
  try {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", action, params);
    }
  } catch (err) {
    // Safe no-op if ad-blocker or offline
  }
}
