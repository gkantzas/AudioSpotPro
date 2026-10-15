/**
 * AudioSpot Pro - AI Radio Ad Studio & Production Suite
 * Complete radio commercial studio with AI copywriter, voice directing, and broadcast audio mixdown.
 * Supports bilingual UI (Greek/English), multi-language ad production, real SFX, and complete JSON project save/load.
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
import { MUSIC_BED_OPTIONS, MusicBedStyle } from './services/musicBedGenerator';
import { UiLanguage, ProductionLanguage, translations } from './i18n/translations';
import {
  AudioSpotProject,
  exportProjectToJson,
  importProjectFromJson,
} from './services/projectStorage';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const INITIAL_DEMO_SCRIPT_EL = `[SFX: Φρενάρισμα αυτοκινήτου]
[Φωνή 1 - Αφηγητής (Άνδρας)]: [έντονα] Ψάχνεις το τέλειο υβριδικό αυτοκίνητο για την πόλη;
[Φωνή 2 - Μαρία (Γυναίκα)]: [ενθουσιασμός] Μα δεν βρίσκω πουθενά άμεση παράδοση και χαμηλή κατανάλωση!
[Φωνή 1 - Αφηγητής (Άνδρας)]: Στην AutoStar σε περιμένουν πάνω από εκατό ετοιμοπαράδοτα μοντέλα, με πέντε χρόνια εγγύηση και μηδέν τοις εκατό προκαταβολή!
[Φωνή 2 - Μαρία (Γυναίκα)]: [γέλιο] Σοβαρά; Έφυγα τώρα για test drive!
[SFX: Ταμειακή μηχανή cha-ching]
[Φωνή 1 - Αφηγητής (Άνδρας)]: [χαλαρά] AutoStar. Οδήγησε το μέλλον σήμερα, στο autostar.gr.
[SFX: Whoosh μετάβασης]`;

export default function App() {
  // Internationalization: UI Language (interface) vs Production Language (commercial audio)
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

  // Initial / current brief for project save/load
  const [currentBrief, setCurrentBrief] = useState<BriefData>({
    topic: 'Προσφορά νέου υβριδικού αυτοκινήτου με 5 χρόνια εγγύηση και άμεση παράδοση.',
    targetDuration: 30,
    voiceCount: 2,
    style: 'Ενθουσιώδες / Hard-sell Προσφορά',
    tone: 'Φιλικός, πειστικός & γεμάτος ενέργεια',
    callToAction: 'Επισκεφθείτε την AutoStar ή στο autostar.gr',
    productionLanguage: 'el',
  });

  // Speakers configuration with explicit gender matching
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

  // Production and Export Master settings
  const [settings, setSettings] = useState<ProductionSettings>({
    targetDurationSeconds: 30,
    musicBedStyle: 'upbeat_acoustic',
    musicVolume: 0.32,
    enableDucking: true,
    duckingAmount: 0.25,
    sfxVolume: 1.0,
    format: 'wav',
    sampleRate: 48000, // 48kHz Broadcast standard
    bitDepth: 24, // 24-bit Studio Master
    channels: 2, // Stereo
  });

  // Render & Playback state
  const [isRenderingAudio, setIsRenderingAudio] = useState<boolean>(false);
  const [renderStepText, setRenderStepText] = useState<string>('');
  const [renderProgressPercent, setRenderProgressPercent] = useState<number>(0);
  const [masterBuffer, setMasterBuffer] = useState<AudioBuffer | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<TimelineTrackSegment[]>([]);
  const [downloadData, setDownloadData] = useState<{ blob: Blob; filename: string; mimeType: string } | null>(null);
  const [previewingSpeakerId, setPreviewingSpeakerId] = useState<string | null>(null);
  const [isPlayingOnAir, setIsPlayingOnAir] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // High-Fidelity Music Studio state: custom user track, Lyria 3 prompt, and infinite seed variations
  const [customMusicBuffer, setCustomMusicBuffer] = useState<AudioBuffer | null>(null);
  const [renderedMusicBuffer, setRenderedMusicBuffer] = useState<AudioBuffer | null>(null);
  const [isRemixingTimeline, setIsRemixingTimeline] = useState<boolean>(false);
  const [musicSeedModifier, setMusicSeedModifier] = useState<number>(0);
  const [customMusicPrompt, setCustomMusicPrompt] = useState<string>('');

  const t = translations[uiLanguage];

  // Persist UI language choice
  const handleUiLanguageChange = (lang: UiLanguage) => {
    setUiLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audiospot_ui_lang', lang);
    }
  };

  // Synchronize target duration in settings
  useEffect(() => {
    setSettings((prev) => ({ ...prev, targetDurationSeconds: targetDuration }));
  }, [targetDuration]);

  // Auto-sync speaker gender/roles if the user edits speaker tags in the script textarea manually
  useEffect(() => {
    const tagRegex = /\[(Φωνή\s*(\d+)[^\]]*|Voice\s*(\d+)[^\]]*)\]/gi;
    const foundByTag = new Map<string, string>();
    let match;
    while ((match = tagRegex.exec(script)) !== null) {
      const fullTagContent = match[1].trim();
      const num = match[2] || match[3];
      const canonicalTag = match[2] ? `Φωνή ${num}` : `Voice ${num}`;
      if (!foundByTag.has(canonicalTag)) {
        foundByTag.set(canonicalTag, fullTagContent);
      }
    }

    if (foundByTag.size === 0) return;

    setSpeakers((prevSpeakers) => {
      let changed = false;
      const updated = [...prevSpeakers];

      foundByTag.forEach((fullLabel, canonicalTag) => {
        const inferredGender = inferGenderFromText(fullLabel);
        const existingIdx = updated.findIndex((s) => s.speakerTag === canonicalTag);

        if (existingIdx !== -1) {
          const existing = updated[existingIdx];
          if (inferredGender && existing.gender !== inferredGender) {
            const newTimbre = getDefaultTimbreForGender(inferredGender, existingIdx);
            updated[existingIdx] = {
              ...existing,
              gender: inferredGender,
              timbreId: newTimbre.id,
              actingStyle: newTimbre.defaultActingStyle,
            };
            changed = true;
          }
        } else {
          // New speaker added in script editor
          const idx = updated.length;
          const gender: 'male' | 'female' = inferredGender || (idx % 2 === 1 ? 'female' : 'male');
          const defaultTimbre = getDefaultTimbreForGender(gender, idx);
          const rolePart = fullLabel
            .replace(/^(?:Φωνή|Voice)\s*\d+\s*[-:]?\s*/i, '')
            .replace(/\((?:Άνδρας|Γυναίκα|Male|Female)\)/gi, '')
            .trim();

          updated.push({
            speakerTag: canonicalTag,
            displayName: rolePart || (gender === 'female' ? `Role ${idx + 1}` : `Role ${idx + 1}`),
            gender,
            timbreId: defaultTimbre.id,
            speed: 1.0,
            pitch: 0,
            volume: 1.0,
            pan: idx % 2 === 0 ? -0.15 : 0.15,
            actingStyle: defaultTimbre.defaultActingStyle,
          });
          changed = true;
        }
      });

      return changed ? updated : prevSpeakers;
    });
  }, [script]);

  // Save full project to JSON file
  const handleSaveProject = () => {
    try {
      const project: AudioSpotProject = {
        version: '1.0',
        savedAt: new Date().toISOString(),
        uiLanguage,
        productionLanguage,
        spotTitle,
        spotConcept,
        script,
        targetDurationSeconds: targetDuration,
        brief: {
          topic: currentBrief.topic,
          style: currentBrief.style,
          tone: currentBrief.tone,
          voiceCount: currentBrief.voiceCount,
          callToAction: currentBrief.callToAction,
        },
        speakers,
        settings,
        musicStudio: {
          customPrompt: customMusicPrompt,
          seedModifier: musicSeedModifier,
        },
      };

      exportProjectToJson(project);
      setStatusNotification(t.projectSavedNotification);
      setTimeout(() => setStatusNotification(null), 4000);
    } catch (err: any) {
      console.error('Error saving project:', err);
      setScriptError(err.message || 'Αποτυχία εξαγωγής έργου σε JSON.');
    }
  };

  // Load full project from uploaded JSON file
  const handleLoadProject = async (file: File) => {
    try {
      const project = await importProjectFromJson(file);

      // Restore all studio parameters
      setSpotTitle(project.spotTitle);
      setSpotConcept(project.spotConcept);
      setScript(project.script);
      setTargetDuration(project.targetDurationSeconds);

      if (Array.isArray(project.speakers) && project.speakers.length > 0) {
        setSpeakers(project.speakers);
      }

      if (project.settings) {
        setSettings(project.settings);
      }

      if (project.musicStudio) {
        setCustomMusicPrompt(project.musicStudio.customPrompt || '');
        setMusicSeedModifier(project.musicStudio.seedModifier || 0);
      }

      if (project.brief) {
        setCurrentBrief({
          ...project.brief,
          targetDuration: project.targetDurationSeconds,
          productionLanguage: project.productionLanguage,
        });
      }

      setProductionLanguage(project.productionLanguage);
      if (project.uiLanguage) {
        handleUiLanguageChange(project.uiLanguage);
      }

      // Reset rendered buffer so user can re-mix or audition the newly loaded project
      setMasterBuffer(null);
      setTimelineSegments([]);
      setDownloadData(null);

      setStatusNotification(translations[project.uiLanguage || uiLanguage].projectLoadedNotification);
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err: any) {
      console.error('Error loading project JSON:', err);
      setScriptError(err.message || 'Αποτυχία φόρτωσης αρχείου JSON.');
    }
  };

  // Handle Generate Script from Briefing
  const handleGenerateScript = async (brief: BriefData) => {
    setIsGeneratingScript(true);
    setScriptError(null);
    setTargetDuration(brief.targetDuration);
    setCurrentBrief(brief);

    try {
      const userApiKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('user_gemini_api_key') || ''
          : '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userApiKey) {
        headers['x-gemini-api-key'] = userApiKey;
      }

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: brief.topic,
          targetDuration: brief.targetDuration,
          voiceCount: brief.voiceCount,
          style: brief.style,
          tone: brief.tone,
          callToAction: brief.callToAction,
          productionLanguage: brief.productionLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα κατά την παραγωγή σεναρίου.');
      }

      if (data.script) {
        setSpotTitle(data.title || 'Ραδιοφωνικό Σποτ');
        setSpotConcept(data.conceptSummary || '');
        setScript(data.script);

        // Apply recommended music bed if valid
        if (
          data.recommendedMusicStyle &&
          MUSIC_BED_OPTIONS.some((m) => m.id === data.recommendedMusicStyle)
        ) {
          setSettings((prev) => ({
            ...prev,
            musicBedStyle: data.recommendedMusicStyle as MusicBedStyle,
          }));
        }

        // Map structuredSpeakers with strict gender-to-voice matching
        if (Array.isArray(data.structuredSpeakers) && data.structuredSpeakers.length > 0) {
          const mappedSpeakers: SpeakerConfig[] = data.structuredSpeakers.map(
            (spk: any, idx: number) => {
              const gender: 'male' | 'female' = spk.gender === 'female' ? 'female' : 'male';
              const requestedTimbre = AVAILABLE_TIMBRES.find(
                (t) => t.id === spk.voicePersona && t.gender === gender
              );
              const finalTimbre = requestedTimbre || getDefaultTimbreForGender(gender, idx);

              const isEn = brief.productionLanguage === 'en';
              return {
                speakerTag: spk.speakerId || (isEn ? `Voice ${idx + 1}` : `Φωνή ${idx + 1}`),
                displayName:
                  spk.roleName ||
                  (gender === 'female'
                    ? isEn
                      ? 'Female Voice'
                      : 'Εκφωνήτρια'
                    : isEn
                    ? 'Male Voice'
                    : 'Εκφωνητής'),
                gender,
                timbreId: finalTimbre.id,
                speed: 1.0,
                pitch: 0,
                volume: 1.0,
                pan:
                  data.structuredSpeakers.length === 1
                    ? 0
                    : idx % 2 === 0
                    ? -0.15
                    : 0.15,
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

  // Preview Voice Sample (Speaks the speaker's ACTUAL line from the script in the production language!)
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
          ? speaker.gender === 'female'
            ? `Hello! I am ${speaker.displayName}, voice talent for your commercial spot.`
            : `Hello! I am ${speaker.displayName}, voice talent for your commercial spot.`
          : speaker.gender === 'female'
          ? `Γεια σας! Είμαι η ${speaker.displayName} και αυτή είναι η γυναικεία φωνή του διαφημιστικού σας σποτ.`
          : `Γεια σας! Είμαι ο ${speaker.displayName} και αυτή είναι η ανδρική φωνή του διαφημιστικού σας σποτ.`;

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

  // Render Full Audio Spot
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

      if (settings.format === 'mp3') {
        setRenderStepText(uiLanguage === 'el' ? 'Μετατροπή σε broadcast MP3 (256 kbps)...' : 'Converting to broadcast MP3 (256 kbps)...');
        setRenderProgressPercent(98);
      }
      const exportData = await exportAudioFile(renderedBuffer, settings);
      setDownloadData(exportData);

      setStatusNotification(
        uiLanguage === 'el'
          ? `Η τελική μιξαρισμένη διαφήμιση (${Math.round(renderedBuffer.duration)}s) είναι έτοιμη! Πατήστε Play στον Master Player παρακάτω.`
          : `Master commercial (${Math.round(renderedBuffer.duration)}s) is ready! Click Play on Master DAW Player below.`
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
      setScriptError(err.message || (uiLanguage === 'el' ? 'Σφάλμα κατά την παραγωγή του ήχου.' : 'Error during audio mixdown.'));
    } finally {
      setIsRenderingAudio(false);
    }
  };

  // Immediate timeline remix (~50ms) after drag-and-drop or timing adjustment
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

      // Re-export current audio file for download in selected format
      const exportData = await exportAudioFile(newMaster, settings);
      setDownloadData(exportData);
    } catch (err) {
      console.error('Failed to remix timeline:', err);
    } finally {
      setIsRemixingTimeline(false);
    }
  };

  // Reset timeline cues to original AI director timing
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
      {/* Studio Header with JSON Export/Import & UI Language Switcher */}
      <StudioHeader
        uiLanguage={uiLanguage}
        onUiLanguageChange={handleUiLanguageChange}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        isRendering={isRenderingAudio}
        isPlaying={isPlayingOnAir}
      />

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Notification Toast */}
        {statusNotification && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/20">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {statusNotification}
            </span>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Script Generation / Render Error */}
        {scriptError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{scriptError}</span>
          </div>
        )}

        {/* Studio Top Grid: Briefing & Script Workspace */}
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

        {/* Section 3: Voice Configuration Rack */}
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

        {/* Section 4 & 5: Music Bed & Audio Mastering Configuration */}
        <MusicAndMasterPanel
          settings={settings}
          onSettingsChange={setSettings}
          onStartRender={handleStartRender}
          isRendering={isRenderingAudio}
          renderStepText={renderStepText}
          renderProgressPercent={renderProgressPercent}
          customAudioBuffer={customMusicBuffer}
          onCustomAudioUploaded={(buf, name) => {
            setCustomMusicBuffer(buf);
            setStatusNotification(
              uiLanguage === 'el'
                ? `Το αρχείο μουσικής '${name}' φορτώθηκε με επιτυχία!`
                : `Music file '${name}' loaded successfully!`
            );
            setTimeout(() => setStatusNotification(null), 4000);
          }}
          musicSeedModifier={musicSeedModifier}
          onMusicSeedChange={setMusicSeedModifier}
          customMusicPrompt={customMusicPrompt}
          onCustomMusicPromptChange={setCustomMusicPrompt}
          uiLanguage={uiLanguage}
        />

        {/* Section 6: Master Audio Player & DAW Monitoring */}
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

      {/* Studio Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AudioSpot PRO — Professional AI Radio Ad Production Suite</span>
          <span className="text-[11px] text-slate-400">
            5s - 10 min • Broadcast WAV / MP3 • 48kHz Master • JSON Project Sync
          </span>
        </div>
      </footer>
    </div>
  );
}
