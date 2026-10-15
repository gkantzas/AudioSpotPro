import React from 'react';
import { Sliders, Volume2, Gauge, Play, Loader2, Music2, Plus, Trash2, UserCheck, Disc, MessageSquareQuote } from 'lucide-react';
import {
  SpeakerConfig,
  AVAILABLE_TIMBRES,
  inferGenderFromText,
  getDefaultTimbreForGender,
  parseScript,
} from '../services/audioProductionEngine';
import { UiLanguage, translations } from '../i18n/translations';

interface VoiceConfigurationRackProps {
  speakers: SpeakerConfig[];
  onSpeakersChange: (speakers: SpeakerConfig[]) => void;
  onPreviewVoice: (speaker: SpeakerConfig) => void;
  previewingSpeakerId: string | null;
  script?: string;
  onStartRender?: () => void;
  isRendering?: boolean;
  uiLanguage?: UiLanguage;
}

export const VoiceConfigurationRack: React.FC<VoiceConfigurationRackProps> = ({
  speakers,
  onSpeakersChange,
  onPreviewVoice,
  previewingSpeakerId,
  script = '',
  onStartRender,
  isRendering = false,
  uiLanguage = 'el',
}) => {
  const maleTimbres = AVAILABLE_TIMBRES.filter((t) => t.gender === 'male');
  const femaleTimbres = AVAILABLE_TIMBRES.filter((t) => t.gender === 'female');
  const parsedLines = parseScript(script, speakers);
  const t = translations[uiLanguage];

  const handleUpdateSpeaker = (idx: number, updates: Partial<SpeakerConfig>) => {
    const updated = [...speakers];
    const current = { ...updated[idx], ...updates };

    // If role name changed, check if it implies a specific gender
    if (updates.displayName !== undefined && updates.gender === undefined) {
      const inferred = inferGenderFromText(updates.displayName);
      if (inferred && inferred !== current.gender) {
        current.gender = inferred;
        const matchingTimbre = getDefaultTimbreForGender(inferred, idx);
        current.timbreId = matchingTimbre.id;
        current.actingStyle = matchingTimbre.defaultActingStyle;
      }
    }

    // If gender was explicitly toggled, ensure timbreId matches the new gender
    if (updates.gender !== undefined) {
      const currentTimbre = AVAILABLE_TIMBRES.find((t) => t.id === current.timbreId);
      if (!currentTimbre || currentTimbre.gender !== updates.gender) {
        const matchingTimbre = getDefaultTimbreForGender(updates.gender, idx);
        current.timbreId = matchingTimbre.id;
        current.actingStyle = matchingTimbre.defaultActingStyle;
      }
    }

    // If timbreId changed, sync gender to that timbre's gender
    if (updates.timbreId !== undefined) {
      const chosenTimbre = AVAILABLE_TIMBRES.find((t) => t.id === updates.timbreId);
      if (chosenTimbre) {
        current.gender = chosenTimbre.gender;
        current.actingStyle = chosenTimbre.defaultActingStyle;
      }
    }

    updated[idx] = current;
    onSpeakersChange(updated);
  };

  const handleAddSpeaker = () => {
    const nextIdx = speakers.length + 1;
    // Alternate gender by default so dialogues have contrast
    const nextGender: 'male' | 'female' = nextIdx % 2 === 0 ? 'female' : 'male';
    const defaultTimbre = getDefaultTimbreForGender(nextGender, nextIdx);
    const newSpeaker: SpeakerConfig = {
      speakerTag: `Φωνή ${nextIdx}`,
      displayName: nextGender === 'female' ? `Γυναικείος Ρόλος ${nextIdx}` : `Ανδρικός Ρόλος ${nextIdx}`,
      gender: nextGender,
      timbreId: defaultTimbre.id,
      speed: 1.0,
      pitch: 0,
      volume: 1.0,
      pan: nextIdx % 2 === 0 ? 0.2 : -0.2,
      actingStyle: defaultTimbre.defaultActingStyle,
    };
    onSpeakersChange([...speakers, newSpeaker]);
  };

  const handleRemoveSpeaker = (idx: number) => {
    if (speakers.length <= 1) return;
    const updated = speakers.filter((_, i) => i !== idx);
    onSpeakersChange(updated);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {t.voiceRackTitle}
            </h2>
            <p className="text-xs text-slate-400">{t.voiceRackSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onStartRender && (
            <button
              type="button"
              onClick={onStartRender}
              disabled={isRendering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              title={uiLanguage === 'el' ? 'Μιξάρει όλες τις φωνές μαζί στη σωστή χρονική σειρά με τα εφέ και τη μουσική' : 'Mixes all voices sequentially with SFX and music bed'}
            >
              {isRendering ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Disc className="w-3.5 h-3.5" />
              )}
              <span>{t.mixAllBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddSpeaker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addVoiceBtn}</span>
          </button>
        </div>
      </div>

      {/* Speaker Cards Grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {speakers.map((spk, idx) => {
          const activeTimbre =
            AVAILABLE_TIMBRES.find((t) => t.id === spk.timbreId) ||
            getDefaultTimbreForGender(spk.gender, idx);
          const isPreviewing = previewingSpeakerId === spk.speakerTag;
          const speakerLines = parsedLines.filter(
            (l) => l.type === 'dialogue' && l.speakerTag === spk.speakerTag
          );

          return (
            <div
              key={spk.speakerTag}
              className="bg-slate-950/80 rounded-xl border border-slate-800/90 p-4 relative overflow-hidden transition-all hover:border-slate-700"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold font-mono ${
                      spk.gender === 'female'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <input
                      type="text"
                      value={spk.displayName}
                      onChange={(e) => handleUpdateSpeaker(idx, { displayName: e.target.value })}
                      placeholder="Όνομα / Ρόλος (π.χ. Μαρία, Αφηγητής)"
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-sm font-bold text-white px-1 py-0.5 rounded"
                    />
                    <div className="text-[11px] text-slate-500 font-mono px-1 flex items-center gap-2">
                      <span>
                        Tag: <span className="text-indigo-400 font-semibold">{spk.speakerTag}</span>
                      </span>
                      <span className="text-emerald-400">
                        • {speakerLines.length} {speakerLines.length === 1 ? 'ατάκα' : 'ατάκες'} στο σποτ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gender Toggle + Preview + Delete */}
                <div className="flex items-center gap-2">
                  {/* Explicit Gender Selector */}
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateSpeaker(idx, { gender: 'male' })}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        spk.gender === 'male'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.maleGender}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateSpeaker(idx, { gender: 'female' })}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        spk.gender === 'female'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.femaleGender}
                    </button>
                  </div>

                  {/* Preview Voice's Actual Script Line Button */}
                  <button
                    type="button"
                    onClick={() => onPreviewVoice(spk)}
                    disabled={isPreviewing}
                    title={uiLanguage === 'el' ? 'Ακούστε αυτή τη φωνή να εκφωνεί τη δική της ατάκα από το σενάριο' : 'Audition this voice speaking their script dialogue'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                    )}
                    <span>{t.testLineBtn}</span>
                  </button>

                  {speakers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpeaker(idx)}
                      title="Διαγραφή φωνής"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Script Lines Preview for this specific speaker */}
              <div className="mb-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-0.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Ατάκες που εκφωνεί ο ρόλος «{spk.displayName}» στη μίξη:</span>
                </div>
                {speakerLines.length > 0 ? (
                  <p className="text-slate-200 italic line-clamp-2 pl-5">
                    «{speakerLines.map((l) => l.spokenText).join(' • ')}»
                  </p>
                ) : (
                  <p className="text-slate-500 pl-5">
                    Δεν βρέθηκε ατάκα με tag [{spk.speakerTag}] στο σενάριο.
                  </p>
                )}
              </div>

              {/* Timbre Selection Filtered/Grouped by Gender */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Ηχόχρωμα Εκφωνητή ({spk.gender === 'female' ? 'Γυναικεία Φωνή ♀' : 'Ανδρική Φωνή ♂'})
                  </label>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Κλειδωμένο φύλο
                  </span>
                </div>
                <select
                  value={activeTimbre.id}
                  onChange={(e) => handleUpdateSpeaker(idx, { timbreId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {spk.gender === 'male' ? (
                    <optgroup label="Ανδρικές Φωνές (♂)">
                      {maleTimbres.map((t) => (
                        <option key={t.id} value={t.id}>
                          ♂ {t.name} — {t.tone}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <optgroup label="Γυναικείες Φωνές (♀)">
                      {femaleTimbres.map((t) => (
                        <option key={t.id} value={t.id}>
                          ♀ {t.name} — {t.tone}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[11px] text-amber-400/90 mt-1">
                  Ιδανικό για: <span className="text-slate-300">{activeTimbre.bestFor}</span>
                </p>
              </div>

              {/* Sliders Grid: Speed, Pitch, Volume, Pan */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Speed Slider */}
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Gauge className="w-3 h-3 text-blue-400" /> Ταχύτητα:
                    </span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {spk.speed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={spk.speed}
                    onChange={(e) => handleUpdateSpeaker(idx, { speed: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span>0.8x (Αργά)</span>
                    <span>1.0x</span>
                    <span>1.4x (Γρήγορα)</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Music2 className="w-3 h-3 text-amber-400" /> Τόνος / Pitch:
                    </span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {spk.pitch > 0 ? `+${spk.pitch}` : spk.pitch} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-4}
                    max={4}
                    step={1}
                    value={spk.pitch}
                    onChange={(e) => handleUpdateSpeaker(idx, { pitch: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span>-4 (Βαθύ)</span>
                    <span>0</span>
                    <span>+4 (Υψηλό)</span>
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Volume2 className="w-3 h-3 text-emerald-400" /> Ένταση:
                    </span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {Math.round(spk.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={spk.volume}
                    onChange={(e) => handleUpdateSpeaker(idx, { volume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span>20%</span>
                    <span>100%</span>
                    <span>150%</span>
                  </div>
                </div>

                {/* Stereo Pan Slider */}
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-[11px]">Πανόραμα (Pan):</span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {spk.pan === 0 ? 'Center' : spk.pan < 0 ? `L ${Math.abs(Math.round(spk.pan * 100))}%` : `R ${Math.round(spk.pan * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.1}
                    value={spk.pan}
                    onChange={(e) => handleUpdateSpeaker(idx, { pan: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span>L</span>
                    <span>C</span>
                    <span>R</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
