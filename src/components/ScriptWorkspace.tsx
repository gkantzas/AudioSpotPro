import React, { useRef, useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Clock,
  Volume2,
  Eye,
  Code2,
  Mic,
  Zap,
  Play,
  PlusCircle,
  Headphones,
} from 'lucide-react';
import { SpeakerConfig, parseScript } from '../services/audioProductionEngine';
import { AVAILABLE_SFX, SFXType, auditionSFX, SFXDefinition } from '../services/soundEffects';
import { UiLanguage, ProductionLanguage, translations } from '../i18n/translations';

interface ScriptWorkspaceProps {
  uiLanguage: UiLanguage;
  productionLanguage: ProductionLanguage;
  spotTitle?: string;
  spotConcept?: string;
  script: string;
  onScriptChange: (newScript: string) => void;
  targetDurationSeconds: number;
  speakers: SpeakerConfig[];
}

export const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({
  uiLanguage,
  productionLanguage,
  spotTitle,
  spotConcept,
  script,
  onScriptChange,
  targetDurationSeconds,
  speakers,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [selectedSfxId, setSelectedSfxId] = useState<SFXType>('cash_register');
  const [isAuditioning, setIsAuditioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = translations[uiLanguage];

  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      onScriptChange(`${script}${tag}`);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newText = `${before}${tag}${after}`;
    onScriptChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const handleAuditionSfx = async (sfxId: SFXType) => {
    setIsAuditioning(true);
    try {
      await auditionSFX(sfxId, 0.85);
    } finally {
      setTimeout(() => setIsAuditioning(false), 900);
    }
  };

  const handleInsertSfx = (sfx: SFXDefinition) => {
    const tag = productionLanguage === 'en' ? sfx.tagEn : sfx.tagEl;
    handleInsertTag(`\n${tag}\n`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group SFX by category
  const categories: Record<string, SFXDefinition[]> = {};
  AVAILABLE_SFX.forEach((sfx) => {
    if (!categories[sfx.category]) categories[sfx.category] = [];
    categories[sfx.category].push(sfx);
  });

  // Current selected SFX definition
  const currentSfx = AVAILABLE_SFX.find((s) => s.id === selectedSfxId) || AVAILABLE_SFX[0];

  // Quick SFX hint picks
  const quickHints: SFXType[] = [
    'cash_register',
    'doorbell',
    'car_screech',
    'whoosh',
    'sub_impact',
    'applause',
    'phone_ring',
    'champagne_cork',
    'magic_sparkle',
    'clock_ticking',
  ];

  // Parse script using exact production parser
  const parsedTimeline = parseScript(script, speakers);
  const dialogueLines = parsedTimeline.filter((l) => l.type === 'dialogue');
  const actualWords = dialogueLines.reduce(
    (sum, line) => sum + line.spokenText.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length,
    0
  );
  const estimatedReadSec = Math.round(actualWords / 2.3);

  const durationDiff = estimatedReadSec - targetDurationSeconds;
  const isTimingGood = Math.abs(durationDiff) <= Math.max(4, targetDurationSeconds * 0.18);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {t.scriptTitle}
            </h2>
            <p className="text-xs text-slate-400">{t.scriptSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch between Raw Script Editor and On-Air Preview */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'editor'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{t.editMode}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {t.previewMode} ({parsedTimeline.length})
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copiedScript}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">{t.copyScript}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Director's Concept Card */}
      {(spotTitle || spotConcept) && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            {spotTitle && (
              <span className="font-bold text-indigo-300 mr-2">🎬 {spotTitle}</span>
            )}
            {spotConcept && <span className="text-slate-300">{spotConcept}</span>}
          </div>
          <span className="text-[10px] text-indigo-400/80 whitespace-nowrap font-mono">
            {uiLanguage === 'el' ? 'Σημείωμα Σκηνοθέτη (Δεν εκφωνείται)' : "Director's Note (Not voiced)"}
          </span>
        </div>
      )}

      {viewMode === 'editor' ? (
        <>
          {/* REAL SFX COMBO & CONTROLS TOOLBAR */}
          <div className="my-3 p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                {t.sfxSelectorLabel}
              </span>
              <span className="text-[11px] text-slate-400">
                {uiLanguage === 'el'
                  ? currentSfx.descriptionEl
                  : currentSfx.descriptionEn}
              </span>
            </div>

            {/* SFX Dropdown Combo + Audition + Insert */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[220px]">
                <select
                  value={selectedSfxId}
                  onChange={(e) => setSelectedSfxId(e.target.value as SFXType)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  {Object.entries(categories).map(([catName, items]) => (
                    <optgroup key={catName} label={`— ${catName} —`}>
                      {items.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {uiLanguage === 'el' ? s.labelEl : s.labelEn}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Audition Button */}
              <button
                type="button"
                onClick={() => handleAuditionSfx(selectedSfxId)}
                disabled={isAuditioning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                title={uiLanguage === 'el' ? 'Ακούστε πώς ηχεί αυτό το SFX' : 'Listen to this SFX'}
              >
                <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.sfxAuditionBtn}</span>
              </button>

              {/* Insert Button */}
              <button
                type="button"
                onClick={() => handleInsertSfx(currentSfx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
                title={uiLanguage === 'el' ? 'Εισαγωγή του tag στο σενάριο' : 'Insert tag into script'}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.sfxInsertBtn}</span>
              </button>
            </div>

            {/* Quick SFX Hints / Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 pr-1">
                {t.sfxQuickHints}
              </span>
              {quickHints.map((hintId) => {
                const sfxDef = AVAILABLE_SFX.find((s) => s.id === hintId);
                if (!sfxDef) return null;
                const isSelected = selectedSfxId === hintId;
                return (
                  <button
                    key={hintId}
                    type="button"
                    onClick={() => {
                      setSelectedSfxId(hintId);
                      handleInsertSfx(sfxDef);
                    }}
                    onDoubleClick={() => handleAuditionSfx(hintId)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
                    }`}
                    title={
                      uiLanguage === 'el'
                        ? `${sfxDef.labelEl} (Κλικ: Εισαγωγή, Διπλό: Ακρόαση)`
                        : `${sfxDef.labelEn} (Click: Insert, Double-click: Audition)`
                    }
                  >
                    <span>{sfxDef.icon}</span>
                    <span>{uiLanguage === 'el' ? sfxDef.labelEl.split(' ')[0] : sfxDef.labelEn.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Acting Cues & Voice Roles Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1 pr-1">
                <Sparkles className="w-3 h-3" /> {t.actingCuesLabel}
              </span>
              {(productionLanguage === 'en'
                ? [
                    { label: '[excited]', tag: '[excited] ' },
                    { label: '[whisper]', tag: '[whisper] ' },
                    { label: '[urgent]', tag: '[urgent] ' },
                    { label: '[relaxed]', tag: '[relaxed] ' },
                    { label: '[laughing]', tag: '[laughing] ' },
                    { label: '[pause 1s]', tag: ' [pause 1s] ' },
                  ]
                : [
                    { label: '[ενθουσιασμός]', tag: '[ενθουσιασμός] ' },
                    { label: '[ψίθυρος]', tag: '[ψίθυρος] ' },
                    { label: '[έντονα]', tag: '[έντονα] ' },
                    { label: '[χαλαρά]', tag: '[χαλαρά] ' },
                    { label: '[γέλιο]', tag: '[γέλιο] ' },
                    { label: '[χασμουρητό]', tag: '[χασμουρητό] ' },
                    { label: '[παύση 1s]', tag: ' [παύση 1s] ' },
                  ]
              ).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertTag(item.tag)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-mono transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Script Textarea */}
          <div className="relative flex-1 min-h-[260px]">
            <textarea
              ref={textareaRef}
              value={script}
              onChange={(e) => onScriptChange(e.target.value)}
              placeholder={t.textareaPlaceholder}
              className="w-full h-full min-h-[260px] bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 leading-relaxed resize-y selection:bg-indigo-500/30"
              spellCheck={false}
            />
          </div>
        </>
      ) : (
        /* ON-AIR PRODUCTION TIMELINE PREVIEW */
        <div className="my-3 flex-1 min-h-[310px] max-h-[400px] overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-3.5 space-y-2">
          <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider pb-2 border-b border-slate-800/80 flex items-center justify-between">
            <span>{t.onAirPreviewHeader}</span>
            <span>{t.autoDuckedBed}</span>
          </div>

          {parsedTimeline.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              {t.noDialogueLines}
            </div>
          ) : (
            parsedTimeline.map((item, idx) => {
              if (item.type === 'sfx_only') {
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-blue-300 flex items-center gap-1.5 font-bold">
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      {t.sfxEventLabel} {item.sfxTriggers.join(', ')}
                    </span>
                    <span className="text-blue-400/80 text-[11px]">{item.originalText}</span>
                  </div>
                );
              }

              const speakerObj = speakers.find((s) => s.speakerTag === item.speakerTag);
              const displayName = speakerObj ? speakerObj.displayName : item.speakerTag;
              const isFemale = speakerObj?.gender === 'female';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    isFemale
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-indigo-950/20 border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isFemale
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isFemale ? '♀' : '♂'} {item.speakerTag} — {displayName}
                      </span>
                      {item.cues.length > 0 && (
                        <span className="text-amber-400 text-[11px] font-semibold">
                          {item.cues.join(' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[10px]">#0{idx + 1}</span>
                  </div>

                  <p className="text-slate-100 text-sm leading-relaxed pl-1">
                    "{item.spokenText}"
                  </p>

                  {item.sfxTriggers.length > 0 && (
                    <div className="mt-2 pt-1 border-t border-slate-800/40 flex items-center gap-1 text-[11px] text-blue-300">
                      <Volume2 className="w-3 h-3 text-blue-400" />
                      <span>SFX: {item.sfxTriggers.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Script Length & Broadcast Duration Tracker */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            {t.wordsCountLabel}{' '}
            <strong className="text-slate-200">{actualWords}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            {t.durationEstimateLabel}{' '}
            <strong
              className={
                isTimingGood
                  ? 'text-emerald-400'
                  : Math.abs(durationDiff) > 10
                  ? 'text-red-400'
                  : 'text-amber-400'
              }
            >
              ~{estimatedReadSec}s
            </strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            {t.targetDurationLabel}{' '}
            <strong className="text-slate-200">{targetDurationSeconds}s</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isTimingGood ? (
            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
              <Check className="w-3.5 h-3.5" /> {t.timingGood}
            </span>
          ) : durationDiff < 0 ? (
            <span className="text-amber-400 flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5" /> {t.timingShort}
            </span>
          ) : (
            <span className="text-red-400 flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" /> {t.timingLong}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
