import React from 'react';
import {
  Smartphone,
  Share2,
  PlusSquare,
  X,
  ExternalLink,
  Download,
  CheckCircle,
  Truck,
  WifiOff,
  Zap,
  MoreVertical,
} from 'lucide-react';
import { Language } from '../translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInIframe: boolean;
  onNativeInstall: () => void;
  onOpenInNewTab: () => void;
}

export const AddToHomeScreenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lang,
  isInstallable,
  isIOS,
  isAndroid,
  isInIframe,
  onNativeInstall,
  onOpenInNewTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md border border-[#E5E5DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 pb-4 bg-linear-to-b from-[#FFF8E7] to-white border-b border-[#E5E5DF] relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#70706B] hover:text-[#1A1A1A] p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-md shrink-0 border-2 border-[#FF8C00]">
              <Truck className="w-7 h-7 text-[#FF8C00]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#FF8C00] text-white">
                  Mobile App
                </span>
                <span className="text-[11px] font-bold text-[#70706B]">PWA Diary</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#1A1A1A] leading-tight mt-0.5">
                {lang === 'hi' ? 'गाड़ी हिसाब को होम स्क्रीन पर जोड़ें' : 'Add GAADI HISAAB to Home Screen'}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-2.5 rounded-2xl">
              <Zap className="w-4 h-4 text-[#FF8C00] mx-auto mb-1" />
              <p className="font-bold text-[11px] text-[#1A1A1A]">
                {lang === 'hi' ? '1-टैप में खोलें' : '1-Tap Launch'}
              </p>
              <p className="text-[10px] text-[#70706B]">
                {lang === 'hi' ? 'बिना ब्राउज़र लिंक' : 'Instant app feel'}
              </p>
            </div>
            <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-2.5 rounded-2xl">
              <WifiOff className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-[11px] text-[#1A1A1A]">
                {lang === 'hi' ? 'ऑफलाइन सपोर्ट' : 'Works Offline'}
              </p>
              <p className="text-[10px] text-[#70706B]">
                {lang === 'hi' ? 'नेटवर्क न हो तो भी' : 'Safe local diary'}
              </p>
            </div>
            <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-2.5 rounded-2xl">
              <Smartphone className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="font-bold text-[11px] text-[#1A1A1A]">
                {lang === 'hi' ? 'सिर्फ 2MB' : 'Zero Storage'}
              </p>
              <p className="text-[10px] text-[#70706B]">
                {lang === 'hi' ? 'नो प्लेस्टोर झंझट' : 'Lightweight'}
              </p>
            </div>
          </div>

          {/* 1-Click Native Install (when browser prompt is available) */}
          {isInstallable && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onNativeInstall}
                className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-sm rounded-2xl shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>
                  {lang === 'hi'
                    ? '📲 अभी होम स्क्रीन पर इंस्टॉल करें (Install Now)'
                    : '📲 Install App on Home Screen Now'}
                </span>
              </button>
              <p className="text-[11px] text-center text-[#70706B]">
                {lang === 'hi'
                  ? 'यह आपके फोन की होम स्क्रीन पर असली ऐप जैसा आइकन बना देगा।'
                  : 'Adds the official icon to your device home screen for instant access.'}
              </p>
            </div>
          )}

          {/* If inside iframe, show recommendation to open in full tab for direct install */}
          {isInIframe && (
            <div className="bg-[#FFF8E7] border border-[#FDE68A] p-3 rounded-2xl space-y-2">
              <div className="flex items-start space-x-2">
                <ExternalLink className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">
                    {lang === 'hi' ? 'पूरे ब्राउज़र में खोलें' : 'Open in Full Browser Tab'}
                  </p>
                  <p className="text-[11px] text-[#70706B] leading-relaxed">
                    {lang === 'hi'
                      ? 'अपने फोन या कंप्यूटर पर सीधे होम स्क्रीन पर जोड़ने के लिए नई टैब में खोलें।'
                      : 'To get the browser’s automatic 1-click install prompt, open in a full window tab.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenInNewTab}
                className="w-full py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <span>{lang === 'hi' ? 'नई टैब में खोलें' : 'Open Full App in New Tab'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FF8C00]" />
              </button>
            </div>
          )}

          {/* Device-Specific Instructions */}
          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-3.5 rounded-2xl space-y-2.5">
              <p className="text-xs font-black text-[#1A1A1A] flex items-center space-x-1.5">
                <span>🍎</span>
                <span>
                  {lang === 'hi' ? 'iPhone / iPad पर कैसे जोड़ें:' : 'How to Add on iPhone / iPad (Safari):'}
                </span>
              </p>
              <div className="space-y-2 text-xs text-[#50504B]">
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <p>
                    {lang === 'hi' ? 'Safari के नीचे ' : 'Tap the '}
                    <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" />
                    <strong>{lang === 'hi' ? 'Share (शेयर)' : 'Share'}</strong>
                    {lang === 'hi' ? ' बटन दबाएं।' : ' button at bottom of Safari.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <p>
                    {lang === 'hi' ? 'नीचे स्क्रॉल करके ' : 'Scroll down and tap '}
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#1A1A1A]" />
                    <strong>{lang === 'hi' ? 'Add to Home Screen' : 'Add to Home Screen'}</strong>
                    {lang === 'hi' ? ' चुनें।' : '.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </span>
                  <p>
                    {lang === 'hi' ? 'ऊपर दाएं कोने में ' : 'Tap '}
                    <strong>{lang === 'hi' ? 'Add (जोड़ें)' : 'Add'}</strong>
                    {lang === 'hi' ? ' पर टैप करें। तैयार! 🎉' : ' at the top right. Done! 🎉'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Instructions */
            <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-3.5 rounded-2xl space-y-2.5">
              <p className="text-xs font-black text-[#1A1A1A] flex items-center space-x-1.5">
                <span>🤖</span>
                <span>
                  {lang === 'hi'
                    ? 'Android / Chrome में कैसे जोड़ें:'
                    : 'How to Add on Android / Chrome Browser:'}
                </span>
              </p>
              <div className="space-y-2 text-xs text-[#50504B]">
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <p>
                    {lang === 'hi' ? 'Chrome ब्राउज़र में ऊपर ' : 'Tap the '}
                    <MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-[#1A1A1A]" />
                    <strong>{lang === 'hi' ? '3 डॉट्स (Menu)' : '3 dots menu'}</strong>
                    {lang === 'hi' ? ' पर क्लिक करें।' : ' at the top right.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <p>
                    {lang === 'hi' ? 'मेनू में ' : 'Select '}
                    <Smartphone className="w-3.5 h-3.5 inline mx-1 text-[#FF8C00]" />
                    <strong>{lang === 'hi' ? '"Install app" या "Add to Home screen"' : '"Install app" or "Add to Home screen"'}</strong>
                    {lang === 'hi' ? ' चुनें।' : '.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </span>
                  <p>
                    {lang === 'hi' ? 'फिर ' : 'Then tap '}
                    <strong>{lang === 'hi' ? '"Install" / "Add"' : '"Install" / "Add"'}</strong>
                    {lang === 'hi' ? ' दबाएं। ऐप आपकी स्क्रीन पर आ जाएगी! 🚚' : '. The app will appear on your phone! 🚚'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F9F9F6] border-t border-[#E5E5DF] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white border border-[#D5D5CF] hover:bg-gray-50 text-[#1A1A1A] font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {lang === 'hi' ? 'बाद में (Dismiss)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
