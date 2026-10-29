import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createZip(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const contentBuf = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8');
    const crc = crc32(contentBuf);
    const uncompressedSize = contentBuf.length;
    
    // Store uncompressed (method 0) or deflate (method 8)
    const compressedBuf = zlib.deflateRawSync(contentBuf);
    const useDeflate = compressedBuf.length < uncompressedSize;
    const finalData = useDeflate ? compressedBuf : contentBuf;
    const method = useDeflate ? 8 : 0;
    const compressedSize = finalData.length;

    // Local file header (30 bytes)
    const localHeader = Buffer.alloc(30);
    localHeader.write('PK\x03\x04', 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6);  // flags
    localHeader.writeUInt16LE(method, 8); // compression method
    localHeader.writeUInt16LE(0, 10); // time
    localHeader.writeUInt16LE(0, 12); // date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    localHeaders.push(localHeader, nameBuf, finalData);

    // Central directory header (46 bytes)
    const centralHeader = Buffer.alloc(46);
    centralHeader.write('PK\x01\x02', 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8);  // flags
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk start
    centralHeader.writeUInt16LE(0, 36); // internal attr
    centralHeader.writeUInt32LE(0, 38); // external attr
    centralHeader.writeUInt32LE(offset, 42); // relative offset

    centralHeaders.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + finalData.length;
  }

  const centralDirOffset = offset;
  const centralDirData = Buffer.concat(centralHeaders);
  const centralDirSize = centralDirData.length;

  // End of Central Directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.write('PK\x05\x06', 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(files.length, 8); // total records on disk
  eocd.writeUInt16LE(files.length, 10); // total records
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, centralDirData, eocd]);
}

const manifestJson = fs.readFileSync('public/manifest.json', 'utf8');
const twaManifestJson = fs.readFileSync('twa-manifest.json', 'utf8');
const icon192 = fs.readFileSync('public/icon-192.png');
const icon512 = fs.readFileSync('public/icon-512.png');
const iconMaskable512 = fs.readFileSync('public/icon-maskable-512.png');
const assetlinks = fs.readFileSync('public/.well-known/assetlinks.json', 'utf8');

const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ug.anatech.market">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ANATECH MARKET"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar">

        <meta-data
            android:name="asset_statements"
            android:value="[{ 'relation': ['delegate_permission/common.handle_all_urls'], 'target': { 'namespace': 'android_app', 'package_name': 'ug.anatech.market' } }]" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="ANATECH MARKET"
            android:exported="true">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://ais-pre-5fon6ool6yd6xaiq4plbnm-14220259642.europe-west1.run.app" />

            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/navigationColor" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="ais-pre-5fon6ool6yd6xaiq4plbnm-14220259642.europe-west1.run.app" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

const buildGradle = `apply plugin: 'com.android.application'

android {
    namespace 'ug.anatech.market'
    compileSdkVersion 34

    defaultConfig {
        applicationId "ug.anatech.market"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}`;

const readme = `# ANATECH MARKET Uganda - Android Package (APK & WebAPK)

## Quick Direct Install on Android Phone:
1. Open https://ais-pre-5fon6ool6yd6xaiq4plbnm-14220259642.europe-west1.run.app in Chrome on your Android phone.
2. Tap "Install App" in the top bar, or tap Chrome's menu (⋮) -> "Install App".
3. Android Google Play Services immediately packages and installs the signed WebAPK directly into your phone's app drawer!

## Standalone APK Generation via PWABuilder (1-Click Cloud Build):
1. Visit: https://www.pwabuilder.com/reportcard?site=https%3A%2F%2Fais-pre-5fon6ool6yd6xaiq4plbnm-14220259642.europe-west1.run.app
2. Click "Package for Android".
3. Download the compiled .apk or .aab directly!

## Local Bubblewrap Build:
Run:
\`\`\`bash
npx @bubblewrap/cli build
\`\`\`
`;

const zip = createZip([
  { name: 'README.md', content: readme },
  { name: 'twa-manifest.json', content: twaManifestJson },
  { name: 'manifest.json', content: manifestJson },
  { name: 'AndroidManifest.xml', content: androidManifestXml },
  { name: 'build.gradle', content: buildGradle },
  { name: 'assetlinks.json', content: assetlinks },
  { name: 'res/mipmap-xxxhdpi/ic_launcher.png', content: icon512 },
  { name: 'res/mipmap-xxhdpi/ic_launcher.png', content: icon192 },
  { name: 'res/mipmap-xxxhdpi/ic_launcher_maskable.png', content: iconMaskable512 }
]);

fs.writeFileSync('public/anatech-market-android-bundle.zip', zip);
console.log('Created public/anatech-market-android-bundle.zip, size:', zip.length, 'bytes');
