import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, CheckCircle2, ShieldCheck, 
  ExternalLink, Copy, Check, QrCode, ArrowRight, Sparkles,
  Layers, HardDrive, WifiOff, Loader2, Link, FileCheck,
  AlertCircle
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  isInstallable: boolean;
  isAppInstalled: boolean;
  onTriggerInstall: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  isInstallable,
  isAppInstalled,
  onTriggerInstall
}) => {
  const [appUrlCopied, setAppUrlCopied] = useState(false);
  const [apkUrlCopied, setApkUrlCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [bundleDownloading, setBundleDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instant' | 'apk_guide' | 'qr'>('instant');
  const [qrTarget, setQrTarget] = useState<'apk' | 'app'>('apk');

  // Compute live active origin
  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-pre-5fon6ool6yd6xaiq4plbnm-14220259642.europe-west1.run.app';

  const appUrl = origin;
  const apkUrl = `${origin}/anatech-market.apk`;
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setAppUrlCopied(true);
    setTimeout(() => setAppUrlCopied(false), 2500);
  };

  const handleCopyApkUrl = () => {
    navigator.clipboard.writeText(apkUrl);
    setApkUrlCopied(true);
    setTimeout(() => setApkUrlCopied(false), 2500);
  };

  // Multi-tier direct APK download executor (Blob -> Data URI -> Direct Anchor)
  const triggerDirectApkDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      // Tier 1: Fetch as ArrayBuffer Blob (Bypasses iframe sandbox download navigation block)
      const response = await fetch('/api/download/apk');
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = 'anatech-market.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
        setDownloadSuccess(true);
        setDownloading(false);
        return;
      }
    } catch (err) {
      console.warn('Tier 1 blob download failed, trying base64 fallback:', err);
    }

    try {
      // Tier 2: Base64 JSON Data URI (Guaranteed in sandboxed browser iframes)
      const res = await fetch('/api/apk-base64');
      if (res.ok) {
        const data = await res.json();
        if (data.dataUri) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = data.dataUri;
          a.download = 'anatech-market.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setDownloadSuccess(true);
          setDownloading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Tier 2 base64 fallback failed, trying tier 3 direct anchor:', err);
    }

    // Tier 3: Standard anchor click
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = '/anatech-market.apk';
      a.download = 'anatech-market.apk';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('All download attempts encountered an issue:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Direct download for Android package zip bundle
  const triggerBundleDownload = async () => {
    setBundleDownloading(true);
    try {
      const res = await fetch('/api/download/bundle');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'anatech-market-android-bundle.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        return;
      }
    } catch (e) {
      console.warn('Bundle fetch fallback:', e);
    }
    const a = document.createElement('a');
    a.href = '/anatech-market-android-bundle.zip';
    a.download = 'anatech-market-android-bundle.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setBundleDownloading(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentQrUrl = qrTarget === 'apk' ? apkUrl : appUrl;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 relative my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 id="install-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Install on Android Device</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                  Signed APK
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly download the official ANATECH MARKET Android app (.apk)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close installation modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'instant'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct APK</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Phone QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('apk_guide')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'apk_guide'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Package Bundle</span>
          </button>
        </div>

        {/* Tab 1: Instant Direct APK Download */}
        {activeTab === 'instant' && (
          <div className="space-y-4">
            {/* Direct APK Download Card */}
            <div className="p-4 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border-2 border-cyan-500/50 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-950 dark:text-cyan-200 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Direct Download anatech-market.apk</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  502 KB · v1.2.0 (Camera Enabled)
                </span>
              </div>
              
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Fully self-contained, signed Android package with full hardware camera access (live viewfinder + device camera app), microphone for voice search, and embedded offline storage. Runs with zero network connection needed.
              </p>

              {/* Download Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={triggerDirectApkDownload}
                  disabled={downloading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing Direct Download...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download anatech-market.apk (Direct)</span>
                    </>
                  )}
                </button>

                {/* Direct Download Link Copy */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyApkUrl}
                    className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {apkUrlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{apkUrlCopied ? 'Direct APK Link Copied!' : 'Copy Direct APK Link (to paste on phone)'}</span>
                  </button>
                </div>
              </div>

              {/* Success Feedback Banner */}
              {downloadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold block">Download Triggered!</span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Check your browser's Downloads or notification tray. Tap the APK file to install on your phone.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Browser 1-Tap WebAPK fallback if available */}
            {isAppInstalled ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">ANATECH MARKET is Already Installed!</span>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Running in standalone app mode with offline database sync.
                  </span>
                </div>
              </div>
            ) : isInstallable && deferredPrompt ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Alternative: Install directly via Chrome WebAPK Prompt</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Install straight to your home screen with no APK sideload permissions needed.
                </p>
                <button
                  onClick={onTriggerInstall}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Trigger 1-Tap WebAPK Prompt</span>
                </button>
              </div>
            ) : null}

            {/* Step-by-Step Instructions */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                How to Install APK on Android:
              </span>
              <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal pl-4 leading-relaxed">
                <li>
                  Tap <strong>Download anatech-market.apk</strong> above.
                </li>
                <li>
                  Once downloaded, tap the notification in your status bar (or open Chrome &gt; Downloads).
                </li>
                <li>
                  If Android asks <em>"Install unknown apps"</em>, toggle <strong>Allow from this source</strong>, then tap <strong>Install</strong>.
                </li>
              </ol>
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg leading-relaxed">
                <span className="font-semibold block">Troubleshooting "App not installed":</span>
                If you previously installed an older preview or home screen shortcut of ANATECH MARKET, please uninstall or remove it first, then tap Install on this updated package.
              </div>
            </div>

            {/* App Features Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium">Safe & Signed (Package ug.anatech.marketapp)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-[11px] font-medium">Offline catalog & Uganda data saver</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile QR Code */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            {/* Toggle QR Target */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-500">QR Code Mode:</span>
              <button
                onClick={() => setQrTarget('apk')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  qrTarget === 'apk'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Direct APK Download
              </button>
              <button
                onClick={() => setQrTarget('app')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  qrTarget === 'app'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Open Web App
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentQrUrl)}&margin=6`}
                  alt="QR Code for ANATECH Mobile App"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {qrTarget === 'apk' ? 'Scan to Download APK Directly' : 'Scan to Open ANATECH MARKET on Phone'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {qrTarget === 'apk' ? 'Point phone camera at screen — prompts direct file download' : 'Opens in your phone browser with instant install prompt'}
                </span>
              </div>
            </div>

            {/* Copyable Link */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={currentQrUrl}
                className="flex-1 px-2 bg-transparent text-xs text-slate-700 dark:text-slate-300 truncate focus:outline-hidden"
              />
              <button
                onClick={qrTarget === 'apk' ? handleCopyApkUrl : handleCopyAppUrl}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              >
                {(qrTarget === 'apk' ? apkUrlCopied : appUrlCopied) ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Raw APK Package Generator & Developer Bundle */}
        {activeTab === 'apk_guide' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              If you require a standalone package binary for sideloading or sharing via WhatsApp, Telegram, or flash drive:
            </p>

            {/* Direct Download Android Package Bundle */}
            <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 space-y-2">
              <span className="font-bold text-cyan-950 dark:text-cyan-200 block flex items-center gap-1.5">
                <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Download Android Package Bundle (.zip)</span>
              </span>
              <p className="text-[11px] text-cyan-800/90 dark:text-cyan-300/90">
                Includes AndroidManifest.xml, high-res mipmap launcher icons, signed classes.dex, Gradle configuration, and Google TWA manifest.
              </p>
              <button
                onClick={triggerBundleDownload}
                disabled={bundleDownloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {bundleDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Downloading Bundle...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Android Bundle (.zip)</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Cloud APK Compiler (PWABuilder)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PWABuilder uses our pre-configured Web App Manifest to compile an Android APK package in the cloud with zero command-line tools.
              </p>
              <a
                href={pwaBuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <span>Generate APK via PWABuilder Cloud</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Google Bubblewrap CLI (TWA APK)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Run this command locally with the Android SDK to recompile using <code>twa-manifest.json</code>:
              </p>
              <pre className="p-2.5 bg-slate-900 text-cyan-300 rounded-lg font-mono text-[11px] overflow-x-auto">
npx @bubblewrap/cli build
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            ANATECH MARKET v1.2.0 · Live Camera & Offline Enabled Signed APK (502 KB)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
