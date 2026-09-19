# Release hardening status

The standalone app now validates persisted alarms, timers, and stopwatch state before use. Data is written in a versioned envelope and a valid legacy record is migrated on its next save. Unreadable, malformed, or internally inconsistent state is safely ignored instead of breaking the workspace.

Time-management actions record a bounded local audit trail (200 most recent entries). This log is intentionally device-local and must not contain user command text, location, or credentials.

Before a store or production release, complete these qualification checks on physical Android and iOS devices:

- Grant, deny, then re-grant notification permission; verify the app communicates each outcome.
- Create, disable, re-enable, and delete both one-time and daily alarms; verify native notifications survive app termination and device restart.
- Verify alarms across daylight-saving transitions and after timezone changes.
- Exercise timer/stopwatch recovery after force-close, storage pressure, and an app upgrade.
- Test voice, weather, and Proprium adapter failure paths with no network and unavailable adapter services.
- Run an accessibility pass with VoiceOver/TalkBack, keyboard navigation, reduced motion, large text, and contrast settings.

Android release builds declare exact-alarm permission and report an inexact schedule to the user when the OS declines exact timing. Native scheduling also reports notification denial and other scheduling failures without losing the local alarm.

Android debug compilation is verified with a project-local Temurin JDK 21 and Android API 36 SDK. iOS archive validation must still run on macOS with Xcode.
