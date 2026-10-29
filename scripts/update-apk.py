#!/usr/bin/env python3
import os
import sys
import zipfile
import hashlib
import base64
import subprocess
import shutil

def main():
    print("=== Updating ANATECH MARKET Android APK with Latest Web Assets ===")
    
    dist_dir = "dist"
    if not os.path.isdir(dist_dir):
        print("dist/ not found, running npm run build...")
        subprocess.check_call(["npm", "run", "build"])

    src_apk = "public/anatech-market.apk"
    if not os.path.isfile(src_apk):
        print(f"Error: Base APK {src_apk} not found.")
        sys.exit(1)

    work_dir = "/tmp/apk-update"
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)

    extracted_dir = os.path.join(work_dir, "extracted")
    os.makedirs(extracted_dir, exist_ok=True)

    # 1. Extract existing APK
    with zipfile.ZipFile(src_apk, "r") as z:
        z.extractall(extracted_dir)

    # 2. Clean out old assets/ and old META-INF/
    old_assets = os.path.join(extracted_dir, "assets")
    if os.path.exists(old_assets):
        shutil.rmtree(old_assets)
    os.makedirs(old_assets, exist_ok=True)

    old_meta = os.path.join(extracted_dir, "META-INF")
    if os.path.exists(old_meta):
        shutil.rmtree(old_meta)

    # 3. Copy all files from dist/ into assets/
    for root, dirs, files in os.walk(dist_dir):
        rel = os.path.relpath(root, dist_dir)
        target_root = os.path.join(old_assets, rel) if rel != "." else old_assets
        os.makedirs(target_root, exist_ok=True)
        for f in files:
            if f.endswith(".apk") or f.endswith(".idsig") or f.endswith(".zip"):
                continue
            src_file = os.path.join(root, f)
            dest_file = os.path.join(target_root, f)
            shutil.copy2(src_file, dest_file)

    # Sanitize index.html: remove crossorigin attributes for local file/webview origin
    index_html = os.path.join(old_assets, "index.html")
    if os.path.isfile(index_html):
        with open(index_html, "r", encoding="utf-8") as f:
            content = f.read()
        sanitized = content.replace(" crossorigin", "")
        with open(index_html, "w", encoding="utf-8") as f:
            f.write(sanitized)

    # 4. Extract release key and certificate from keystore
    keystore_path = "anatech-release.keystore"
    key_path = os.path.join(work_dir, "anatech.key")
    cert_path = os.path.join(work_dir, "anatech.crt")

    subprocess.check_call([
        "openssl", "pkcs12", "-in", keystore_path,
        "-passin", "pass:anatech123", "-nodes", "-nocerts",
        "-out", key_path
    ], stderr=subprocess.DEVNULL)

    subprocess.check_call([
        "openssl", "pkcs12", "-in", keystore_path,
        "-passin", "pass:anatech123", "-nokeys",
        "-out", cert_path
    ], stderr=subprocess.DEVNULL)

    # 5. Build list of files to sign (all files except META-INF)
    files_to_hash = []
    for root, dirs, files in os.walk(extracted_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, extracted_dir).replace("\\", "/")
            if not rel_path.startswith("META-INF/"):
                files_to_hash.append((rel_path, full_path))

    files_to_hash.sort(key=lambda x: x[0])

    # 6. Generate META-INF/MANIFEST.MF
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Created-By: 1.8.0 (ANATECH APK Builder)",
        ""
    ]
    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.8.0 (ANATECH APK Builder)",
    ]

    # Calculate individual file digests
    manifest_entries = {}
    for rel_path, full_path in files_to_hash:
        with open(full_path, "rb") as f:
            data = f.read()
        sha256 = base64.b64encode(hashlib.sha256(data).digest()).decode("ascii")
        sha1 = base64.b64encode(hashlib.sha1(data).digest()).decode("ascii")

        entry_lines = [
            f"Name: {rel_path}",
            f"SHA-256-Digest: {sha256}",
            f"SHA1-Digest: {sha1}",
            ""
        ]
        manifest_entries[rel_path] = "\r\n".join(entry_lines) + "\r\n"
        manifest_lines.extend(entry_lines)

    manifest_content = "\r\n".join(manifest_lines) + "\r\n"
    manifest_bytes = manifest_content.encode("utf-8")

    manifest_sha256 = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode("ascii")
    manifest_sha1 = base64.b64encode(hashlib.sha1(manifest_bytes).digest()).decode("ascii")

    sf_lines.append(f"SHA-256-Digest-Manifest: {manifest_sha256}")
    sf_lines.append(f"SHA1-Digest-Manifest: {manifest_sha1}")
    sf_lines.append("")

    for rel_path, entry_str in manifest_entries.items():
        entry_bytes = entry_str.encode("utf-8")
        entry_sha256 = base64.b64encode(hashlib.sha256(entry_bytes).digest()).decode("ascii")
        entry_sha1 = base64.b64encode(hashlib.sha1(entry_bytes).digest()).decode("ascii")
        sf_lines.extend([
            f"Name: {rel_path}",
            f"SHA-256-Digest: {entry_sha256}",
            f"SHA1-Digest: {entry_sha1}",
            ""
        ])

    sf_content = "\r\n".join(sf_lines) + "\r\n"
    sf_bytes = sf_content.encode("utf-8")

    meta_dir = os.path.join(extracted_dir, "META-INF")
    os.makedirs(meta_dir, exist_ok=True)

    manifest_file = os.path.join(meta_dir, "MANIFEST.MF")
    with open(manifest_file, "wb") as f:
        f.write(manifest_bytes)

    sf_file = os.path.join(meta_dir, "ANATECH.SF")
    with open(sf_file, "wb") as f:
        f.write(sf_bytes)

    rsa_file = os.path.join(meta_dir, "ANATECH.RSA")
    # Generate PKCS#7 signature over ANATECH.SF
    subprocess.check_call([
        "openssl", "smime", "-sign",
        "-in", sf_file,
        "-inkey", key_path,
        "-signer", cert_path,
        "-out", rsa_file,
        "-outform", "DER",
        "-binary", "-noattr"
    ], stderr=subprocess.DEVNULL)

    # 7. Package into final signed APK
    output_apk = os.path.join(work_dir, "anatech-market-signed.apk")
    with zipfile.ZipFile(output_apk, "w") as zout:
        # First write META-INF entries
        zout.write(manifest_file, "META-INF/MANIFEST.MF", compress_type=zipfile.ZIP_DEFLATED)
        zout.write(sf_file, "META-INF/ANATECH.SF", compress_type=zipfile.ZIP_DEFLATED)
        zout.write(rsa_file, "META-INF/ANATECH.RSA", compress_type=zipfile.ZIP_DEFLATED)

        # Write AndroidManifest.xml and resources.arsc uncompressed (required for Android APK alignment)
        for rel_path, full_path in files_to_hash:
            if rel_path in ("AndroidManifest.xml", "resources.arsc"):
                zout.write(full_path, rel_path, compress_type=zipfile.ZIP_STORED)
            else:
                zout.write(full_path, rel_path, compress_type=zipfile.ZIP_DEFLATED)

    apk_size = os.path.getsize(output_apk)
    print(f"Generated signed APK: {apk_size} bytes ({round(apk_size / 1024)} KB)")

    # 8. Copy to distribution locations
    shutil.copy2(output_apk, "public/anatech-market.apk")
    if os.path.isdir("dist"):
        shutil.copy2(output_apk, "dist/anatech-market.apk")

    artifact_dir = ".aistudio/artifacts/brain/d2987fa7-bfeb-4712-a59f-4447b93097f0"
    if os.path.isdir(artifact_dir):
        shutil.copy2(output_apk, os.path.join(artifact_dir, "anatech-market.apk"))
        print(f"Copied updated APK to {artifact_dir}/anatech-market.apk")

    # Update Android package bundle zip
    node_bundle_script = "scripts/package-android.js"
    if os.path.isfile(node_bundle_script):
        subprocess.run(["node", node_bundle_script], check=False)

    print("=== Standalone Android APK Updated Successfully ===")

if __name__ == "__main__":
    main()
