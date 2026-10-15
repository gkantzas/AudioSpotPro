import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Volume2,
  Play,
  Square,
  PlusCircle,
  Sparkles,
  Headphones,
  Check,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  AVAILABLE_SFX,
  SFXDefinition,
  SFXCategory,
  auditionSFX,
  stopAudition,
} from '../services/soundEffects';
import { UiLanguage, ProductionLanguage, translations } from '../i18n/translations';

interface SFXLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: UiLanguage;
  productionLanguage: ProductionLanguage;
  onInsertSfx: (sfx: SFXDefinition, volume: number) => void;
  initialVolume?: number;
}

export const SFXLibraryModal: React.FC<SFXLibraryModalProps> = ({
  isOpen,
  onClose,
  uiLanguage,
  productionLanguage,
  onInsertSfx,
  initialVolume = 0.9,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SFXCategory | 'ALL'>('ALL');
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [volumes, setVolumes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    AVAILABLE_SFX.forEach((s) => {
      initial[s.id] = s.defaultVolume ?? initialVolume;
    });
    return initial;
  });
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const t = translations[uiLanguage];

  // Category labels and icons
  const categoryMeta: Record<
    SFXCategory | 'ALL',
    { labelEl: string; labelEn: string; icon: string }
  > = {
    ALL: { labelEl: 'Όλα τα Εφέ', labelEn: 'All Sounds', icon: '🎧' },
    'Retail & Sales': { labelEl: '💰 Λιανική & Προσφορές', labelEn: '💰 Retail & Sales', icon: '💰' },
    'Alerts & Bells': { labelEl: '🔔 Κουδούνια & Σήματα', labelEn: '🔔 Alerts & Bells', icon: '🔔' },
    'Cinematic & Impacts': { labelEl: '💥 Κινηματογραφικά & Impacts', labelEn: '💥 Cinematic & Impacts', icon: '💥' },
    'Vehicles & City': { labelEl: '🚗 Οχήματα & Πόλη', labelEn: '🚗 Vehicles & City', icon: '🚗' },
    'Crowd & Events': { labelEl: '👏 Κοινό & Ατμόσφαιρα', labelEn: '👏 Crowds & Atmosphere', icon: '👏' },
    'Office & Tech': { labelEl: '📱 Γραφείο & Tech', labelEn: '📱 Office & Tech', icon: '📱' },
    'Nature & Weather': { labelEl: '⚡ Φύση & Καιρός', labelEn: '⚡ Nature & Weather', icon: '⚡' },
    'Cartoon & Comedy': { labelEl: '🎪 Κωμικά & Cartoon', labelEn: '🎪 Cartoon & Comedy', icon: '🎪' },
  };

  const categories: (SFXCategory | 'ALL')[] = [
    'ALL',
    'Retail & Sales',
    'Alerts & Bells',
    'Cinematic & Impacts',
    'Vehicles & City',
    'Crowd & Events',
    'Office & Tech',
    'Nature & Weather',
    'Cartoon & Comedy',
  ];

  // Filtered sounds based on search query and category
  const filteredSounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AVAILABLE_SFX.filter((s) => {
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        s.labelEl.toLowerCase().includes(q) ||
        s.labelEn.toLowerCase().includes(q) ||
        s.descriptionEl.toLowerCase().includes(q) ||
        s.descriptionEn.toLowerCase().includes(q) ||
        s.tagEl.toLowerCase().includes(q) ||
        s.tagEn.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleAuditionToggle = async (sfx: SFXDefinition) => {
    if (playingSfxId === sfx.id) {
      stopAudition();
      setPlayingSfxId(null);
      return;
    }

    const vol = volumes[sfx.id] ?? sfx.defaultVolume ?? 0.9;
    setPlayingSfxId(sfx.id);
    await auditionSFX(sfx.id, vol, () => {
      setPlayingSfxId(null);
    });
  };

  const handleInsert = (sfx: SFXDefinition) => {
    const vol = volumes[sfx.id] ?? sfx.defaultVolume ?? 0.9;
    onInsertSfx(sfx, vol);
    setInsertedId(sfx.id);
    setTimeout(() => setInsertedId(null), 1500);
  };

  const handleVolumeChange = (sfxId: string, newVol: number) => {
    setVolumes((prev) => ({
      ...prev,
      [sfxId]: Math.max(0, Math.min(1.5, newVol)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                📂
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  {t.sfxLibraryTitle}
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-normal bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {AVAILABLE_SFX.length} Real Audio Sounds
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.sfxLibrarySubtitle}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              stopAudition();
              setPlayingSfxId(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Κλείσιμο / Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.sfxSearchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const count =
                cat === 'ALL'
                  ? AVAILABLE_SFX.length
                  : AVAILABLE_SFX.filter((s) => s.category === cat).length;
              const isSelected = selectedCategory === cat;
              const meta = categoryMeta[cat];
              const label = uiLanguage === 'el' ? meta.labelEl : meta.labelEn;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-slate-950/30 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950/30">
          {filteredSounds.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <Headphones className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-sm font-semibold text-slate-400">
                {uiLanguage === 'el'
                  ? 'Δεν βρέθηκαν ηχητικά εφέ με αυτή την αναζήτηση.'
                  : 'No sound effects found matching your query.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="mt-2 text-xs text-amber-400 hover:underline font-medium"
              >
                {uiLanguage === 'el' ? 'Επαναφορά φίλτρων' : 'Reset search & filters'}
              </button>
            </div>
          ) : (
            filteredSounds.map((sfx) => {
              const isPlaying = playingSfxId === sfx.id;
              const wasJustInserted = insertedId === sfx.id;
              const vol = volumes[sfx.id] ?? sfx.defaultVolume ?? 0.9;
              const volPct = Math.round(vol * 100);

              return (
                <div
                  key={sfx.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isPlaying
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-lg ring-1 ring-amber-500/50'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Top: Icon + Name + Category + Duration */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base flex-shrink-0">
                          {sfx.icon}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            {uiLanguage === 'el' ? sfx.labelEl : sfx.labelEn}
                          </h4>
                          <span className="text-[10px] text-amber-400/90 font-mono">
                            {uiLanguage === 'el' ? sfx.labelEn : sfx.labelEl}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          ~{sfx.durationEstimate}s
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {uiLanguage === 'el' ? sfx.descriptionEl : sfx.descriptionEn}
                    </p>
                  </div>

                  {/* Bottom: Volume Slider + Audition & Insert Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                    {/* Live Volume Slider */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span>{t.sfxVolumeLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                        <input
                          type="range"
                          min={0.05}
                          max={1.5}
                          step={0.05}
                          value={vol}
                          onChange={(e) => handleVolumeChange(sfx.id, parseFloat(e.target.value))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                        <span className="font-mono text-[10px] font-bold text-amber-300 w-8 text-right">
                          {volPct}%
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {/* Audition Button */}
                      <button
                        type="button"
                        onClick={() => handleAuditionToggle(sfx)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>{t.sfxStopBtn}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{t.sfxAuditionBtn}</span>
                          </>
                        )}
                      </button>

                      {/* Insert Button */}
                      <button
                        type="button"
                        onClick={() => handleInsert(sfx)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          wasJustInserted
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                        }`}
                      >
                        {wasJustInserted ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{uiLanguage === 'el' ? 'Προστέθηκε!' : 'Inserted!'}</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{t.sfxInsertBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>
              {uiLanguage === 'el'
                ? 'Συμβουλή: Κάθε εφέ εισάγεται στο σενάριο με την επιλεγμένη ένταση (π.χ. @ 80%)'
                : 'Tip: Each sound is inserted into the script with its selected volume tag (e.g. @ 80%)'}
            </span>
          </div>
          <button
            onClick={() => {
              stopAudition();
              setPlayingSfxId(null);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {uiLanguage === 'el' ? 'Κλείσιμο' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
