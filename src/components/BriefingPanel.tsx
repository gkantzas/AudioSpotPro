import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Users,
  Megaphone,
  Lightbulb,
  ArrowRight,
  Wand2,
  Globe2,
} from 'lucide-react';
import {
  UiLanguage,
  ProductionLanguage,
  PRODUCTION_LANGUAGES,
  translations,
} from '../i18n/translations';

export interface BriefData {
  topic: string;
  targetDuration: number;
  voiceCount: number;
  style: string;
  tone: string;
  callToAction: string;
  productionLanguage: ProductionLanguage;
}

interface BriefingPanelProps {
  uiLanguage: UiLanguage;
  productionLanguage: ProductionLanguage;
  onProductionLanguageChange: (lang: ProductionLanguage) => void;
  onGenerate: (brief: BriefData) => void;
  isGenerating: boolean;
  initialBrief?: Partial<BriefData>;
}

const DURATION_PRESETS = [
  { sec: 10, label: '10s (Bumper)' },
  { sec: 15, label: '15s (Short)' },
  { sec: 20, label: '20s (Standard)' },
  { sec: 30, label: '30s (Radio Classic)' },
  { sec: 45, label: '45s (Story)' },
  { sec: 60, label: '60s (Full 1min)' },
  { sec: 90, label: '90s (Podcast)' },
  { sec: 180, label: '3m (Infomercial)' },
  { sec: 600, label: '10m (Max Format)' },
];

const PRESET_IDEAS_EL = [
  {
    title: 'Black Friday / Μεγάλες Εκπτώσεις',
    text: 'Διαφήμιση καταστήματος ηλεκτρονικών για τη Black Friday με εκπτώσεις έως 70%, δωρεάν μεταφορικά και έντονη αίσθηση επείγοντος.',
    duration: 30,
    voices: 2,
    style: 'Ενθουσιώδες / Hard-sell Προσφορά',
  },
  {
    title: 'Gourmet Εστιατόριο & Delivery',
    text: 'Προώθηση νέου ιταλικού εστιατορίου με αυθεντική ναπολιτάνικη πίτσα σε ξυλόφουρνο και delivery σε όλη την πόλη. Ζεστή, λαχταριστή περιγραφή.',
    duration: 30,
    voices: 1,
    style: 'Ζεστό / Συναισθηματικό',
  },
  {
    title: 'Νέα Εφαρμογή Fintech / Mobile App',
    text: 'Εφαρμογή άμεσων πληρωμών και εξόδων μεταξύ φίλων χωρίς τραπεζικές προμήθειες. Σύγχρονο, γρήγορο και νεανικό ύφος.',
    duration: 20,
    voices: 2,
    style: 'Σύγχρονο & Νεανικό',
  },
  {
    title: 'Αντιπροσωπεία Αυτοκινήτων',
    text: 'Προσφορά νέου υβριδικού SUV με 5 χρόνια εγγύηση, άτοκο διακανονισμό και άμεση παράδοση. Κύρος, αξιοπιστία και ασφάλεια.',
    duration: 45,
    voices: 1,
    style: 'Εταιρικό / Κύρος & Αξιοπιστία',
  },
  {
    title: 'Χιουμοριστικό Σκετσάκι (Διάλογος)',
    text: 'Ένας πελάτης προσπαθεί απεγνωσμένα να συναρμολογήσει μόνος του ένα έπιπλο μέχρι που ο φίλος του του θυμίζει την υπηρεσία έτοιμων επίπλων με δωρεάν τοποθέτηση.',
    duration: 30,
    voices: 2,
    style: 'Χιουμοριστικό / Παιχνιδιάρικο',
  },
];

const PRESET_IDEAS_EN = [
  {
    title: 'Black Friday / Big Mega Sale',
    text: 'Retail tech electronics store commercial for Black Friday with up to 70% off, free same-day shipping, and high urgency.',
    duration: 30,
    voices: 2,
    style: 'High-Energy / Hard-sell Promo',
  },
  {
    title: 'Gourmet Artisan Pizzeria',
    text: 'Grand opening of authentic wood-fired Neapolitan pizzeria with organic ingredients and fast neighborhood delivery. Warm, mouthwatering sensory narrative.',
    duration: 30,
    voices: 1,
    style: 'Warm / Emotional & Sensory',
  },
  {
    title: 'Next-Gen Fintech Mobile App',
    text: 'Zero-fee instant peer-to-peer mobile payments and split bill app for friends. Modern, energetic, snappy tech commercial.',
    duration: 20,
    voices: 2,
    style: 'Modern & Youthful',
  },
  {
    title: 'Hybrid SUV Dealership Event',
    text: 'All-new Hybrid SUV with 5-year warranty, zero down payment, and immediate delivery. Authoritative, trustworthy automotive spot.',
    duration: 45,
    voices: 1,
    style: 'Corporate / Trust & Prestige',
  },
  {
    title: 'Comedic Sketch (Dialogue)',
    text: 'A homeowner desperately struggles with flat-pack furniture assembly until their neighbor introduces an all-inclusive setup service.',
    duration: 30,
    voices: 2,
    style: 'Humorous & Playful',
  },
];

const STYLES_EL = [
  'Ενθουσιώδες / Hard-sell Προσφορά',
  'Χιουμοριστικό / Παιχνιδιάρικο',
  'Εταιρικό / Κύρος & Αξιοπιστία',
  'Ζεστό / Συναισθηματικό',
  'Σύγχρονο & Νεανικό',
  'Μυστήριο / Teaser & Αγωνία',
];

const STYLES_EN = [
  'High-Energy / Hard-sell Promo',
  'Humorous & Playful',
  'Corporate / Trust & Prestige',
  'Warm / Emotional & Sensory',
  'Modern & Youthful',
  'Mysterious / Dramatic Teaser',
];

export const BriefingPanel: React.FC<BriefingPanelProps> = ({
  uiLanguage,
  productionLanguage,
  onProductionLanguageChange,
  onGenerate,
  isGenerating,
  initialBrief,
}) => {
  const [topic, setTopic] = useState('');
  const [targetDuration, setTargetDuration] = useState(30);
  const [voiceCount, setVoiceCount] = useState(1);
  const [style, setStyle] = useState('Ενθουσιώδες / Hard-sell Προσφορά');
  const [tone, setTone] = useState('Φιλικός, πειστικός & γεμάτος ενέργεια');
  const [callToAction, setCallToAction] = useState('');

  const t = translations[uiLanguage];
  const presets = productionLanguage === 'en' ? PRESET_IDEAS_EN : PRESET_IDEAS_EL;
  const stylesList = productionLanguage === 'en' ? STYLES_EN : STYLES_EL;

  // Sync when initialBrief changes (e.g. from JSON load)
  useEffect(() => {
    if (initialBrief) {
      if (initialBrief.topic !== undefined) setTopic(initialBrief.topic);
      if (initialBrief.targetDuration !== undefined) setTargetDuration(initialBrief.targetDuration);
      if (initialBrief.voiceCount !== undefined) setVoiceCount(initialBrief.voiceCount);
      if (initialBrief.style !== undefined) setStyle(initialBrief.style);
      if (initialBrief.tone !== undefined) setTone(initialBrief.tone);
      if (initialBrief.callToAction !== undefined) setCallToAction(initialBrief.callToAction);
      if (initialBrief.productionLanguage !== undefined) {
        onProductionLanguageChange(initialBrief.productionLanguage);
      }
    }
  }, [initialBrief, onProductionLanguageChange]);

  const estimatedWords = Math.round(targetDuration * 2.3);

  const formatSecToDisplay = (sec: number) => {
    if (sec < 60) {
      return `${sec} ${t.secondsText}`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} ${t.minutesText}`;
  };

  const handleApplyPreset = (preset: typeof PRESET_IDEAS_EL[0]) => {
    setTopic(preset.text);
    setTargetDuration(preset.duration);
    setVoiceCount(preset.voices);
    setStyle(preset.style);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({
      topic,
      targetDuration,
      voiceCount,
      style,
      tone,
      callToAction,
      productionLanguage,
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.briefingTitle}</h2>
              <p className="text-xs text-slate-400">{t.briefingSubtitle}</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" /> {t.aiPersonaTag}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* CRITICAL: Production Language vs UI Language */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                {t.prodLangLabel}
              </label>
              <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {uiLanguage === 'el' ? 'Ανεξάρτητη από τη γλώσσα UI' : 'Independent of UI language'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              {t.prodLangHelp}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {PRODUCTION_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onProductionLanguageChange(lang.code)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    productionLanguage === lang.code
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-[1.02]'
                      : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span className="truncate">
                    {uiLanguage === 'el' ? lang.nameEl.split(' ')[0] : lang.nameEn.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic & Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {t.topicLabel} <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              rows={3}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-y"
            />
          </div>

          {/* Quick Inspiration Presets */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.quickInspirations}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 hover:text-amber-300 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Configuration */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {t.durationLabel}
              </label>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {formatSecToDisplay(targetDuration)}
                </span>
                <span className="text-[11px] text-slate-400 ml-2">
                  (~{estimatedWords} {t.wordsApprox})
                </span>
              </div>
            </div>

            <input
              type="range"
              min={5}
              max={600}
              step={5}
              value={targetDuration}
              onChange={(e) => setTargetDuration(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex flex-wrap gap-1 mt-2.5">
              {DURATION_PRESETS.map((dp) => (
                <button
                  key={dp.sec}
                  type="button"
                  onClick={() => setTargetDuration(dp.sec)}
                  className={`text-[11px] px-2 py-1 rounded-md transition-all font-medium ${
                    targetDuration === dp.sec
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid for Voices & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Number of Voices */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {t.voiceCountLabel}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setVoiceCount(count)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                      voiceCount === count
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {count === 1 ? t.oneVoice : `${count} ${t.multipleVoices}`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {voiceCount === 1 ? t.singleVoiceDesc : t.multiVoiceDesc}
              </p>
            </div>

            {/* Spot Style */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.styleLabel}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {stylesList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">{t.styleHelp}</p>
            </div>
          </div>

          {/* Call to action */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.ctaLabel}
            </label>
            <input
              type="text"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              placeholder={t.ctaPlaceholder}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Generate Script Button */}
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{t.generatingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generateBtn}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
