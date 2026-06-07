# AGENTS.md — So Spill

> For Claude Code & any AI agent. Read this first.

## What This Is

So Spill is a local-first AI companion PWA. You talk, an on-device LLM responds with a personality you choose. Nothing leaves your device. Think: emotional first-aid kit in your pocket.

- **Brand:** So Spill — [sospill.org](https://sospill.org)
- **Repo:** GibGitGib/vent-app (private) — internal codename: vent-app
- **Landing:** GibGitGib/vent-landing (public) → sospill.org
- **Local:** `C:\Users\email\CoreTech_Sr\vent-app\`
- **Gumroad:** coretechlabs.gumroad.com/l/spill-pro ($2.99, one-time)
- **Tech:** Single HTML file + vanilla JS engine. No build step. No framework. No npm.
- **LLM backends:** Ollama (desktop), GPT4All (phone), PocketPal, Enclave, Custom (any OpenAI-compatible)
- **Personalities:** 8 curated (Best Friend, No Judgment, Tough Love, Therapist, Funny, Hype, Zen, Custom)

## Architecture

```
vent-app/
├── index.html          ← The app (1129 lines). PWA + UI + Pro gating + voice + mood
├── vent-engine.js      ← Core engine (308 lines). Backends, chat, mood, memory, fallback
├── companion-engine.js ← Standalone SDK — reusable across any CoreTech B2C app
├── manifest.json       ← PWA manifest ("So Spill", coral theme #e94560)
├── sw.js               ← Service worker (offline cache)
├── icon-192.png        ← App icon (small)
├── icon-512.png        ← App icon (large)
├── LICENSE_KEYS.txt    ← 20 Pro keys (VEN-XXXX-XXXX-XXXX format)
├── AGENTS.md           ← This file
└── ios-lock-screen-widget.md  ← Design blueprint (not built)
```

## Key Systems

### Pro Tier Gating (`index.html`, lines ~870-1010)
- License format: `VEN-XXXX-XXXX-XXXX` (checksum-validated)
- Dev bypass: `DEV-XXXX-XXXX-XXXX` (any body works)
- Gated: 3 free personalities / 5 Pro + voice input + extended memory
- Upgrade modal + banner (modeled after Voice Calc)
- Gumroad link: `coretechlabs.gumroad.com/l/spill-pro`

### Disclaimer System (`index.html`, lines ~508-530)
- First-run modal: explicit is/is-not (AI companion, NOT therapist/medical)
- Crisis resources: 988, Crisis Text Line (741741)
- Crisis banner: auto-shows on language suggesting distress
- **DO NOT remove or soften these.** Legal requirement.

### Backends (`vent-engine.js`)
- Ollama, GPT4All, PocketPal, Enclave (phone), Custom
- Enclave backend: `http://127.0.0.1:8080` (port may need adjustment for actual Enclave App)

### Mood Detection (`vent-engine.js`)
- Keyword-based: anxiety, anger, sadness, gratitude, confusion, celebration, grief, neutral
- Drives crisis banner trigger on high-risk mood patterns

### Memory
- localStorage, last 40 messages
- No cloud, no accounts, no servers

## What's Built

- Full PWA with install prompt
- Text + voice input (voice = Pro-gated)
- 8 personalities with mood detection
- Pro tier: license validation, upgrade flow, banner/modal
- Disclaimer + crisis resources
- Offline fallback responses
- Lock screen widget deep link (`?mode=quick-vent`)
- Companion engine SDK extracted (standalone, zero-dependency)

## What's NOT Built (v2)

- Session management (start new, view history)
- Mood tracking/analytics over time
- Export conversations
- Theme system (dark/light)
- Actual lock screen widget (iOS Swift/SwiftUI)
- Analytics/telemetry (intentionally — privacy-first)

## Constraints

- **Single-file PWA** — no build step, no framework, no npm. All JS inline or in `.js` files.
- **Local-first** — all data in localStorage. No servers, no accounts, no cloud.
- **Private repo** — no API keys, no secrets exposed.
- **Mobile-first** — CSS uses `100dvh`, safe-area-inset, touch-friendly tap targets.
- **Offline-resilient** — must work without internet.

## How to Test

```
1. Open index.html in browser (file:// works, no server needed)
2. Point at running LLM backend (Ollama on desktop, or Enclave on phone)
3. Vent something → verify personality + mood detection
4. Test offline: disconnect → verify fallback response
5. Test Pro: paste DEV-XXXX-XXXX-XXXX → verify unlock + all personalities
6. Test crisis: type "I want to kill myself" → verify crisis banner appears
```

## Known Issues / Gotchas

- Enclave port unconfirmed (defaulted to 8080)
- PocketPal lacks API server (GitHub issue #407) — may need workaround
- Pro license validation is client-side checksum only — acceptable for $2.99 product
- Voice input uses Web Speech API — works on Chrome/Safari mobile, not Firefox
- `sendSpillNotification()` function name is legacy — don't rename (internal only)

## Voice Calc Reference

The Pro gating system was modeled after Voice Calculator. Reference files:
- `../voice-calculator/index.html` lines 140-168 — license validation
- `../voice-calculator/index.html` lines 903-915 — Pro banner CSS
- `../voice-calculator/index.html` lines 1087-1131 — Upgrade modal CSS
- `../voice-calculator/HANDOFF.md` — Full project reference

## Companion Engine SDK

`companion-engine.js` is the portable core. Use it as a drop-in for any future CoreTech B2C companion app:
- `window.CompanionEngine` (factory pattern)
- Personalities + multi-backend chat + mood detection + memory
- Zero dependencies. Include via `<script>` tag.
- Already designed for: Jenny Rich, Situational Coach, PUSHYPUSHY

## Brand Voice

- **So Spill** — conversational, warm, lowercase-friendly ("so spill")
- Tagline: "Talk it out. Feel better."
- CoreTech Labs: "Labs for Software Experiments."
- Corey is the solo founder. Ship for speed, not perfection.

## After Building

- Do NOT modify `ios-lock-screen-widget.md` (design doc, not code)
- Do NOT remove or soften disclaimer/crisis content
- Commit with descriptive message: `feat: <what you built>`
- Update this AGENTS.md if architecture changes
