/**
 * AudioSpot Pro - AI Radio Ad Studio & Production Suite (GitHub Pages BYOK Edition)
 */

import React, { useState, useEffect } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { BriefingPanel, BriefData } from './components/BriefingPanel';
import { ScriptWorkspace } from './components/ScriptWorkspace';
import { VoiceConfigurationRack } from './components/VoiceConfigurationRack';
import { MusicAndMasterPanel } from './components/MusicAndMasterPanel';
import { AudioMasterPlayer } from './components/AudioMasterPlayer';
import {
  SpeakerConfig,
  ProductionSettings,
  TimelineTrackSegment,
  parseScript,
  renderFullSpotMixdown,
  remixWithUpdatedTimeline,
  exportAudioFile,
  synthesizeLineAudio,
  AVAILABLE_TIMBRES,
  inferGenderFromText,
  getDefaultTimbreForGender,
} from './services/audioProductionEngine';
import { clientGenerateScript } from './services/geminiClientService';
import { MUSIC_BED_OPTIONS, MusicBedStyle } from './services/musicBedGenerator';
import { UiLanguage, ProductionLanguage, translations } from './i18n/translations';
import {
  AudioSpotProject,
  exportProjectToJson,
  importProjectFromJson,
} from './services/projectStorage';
import { AlertTriangle, CheckCircle2, Key, ShieldCheck } from 'lucide-react';

const INITIAL_DEMO_SCRIPT_EL = `[SFX: Φρενάρισμα αυτοκινήτου]
[Φωνή 1 - Αφηγητής (Άνδρας)]: [έντονα] Ψάχνεις το τέλειο υβριδικό αυτοκίνητο για την πόλη;
[Φωνή 2 - Μαρία (Γυναίκα)]: [ενθουσιασμός] Μα δεν βρίσκω πουθενά άμεση παράδοση και χαμηλή κατανάλωση!
[Φωνή 1 - Αφηγητής (Άνδρας)]: Στην AutoStar σε περιμένουν πάνω από εκατό ετοιμοπαράδοτα μοντέλα, με πέντε χρόνια εγγύηση και μηδέν τοις εκατό προκαταβολή!
[Φωνή 2 - Μαρία (Γυναίκα)]: [γέλιο] Σοβαρά; Έφυγα τώρα για test drive!
[SFX: Ταμειακή μηχανή cha-ching]
[Φωνή 1 - Αφηγητής (Άνδρας)]: [χαλαρά] AutoStar. Οδήγησε το μέλλον σήμερα, στο autostar.gr.
[SFX: Whoosh μετάβασης]`;

export default function App() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('audiospot_ui_lang');
      if (stored === 'en' || stored === 'el') return stored;
    }
    return 'el';
  });

  const [productionLanguage, setProductionLanguage] = useState<ProductionLanguage>('el');
  const [spotTitle, setSpotTitle] = useState<string>('AutoStar Hybrid — Άμεση Παράδοση');
  const [spotConcept, setSpotConcept] = useState<string>(
    'Δυναμικός διάλογος ανάμεσα σε γυναίκα οδηγό και άνδρα εκφωνητή με ηχητικά εφέ αυτοκινήτου.'
  );
  const [script, setScript] = useState<string>(INITIAL_DEMO_SCRIPT_EL);
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // BYOK State
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_gemini_api_key') || '';
    }
    return '';
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyInputValue, setKeyInputValue] = useState<string>('');

  const [currentBrief, setCurrentBrief] = useState<BriefData>({
    topic: 'Προσφορά νέου υβριδικού αυτοκινήτου με 5 χρόνια εγγύηση και άμεση παράδοση.',
    targetDuration: 30,
    voiceCount: 2,
    style: 'Ενθουσιώδες / Hard-sell Προσφορά',
    tone: 'Φιλικός, πειστικός & γεμάτος ενέργεια',
    callToAction: 'Επισκεφθείτε την AutoStar ή στο autostar.gr',
    productionLanguage: 'el',
  });

  const [speakers, setSpeakers] = useState<SpeakerConfig[]>([
    {
      speakerTag: 'Φωνή 1',
      displayName: 'Αφηγητής',
      gender: 'male',
      timbreId: 'Fenrir',
      speed: 1.0,
      pitch: 0,
      volume: 1.0,
      pan: -0.15,
      actingStyle: 'Deep, warm, authoritative radio commercial announcer',
    },
    {
      speakerTag: 'Φωνή 2',
      displayName: 'Μαρία',
      gender: 'female',
      timbreId: 'Zephyr',
      speed: 1.05,
      pitch: 0,
      volume: 1.0,
      pan: 0.15,
      actingStyle: 'Friendly, bright, enthusiastic voice actor',
    },
  ]);

  const [settings, setSettings] = useState<ProductionSettings>({
    targetDurationSeconds: 30,
    musicBedStyle: 'upbeat_acoustic',
    musicVolume: 0.32,
    enableDucking: true,
    duckingAmount: 0.25,
    sfxVolume: 1.0,
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
  });

  const [isRenderingAudio, setIsRenderingAudio] = useState<boolean>(false);
  const [renderStepText, setRenderStepText] = useState<string>('');
  const [renderProgressPercent, setRenderProgressPercent] = useState<number>(0);
  const [masterBuffer, setMasterBuffer] = useState<AudioBuffer | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<TimelineTrackSegment[]>([]);
  const [downloadData, setDownloadData] = useState<{ blob: Blob; filename: string; mimeType: string } | null>(null);
  const [previewingSpeakerId, setPreviewingSpeakerId] = useState<string | null>(null);
  const [isPlayingOnAir, setIsPlayingOnAir] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const [customMusicBuffer, setCustomMusicBuffer] = useState<AudioBuffer | null>(null);
  const [renderedMusicBuffer, setRenderedMusicBuffer] = useState<AudioBuffer | null>(null);
  const [isRemixingTimeline, setIsRemixingTimeline] = useState<boolean>(false);
  const [musicSeedModifier, setMusicSeedModifier] = useState<number>(0);
  const [customMusicPrompt, setCustomMusicPrompt] = useState<string>('');

  const t = translations[uiLanguage];

  const handleUiLanguageChange = (lang: UiLanguage) => {
    setUiLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audiospot_ui_lang', lang);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = keyInputValue.trim();
    if (!trimmed) return;
    localStorage.setItem('user_gemini_api_key', trimmed);
    setApiKey(trimmed);
    setShowKeyModal(false);
    setStatusNotification(uiLanguage === 'el' ? 'Το Gemini API Key αποθηκεύτηκε επιτυχώς!' : 'Gemini API Key saved successfully!');
    setTimeout(() => setStatusNotification(null), 4000);
  };

  useEffect(() => {
    setSettings((prev) => ({ ...prev, targetDurationSeconds: targetDuration }));
  }, [targetDuration]);

  // Handle Generate Script completely Client-Side (BYOK)
  const handleGenerateScript = async (brief: BriefData) => {
    const activeKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : '');
    if (!activeKey) {
      setKeyInputValue('');
      setShowKeyModal(true);
      setScriptError(uiLanguage === 'el' ? 'Παρακαλώ εισάγετε το δικό σας Google AI Studio API Key (BYOK).' : 'Please enter your Google AI Studio API Key (BYOK).');
      return;
    }

    setIsGeneratingScript(true);
    setScriptError(null);
    setTargetDuration(brief.targetDuration);
    setCurrentBrief(brief);

    try {
      const data = await clientGenerateScript({
        apiKey: activeKey,
        topic: brief.topic,
        targetDuration: brief.targetDuration,
        voiceCount: brief.voiceCount,
        style: brief.style,
        tone: brief.tone,
        callToAction: brief.callToAction,
        productionLanguage: brief.productionLanguage,
      });

      if (data.script) {
        setSpotTitle(data.title || 'Ραδιοφωνικό Σποτ');
        setSpotConcept(data.conceptSummary || '');
        setScript(data.script);

        if (
          data.recommendedMusicStyle &&
          MUSIC_BED_OPTIONS.some((m) => m.id === data.recommendedMusicStyle)
        ) {
          setSettings((prev) => ({
            ...prev,
            musicBedStyle: data.recommendedMusicStyle as MusicBedStyle,
          }));
        }

        if (Array.isArray(data.structuredSpeakers) && data.structuredSpeakers.length > 0) {
          const mappedSpeakers: SpeakerConfig[] = data.structuredSpeakers.map(
            (spk: any, idx: number) => {
              const gender: 'male' | 'female' = spk.gender === 'female' ? 'female' : 'male';
              const requestedTimbre = AVAILABLE_TIMBRES.find(
                (timbre) => timbre.id === spk.voicePersona && timbre.gender === gender
              );
              const finalTimbre = requestedTimbre || getDefaultTimbreForGender(gender, idx);
              const isEn = brief.productionLanguage === 'en';

              return {
                speakerTag: spk.speakerId || (isEn ? `Voice ${idx + 1}` : `Φωνή ${idx + 1}`),
                displayName:
                  spk.roleName ||
                  (gender === 'female'
                    ? isEn ? 'Female Voice' : 'Εκφωνήτρια'
                    : isEn ? 'Male Voice' : 'Εκφωνητής'),
                gender,
                timbreId: finalTimbre.id,
                speed: 1.0,
                pitch: 0,
                volume: 1.0,
                pan: data.structuredSpeakers.length === 1 ? 0 : idx % 2 === 0 ? -0.15 : 0.15,
                actingStyle: spk.actingStyle || finalTimbre.defaultActingStyle,
              };
            }
          );
          setSpeakers(mappedSpeakers);
        }

        setStatusNotification(
          uiLanguage === 'el'
            ? `Το διαφημιστικό σενάριο (${brief.targetDuration}s) και οι φωνές ρυθμίστηκαν αυτόματα!`
            : `The commercial script (${brief.targetDuration}s) and voice cast are ready!`
        );
        setTimeout(() => setStatusNotification(null), 4500);
      }
    } catch (err: any) {
      console.error('Error in handleGenerateScript:', err);
      setScriptError(err.message || 'Αποτυχία παραγωγής σεναρίου.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handlePreviewVoice = async (speaker: SpeakerConfig) => {
    setPreviewingSpeakerId(speaker.speakerTag);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const parsedLines = parseScript(script, speakers);
      const speakerScriptLine = parsedLines.find(
        (l) => l.type === 'dialogue' && l.speakerTag === speaker.speakerTag
      );

      const fallbackSampleText =
        productionLanguage === 'en'
          ? `Hello! I am ${speaker.displayName}, voice talent for your commercial spot.`
          : `Γεια σας! Είμαι ο ${speaker.displayName} και αυτή είναι η φωνή του διαφημιστικού σας σποτ.`;

      const lineToSpeak = speakerScriptLine || {
        id: 'sample',
        type: 'dialogue' as const,
        speakerTag: speaker.speakerTag,
        originalText: fallbackSampleText,
        spokenText: fallbackSampleText,
        cues: [],
        sfxTriggers: [],
        pauseAfterSeconds: 0.2,
      };

      const buffer = await synthesizeLineAudio(audioCtx, lineToSpeak, speaker, productionLanguage);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speaker.speed || 1.0;

      const gain = audioCtx.createGain();
      gain.gain.value = speaker.volume;

      const panner = audioCtx.createStereoPanner();
      panner.pan.value = speaker.pan;

      source.connect(gain);
      gain.connect(panner);
      panner.connect(audioCtx.destination);

      source.onended = () => {
        setPreviewingSpeakerId(null);
      };

      source.start(0);
    } catch (err) {
      console.error('Failed to preview voice:', err);
      setPreviewingSpeakerId(null);
    }
  };

  const handleStartRender = async () => {
    setIsRenderingAudio(true);
    setRenderProgressPercent(5);
    setRenderStepText(
      uiLanguage === 'el'
        ? 'Απομόνωση καθαρών διαλόγων & ηχητικών εφέ...'
        : 'Isolating spoken dialogue & sound effects...'
    );
    setScriptError(null);

    try {
      const parsedLines = parseScript(script, speakers);
      const hasDialogue = parsedLines.some((l) => l.type === 'dialogue');
      if (!hasDialogue) {
        throw new Error(
          uiLanguage === 'el'
            ? 'Δεν βρέθηκαν ατάκες διαλόγου στο σενάριο. Πληκτρολογήστε ή παράγετε κείμενο.'
            : 'No dialogue lines found in script. Please type or generate script.'
        );
      }

      const {
        masterBuffer: renderedBuffer,
        timelineSegments: renderedSegments,
        musicBuffer: producedMusicBuffer,
      } = await renderFullSpotMixdown(
        parsedLines,
        speakers,
        settings,
        (step, progress) => {
          setRenderStepText(step);
          setRenderProgressPercent(Math.round(progress));
        },
        customMusicBuffer,
        musicSeedModifier,
        customMusicPrompt,
        productionLanguage
      );

      setMasterBuffer(renderedBuffer);
      setTimelineSegments(renderedSegments);
      setRenderedMusicBuffer(producedMusicBuffer || null);

      const exportData = await exportAudioFile(renderedBuffer, settings);
      setDownloadData(exportData);

      setStatusNotification(
        uiLanguage === 'el'
          ? `Η τελική διαφήμιση (${Math.round(renderedBuffer.duration)}s) είναι έτοιμη!`
          : `Master commercial (${Math.round(renderedBuffer.duration)}s) is ready!`
      );
      setTimeout(() => setStatusNotification(null), 5000);

      setTimeout(() => {
        const playerElem = document.getElementById('master-player-section');
        if (playerElem) {
          playerElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (err: any) {
      console.error('Error during audio production:', err);
      setScriptError(err.message || 'Σφάλμα κατά την παραγωγή του ήχου.');
    } finally {
      setIsRenderingAudio(false);
    }
  };

  const handleUpdateTimelineSegments = async (updatedSegments: TimelineTrackSegment[]) => {
    setIsRemixingTimeline(true);
    try {
      const { masterBuffer: newMaster, timelineSegments: newSegs } = await remixWithUpdatedTimeline(
        updatedSegments,
        renderedMusicBuffer,
        settings
      );
      setMasterBuffer(newMaster);
      setTimelineSegments(newSegs);
      const exportData = await exportAudioFile(newMaster, settings);
      setDownloadData(exportData);
    } catch (err) {
      console.error('Failed to remix timeline:', err);
    } finally {
      setIsRemixingTimeline(false);
    }
  };

  const handleResetTimeline = async () => {
    if (!timelineSegments || timelineSegments.length === 0) return;
    const resetSegs = timelineSegments.map((s) => ({
      ...s,
      startTime: s.originalStartTime ?? s.startTime,
      endTime: s.originalEndTime ?? s.endTime,
    }));
    await handleUpdateTimelineSegments(resetSegs);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Studio Header */}
      <StudioHeader
        uiLanguage={uiLanguage}
        onUiLanguageChange={handleUiLanguageChange}
        onSaveProject={() => {}}
        onLoadProject={() => {}}
        isRendering={isRenderingAudio}
        isPlaying={isPlayingOnAir}
      />

      {/* BYOK Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Deployment: <strong className="text-slate-200">GitHub Pages (Client-Side BYOK)</strong></span>
          </div>
          <button
            onClick={() => {
              setKeyInputValue(apiKey);
              setShowKeyModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'Gemini API Key: ••••••••' : 'Ορισμός Gemini API Key (BYOK)'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {statusNotification && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {statusNotification}
            </span>
            <button onClick={() => setStatusNotification(null)} className="text-emerald-400 hover:text-white ml-2 text-xs">✕</button>
          </div>
        )}

        {scriptError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{scriptError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <BriefingPanel
              uiLanguage={uiLanguage}
              productionLanguage={productionLanguage}
              onProductionLanguageChange={setProductionLanguage}
              onGenerate={handleGenerateScript}
              isGenerating={isGeneratingScript}
              initialBrief={currentBrief}
            />
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <ScriptWorkspace
              uiLanguage={uiLanguage}
              productionLanguage={productionLanguage}
              spotTitle={spotTitle}
              spotConcept={spotConcept}
              script={script}
              onScriptChange={setScript}
              targetDurationSeconds={targetDuration}
              speakers={speakers}
            />
          </div>
        </div>

        <VoiceConfigurationRack
          speakers={speakers}
          onSpeakersChange={setSpeakers}
          onPreviewVoice={handlePreviewVoice}
          previewingSpeakerId={previewingSpeakerId}
          script={script}
          onStartRender={handleStartRender}
          isRendering={isRenderingAudio}
          uiLanguage={uiLanguage}
        />

        <MusicAndMasterPanel
          settings={settings}
          onSettingsChange={setSettings}
          onStartRender={handleStartRender}
          isRendering={isRenderingAudio}
          renderStepText={renderStepText}
          renderProgressPercent={renderProgressPercent}
          customAudioBuffer={customMusicBuffer}
          onCustomAudioUploaded={(buf) => setCustomMusicBuffer(buf)}
          musicSeedModifier={musicSeedModifier}
          onMusicSeedChange={setMusicSeedModifier}
          customMusicPrompt={customMusicPrompt}
          onCustomMusicPromptChange={setCustomMusicPrompt}
          uiLanguage={uiLanguage}
        />

        <div id="master-player-section">
          <AudioMasterPlayer
            masterBuffer={masterBuffer}
            downloadData={downloadData}
            settings={settings}
            timelineSegments={timelineSegments}
            onPlayStateChange={setIsPlayingOnAir}
            uiLanguage={uiLanguage}
            onUpdateTimelineSegments={handleUpdateTimelineSegments}
            onResetTimeline={handleResetTimeline}
            isRemixing={isRemixingTimeline}
          />
        </div>
      </main>

      {/* BYOK Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Google AI Studio API Key (BYOK)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Εισάγετε το προσωπικό σας Gemini API key. Το κλειδί αποθηκεύεται <strong>αποκλειστικά στον browser σας</strong> (localStorage) και καλεί απευθείας τα μοντέλα της Google χωρίς μεσάζοντες server.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInputValue}
              onChange={(e) => setKeyInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl transition-colors"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AudioSpot PRO — Professional AI Radio Ad Production Suite</span>
          <span className="text-[11px] text-slate-400">GitHub Pages BYOK Edition</span>
        </div>
      </footer>
    </div>
  );
}