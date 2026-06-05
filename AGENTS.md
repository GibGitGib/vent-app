# AGENTS.md — Vent App

> For Claude Code. Read this first.

## What This Is

Vent App is a local-first AI companion PWA. You vent, an on-device LLM responds with a personality you choose. Nothing leaves your device. Think: emotional first-aid kit in your pocket.

- **Repo:** GibGitGib/vent-app (private)
- **Local:** `C:\Users\email\CoreTech_Sr\vent-app\`
- **Tech:** Single HTML file + vanilla JS engine. No build step. No framework. No npm.
- **LLM backends:** Ollama (desktop), GPT4All (phone), PocketPal, Enclave, Custom (any OpenAI-compatible)
- **Personalities:** 8 curated system prompts (Best Friend, No Judgment, Tough Love, Therapist, Funny, Hype, Zen, Custom)

## Current State

### Built
- `index.html` — 944 lines, full PWA with conversation UI, voice input, text input, mood display, lock screen widget deep link
- `vent-engine.js` — 308 lines, clean engine: multi-backend detection, chat, mood detection, memory (localStorage, 40 msgs), fallback responses, personality management
- `manifest.json` + `sw.js` — PWA installable
- `icon-192.png` + `icon-512.png` — App icons
- `ios-lock-screen-widget.md` — Design blueprint (not built)

### NOT Built
- Session management (start new, view history)
- Mood tracking/analytics over time
- Export
- Theme system
- Gumroad product setup (Corey needs to create product at coretechlabs.gumroad.com/l/vent-pro)

### ✅ Completed June 5
- Enclave App backend
- Companion engine SDK extraction (`companion-engine.js`)
- Pro tier gating: license validation (VEN-XXXX-XXXX-XXXX), personality locking (3 free / 5 Pro), upgrade banner + modal, Gumroad link
- Landing page built (coral theme) — live at gibgitgib.github.io/vent-landing (source: `landing/index.html`)
- Domain: ventapp.app available — Corey to purchase + add CNAME → gibgitgib.github.io
- Public landing repo: GibGitGib/vent-landing

### 🔜 Pending
- Corey: Buy ventapp.app domain → add CNAME to vent-landing repo
- Corey: Create Gumroad product at coretechlabs.gumroad.com/l/vent-pro ($2.99, upload LICENSE_KEYS.txt)
- Test full purchase flow: buy on Gumroad → receive key → paste in PWA → unlock personalities
- Product Hunt listing
- Reddit launch posts

## Current Task: Pro Monetization + Enclave Backend

### Task 1: Add Enclave Backend
Add to `vent-engine.js` backends:
```js
enclave: {
  name: '📱 Enclave (Phone)',
  baseUrl: 'http://127.0.0.1:8080',  // TBD — check Enclave App docs for actual port
  modelsPath: '/v1/models',
  modelsKey: 'data',
  modelsMap: (m) => m.id,
  chatPath: '/v1/chat/completions',
  chatFormat: 'openai'
}
```
Corey uses Enclave App with Liquid LFM 2.5-1.5B. If you don't know the port, use 8080 as default (most OpenAI-compatible servers) and note it may need adjustment.

### Task 2: Pro Tier Gating
Model after Voice Calculator's Pro system (see `../voice-calculator/index.html` lines 140-168):
- License key format: `VEN-XXXX-XXXX-XXXX`
- Checksum validation (same algorithm as Voice Calc)
- Gate at least ONE feature behind Pro:
  - **Recommendation:** Gate personalities beyond the first 3 (Best Friend, No Judgment, Tough Love = free; the rest = Pro)
  - OR gate conversation memory beyond 10 messages
  - OR gate voice input (text = free, voice = Pro)
- Price: $2.99 one-time via Gumroad (Corey will set up the product)
- DEV-XXXX-XXXX-XXXX bypass for development
- Upgrade banner + modal (steal CSS from Voice Calc's `.vc-upgrade-overlay` / `.vc-upgrade-box`)

### Task 3: Companion Engine Extraction
Extract the portable core of `vent-engine.js` into `companion-engine.js`:
- Keep: backends system, chat(), mood detection, personality system, memory, fallback
- Remove: Vent-specific UI references
- Make it a drop-in SDK for: Jenny Rich, Situational Coach, PUSHYPUSHY, any future companion app

## Constraints

- **Single-file PWA** — no build step, no framework, no npm. Everything in `index.html` + `.js` files.
- **Local-first** — all data in localStorage. No servers, no accounts, no cloud.
- **Private repo** — no API keys, no secrets exposed. Public Pages not planned.
- **Mobile-first** — test on phone (Enclave App on iOS/Android serving LLM). CSS uses `100dvh`, safe-area-inset, touch-friendly tap targets.
- **Offline-resilient** — must work without internet. Fallback responses already exist.

## How to Test

1. Open `index.html` in browser (file:// works, no server needed)
2. Point at running LLM backend (Ollama on desktop, or Enclave on phone)
3. Vent something → verify personality + mood detection
4. Test offline: disconnect → verify fallback response

## Voice Calc Reference

The Voice Calculator Pro gating system is the template. Key files:
- `../voice-calculator/index.html` lines 140-168 — license validation (`vcValidateLicense`, `vcLicenseChecksum`)
- `../voice-calculator/index.html` lines 903-915 — Pro banner CSS
- `../voice-calculator/index.html` lines 1087-1131 — Upgrade modal CSS
- `../voice-calculator/HANDOFF.md` — Full project reference

## After Building

- Do NOT modify `ios-lock-screen-widget.md` (design doc, not code)
- Commit with descriptive message: `feat: <what you built>`
- CoreTech brand: "Labs for Software Experiments." — use this voice in any user-facing copy
- Corey is the solo founder. Build for shipping speed, not perfection.
