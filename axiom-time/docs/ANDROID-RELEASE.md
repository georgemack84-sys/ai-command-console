# Android release bundle

`npm run android:release` produces a signed Android App Bundle (`.aab`) for Play Console submission. It deliberately fails when signing credentials are absent; it never falls back to a debug key.

Set these process environment variables in a secure terminal or CI secret store. Do not put passwords or keystores in the repository.

```powershell
$env:AXIOM_ANDROID_KEYSTORE_PATH = "C:\secure\axiom-time-upload.jks"
$env:AXIOM_ANDROID_KEYSTORE_PASSWORD = "..."
$env:AXIOM_ANDROID_KEY_ALIAS = "..."
$env:AXIOM_ANDROID_KEY_PASSWORD = "..."
npm run mobile:sync
npm run android:release
```

The resulting file is `android/app/build/outputs/bundle/release/app-release.aab`.

Before uploading, verify the bundle signature and run the device QA checklist. This project intentionally does not create, store, or export a signing key.

## Direct private distribution

For direct installation outside Google Play, use the same signing variables and run:

```powershell
npm run android:release:apk
```

The signed APK is `android/app/build/outputs/apk/release/app-release.apk`. Recipients must explicitly allow installs from the app they use to open the file. Share it only through a trusted channel, and do not describe it as a Play Store release.
