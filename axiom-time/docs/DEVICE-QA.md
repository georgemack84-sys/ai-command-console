# Android device QA

## Prerequisites

- Enable developer options and USB debugging on an Android device.
- Connect it by USB, then confirm it appears in `adb devices -l`.
- Build the APK with `npm run android:build`.

## Install

```powershell
.tools\android-sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

## Required checks

1. Add an alarm two minutes ahead; grant notifications when asked and confirm delivery with the app open, backgrounded, and force-closed.
2. Disable, re-enable, and delete an alarm; confirm native delivery matches each state.
3. In Android Settings, disable exact alarms for Axiom Time, create another alarm, and confirm the app reports potentially inexact delivery without losing the alarm.
4. Change the device timezone, then repeat the alarm test. Repeat across the next daylight-saving transition where practical.
5. Create a timer and stopwatch, force-close the app, then reopen it and confirm their recovered state is sensible.
6. Turn on airplane mode and verify optional weather actions fail clearly while core time tools continue to work.
7. Enable TalkBack, large text, and increased contrast; operate every visible control without relying on color alone.

Record device model, Android version, app version, and pass/fail result for each check before release.
