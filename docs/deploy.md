Since your app is a **purely static site** (compiled HTML/CSS/JS + JSON), you have several free options. Here's the quickest path for each:

---

## Option 1: Netlify Drop (fastest — no CLI, no Git)

1. Build your project:
   ```bash
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. **Drag and drop** your `dist/` folder
4. Done — you get a live URL like `https://chordflow-abc123.netlify.app`

---

## Option 2: Cloudflare Pages (unlimited bandwidth, free)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy your dist folder
wrangler pages deploy dist --project-name chordflow
```

Gives you: `https://chordflow.pages.dev`

---

## Option 3: Vercel (one command)

```bash
npx vercel dist
```

Or connect your Git repo at [vercel.com](https://vercel.com) and it auto-deploys on every push.

---

## Option 4: Surge.sh (fastest CLI)

```bash
npm install -g surge
surge dist
```

Pick a subdomain → instant URL like `https://chordflow.surge.sh`

---

## Option 5: GitHub Pages (free forever)

```bash
# Push your repo to GitHub, then:
npm run build
npx gh-pages -d dist
```

Gives you: `https://<username>.github.io/<repo>/`

> ⚠️ **Important for SPA + GitHub Pages:** If your app uses client-side routing, you need a `_redirects` file in `dist/`:
> ```
> /* /index.html 200
> ```

---

## Quick Comparison

| Platform | Free Tier | Bandwidth | Custom Domain | Easiest? |
|----------|-----------|-----------|---------------|----------|
| **Netlify Drop** | ✅ | 100 GB/mo | ✅ | 🥇 Drag & drop |
| **Cloudflare Pages** | ✅ | **Unlimited** | ✅ | 🥈 CLI |
| **Vercel** | ✅ | 100 GB/mo | ✅ (paid) | 🥉 CLI |
| **Surge.sh** | ✅ | Unlimited | ✅ | One command |
| **GitHub Pages** | ✅ | 100 GB/mo | ✅ | Needs Git |

---

## Recommended Setup for Your Project

Since your app is a beginner-friendly static SPA:

1. **Push code to GitHub** (version control + easy sharing)
2. **Deploy via Cloudflare Pages** (unlimited bandwidth = no surprise costs if it goes viral)
3. **Add a custom domain** later (e.g., `chordflow.com`) — all 5 platforms support this for free

**One-time config to add to your project:**

```json
// package.json
{
  "scripts": {
    "build": "tsc && npx esbuild ts/main.ts --bundle --outfile=dist/js/main.js --minify",
    "deploy": "wrangler pages deploy dist --project-name chordflow"
  }
}
```

Then every time you update: `npm run build && npm run deploy` → live in ~30 seconds.

