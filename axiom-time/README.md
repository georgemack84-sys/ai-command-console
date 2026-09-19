# Axiom Time

The standalone temporal-awareness prototype for Axiom OS.

## Current scope

This initial implementation covers the roadmap's first six dependencies:

- Phase 0: strict TypeScript, linting, formatting, tests, environment template, and global error recovery.
- Phase 1: timezone-aware deterministic temporal state, daylight-saving detection, and a monotonic timer primitive.
- Phase 2: an accessible, responsive ambient clock display.
- Phase 3: a deterministic mutation state derived from the authoritative day period.
- Phases 4–5: local, persistent alarms, timers, and stopwatch controls.
- Phase 6: a normalized Time Horizon that orders the next alarm and active timer.
- Phase 7: an optional Open-Meteo weather adapter activated only by a user-supplied city.
- Governed command handling: text and optional browser voice resolve to typed intents and require explicit approval before time services mutate.
- Native delivery: Capacitor Android/iOS projects, local-notification scheduling, explicit permission and inexact-delivery feedback, and Android exact-alarm configuration.
- Reliability: versioned validated local persistence, a bounded device-local audit trail, malformed-data recovery, and regression coverage.

The agent contracts are intentionally data-only. Agents do not exist yet, and no future agent may directly mutate authoritative time state.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run mobile:sync
npm run android:build
```

## Release qualification

The JavaScript bundle, native project synchronization, and automated tests are verified. Before release, run the physical-device checklist in [docs/HARDENING.md](docs/HARDENING.md), including notification permission, background delivery, timezone/DST, accessibility, and offline-adapter scenarios.

Use [docs/DEVICE-QA.md](docs/DEVICE-QA.md) to install the APK and record Android device results.

For a signed Play Store bundle, follow [docs/ANDROID-RELEASE.md](docs/ANDROID-RELEASE.md). Signing credentials are required and are never stored in this project.

For private Android installation outside Play Console, use `npm run android:release:apk` after setting the same signing variables.

Android debug compilation uses a project-local JDK and Android SDK when present; iOS archive validation requires Xcode on macOS.
