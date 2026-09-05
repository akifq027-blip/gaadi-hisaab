import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  useEffect(() => {
    // Check if in iframe
    try {
      const inFrame = window.self !== window.top;
      setIsInIframe(inFrame);
    } catch {
      setIsInIframe(true);
    }

    // Check if already in standalone mode (already installed on phone / PC)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Platform detection
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    const isDroid = /android/.test(userAgent);

    setIsIOS(isApple && !isStandalone);
    setIsAndroid(isDroid && !isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallGuideModal(false);
      console.log('✅ Gaadi Hisaab successfully added to home screen!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          setShowInstallGuideModal(false);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
      }
    }

    // If native prompt is not available (iOS, in iframe, or browser where event already handled), show visual guide modal
    setShowInstallGuideModal(true);
    return 'manual';
  }, [deferredPrompt]);

  const openInNewTab = useCallback(() => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    showInstallGuideModal,
    setShowInstallGuideModal,
    triggerInstall,
    openInNewTab,
  };
}
