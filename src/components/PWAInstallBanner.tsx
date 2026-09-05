import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, ArrowRight, Truck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AddToHomeScreenModal } from './AddToHomeScreenModal';
import { Language } from '../translations';

interface Props {
  lang: Language;
}

export const PWAInstallBanner: React.FC<Props> = ({ lang }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    showInstallGuideModal,
    setShowInstallGuideModal,
    triggerInstall,
    openInNewTab,
  } = usePWAInstall();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('gaadi_pwa_banner_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('gaadi_pwa_banner_dismissed', 'true');
  };

  const handleOpenInstall = async () => {
    const res = await triggerInstall();
    if (res === 'manual') {
      setShowInstallGuideModal(true);
    }
  };

  // If already running as an installed PWA, do not show the banner
  if (isInstalled || isDismissed) {
    return (
      <AddToHomeScreenModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        lang={lang}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInIframe={isInIframe}
        onNativeInstall={triggerInstall}
        onOpenInNewTab={openInNewTab}
      />
    );
  }

  return (
    <>
      <div className="bg-[#1A1A1A] text-white px-3 sm:px-4 py-2.5 shadow-md sticky top-0 z-30 border-b border-[#333] transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          {/* Left Icon & Text */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-white truncate">
                  {lang === 'hi' ? 'गाड़ी हिसाब ऐप को होम स्क्रीन पर जोड़ें' : 'Add GAADI HISAAB to Home Screen'}
                </span>
                <span className="hidden md:inline-block bg-[#FF8C00]/20 text-[#FF8C00] text-[10px] font-black px-1.5 py-0.2 rounded border border-[#FF8C00]/40">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[#A0A09B] hidden sm:block truncate">
                {lang === 'hi'
                  ? 'मोबाइल ऐप की तरह 1-टैप में खोलें, बिना इंटरनेट भी चलेगा।'
                  : 'Install on your device for fast 1-tap diary access & offline sync.'}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenInstall}
              className="bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-xs transition active:scale-[0.98] flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi'
                  ? 'होम स्क्रीन पर जोड़ें'
                  : 'Add to Home Screen'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#A0A09B] hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      <AddToHomeScreenModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        lang={lang}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInIframe={isInIframe}
        onNativeInstall={triggerInstall}
        onOpenInNewTab={openInNewTab}
      />
    </>
  );
};
