# ShopSnap List (Project001)

Cross-platform **Android + iPhone** shopping list app built with [Expo](https://expo.dev) (React Native) and TypeScript.

**Expo SDK 54** — matches App Store Expo Go for on-device testing.

## What it does

1. **Photograph products** (or pick from your library — multiple photos supported).
2. **AI identifies items** via SpaceXAI (xAI vision) and adds them to your **in-app list**.
3. Each row keeps the **photo** next to the product name for visual shelf matching.
4. **Pick a store** (Walmart, Kroger, Target, Costco, ALDI, Whole Foods) — the list is **grouped by aisle**.
5. Check items off as you shop; everything stays **inside the app** (no file export).

Without an API key you can still add items as text (and attach photos when available).

## Prerequisites

See [docs/MOBILE_PREREQS.md](docs/MOBILE_PREREQS.md).

```bash
source scripts/load-mobile-env.sh
```

## Setup

```bash
cd /Users/mikeburt/Grok_Worktree01
npm install
```

### AI photo recognition (SpaceXAI)

1. Create a key at [console.x.ai](https://console.x.ai).
2. Either:
   - Open the app → **Settings** → paste `XAI_API_KEY`, or
   - Copy `.env.example` → `.env` and set `EXPO_PUBLIC_XAI_API_KEY=...` (restart Expo after).

> Client-side keys are fine for personal use only. For production, put the key on a server/proxy.

## Run

```bash
npm start          # Metro
npm run ios        # iOS Simulator
npm run android    # Android emulator
npm run typecheck
```

## Project layout

| Path | Purpose |
|------|---------|
| `App.tsx` | In-app shopping list (photos + aisles) |
| `src/services/vision.ts` | Photo → products (SpaceXAI) |
| `src/data/stores.ts` | Store aisle maps |
| `src/services/storage.ts` | Persist list, store, API key |
| `docs/` | Tooling notes |

## Notes

- Aisle numbers are **approximate** generic layouts; real stores differ by location.
- List data is stored on-device with AsyncStorage.
- Native `ios/` / `android/` folders are not generated (Expo managed + Expo Go).
