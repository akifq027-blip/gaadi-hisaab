import React from 'react';
import { Home, Calendar, Plus, Truck, Menu } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddHisaab: () => void;
  lang: Language;
}

export const BottomNav: React.FC<Props> = ({
  currentTab,
  onTabChange,
  onOpenAddHisaab,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E5DF] shadow-md px-3 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around relative">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-center transition ${
            currentTab === 'home' ? 'text-[#FF8C00] font-black' : 'text-[#70706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider">{t.navHome}</span>
        </button>

        {/* 2. Hisaab Diary */}
        <button
          onClick={() => onTabChange('hisaab')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-center transition ${
            currentTab === 'hisaab' ? 'text-[#FF8C00] font-black' : 'text-[#70706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider">{t.navHisaab}</span>
        </button>

        {/* 3. Center Elevated + Add Action Button */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={onOpenAddHisaab}
            className="w-14 h-14 rounded-full bg-[#FF8C00] hover:bg-[#E67E00] text-white flex items-center justify-center shadow-lg shadow-[#FF8C00]/30 hover:scale-105 active:scale-95 transition ring-4 ring-white"
            title={t.addHisaab}
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
          <span className="text-[9px] font-black text-[#FF8C00] mt-0.5 uppercase tracking-wider">{t.navAdd}</span>
        </div>

        {/* 4. Trips */}
        <button
          onClick={() => onTabChange('trips')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-center transition ${
            currentTab === 'trips' ? 'text-[#FF8C00] font-black' : 'text-[#70706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider">{t.navTrips}</span>
        </button>

        {/* 5. More */}
        <button
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-center transition ${
            currentTab === 'more' ? 'text-[#FF8C00] font-black' : 'text-[#70706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider">{t.navMore}</span>
        </button>
      </div>
    </div>
  );
};
