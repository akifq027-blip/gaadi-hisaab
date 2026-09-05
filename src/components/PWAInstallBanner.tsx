import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language, translations } from '../translations';

interface Props {
  lang: Language;
}

export const PWAInstallBanner: React.FC<Props> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const t = translations[lang];

  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      triggerInstall();
    }
  };

  return (
    <>
      <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md text-sm sticky top-0 z-30 animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-xs sm:text-sm truncate">
              {t.installApp}
            </p>
            <p className="text-[11px] text-amber-100 hidden sm:block truncate">
              {t.installAppDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all active:scale-95"
          >
            {isIOS ? 'Install (iOS)' : 'Install App'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/80 hover:text-white p-1 rounded-md"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Manual Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-black text-amber-700">GH</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Install Gaadi Hisaab</h3>
              <p className="text-xs text-slate-500 mt-1">
                Install as a native app on your iPhone or iPad for quick 1-tap diary access
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" />{' '}
                  <strong>Share</strong> button at bottom of Safari.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Scroll down and tap{' '}
                  <strong className="inline-flex items-center">
                    <PlusSquare className="w-3.5 h-3.5 inline mr-1 text-slate-800" /> Add to Home Screen
                  </strong>
                  .
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p>
                  Tap <strong>Add</strong> at top-right corner. Done! 🚚
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
