import React, { useState, useRef } from 'react';
import {
  Music,
  Settings2,
  Play,
  Square,
  Loader2,
  Sparkles,
  Volume2,
  Disc,
  Upload,
  Dices,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { ProductionSettings } from '../services/audioProductionEngine';
import { MUSIC_BED_OPTIONS, renderMusicBedBuffer } from '../services/musicBedGenerator';
import { UiLanguage, translations } from '../i18n/translations';

interface MusicAndMasterPanelProps {
  settings: ProductionSettings;
  onSettingsChange: (settings: ProductionSettings) => void;
  onStartRender: () => void;
  isRendering: boolean;
  renderStepText: string;
  renderProgressPercent: number;
  customAudioBuffer?: AudioBuffer | null;
  onCustomAudioUploaded?: (buffer: AudioBuffer, filename: string) => void;
  musicSeedModifier?: number;
  onMusicSeedChange?: (seed: number) => void;
  customMusicPrompt?: string;
  onCustomMusicPromptChange?: (prompt: string) => void;
  uiLanguage?: UiLanguage;
}

export const MusicAndMasterPanel: React.FC<MusicAndMasterPanelProps> = ({
  settings,
  onSettingsChange,
  onStartRender,
  isRendering,
  renderStepText,
  renderProgressPercent,
  customAudioBuffer,
  onCustomAudioUploaded,
  musicSeedModifier = 0,
  onMusicSeedChange,
  customMusicPrompt = '',
  onCustomMusicPromptChange,
  uiLanguage = 'el',
}) => {
  const t = translations[uiLanguage];
  const [isPlayingMusicPreview, setIsPlayingMusicPreview] = useState(false);
  const [isLoadingMusicPreview, setIsLoadingMusicPreview] = useState(false);
  const [previewSource, setPreviewSource] = useState<AudioBufferSourceNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(uiLanguage === 'el' ? 'Όλα' : 'All');
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    uiLanguage === 'el' ? 'Όλα' : 'All',
    'Retail & Promo',
    'Tech & Modern',
    'Corporate & Trust',
    'Lifestyle & Chill',
    'Cinematic & Dramatic',
  ];

  const filteredOptions =
    selectedCategory === 'Όλα'
      ? MUSIC_BED_OPTIONS
      : MUSIC_BED_OPTIONS.filter(
          (o) => o.category === selectedCategory || o.id === 'none' || o.id === 'custom_upload'
        );

  const handleUpdate = (updates: Partial<ProductionSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setUploadedFilename(file.name);
      onCustomAudioUploaded?.(decoded, file.name);
      handleUpdate({ musicBedStyle: 'custom_upload' });
    } catch (err) {
      console.error('Failed to load custom audio track:', err);
    }
  };

  // Preview Music Bed (uses Google Lyria 3 Studio AI Music Engine)
  const togglePlayMusicPreview = async () => {
    if (isPlayingMusicPreview) {
      if (previewSource) {
        try {
          previewSource.stop();
        } catch {
          // ignore
        }
      }
      setIsPlayingMusicPreview(false);
      return;
    }

    if (settings.musicBedStyle === 'none' || isLoadingMusicPreview) return;

    setIsLoadingMusicPreview(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const musicBuf = await renderMusicBedBuffer(
        ctx,
        settings.musicBedStyle,
        15,
        customAudioBuffer,
        musicSeedModifier,
        customMusicPrompt
      );
      if (!musicBuf) {
        setIsLoadingMusicPreview(false);
        return;
      }

      const src = ctx.createBufferSource();
      src.buffer = musicBuf;

      const gain = ctx.createGain();
      gain.gain.value = Math.min(1.0, settings.musicVolume * 1.4);

      src.connect(gain);
      gain.connect(ctx.destination);

      src.onended = () => {
        setIsPlayingMusicPreview(false);
      };

      src.start(0);
      setPreviewSource(src);
      setIsPlayingMusicPreview(true);
    } catch (err) {
      console.error('Failed to preview music bed:', err);
    } finally {
      setIsLoadingMusicPreview(false);
    }
  };

  const handleNextVariation = () => {
    const nextSeed = (musicSeedModifier || 0) + 1;
    onMusicSeedChange?.(nextSeed);
    if (isPlayingMusicPreview && previewSource) {
      try {
        previewSource.stop();
      } catch {
        // ignore
      }
      setIsPlayingMusicPreview(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-6">
      {/* Hidden file input for custom music upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* SECTION 1: Background Music Bed */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {t.musicTitle}
              </h2>
              <p className="text-xs text-slate-400">{t.musicSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate Infinite Variation Button */}
            {settings.musicBedStyle !== 'none' && settings.musicBedStyle !== 'custom_upload' && (
              <button
                type="button"
                onClick={handleNextVariation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
                title={uiLanguage === 'el' ? 'Παραγωγή νέας studio ενορχήστρωσης από το Google Lyria 3' : 'Generate new studio arrangement via Google Lyria 3'}
              >
                <Dices className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.newVariationBtn} #{musicSeedModifier + 1}</span>
              </button>
            )}

            {/* Custom File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-pink-400" />
              <span>
                {uploadedFilename
                  ? `${t.musicFileLoaded} ${uploadedFilename.slice(0, 15)}...`
                  : t.uploadCustomMusic}
              </span>
            </button>

            {/* Preview Button */}
            {settings.musicBedStyle !== 'none' && (
              <button
                type="button"
                onClick={togglePlayMusicPreview}
                disabled={isLoadingMusicPreview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isPlayingMusicPreview
                    ? 'bg-pink-600 border-pink-500 text-white animate-pulse'
                    : isLoadingMusicPreview
                    ? 'bg-pink-950/60 border-pink-500/40 text-pink-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border-slate-700'
                }`}
              >
                {isLoadingMusicPreview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-300" />
                    <span>Σύνθεση Lyria 3 Studio (~8s)...</span>
                  </>
                ) : isPlayingMusicPreview ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Διακοπή Ακρόασης</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ακρόαση Υπόκρουσης (Lyria 3)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Custom AI Music Generator Prompt Bar (Infinite Styles) */}
        {settings.musicBedStyle !== 'none' && settings.musicBedStyle !== 'custom_upload' && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-pink-950/30 via-indigo-950/30 to-slate-950 border border-pink-500/25 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-pink-300 whitespace-nowrap">
              <Wand2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span>AI Studio Music Prompt (Προαιρετικό):</span>
            </div>
            <input
              type="text"
              value={customMusicPrompt}
              onChange={(e) => onCustomMusicPromptChange?.(e.target.value)}
              placeholder="π.χ. Upbeat sunny Mediterranean acoustic guitar, warm bass & handclaps (ή αφήστε κενό για το επιλεγμένο στυλ)"
              className="flex-1 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
            {customMusicPrompt && (
              <button
                type="button"
                onClick={() => onCustomMusicPromptChange?.('')}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
              >
                Καθαρισμός
              </button>
            )}
          </div>
        )}

        {/* Music Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 my-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Music Bed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredOptions.map((bed) => {
            const isSelected = settings.musicBedStyle === bed.id;
            return (
              <button
                key={bed.id}
                type="button"
                onClick={() => handleUpdate({ musicBedStyle: bed.id })}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-pink-500/10 border-pink-500/60 shadow-md shadow-pink-950/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold line-clamp-1 ${
                      isSelected ? 'text-pink-300' : 'text-slate-200'
                    }`}
                  >
                    {bed.name}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0 ml-1" />}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-pink-400/90 font-medium mb-1">
                  <span>{bed.category}</span>
                  {bed.tempoBpm > 0 && <span>• {bed.tempoBpm} BPM</span>}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug mb-1.5">
                  {bed.description}
                </p>

                {bed.moodTags && bed.moodTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bed.moodTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Music & SFX Volume & Ducking Controls */}
        <div className="mt-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Music Volume (if music bed enabled) */}
          {settings.musicBedStyle !== 'none' ? (
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  {uiLanguage === 'el' ? 'Ένταση Μουσικής:' : 'Music Bed Volume:'}
                </span>
                <span className="font-mono font-bold text-pink-300">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.8}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) => handleUpdate({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                {uiLanguage === 'el'
                  ? 'Προτεινόμενο: 30% - 40% για καθαρή ομιλία'
                  : 'Recommended: 30% - 40% for clear voiceover'}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-slate-500 italic">
              {uiLanguage === 'el' ? 'Μουσική ανενεργή (A cappella / Voices & SFX only)' : 'Music disabled (A cappella / Voices & SFX only)'}
            </div>
          )}

          {/* SFX Global Volume */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                {uiLanguage === 'el' ? 'Ένταση SFX Εφέ:' : 'SFX Effects Volume:'}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {Math.round((settings.sfxVolume ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.5}
              step={0.05}
              value={settings.sfxVolume ?? 1.0}
              onChange={(e) => handleUpdate({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              {uiLanguage === 'el'
                ? 'Εξισορρόπηση όλων των ηχητικών εφέ στη μίξη'
                : 'Master level for all sound effects in the spot'}
            </span>
          </div>

          {/* Ducking Switch */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                {uiLanguage === 'el' ? 'Auto-Ducking (-12dB)' : 'Auto-Ducking (-12dB)'}
              </span>
              <span className="text-[11px] text-slate-400">
                {uiLanguage === 'el'
                  ? 'Χαμηλώνει τη μουσική αυτόματα στην ομιλία'
                  : 'Lowers music automatically under dialogue'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={settings.enableDucking}
                onChange={(e) => handleUpdate({ enableDucking: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: Audio Export & Quality Settings */}
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              5. Ρυθμίσεις Ποιότητας & Mastering (WAV / MP3)
            </h2>
            <p className="text-xs text-slate-400">
              Καθορίστε τη δειγματοληψία (kHz), το bit depth και τα κανάλια ήχου (Stereo/Mono).
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Format Selection: WAV or MP3 */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Format Αρχείου
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['wav', 'mp3'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleUpdate({ format: fmt })}
                  className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                    settings.format === fmt
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {settings.format === 'wav' ? 'Ασυμπίεστο Broadcast WAV' : 'Συμπιεσμένο MP3 / Web Audio'}
            </span>
          </div>

          {/* Sample Rate (kHz) */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Δειγματοληψία (Sample Rate)
            </label>
            <select
              value={settings.sampleRate}
              onChange={(e) => handleUpdate({ sampleRate: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value={22050}>22.05 kHz (Low Bandwidth)</option>
              <option value={24000}>24.0 kHz (Speech Optimized)</option>
              <option value={44100}>44.1 kHz (CD Audio Standard)</option>
              <option value={48000}>48.0 kHz (Radio & TV Broadcast Standard)</option>
              <option value={96000}>96.0 kHz (Hi-Res Studio Master)</option>
            </select>
            <span className="text-[10px] text-blue-400 block mt-1">
              {settings.sampleRate === 48000
                ? '★ Broadcast Standard (Προτεινόμενο)'
                : `${(settings.sampleRate / 1000).toFixed(1)} kHz`}
            </span>
          </div>

          {/* Bit Depth */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Βάθος Bit (Bit Depth)
            </label>
            <select
              value={settings.bitDepth}
              onChange={(e) => handleUpdate({ bitDepth: parseInt(e.target.value, 10) as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value={16}>16-bit PCM (Standard CD / Radio)</option>
              <option value={24}>24-bit PCM (Studio Master)</option>
              <option value={32}>32-bit Float (Ultra Dynamic Range)</option>
            </select>
            <span className="text-[10px] text-slate-500 block mt-1">
              {settings.bitDepth === 24 ? 'Επαγγελματικό δυναμικό εύρος' : `${settings.bitDepth}-bit`}
            </span>
          </div>

          {/* Channels: Stereo / Mono */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Κανάλια Ήχου
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { ch: 2, label: 'Stereo' },
                { ch: 1, label: 'Mono' },
              ].map((item) => (
                <button
                  key={item.ch}
                  type="button"
                  onClick={() => handleUpdate({ channels: item.ch as any })}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    settings.channels === item.ch
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {settings.channels === 2 ? 'L/R Spatial Panning' : 'Μονοφωνικό σήμα'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: The Big Render Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartRender}
          disabled={isRendering}
          className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg tracking-wide uppercase text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 active:scale-[0.99] transition-all shadow-xl shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-emerald-400/30 cursor-pointer"
        >
          {isRendering ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-emerald-200" />
              <span>{renderStepText || 'Εκτέλεση Παραγωγής Σποτ...'}</span>
            </>
          ) : (
            <>
              <Disc className="w-6 h-6 text-emerald-300 animate-spin-slow" />
              <span>Έναρξη Δημιουργίας & Μίξης Διαφήμισης (Render Full Spot)</span>
            </>
          )}
        </button>

        {/* Progress Bar when rendering */}
        {isRendering && (
          <div className="mt-3 bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-400">{renderStepText}</span>
              <span className="text-slate-300 font-mono">{renderProgressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${renderProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
