# Mobile development prerequisites (Android + iOS)

Target machine: macOS Apple Silicon. Repo root: `Grok_Worktree01`.

## Status summary

| Component | Status | Location / notes |
|-----------|--------|------------------|
| Node.js | Ready | v22.14.0 at `~/.local/node` |
| JDK 17 (Temurin) | Ready | `~/.local/opt/jdk-17` |
| Android SDK | Ready | `~/Library/Android/sdk` |
| Android platform-tools (`adb`) | Ready | API 35, build-tools 35.0.0 |
| Android emulator + AVD | Ready | AVD name: `Pixel_8_API_35` |
| Ruby 3.3.8 (rbenv) | Ready | `~/.rbenv/versions/3.3.8` |
| CocoaPods | Ready | 1.17.0 |
| Homebrew | Not installed | Needs admin password (`sudo`) |
| **Xcode** | Ready | Xcode 26.6 (Build 17F113) at `/Applications/Xcode.app` |
| iOS SDK + Simulator | Ready | iOS 26.5 runtime (`23F77`), devices e.g. iPhone 17 Pro |
| Xcode Command Line Tools | Present | Developer dir points at full Xcode |

## Environment variables

Added to `~/.zshrc` under the `mobile-dev-prereqs` block. Reload with:

```bash
source ~/.zshrc
# or from the repo:
source scripts/load-mobile-env.sh
```

| Variable | Value |
|----------|--------|
| `JAVA_HOME` | `$HOME/.local/opt/jdk-17` |
| `ANDROID_HOME` | `$HOME/Library/Android/sdk` |
| `ANDROID_SDK_ROOT` | same as `ANDROID_HOME` |

## Verify installs

```bash
source scripts/load-mobile-env.sh
java -version
adb version
sdkmanager --list_installed | head
emulator -list-avds
node -v
```

Start the Android emulator:

```bash
emulator -avd Pixel_8_API_35 &
adb devices
```

## iOS status

Xcode and the iOS 26.5 Simulator runtime are installed and usable from the CLI.

```bash
xcodebuild -version
xcrun simctl list devices available
open -a Simulator
```

CocoaPods is ready (`pod --version` → 1.17.0). The first iOS build will run `pod install` in the app’s `ios/` folder.

For a physical iPhone: connect the device, trust the computer, and sign with your Apple ID in Xcode → Settings → Accounts.

## Optional but useful later

| Tool | Why |
|------|-----|
| Homebrew | Easier upgrades (`watchman`, `scrcpy`, etc.) |
| Watchman | Faster React Native file watching |
| Android Studio | GUI for SDK/AVD (CLI SDK is already installed) |
| Expo account | EAS Build / cloud iOS builds without local Xcode |

## Suggested app stack (not scaffolded yet)

Cross-platform options that fit this environment:

1. **Expo (React Native)** — best fit with Node already installed; Android ready; iOS after Xcode.
2. **Flutter** — would need the Flutter SDK install.
3. **Native** — separate Kotlin (Android) + Swift (iOS) projects.

When you pick a stack, we can scaffold into this repo on `main`.

## Android packages installed

- `platform-tools`
- `platforms;android-35`
- `build-tools;35.0.0`
- `emulator`
- `system-images;android-35;google_apis;arm64-v8a`
- `cmdline-tools;latest`
- `sources;android-35`
