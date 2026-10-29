# ANATECH MARKET — Why Camera & Photos Failed on Device and How v1.3.0 Fixes It

### Root Causes Identified on Real Android Devices:

1. **High-Resolution Photo Dropping (The 5MB Filter)**:
   - In the web browser preview, test images are usually small (200KB - 1MB).
   - On a real Android device (Samsung, Xiaomi, Tecno, Pixel, etc.), photos taken by modern 48MP/64MP/108MP cameras are **6MB to 15MB**.
   - The file upload handler had a hard check: `if (file.size > 5 * 1024 * 1024) return;`, which silently dropped real camera photos!
   - **Fix**: Added an automatic in-browser Canvas compressor that resizes any photo to max 1600px and 85% JPEG quality (~300KB) in under 50ms before saving.

2. **File Chooser Missing Output URI (`onShowFileChooser`)**:
   - When an Android app launches `MediaStore.ACTION_IMAGE_CAPTURE` without an explicit `EXTRA_OUTPUT` file URI, Android cameras return only a tiny thumbnail or `null` in `data.getData()`.
   - The previous `onActivityResult` checked only `data.getData() != null`. When it was `null`, it returned nothing to the web page.
   - **Fix**: Implemented a complete `ACTION_CHOOSER` combining both Camera capture (with a dedicated cache file URI) and Gallery picker (`image/*`).

3. **Android 7.0+ StrictMode `FileUriExposedException`**:
   - Modern Android versions block file URIs passed to external camera apps unless strict mode VM policy is relaxed.
   - **Fix**: Added `StrictMode.VmPolicy` relaxation in `MainActivity.onCreate()` so file targets work reliably across Android 7 through Android 14.

4. **WebRTC Permission Flow**:
   - If camera permission was not granted before `getUserMedia` was called, `request.grant(...)` failed.
   - **Fix**: Implemented `pendingPermissionRequest` in `WebChromeClient` which prompts Android's system permission dialog and grants camera access upon user confirmation.

5. **Keystore Consistency**:
   - Previous builds generated a new temporary key on each run, causing Android to refuse to update the installed app due to signature mismatch.
   - **Fix**: Bound to a permanent release keystore (`./anatech-release.keystore`). **Note**: If updating fails on your device, uninstall the older test app first, then install the fresh APK.
