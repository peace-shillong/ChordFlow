## Short answer: **Not strictly required, but there's a free, zero-effort option that fits perfectly.**

Your app is a **purely static frontend** — no backend, no database, no auth, no server-side logic. The classic SAST targets (SQL injection, hardcoded secrets, insecure deserialization on a server) basically don't apply.

### What *could* be a concern in your specific case:

| Risk | Where | Severity |
|------|-------|----------|
| **XSS via JSON import** | User uploads a `.json` file → if you render it unsanitized into DOM | Low–Medium |
| **CDN supply chain** | `jsPDF` loaded from CDN — what if the CDN is compromised? | Low |
| **Unsafe DOM manipulation** | `innerHTML` usage (if any) with user-derived data | Low |

### What I'd actually recommend (lightweight, free):

**1. GitHub Code Scanning (CodeQL)** — free for public repos, zero setup:

```
Repo Settings → Code Security → Code Scanning → Enable
```

GitHub will automatically scan your TypeScript on every push. It catches XSS patterns, unsafe `eval`, `innerHTML` misuse, etc. No config file needed for JS/TS.

**2. Add one ESLint security rule** to your build (if you're using ESLint):

```bash
npm install -D eslint-plugin-security
```

```json
// .eslintrc.json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"]
}
```

This flags `eval`, `document.write`, `innerHTML` with variables, etc.

**3. Sanitize your JSON import** — the one real code change worth making:

```typescript
// In export.ts, when importing user JSON:
function safeImportJSON(file: File): Promise<Progression> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        // Validate schema before touching DOM
        if (!validateProgressionSchema(data)) {
          throw new Error("Invalid progression file");
        }
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}
```

Key rule: **never use `innerHTML` with user-provided data** — use `textContent` or `createElement` instead.

### What you can skip:

- ❌ SonarQube, Checkmarx, Veracode — enterprise tools, overkill here
- ❌ DAST (dynamic scanning) — no backend to attack
- ❌ OWASP ZAP against your site — it's static, nothing to exploit at runtime
- ❌ Penetration testing — no attack surface

### TL;DR

Enable **GitHub Code Scanning** (2 clicks in repo settings) + make sure your JSON import uses `textContent` not `innerHTML`. That's 95% of what matters for a static SPA. Full SAST suites are for apps with backends, auth, and data flows.

