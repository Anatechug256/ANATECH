#!/bin/bash
set -e

echo "=== Building Fully Standalone Android APK with Live Camera & Photo Picker for ANATECH MARKET ==="

# Step 1: Build the web application with relative assets
echo "1. Building production web assets..."
npm run build

BUILD_DIR="/tmp/apk-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/java/ug/anatech/marketapp"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-mdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets"

# Step 2: Copy icons
echo "2. Copying launcher icons..."
cp public/icon-192.png "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp public/icon-192.png "$BUILD_DIR/res/mipmap-mdpi/ic_launcher.png"
cp public/icon-192.png "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp public/icon-192.png "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
cp public/icon-512.png "$BUILD_DIR/res/mipmap-xxxhdpi/ic_launcher.png"

# Step 3: Embed full web app into APK assets/ folder
echo "3. Packaging built web app into assets/..."
cp -r dist/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR/assets/anatech-market.apk" "$BUILD_DIR/assets/anatech-market.apk.idsig" "$BUILD_DIR/assets/anatech-market-android-bundle.zip"

# Remove any crossorigin attributes from embedded index.html so WebView loads file:/// or local origin without CORS issues
if [ -f "$BUILD_DIR/assets/index.html" ]; then
    sed -i 's/ crossorigin//g' "$BUILD_DIR/assets/index.html"
fi

# Step 4: Generate XML resources
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ANATECH MARKET</string>
</resources>
EOF

cat << 'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#06B6D4</color>
    <color name="colorPrimaryDark">#0A192F</color>
    <color name="colorAccent">#F59E0B</color>
</resources>
EOF

# Step 5: AndroidManifest.xml with complete camera, audio, storage, and location permissions
# Package is set to ug.anatech.marketapp to avoid conflicts with previous installations or WebAPKs
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ug.anatech.marketapp"
    android:versionCode="10"
    android:versionName="1.6.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <!-- Network permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera hardware & live video streaming permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.camera.front" android:required="false" />

    <!-- Microphone & Audio for Voice Search -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Location for District auto-detection -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Storage for Photo Gallery picker and saving images (all Android versions) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name="ug.anatech.marketapp.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Step 6: Native Android LocalServer.java
cat << 'EOF' > "$BUILD_DIR/java/ug/anatech/marketapp/LocalServer.java"
package ug.anatech.marketapp;

import android.content.Context;
import android.content.res.AssetManager;
import java.io.*;
import java.net.*;

public class LocalServer {
    private ServerSocket serverSocket;
    private int port = 8088;
    private Context context;
    private volatile boolean running = false;

    public LocalServer(Context context) {
        this.context = context;
    }

    public int start() {
        try {
            serverSocket = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
            port = serverSocket.getLocalPort();
            running = true;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    while (running) {
                        try {
                            Socket client = serverSocket.accept();
                            handleClient(client);
                        } catch (Exception e) {
                            // socket closed
                        }
                    }
                }
            }).start();
            return port;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    private void handleClient(final Socket socket) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                    OutputStream out = socket.getOutputStream();
                    String line = in.readLine();
                    if (line == null) {
                        socket.close();
                        return;
                    }

                    // Consume all incoming request headers to prevent socket RST
                    String headerLine;
                    while ((headerLine = in.readLine()) != null) {
                        if (headerLine.trim().isEmpty()) {
                            break;
                        }
                    }

                    String[] parts = line.split(" ");
                    if (parts.length < 2) {
                        socket.close();
                        return;
                    }
                    String method = parts[0];
                    String path = parts[1];
                    if (path.contains("?")) {
                        path = path.substring(0, path.indexOf("?"));
                    }
                    try {
                        path = URLDecoder.decode(path, "UTF-8");
                    } catch (Exception ignored) {}

                    if (path.equals("/") || path.isEmpty()) {
                        path = "/index.html";
                    }
                    String assetPath = path.startsWith("/") ? path.substring(1) : path;

                    AssetManager am = context.getAssets();
                    InputStream is = null;
                    try {
                        is = am.open(assetPath);
                    } catch (IOException e) {
                        // SPA fallback: return index.html for unknown client-side routes
                        try {
                            is = am.open("index.html");
                            assetPath = "index.html";
                        } catch (IOException ex) {
                            // not found
                        }
                    }

                    if (is == null) {
                        out.write("HTTP/1.1 404 Not Found\r\n\r\n".getBytes());
                        out.flush();
                        socket.close();
                        return;
                    }

                    String contentType = "text/html; charset=utf-8";
                    if (assetPath.endsWith(".js")) contentType = "application/javascript; charset=utf-8";
                    else if (assetPath.endsWith(".css")) contentType = "text/css; charset=utf-8";
                    else if (assetPath.endsWith(".png")) contentType = "image/png";
                    else if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) contentType = "image/jpeg";
                    else if (assetPath.endsWith(".svg")) contentType = "image/svg+xml";
                    else if (assetPath.endsWith(".webp")) contentType = "image/webp";
                    else if (assetPath.endsWith(".json") || assetPath.endsWith(".webmanifest")) contentType = "application/json; charset=utf-8";
                    else if (assetPath.endsWith(".woff2")) contentType = "font/woff2";
                    else if (assetPath.endsWith(".ico")) contentType = "image/x-icon";

                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    byte[] data = new byte[8192];
                    int nRead;
                    while ((nRead = is.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, nRead);
                    }
                    byte[] body = buffer.toByteArray();
                    is.close();

                    String header = "HTTP/1.1 200 OK\r\n" +
                            "Content-Type: " + contentType + "\r\n" +
                            "Content-Length: " + body.length + "\r\n" +
                            "Access-Control-Allow-Origin: *\r\n" +
                            "Cache-Control: no-cache\r\n" +
                            "Connection: close\r\n\r\n";
                    out.write(header.getBytes());
                    if (!"HEAD".equalsIgnoreCase(method)) {
                        out.write(body);
                    }
                    out.flush();
                    socket.close();
                } catch (Exception e) {
                    try { socket.close(); } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    public void stop() {
        running = false;
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (Exception ignored) {}
    }
}
EOF

# Step 7: Native Android MainActivity.java
cat << 'EOF' > "$BUILD_DIR/java/ug/anatech/marketapp/MainActivity.java"
package ug.anatech.marketapp;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.StrictMode;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;

public class MainActivity extends Activity {
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final int FILE_CHOOSER_REQ_CODE = 2002;
    private static final int CAMERA_PERMISSION_REQ_CODE = 3003;

    private WebView webView;
    private LocalServer localServer;
    private ValueCallback<Uri[]> uploadMessage;
    private Uri cameraImageUri = null;
    private PermissionRequest pendingPermissionRequest = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Relax strict mode VM policy so file URIs can be passed to Camera intent without FileUriExposedException
        try {
            StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
            StrictMode.setVmPolicy(builder.build());
        } catch (Exception ignored) {}

        // Proactively request runtime dangerous permissions on Android 6.0+ (API 23+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = new String[]{
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE"
            };
            boolean needsRequest = false;
            for (String p : permissions) {
                if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                    needsRequest = true;
                    break;
                }
            }
            if (needsRequest) {
                requestPermissions(permissions, PERMISSION_REQ_CODE);
            }
        }

        // Start embedded local secure server for assets
        localServer = new LocalServer(this);
        int localPort = localServer.start();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        // Allows getUserMedia camera video streams to autoplay smoothly without waiting for an extra touch gesture
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("mailto:") || url.startsWith("sms:") || url.contains("wa.me/"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        MainActivity.this.startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return false;
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (request == null) return;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            boolean hasCamera = checkSelfPermission("android.permission.CAMERA") == PackageManager.PERMISSION_GRANTED;
                            if (!hasCamera) {
                                pendingPermissionRequest = request;
                                requestPermissions(new String[]{
                                    "android.permission.CAMERA",
                                    "android.permission.RECORD_AUDIO"
                                }, CAMERA_PERMISSION_REQ_CODE);
                                return;
                            }
                        }
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (callback != null) {
                    callback.invoke(origin, true, false);
                }
            }

            // Handles HTML5 <input type="file" capture="environment"> and photo pickers
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;

                // 1. Prepare Camera capture intent with direct file target
                Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                try {
                    File cacheDir = getExternalCacheDir();
                    if (cacheDir == null) {
                        cacheDir = getCacheDir();
                    }
                    File photoFile = new File(cacheDir, "camera_" + System.currentTimeMillis() + ".jpg");
                    cameraImageUri = Uri.fromFile(photoFile);
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri);
                } catch (Exception e) {
                    cameraImageUri = null;
                }

                // 2. Prepare Gallery / Photo picker intent
                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("image/*");
                if (fileChooserParams != null && fileChooserParams.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    contentSelectionIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }

                Intent[] intentArray = (takePictureIntent != null && cameraImageUri != null)
                    ? new Intent[]{ takePictureIntent }
                    : new Intent[0];

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Photo or Take Picture");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                try {
                    startActivityForResult(chooserIntent, FILE_CHOOSER_REQ_CODE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    uploadMessage = null;
                    return false;
                }
            }
        });

        if (localPort > 0) {
            // Load via http://127.0.0.1:<port>/ -> Secure Context for camera & WebRTC!
            webView.loadUrl("http://127.0.0.1:" + localPort + "/index.html");
        } else {
            // Fallback to direct asset
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQ_CODE && pendingPermissionRequest != null) {
            boolean granted = false;
            for (int r : grantResults) {
                if (r == PackageManager.PERMISSION_GRANTED) {
                    granted = true;
                    break;
                }
            }
            if (granted) {
                pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
            } else {
                pendingPermissionRequest.deny();
            }
            pendingPermissionRequest = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQ_CODE) {
            if (uploadMessage == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK) {
                // Case A: Image captured via Camera Intent
                if (data == null || (data.getData() == null && data.getClipData() == null)) {
                    if (cameraImageUri != null) {
                        try {
                            File f = new File(cameraImageUri.getPath());
                            if (f.exists() && f.length() > 0) {
                                results = new Uri[]{ cameraImageUri };
                            }
                        } catch (Exception ignored) {}
                    }
                } else if (data.getData() != null) {
                    // Case B: Single image from gallery picker
                    results = new Uri[]{ data.getData() };
                } else if (data.getClipData() != null) {
                    // Case C: Multiple images selected from gallery
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            uploadMessage.onReceiveValue(results);
            uploadMessage = null;
            cameraImageUri = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (localServer != null) {
            localServer.stop();
        }
    }
}
EOF

# Step 8: Compile Java files and generate Dalvik Executable (classes.dex)
echo "4. Compiling Java sources with javac and dx (dalvik-exchange)..."
javac -cp /usr/lib/android-sdk/platforms/android-23/android.jar -source 1.8 -target 1.8 -d "$BUILD_DIR/bin" "$BUILD_DIR/java/ug/anatech/marketapp/"*.java
dalvik-exchange --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/bin"

# Step 9: Package APK with aapt (including assets/ and resources)
echo "5. Packaging APK with aapt..."
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
aapt package -F "$BUILD_DIR/unaligned.apk" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -f

# Step 10: Add classes.dex into unaligned APK
echo "6. Adding classes.dex into APK..."
(cd "$BUILD_DIR" && aapt add unaligned.apk classes.dex)

# Step 11: Align APK with zipalign
echo "7. Aligning APK with zipalign..."
zipalign -f -v 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk"

# Step 12: Generate keystore with startdate in 2020 so ALL Android devices (2020-2047) pass certificate validation
echo "8. Checking release keystore with broad device validity (startdate 2020)..."
KEYSTORE="$(pwd)/anatech-release.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias anatech \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -startdate "2020/01/01 00:00:00" \
        -storepass anatech123 \
        -keypass anatech123 \
        -dname "CN=ANATECH MARKET, OU=Mobile, O=ANATECH UG, L=Kampala, ST=Central, C=UG"
fi

# Step 13: Sign APK with apksigner (v1, v2, v3) and min-sdk 21
echo "9. Signing APK with apksigner (v1 + v2 + v3, min-sdk 21)..."
mkdir -p public dist
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias anatech \
    --ks-pass pass:anatech123 \
    --key-pass pass:anatech123 \
    --min-sdk-version 21 \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    --out "public/anatech-market.apk" \
    "$BUILD_DIR/aligned.apk"

# Copy to dist so production server serves it too
cp "public/anatech-market.apk" "dist/anatech-market.apk"

# Also package zip bundle
python3 -c "import zipfile, os; z = zipfile.ZipFile('public/anatech-market-android-bundle.zip', 'w', zipfile.ZIP_DEFLATED); z.write('public/anatech-market.apk', 'anatech-market.apk'); z.write('public/manifest.json', 'manifest.json'); z.close(); os.system('cp public/anatech-market-android-bundle.zip dist/')"

# Also copy to artifacts directory
mkdir -p .aistudio/artifacts/brain/d2987fa7-bfeb-4712-a59f-4447b93097f0
cp "public/anatech-market.apk" ".aistudio/artifacts/brain/d2987fa7-bfeb-4712-a59f-4447b93097f0/anatech-market.apk"

echo "10. Verifying APK signature..."
apksigner verify -v "public/anatech-market.apk"

echo "=== APK build complete successfully! ==="
ls -lh public/anatech-market.apk public/anatech-market-android-bundle.zip
