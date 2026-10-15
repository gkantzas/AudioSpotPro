import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Sparkles,
  Volume2,
  Key,
  Check,
  Trash2,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  ShieldCheck,
  Download,
  Upload,
  Globe,
  FileJson,
} from 'lucide-react';
import { UiLanguage, translations } from '../i18n/translations';

interface StudioHeaderProps {
  uiLanguage: UiLanguage;
  onUiLanguageChange: (lang: UiLanguage) => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  isRendering: boolean;
  isPlaying: boolean;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  uiLanguage,
  onUiLanguageChange,
  onSaveProject,
  onLoadProject,
  isRendering,
  isPlaying,
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKeyText, setShowKeyText] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[uiLanguage];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_gemini_api_key');
      if (stored) {
        setSavedKey(stored);
        setApiKeyInput(stored);
      }
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      document.cookie = `gemini_api_key=${encodeURIComponent(trimmed)}; path=/; max-age=31536000; SameSite=Lax`;
      setSavedKey(trimmed);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      handleClearKey();
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    document.cookie = 'gemini_api_key=; path=/; max-age=0';
    setSavedKey(null);
    setApiKeyInput('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
      // Reset input value so re-uploading the same file triggers change
      e.target.value = '';
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Studio Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  AudioSpot <span className="text-amber-400 font-black">PRO</span>
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {uiLanguage === 'el' ? 'Radio Ad Studio' : 'Commercial Studio'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {uiLanguage === 'el'
                  ? 'Επαγγελματικό Στούντιο Παραγωγής Ηχητικών Σποτ & Ραδιοφωνικών Διαφημίσεων'
                  : 'Professional AI Radio Ad Production Suite & Master Mixdown Studio'}
              </p>
            </div>
          </div>

          {/* Actions & Live Status Indicators */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Hidden JSON file upload input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* UI Language Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onUiLanguageChange('el')}
                className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-all ${
                  uiLanguage === 'el'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ελληνικά περιβάλλοντος"
              >
                <span>🇬🇷</span>
                <span className="text-[11px]">EL</span>
              </button>
              <button
                type="button"
                onClick={() => onUiLanguageChange('en')}
                className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-all ${
                  uiLanguage === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English interface"
              >
                <span>🇬🇧</span>
                <span className="text-[11px]">EN</span>
              </button>
            </div>

            {/* Save JSON Project Button */}
            <button
              type="button"
              onClick={onSaveProject}
              title={t.saveProjectTooltip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{t.saveProject}</span>
              <span className="md:hidden">JSON</span>
            </button>

            {/* Load JSON Project Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t.loadProjectTooltip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 shadow-xs transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">{t.loadProject}</span>
              <span className="md:hidden">Load</span>
            </button>

            {/* Custom Gemini API Key Button */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                savedKey
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {savedKey
                  ? uiLanguage === 'el'
                    ? 'Προσωπικό Key: Ενεργό'
                    : 'Personal Key: Active'
                  : 'Gemini API Key'}
              </span>
              <span className="lg:hidden">Key</span>
            </button>

            {/* ON AIR Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border ${
                isPlaying
                  ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-sm shadow-red-500/20'
                  : isRendering
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying
                    ? 'bg-red-500 animate-ping'
                    : isRendering
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              {isPlaying ? 'ON AIR' : isRendering ? 'RENDERING' : 'READY'}
            </div>
          </div>
        </div>
      </header>

      {/* Gemini API Key & Publishing Settings Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {uiLanguage === 'el'
                    ? 'Διαχείριση Gemini API Key & Δημοσίευση (Publish)'
                    : 'Manage Gemini API Key & App Publishing'}
                </h3>
                <p className="text-xs text-slate-400">
                  {uiLanguage === 'el'
                    ? 'Πώς λειτουργεί το κλειδί στο περιβάλλον δοκιμών και στο τελικό Publish'
                    : 'How API keys operate during testing and in production publish'}
                </p>
              </div>
            </div>

            {/* Explanation Box */}
            <div className="space-y-3 mb-5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {uiLanguage === 'el' ? 'Πώς λειτουργεί όταν γίνει Publish:' : 'When Published:'}
                </div>
                <p className="leading-relaxed text-slate-400">
                  {uiLanguage === 'el' ? (
                    <>
                      Όταν κάνετε <strong className="text-slate-200">Publish</strong> την εφαρμογή, το{' '}
                      <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">GEMINI_API_KEY</code>{' '}
                      εισάγεται αυτόματα από τις ρυθμίσεις του Cloud server. Έτσι οι επισκέπτες της δημοσιευμένης
                      ιστοσελίδας <strong>δεν χρειάζεται να βάλουν κανένα κλειδί</strong> — λειτουργεί αυτόματα για όλους!
                    </>
                  ) : (
                    <>
                      When you <strong className="text-slate-200">Publish</strong> the app,{' '}
                      <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">GEMINI_API_KEY</code> is
                      automatically provided by the Cloud server environment. Visitors on the published URL{' '}
                      <strong>do not need to enter any key</strong> — it works out of the box for everyone!
                    </>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {uiLanguage === 'el' ? 'Προσωπικό Gemini Key (Προαιρετικό):' : 'Personal Gemini Key (Optional):'}
                </div>
                <p className="leading-relaxed text-slate-400">
                  {uiLanguage === 'el'
                    ? 'Εάν το δωρεάν ημερήσιο όριο εξαντληθεί, μπορείτε να εισάγετε παρακάτω το δικό σας κλειδί από το Google AI Studio. Αποθηκεύεται τοπικά στον browser σας (σε localStorage και cookie).'
                    : 'If the shared free tier daily quota is reached, you can input your own personal Google AI Studio key below. It is stored securely in your browser localStorage and cookie.'}
                </p>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Gemini API Key (AIzaSy...)</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  {uiLanguage === 'el' ? 'Λήψη κλειδιού' : 'Get API Key'}{' '}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              {savedKey ? (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{uiLanguage === 'el' ? 'Διαγραφή Προσωπικού Key' : 'Clear Key'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  {uiLanguage === 'el' ? 'Χρήση Server Key' : 'Using Server Key'}
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  {t.closeBtn}
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{savedSuccess ? t.savedNotification : t.saveKeyBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
