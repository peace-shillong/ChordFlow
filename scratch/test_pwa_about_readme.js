import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("=== Testing PWA, About App Modal & README.md ===");

const root = path.resolve('.');

// 1. Verify manifest.webmanifest
const manifestPath = path.join(root, 'manifest.webmanifest');
assert(fs.existsSync(manifestPath), "manifest.webmanifest must exist");
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert.strictEqual(manifest.name, "ChordFlow — Chord Previewer & Progression Builder");
assert.strictEqual(manifest.short_name, "ChordFlow");
assert.strictEqual(manifest.display, "standalone");
assert.strictEqual(manifest.theme_color, "#0b0d17");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, "Must have icons in manifest");
console.log("✓ manifest.webmanifest is valid with all icons and shortcuts");

// 2. Verify PWA Icons exist
const iconFiles = ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
for (const iconFile of iconFiles) {
  const iconPath = path.join(root, 'icons', iconFile);
  assert(fs.existsSync(iconPath), `Icon file ${iconFile} must exist`);
  const stat = fs.statSync(iconPath);
  assert(stat.size > 0, `Icon file ${iconFile} must not be empty`);
}
console.log("✓ All PWA icon assets verified in ./icons/");

// 3. Verify Service Worker sw.js
const swPath = path.join(root, 'sw.js');
assert(fs.existsSync(swPath), "sw.js must exist");
const swContent = fs.readFileSync(swPath, 'utf-8');
assert(swContent.includes("PRECACHE_ASSETS"), "sw.js must define PRECACHE_ASSETS");
assert(swContent.includes("addEventListener('install'"), "sw.js must handle install event");
assert(swContent.includes("addEventListener('activate'"), "sw.js must handle activate event");
assert(swContent.includes("addEventListener('fetch'"), "sw.js must handle fetch event");
console.log("✓ Service Worker sw.js verified");

// 4. Verify index.html tags, About modal, and Settings PWA Install button
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
assert(indexHtml.includes('rel="manifest" href="manifest.webmanifest"'), "index.html must link to manifest.webmanifest");
assert(indexHtml.includes('id="btn-open-about"'), "index.html must have btn-open-about");
assert(indexHtml.includes('id="about-modal"'), "index.html must have about-modal");
assert(indexHtml.includes('id="btn-close-about"'), "index.html must have btn-close-about");
assert(indexHtml.includes('id="btn-close-about-footer"'), "index.html must have btn-close-about-footer");
assert(indexHtml.includes('about-shortcuts-table'), "index.html must have about-shortcuts-table");
assert(indexHtml.includes('id="btn-install-pwa"'), "index.html must have btn-install-pwa in settings modal");
assert(indexHtml.includes('id="pwa-install-group"'), "index.html must have pwa-install-group");
console.log("✓ index.html contains PWA links, About Modal, and Settings PWA Install button");

// 5. Verify ts/main.ts and dist/main.js register SW
const mainJs = fs.readFileSync(path.join(root, 'dist/main.js'), 'utf-8');
assert(mainJs.includes('registerServiceWorker'), "main.js must contain registerServiceWorker");
assert(mainJs.includes("navigator.serviceWorker.register"), "main.js must call navigator.serviceWorker.register");
console.log("✓ main.js registers service worker on boot");

// 6. Verify ts/ui.ts and dist/ui.js About Modal, Shortcuts, and PWA Install
const uiJs = fs.readFileSync(path.join(root, 'dist/ui.js'), 'utf-8');
assert(uiJs.includes('openAboutModal'), "ui.js must have openAboutModal");
assert(uiJs.includes('closeAboutModal'), "ui.js must have closeAboutModal");
assert(uiJs.includes('this.aboutModalEl'), "ui.js must bind aboutModalEl");
assert(uiJs.includes('btn-open-about'), "ui.js must query btn-open-about");
assert(uiJs.includes('btn-install-pwa'), "ui.js must query btn-install-pwa");
assert(uiJs.includes('initPwaInstallHandler'), "ui.js must have initPwaInstallHandler");
assert(uiJs.includes('updatePwaInstallState'), "ui.js must have updatePwaInstallState");
console.log("✓ ui.js includes About Modal controllers, keyboard bindings, and PWA install handlers");

// 7. Verify main.css styling
const mainCss = fs.readFileSync(path.join(root, 'css/main.css'), 'utf-8');
assert(mainCss.includes('.about-modal-card'), "main.css must style .about-modal-card");
assert(mainCss.includes('.about-feature-card'), "main.css must style .about-feature-card");
assert(mainCss.includes('.about-shortcuts-table'), "main.css must style .about-shortcuts-table");
assert(mainCss.includes('.about-version-badge'), "main.css must style .about-version-badge");
assert(mainCss.includes('.pwa-install-card'), "main.css must style .pwa-install-card");
assert(mainCss.includes('.pwa-install-btn'), "main.css must style .pwa-install-btn");
console.log("✓ main.css includes all About Modal and PWA install styles");

// 8. Verify README.md and screenshot files
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf-8');
const screenshotFiles = [
  '1. Home Screen.png',
  '2. Home Screen - Piano.png',
  '3. Chord Progression Generation Modal.png',
  '4. Advance Instrument Settings.png',
  '5. Interactive Music Theory.png',
  '6. Tuner.png'
];
for (const sc of screenshotFiles) {
  const scPath = path.join(root, 'screenshots', sc);
  assert(fs.existsSync(scPath), `Screenshot file ${sc} must exist`);
  const encodedName = encodeURI(sc);
  assert(readme.includes(`screenshots/${encodedName}`) || readme.includes(`screenshots/${sc}`), `README.md must reference screenshot ${sc}`);
}
console.log("✓ README.md references all valid screenshots");

console.log("\n🎉 ALL PWA, ABOUT MODAL & README TESTS PASSED!");
