import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Globe,
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  Download,
} from 'lucide-react';
import { Language, translations } from '../translations';
import { User, Vehicle, NotificationItem } from '../types';
import { api, formatDate } from '../api';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AddToHomeScreenModal } from './AddToHomeScreenModal';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  user: User | null;
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onVehicleChange: (id: string) => void;
  onSwitchRole: (role: string) => void;
  onOpenSearch: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<Props> = ({
  lang,
  onLanguageChange,
  user,
  vehicles,
  selectedVehicleId,
  onVehicleChange,
  onSwitchRole,
  onOpenSearch,
  onLogout,
}) => {
  const t = translations[lang];
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

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch notifications
    api.getNotifications().then(setNotifications).catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {}
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'driver':
        return t.roleDriver;
      case 'fleet_owner':
        return t.roleFleet;
      case 'admin':
        return t.roleAdmin;
      default:
        return t.roleOwner;
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white text-[#1A1A1A] shadow-xs border-b border-[#E5E5DF] w-full max-w-full">
      {!isOnline && (
        <div className="bg-rose-600 text-white text-xs py-1 px-4 text-center flex items-center justify-center space-x-2 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.offlineNotice}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center font-black text-base sm:text-xl shadow-xs shrink-0">
            🚚
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="font-black tracking-tight text-base sm:text-xl text-[#1A1A1A] truncate">
                GAADI HISAAB
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-black bg-[#FFF3E0] text-[#FF8C00] px-1 sm:px-1.5 py-0.5 rounded border border-[#FFE0B2] shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#70706B] uppercase tracking-wider font-semibold hidden sm:block truncate leading-none mt-0.5">
              {t.tagline || 'Hisaab, Trip aur Gaadi — Sab Ek Jagah'}
            </p>
          </div>
        </div>

        {/* Vehicle Quick Filter (if multiple vehicles) */}
        {vehicles.length > 0 && (
          <div className="hidden lg:flex items-center bg-[#F5F5F0] rounded-xl px-3 py-1.5 border border-[#E5E5DF] shrink-0">
            <Truck className="w-3.5 h-3.5 text-[#FF8C00] mr-2 shrink-0" />
            <select
              value={selectedVehicleId}
              onChange={(e) => onVehicleChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1A1A1A] outline-none cursor-pointer pr-1"
            >
              <option value="all">
                All Vehicles ({vehicles.length})
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.vehicle_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Global Controls: Search, Language, Notifications, Role Switcher, User */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Add to Home Screen / Install App Button */}
          {!isInstalled && (
            <button
              type="button"
              onClick={async () => {
                const res = await triggerInstall();
                if (res === 'manual') setShowInstallGuideModal(true);
              }}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 bg-[#FFF8E7] hover:bg-[#FFEEC2] border border-[#FFD580] text-[#B45309] rounded-xl text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
              title={lang === 'hi' ? 'गाड़ी हिसाब को होम स्क्रीन पर जोड़ें' : 'Add GAADI HISAAB to Home Screen'}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#FF8C00] shrink-0" />
              <span className="hidden sm:inline">
                {lang === 'hi' ? 'होम स्क्रीन' : 'Install App'}
              </span>
            </button>
          )}

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 rounded-xl text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] border border-transparent hover:border-[#E5E5DF] transition"
            title="Search (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile Language Selector: Compact Select */}
          <div className="sm:hidden relative flex items-center bg-[#F5F5F0] rounded-xl px-1.5 py-1 border border-[#E5E5DF]">
            <Globe className="w-3.5 h-3.5 text-[#FF8C00] mr-1 shrink-0" />
            <select
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-[11px] font-bold text-[#1A1A1A] outline-none cursor-pointer"
            >
              <option value="hi">हिन्दी</option>
              <option value="en">EN</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          {/* Desktop Language Selector */}
          <div className="hidden sm:flex items-center bg-[#F5F5F0] rounded-xl p-0.5 text-xs font-bold border border-[#E5E5DF]">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition text-[11px] ${
                lang === 'en' ? 'bg-[#FF8C00] text-white shadow-xs' : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 rounded-lg transition text-[11px] ${
                lang === 'hi' ? 'bg-[#FF8C00] text-white shadow-xs' : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-2 py-1 rounded-lg transition text-[11px] ${
                lang === 'te' ? 'bg-[#FF8C00] text-white shadow-xs' : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-1.5 sm:p-2 rounded-xl text-[#70706B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] border border-transparent hover:border-[#E5E5DF] transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-[#FF8C00] rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-20px)] bg-white text-[#1A1A1A] rounded-2xl shadow-xl border border-[#E5E5DF] overflow-hidden z-50">
                <div className="p-3 bg-[#F9F9F6] border-b border-[#E5E5DF] flex items-center justify-between">
                  <span className="font-black text-xs text-[#1A1A1A] uppercase tracking-wider">
                    Notifications ({notifications.length})
                  </span>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-[#70706B] hover:text-[#1A1A1A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F5F0]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#70706B]">
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 text-xs hover:bg-[#FFF9F2] cursor-pointer transition flex items-start space-x-2.5 ${
                          !n.is_read ? 'bg-[#FFF9F2] font-semibold' : ''
                        }`}
                      >
                        {n.severity === 'danger' || n.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1A1A1A] truncate">{n.title}</p>
                          <p className="text-[#70706B] text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-[#A0A09A] mt-1 block">
                            {formatDate(n.created_at?.split(' ')[0] || '')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-[#F5F5F0] hover:bg-[#EAEAE5] px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#1A1A1A] border border-[#E5E5DF] transition"
              title="Switch user perspective"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span className="hidden md:inline">{getRoleLabel(user?.role)}</span>
              <ChevronDown className="w-3 h-3 text-[#70706B]" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-20px)] bg-white text-[#1A1A1A] rounded-2xl shadow-xl border border-[#E5E5DF] py-1 z-50">
                <div className="px-3 py-2 border-b border-[#E5E5DF] bg-[#F9F9F6]">
                  <p className="text-[10px] font-black text-[#70706B] uppercase tracking-wider">
                    Role Perspective
                  </p>
                  <p className="text-xs font-bold text-[#1A1A1A] truncate">{user?.name}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onSwitchRole('owner');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#FFF9F2] flex items-center justify-between ${
                      user?.role === 'owner' ? 'font-bold text-[#FF8C00] bg-[#FFF9F2]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    <span>🚚 {t.roleOwner} (Single/DCM)</span>
                    {user?.role === 'owner' && <span className="text-[#FF8C00]">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole('driver');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#FFF9F2] flex items-center justify-between ${
                      user?.role === 'driver' ? 'font-bold text-[#FF8C00] bg-[#FFF9F2]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    <span>👨‍✈️ {t.roleDriver} (Simple Diary)</span>
                    {user?.role === 'driver' && <span className="text-[#FF8C00]">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole('fleet_owner');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#FFF9F2] flex items-center justify-between ${
                      user?.role === 'fleet_owner' ? 'font-bold text-[#FF8C00] bg-[#FFF9F2]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    <span>🚛 {t.roleFleet} (Multi-Vehicle)</span>
                    {user?.role === 'fleet_owner' && <span className="text-[#FF8C00]">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#FFF9F2] flex items-center justify-between ${
                      user?.role === 'admin' ? 'font-bold text-[#FF8C00] bg-[#FFF9F2]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    <span>⚡ {t.roleAdmin} (Platform Control)</span>
                    {user?.role === 'admin' && <span className="text-[#FF8C00]">✓</span>}
                  </button>

                  {onLogout && (
                    <div className="border-t border-[#E5E5DF] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#FFF5F5] flex items-center space-x-2"
                      >
                        <span>🚪</span>
                        <span>{lang === 'hi' ? 'लॉगआउट / खाता बदलें' : 'Logout / Switch Account'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info & Avatar */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E5E5DF]">
            <div className="text-right">
              <p className="text-xs font-bold text-[#1A1A1A] leading-tight truncate max-w-[110px]">
                {user?.name || 'Rajesh Kumar'}
              </p>
              <p className="text-[10px] text-[#70706B] leading-tight">
                {getRoleLabel(user?.role)} • {vehicles.length} Vehicles
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E5E5DF] border-2 border-white flex items-center justify-center font-black text-xs text-[#1A1A1A] shrink-0">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'RK'}
            </div>
          </div>
        </div>
      </div>

      {/* Add To Home Screen Guide Modal */}
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
    </header>
  );
};
