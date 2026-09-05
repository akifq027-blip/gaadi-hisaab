import React, { useState } from 'react';
import { 
  Truck, 
  KeyRound, 
  Phone, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Building2, 
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail
} from 'lucide-react';
import { Language } from '../translations';
import { api, setStoredToken } from '../api';
import { User as UserType } from '../types';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginScreen: React.FC<Props> = ({ lang, onLanguageChange, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'driver' | 'admin'>('owner');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Sign-in form fields
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBusiness, setRegBusiness] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = (role: 'owner' | 'driver' | 'admin') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setLoginInput('akifq027@gmail.com');
      setPasswordInput('');
    } else {
      if (loginInput === 'akifq027@gmail.com') {
        setLoginInput('');
      }
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError(
        lang === 'hi'
          ? 'कृपया अपना ईमेल या मोबाइल नंबर और पासवर्ड/पिन दर्ज करें।'
          : 'Please enter your email or mobile number and password/PIN.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.login(loginInput.trim(), passwordInput.trim());
      setStoredToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'लॉगिन विफल रहा। कृपया विवरण जांचें।' : 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const email = regEmail.trim() || `${regPhone.trim()}@gaadihisaab.in`;
      const res = await api.register({
        name: regName.trim(),
        phone: regPhone.trim(),
        email,
        password: regPassword.trim(),
        role: selectedRole === 'driver' ? 'driver' : 'owner',
        businessName: regBusiness.trim() || `${regName.trim()} Transport`,
      });

      setStoredToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1A1A1A] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#FF8C00] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Header with Branding and Language Selection */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between gap-3 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center shadow-xs shrink-0">
            <Truck className="w-5 h-5 text-[#FF8C00]" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-[#1A1A1A] leading-none">
              GAADI HISAAB
            </h1>
            <span className="text-[11px] font-semibold text-[#70706B] block mt-0.5">
              {lang === 'hi' ? 'डिजिटल ड्राइवर डायरी' : 'Fleet & Driver Diary'}
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center bg-[#E5E5DF]/70 p-1 rounded-xl border border-[#D5D5CF] shrink-0">
          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${
              lang === 'hi'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#70706B] hover:text-[#1A1A1A]'
            }`}
          >
            🇮🇳 हिन्दी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${
              lang === 'en'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#70706B] hover:text-[#1A1A1A]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('te')}
            className={`px-2 py-1 text-xs font-black rounded-lg transition ${
              lang === 'te'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#70706B] hover:text-[#1A1A1A]'
            }`}
          >
            తెలుగు
          </button>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-white rounded-3xl border border-[#E5E5DF] p-6 sm:p-7 shadow-xs space-y-5">
          {/* Sign In vs Register Toggle */}
          <div className="flex bg-[#F5F5F0] p-1 rounded-2xl border border-[#E5E5DF]">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                !isRegisterMode
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              {lang === 'hi' ? 'लॉगिन करें (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                isRegisterMode
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              {lang === 'hi' ? 'नया खाता (Register)' : 'New Registration'}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-[#FFF5F5] border border-[#FCA5A5] text-[#991B1B] text-xs p-3 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {!isRegisterMode ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-[#70706B] mb-2">
                  {lang === 'hi' ? 'खाता प्रकार चुनें (Account Type)' : 'Select Account Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('owner')}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      selectedRole === 'owner'
                        ? 'border-[#FF8C00] bg-[#FFF8E7] text-[#1A1A1A] shadow-2xs'
                        : 'border-[#E5E5DF] text-[#70706B] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="text-base">🚚</span>
                    <span className="text-[11px] truncate">{lang === 'hi' ? 'गाड़ी मालिक' : 'Owner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('driver')}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      selectedRole === 'driver'
                        ? 'border-[#4A90E2] bg-[#EBF4FE] text-[#1A1A1A] shadow-2xs'
                        : 'border-[#E5E5DF] text-[#70706B] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="text-base">👨‍✈️</span>
                    <span className="text-[11px] truncate">{lang === 'hi' ? 'ड्राइवर' : 'Driver'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('admin')}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-2xs'
                        : 'border-[#E5E5DF] text-[#70706B] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="text-base">🛡️</span>
                    <span className="text-[11px] truncate">{lang === 'hi' ? 'एडमिन' : 'Admin'}</span>
                  </button>
                </div>
              </div>

              {/* Login Input (Email / Mobile) */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                  {selectedRole === 'admin'
                    ? (lang === 'hi' ? 'एडमिन ईमेल या यूज़रनेम *' : 'Admin Email *')
                    : (lang === 'hi' ? 'मोबाइल नंबर या ईमेल *' : 'Mobile Number or Email *')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70706B]">
                    {selectedRole === 'admin' ? (
                      <Mail className="w-4 h-4 text-[#70706B]" />
                    ) : (
                      <Phone className="w-4 h-4 text-[#70706B]" />
                    )}
                  </div>
                  <input
                    type={selectedRole === 'admin' ? 'email' : 'text'}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder={
                      selectedRole === 'admin'
                        ? 'akifq027@gmail.com'
                        : (lang === 'hi' ? '98765XXXXX या ईमेल' : 'Mobile number or email')
                    }
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition"
                    required
                  />
                </div>
              </div>

              {/* Password / PIN */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                  {selectedRole === 'admin'
                    ? (lang === 'hi' ? 'एडमिन पासवर्ड *' : 'Admin Password *')
                    : (lang === 'hi' ? 'पासवर्ड या 4-अंकों का पिन *' : 'Password or 4-Digit PIN *')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70706B]">
                    <KeyRound className="w-4 h-4 text-[#70706B]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={selectedRole === 'admin' ? '••••••••' : (lang === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter password / PIN')}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#70706B] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>{lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <span>{lang === 'hi' ? 'खाता खोलें (Sign In)' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTRATION FORM ================= */
            <form onSubmit={handleSubmitRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'आपका पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Balwinder Singh"
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#FF8C00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'ट्रांसपोर्ट या फर्म का नाम' : 'Transport / Business Name'}
                </label>
                <input
                  type="text"
                  value={regBusiness}
                  onChange={(e) => setRegBusiness(e.target.value)}
                  placeholder="e.g. Singh Roadlines Logistics"
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="98765XXXXX"
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF8C00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                    {lang === 'hi' ? 'शहर (City)' : 'City'}
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF8C00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'पासवर्ड या 4-अंकों का पिन *' : 'Create Password or PIN *'}
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF8C00]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#FF8C00]" />
                <span>{lang === 'hi' ? 'नया खाता बनाएं (Create Account)' : 'Create Free Account'}</span>
              </button>
            </form>
          )}

          {/* Secure Badge */}
          <div className="pt-2 border-t border-[#E5E5DF] flex items-center justify-center space-x-2 text-[11px] text-[#70706B]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {lang === 'hi'
                ? 'सुरक्षित ट्रांसपोर्ट डेटा एन्क्रिप्शन'
                : '100% Secure Transport Data Encryption'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto py-3 text-center text-xs text-[#70706B]">
        <p>
          GAADI HISAAB • {lang === 'hi' ? 'कमर्शियल वाहन और ट्रांसपोर्टर का डिजिटल हिसाब' : 'Commercial Vehicle Transport Management'}
        </p>
      </footer>
    </div>
  );
};
