import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Radio,
  Check,
  Disc,
  Activity,
  Mic,
  Layers,
  Loader2,
  FileAudio,
  GripVertical,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import { ProductionSettings, TimelineTrackSegment, exportAudioInFormat } from '../services/audioProductionEngine';
import { convertWavBlobToMp3 } from '../services/mp3Encoder';
import { UiLanguage, translations } from '../i18n/translations';

interface AudioMasterPlayerProps {
  masterBuffer: AudioBuffer | null;
  downloadData: { blob: Blob; filename: string; mimeType: string } | null;
  settings: ProductionSettings;
  timelineSegments?: TimelineTrackSegment[];
  onPlayStateChange?: (isPlaying: boolean) => void;
  uiLanguage?: UiLanguage;
  onUpdateTimelineSegments?: (newSegments: TimelineTrackSegment[]) => Promise<void>;
  onResetTimeline?: () => Promise<void>;
  isRemixing?: boolean;
}

export const AudioMasterPlayer: React.FC<AudioMasterPlayerProps> = ({
  masterBuffer,
  downloadData,
  settings,
  timelineSegments = [],
  onPlayStateChange,
  uiLanguage = 'el',
  onUpdateTimelineSegments,
  onResetTimeline,
  isRemixing = false,
}) => {
  const t = translations[uiLanguage];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'wav'>(settings.format || 'mp3');
  const [isConverting, setIsConverting] = useState(false);
  const [formatDownloadData, setFormatDownloadData] = useState<{
    mp3?: { blob: Blob; filename: string; mimeType: string };
    wav?: { blob: Blob; filename: string; mimeType: string };
  }>({});

  // Drag and drop state for timeline segments
  const [dragState, setDragState] = useState<{
    segmentId: string;
    initialStartTime: number;
    initialClientX: number;
    currentClientX: number;
    trackWidth: number;
    hasMoved: boolean;
  } | null>(null);

  const [remixSuccessBadge, setRemixSuccessBadge] = useState(false);

  useEffect(() => {
    if (settings.format) {
      setSelectedFormat(settings.format);
    }
  }, [settings.format]);

  useEffect(() => {
    if (downloadData) {
      if (downloadData.mimeType.includes('mpeg') || downloadData.filename.endsWith('.mp3')) {
        setFormatDownloadData((prev) => ({ ...prev, mp3: downloadData }));
      } else {
        setFormatDownloadData((prev) => ({ ...prev, wav: downloadData }));
      }
    }
  }, [downloadData]);

  // Audio Context and playback nodes ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const analyserRRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Meter levels
  const [meterL, setMeterL] = useState(0);
  const [meterR, setMeterR] = useState(0);

  const duration = masterBuffer?.duration || 0;

  // Initialize or resume AudioContext
  const getOrCreateAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: masterBuffer?.sampleRate || settings.sampleRate,
      });
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const handlePlay = () => {
    if (!masterBuffer) return;
    const ctx = getOrCreateAudioContext();

    // Stop any existing playback
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // ignore
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = masterBuffer;
    source.loop = isLooping;

    const gain = ctx.createGain();
    gain.gain.value = isMuted ? 0 : volume;
    gainNodeRef.current = gain;

    // Split channels for dual VU meters
    const splitter = ctx.createChannelSplitter(2);
    const analyserL = ctx.createAnalyser();
    const analyserR = ctx.createAnalyser();
    analyserL.fftSize = 256;
    analyserR.fftSize = 256;

    source.connect(splitter);
    splitter.connect(analyserL, 0);
    if (masterBuffer.numberOfChannels > 1) {
      splitter.connect(analyserR, 1);
    } else {
      splitter.connect(analyserR, 0);
    }

    analyserLRef.current = analyserL;
    analyserRRef.current = analyserR;

    source.connect(gain);
    gain.connect(ctx.destination);

    const offset = startOffsetRef.current >= duration ? 0 : startOffsetRef.current;
    source.start(0, offset);

    startTimeRef.current = ctx.currentTime - offset;
    sourceNodeRef.current = source;

    source.onended = () => {
      if (!isLooping) {
        setIsPlaying(false);
        onPlayStateChange?.(false);
      }
    };

    setIsPlaying(true);
    onPlayStateChange?.(true);
  };

  const handlePause = () => {
    if (sourceNodeRef.current && audioCtxRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // ignore
      }
      startOffsetRef.current = currentTime;
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // ignore
      }
    }
    startOffsetRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    onPlayStateChange?.(false);
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(duration, newTime));
    startOffsetRef.current = clamped;
    setCurrentTime(clamped);
    if (isPlaying) {
      handlePlay();
    }
  };

  // Auto-reset playhead when a new masterBuffer is rendered
  useEffect(() => {
    if (masterBuffer) {
      startOffsetRef.current = 0;
      setCurrentTime(0);
    }
  }, [masterBuffer]);

  // Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.value = newVol;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMute ? 0 : volume;
    }
  };

  // Download Trigger with instant or on-the-fly MP3/WAV conversion
  const handleDownload = async (targetFmt: 'mp3' | 'wav' = selectedFormat) => {
    setSelectedFormat(targetFmt);
    if (!masterBuffer && !downloadData) return;

    try {
      setIsConverting(true);
      let targetData = formatDownloadData[targetFmt];

      if (!targetData && masterBuffer) {
        targetData = await exportAudioInFormat(masterBuffer, settings, targetFmt);
        setFormatDownloadData((prev) => ({ ...prev, [targetFmt]: targetData }));
      } else if (!targetData && downloadData) {
        if (targetFmt === 'mp3') {
          // Convert existing WAV to MP3
          const mp3Blob = await convertWavBlobToMp3(downloadData.blob, masterBuffer, 256);
          const filename = downloadData.filename.replace(/\.wav$/i, '.mp3');
          targetData = {
            blob: mp3Blob,
            filename: filename.endsWith('.mp3') ? filename : `${filename}.mp3`,
            mimeType: 'audio/mpeg',
          };
          setFormatDownloadData((prev) => ({ ...prev, mp3: targetData }));
        } else {
          targetData = downloadData;
        }
      }

      if (targetData) {
        const url = URL.createObjectURL(targetData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = targetData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error during audio download conversion:', err);
    } finally {
      setIsConverting(false);
    }
  };

  // Animation Loop for Time Tracking and VU meters
  useEffect(() => {
    const updateLoop = () => {
      if (isPlaying && audioCtxRef.current) {
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        if (duration > 0) {
          const modTime = isLooping ? elapsed % duration : Math.min(elapsed, duration);
          setCurrentTime(modTime);
          if (!isLooping && elapsed >= duration) {
            setIsPlaying(false);
            onPlayStateChange?.(false);
            startOffsetRef.current = 0;
          }
        }

        // Update meters
        if (analyserLRef.current && analyserRRef.current) {
          const dataL = new Uint8Array(analyserLRef.current.frequencyBinCount);
          const dataR = new Uint8Array(analyserRRef.current.frequencyBinCount);
          analyserLRef.current.getByteTimeDomainData(dataL);
          analyserRRef.current.getByteTimeDomainData(dataR);

          let sumL = 0;
          let sumR = 0;
          for (let i = 0; i < dataL.length; i++) {
            const valL = (dataL[i] - 128) / 128;
            const valR = (dataR[i] - 128) / 128;
            sumL += valL * valL;
            sumR += valR * valR;
          }
          const rmsL = Math.sqrt(sumL / dataL.length);
          const rmsR = Math.sqrt(sumR / dataR.length);
          setMeterL(Math.min(1, rmsL * 2.5));
          setMeterR(Math.min(1, rmsR * 2.5));
        }
      } else {
        setMeterL((prev) => Math.max(0, prev * 0.85));
        setMeterR((prev) => Math.max(0, prev * 0.85));
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, duration, isLooping]);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !masterBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal center grid line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const data = masterBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Draw waveform bars
    const progressX = duration > 0 ? (currentTime / duration) * width : 0;

    for (let x = 0; x < width; x++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[x * step + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(2, (max - min) * amp * 0.95);
      const isPast = x <= progressX;

      if (isPast) {
        ctx.fillStyle = '#10b981'; // Played part: vibrant emerald
      } else {
        ctx.fillStyle = '#334155'; // Unplayed part: slate
      }

      ctx.fillRect(x, (height - barHeight) / 2, 1, barHeight);
    }

    // Playhead line
    if (duration > 0) {
      ctx.fillStyle = '#38bdf8'; // Sky blue playhead
      ctx.fillRect(progressX - 1, 0, 2, height);
    }
  }, [masterBuffer, currentTime, duration]);

  // Format time (00:00.0)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}.${ms}`;
  };

  // Drag and drop handlers for timeline segments
  const handleSegmentPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    seg: TimelineTrackSegment
  ) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    const parentLane = e.currentTarget.parentElement;
    const laneWidth = parentLane ? parentLane.getBoundingClientRect().width : 600;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setDragState({
      segmentId: seg.id,
      initialStartTime: seg.startTime,
      initialClientX: e.clientX,
      currentClientX: e.clientX,
      trackWidth: laneWidth,
      hasMoved: false,
    });
  };

  const handleSegmentPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const deltaX = Math.abs(e.clientX - dragState.initialClientX);
    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentClientX: e.clientX,
            hasMoved: prev.hasMoved || deltaX > 4,
          }
        : null
    );
  };

  const handleSegmentPointerUp = async (
    e: React.PointerEvent<HTMLDivElement>,
    seg: TimelineTrackSegment
  ) => {
    if (!dragState || dragState.segmentId !== seg.id) {
      setDragState(null);
      return;
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!dragState.hasMoved) {
      handleSeek(seg.startTime);
      setDragState(null);
      return;
    }

    const deltaX = dragState.currentClientX - dragState.initialClientX;
    const deltaTime = (deltaX / Math.max(100, dragState.trackWidth)) * duration;
    const rawNewStart = Math.max(0, dragState.initialStartTime + deltaTime);
    const snapNewStart = Math.round(rawNewStart * 10) / 10; // 0.1s snap
    const segDuration = Math.max(0.2, seg.endTime - seg.startTime);
    const newEnd = snapNewStart + segDuration;

    setDragState(null);

    if (Math.abs(snapNewStart - seg.startTime) > 0.04) {
      const updated = timelineSegments.map((s) =>
        s.id === seg.id ? { ...s, startTime: snapNewStart, endTime: newEnd } : s
      );
      if (onUpdateTimelineSegments) {
        await onUpdateTimelineSegments(updated);
        setRemixSuccessBadge(true);
        setTimeout(() => setRemixSuccessBadge(false), 3000);
      }
      handleSeek(snapNewStart);
    }
  };

  const handleSegmentPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDragState(null);
  };

  const handleNudgeSegment = async (seg: TimelineTrackSegment, delta: number) => {
    const segDuration = Math.max(0.2, seg.endTime - seg.startTime);
    const newStart = Math.max(0, Math.round((seg.startTime + delta) * 10) / 10);
    const newEnd = newStart + segDuration;

    const updated = timelineSegments.map((s) =>
      s.id === seg.id ? { ...s, startTime: newStart, endTime: newEnd } : s
    );
    if (onUpdateTimelineSegments) {
      await onUpdateTimelineSegments(updated);
      setRemixSuccessBadge(true);
      setTimeout(() => setRemixSuccessBadge(false), 3000);
    }
    handleSeek(newStart);
  };

  const getSegmentPosition = (seg: TimelineTrackSegment) => {
    const isDraggingThis = dragState?.segmentId === seg.id;
    let effectiveStartTime = seg.startTime;
    if (isDraggingThis && dragState && dragState.hasMoved) {
      const deltaX = dragState.currentClientX - dragState.initialClientX;
      const deltaTime = (deltaX / Math.max(100, dragState.trackWidth)) * duration;
      const raw = Math.max(0, dragState.initialStartTime + deltaTime);
      effectiveStartTime = Math.round(raw * 10) / 10;
    }
    const segDuration = Math.max(0.2, seg.endTime - seg.startTime);
    const leftPct = Math.max(0, Math.min(98, (effectiveStartTime / duration) * 100));
    const widthPct = Math.max(3, Math.min(100 - leftPct, (segDuration / duration) * 100));
    return { effectiveStartTime, leftPct, widthPct, isDraggingThis };
  };

  // Group voice segments by speakerTag for multi-track display
  const voiceSegments = timelineSegments.filter((seg) => seg.type === 'voice');
  const sfxSegments = timelineSegments.filter((seg) => seg.type === 'sfx');
  const uniqueVoiceTracks = Array.from(
    new Map(
      voiceSegments.map((seg) => [
        seg.speakerTag,
        { speakerTag: seg.speakerTag, displayName: seg.displayName, gender: seg.gender },
      ])
    ).values()
  );

  // Time ruler ticks
  const tickInterval = duration > 45 ? 5 : duration > 20 ? 2 : 1;
  const tickCount = duration > 0 ? Math.floor(duration / tickInterval) : 0;
  const timeRulerTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval);

  // Currently speaking segment at playhead
  const activeVoiceSegment = voiceSegments.find(
    (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
  );

  if (!masterBuffer) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
        <Disc className="w-10 h-10 mx-auto mb-2 text-slate-700 animate-spin-slow" />
        <h3 className="text-sm font-semibold text-slate-400">
          {t.playerReadyTitle}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {t.playerReadyDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-emerald-500/30 p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {t.masterPlayerTitle}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Multi-Track Mastered
              </span>
            </h2>
            <p className="text-xs text-slate-400">{t.masterPlayerSubtitle}</p>
          </div>
        </div>

        {/* Format & Spec Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {settings.format.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {(settings.sampleRate / 1000).toFixed(1)} kHz
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {settings.bitDepth}-bit
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {settings.channels === 2 ? 'Stereo' : 'Mono'}
          </span>
        </div>
      </div>

      {/* Live Active Speaker Subtitle Bar */}
      <div className="mt-3 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Mic
            className={`w-4 h-4 flex-shrink-0 ${
              activeVoiceSegment ? 'text-emerald-400 animate-pulse' : 'text-slate-600'
            }`}
          />
          {activeVoiceSegment ? (
            <div className="truncate text-xs">
              <span
                className={`font-bold mr-2 px-1.5 py-0.5 rounded ${
                  activeVoiceSegment.gender === 'female'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {activeVoiceSegment.gender === 'female' ? '♀' : '♂'} {activeVoiceSegment.displayName} (
                {activeVoiceSegment.speakerTag})
              </span>
              <span className="text-white font-medium">«{activeVoiceSegment.label}»</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">
              {isPlaying
                ? '🎵 Μουσική Επένδυση / Ηχητικά Εφέ (Intro / Παύση / Outro)...'
                : 'Πατήστε Play (▶) για αναπαραγωγή του μιξαρισμένου διαφημιστικού σποτ'}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
          {uniqueVoiceTracks.length} {uniqueVoiceTracks.length === 1 ? 'Φωνή' : 'Φωνές'} στη Μίξη
        </span>
      </div>

      {/* Multi-Track Voice & SFX Timeline Lanes (DAW Sequencer with Drag & Drop) */}
      {uniqueVoiceTracks.length > 0 && duration > 0 && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2.5 relative">
          {/* Timeline Header with Reset & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                <Layers className="w-4 h-4 text-indigo-400" />
                {t.timelineLanesHeader}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Drag & Drop Timing
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isRemixing && (
                <span className="flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  {t.remixingInProgress}
                </span>
              )}
              {remixSuccessBadge && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md animate-fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {t.remixSuccessNotice}
                </span>
              )}
              {onResetTimeline && (
                <button
                  type="button"
                  onClick={onResetTimeline}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer"
                  title={t.resetTimelineTiming}
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  {t.resetTimelineTiming}
                </button>
              )}
              <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                0.0s — {duration.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* User instruction banner */}
          <div className="px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-indigo-300">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>{t.timelineDragHint}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
              <span className="text-indigo-400">Snap: 0.1s</span>
              <span>{voiceSegments.length} Cues</span>
            </div>
          </div>

          {/* Floating Drag HUD Badge when dragging */}
          {dragState && dragState.hasMoved && (
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {t.timelineDragActive}
              </span>
              <span className="font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded">
                {(() => {
                  const deltaX = dragState.currentClientX - dragState.initialClientX;
                  const deltaTime = (deltaX / Math.max(100, dragState.trackWidth)) * duration;
                  const rawNewStart = Math.max(0, dragState.initialStartTime + deltaTime);
                  const snapNewStart = Math.round(rawNewStart * 10) / 10;
                  const shift = snapNewStart - dragState.initialStartTime;
                  return `${t.cueStartTime}: ${snapNewStart.toFixed(1)}s (${shift >= 0 ? '+' : ''}${shift.toFixed(1)}s)`;
                })()}
              </span>
            </div>
          )}

          {/* Time Ruler Scale */}
          <div className="flex items-center gap-2 pt-1 select-none">
            <div className="w-32 sm:w-40 flex-shrink-0 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
              Time (s)
            </div>
            <div className="relative flex-1 h-5 border-b border-slate-800">
              {timeRulerTicks.map((sec) => (
                <div
                  key={sec}
                  style={{ left: `${(sec / duration) * 100}%` }}
                  className="absolute top-0 flex flex-col items-start -translate-x-1/2 pointer-events-none"
                >
                  <span className="text-[9px] font-mono text-slate-500">{sec}s</span>
                  <div className="h-1.5 w-px bg-slate-700 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Voice Track Lanes */}
          {uniqueVoiceTracks.map((trk) => {
            const trackSegs = voiceSegments.filter((s) => s.speakerTag === trk.speakerTag);
            const isFemale = trk.gender === 'female';
            return (
              <div key={trk.speakerTag} className="flex items-center gap-2">
                <div className="w-32 sm:w-40 flex-shrink-0 truncate text-[11px] font-semibold flex items-center gap-1.5">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isFemale ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {isFemale ? '♀' : '♂'}
                  </span>
                  <span className="text-slate-200 truncate">{trk.displayName}</span>
                </div>
                <div className="relative flex-1 h-8 bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden">
                  {trackSegs.map((seg) => {
                    const { effectiveStartTime, leftPct, widthPct, isDraggingThis } =
                      getSegmentPosition(seg);
                    const segDur = Math.max(0.2, seg.endTime - seg.startTime);
                    const isActive =
                      currentTime >= effectiveStartTime &&
                      currentTime <= effectiveStartTime + segDur &&
                      isPlaying;

                    return (
                      <div
                        key={seg.id}
                        onPointerDown={(e) => handleSegmentPointerDown(e, seg)}
                        onPointerMove={handleSegmentPointerMove}
                        onPointerUp={(e) => handleSegmentPointerUp(e, seg)}
                        onPointerCancel={handleSegmentPointerCancel}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${trk.displayName} (${effectiveStartTime.toFixed(1)}s - ${(
                          effectiveStartTime + segDur
                        ).toFixed(1)}s): «${seg.label}» — Σύρετε για μετακίνηση στο χρόνο`}
                        className={`absolute top-0.5 bottom-0.5 rounded-md px-1.5 text-[9px] font-medium flex items-center gap-1 select-none transition-shadow touch-none cursor-grab active:cursor-grabbing group ${
                          isDraggingThis
                            ? 'z-40 ring-2 ring-amber-400 bg-amber-500 text-slate-950 font-bold shadow-2xl scale-[1.02]'
                            : isFemale
                            ? isActive
                              ? 'bg-pink-500 text-white shadow-md ring-1 ring-white z-20'
                              : 'bg-pink-500/35 hover:bg-pink-500/60 text-pink-100 border border-pink-400/50'
                            : isActive
                            ? 'bg-blue-500 text-white shadow-md ring-1 ring-white z-20'
                            : 'bg-blue-500/35 hover:bg-blue-500/60 text-blue-100 border border-blue-400/50'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100 cursor-grab" />
                        <span className="font-mono text-[9px] px-1 py-0.2 bg-black/40 rounded font-bold shrink-0">
                          {effectiveStartTime.toFixed(1)}s
                        </span>
                        <span className="truncate flex-1 font-medium">{seg.label}</span>
                        {/* Nudge mini buttons on hover */}
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-auto pl-1 z-30 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudgeSegment(seg, -0.1);
                            }}
                            className="px-1 py-0.5 rounded bg-black/70 hover:bg-black text-[8px] font-mono text-slate-200"
                            title="Nudge -0.1s"
                          >
                            -0.1s
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudgeSegment(seg, 0.1);
                            }}
                            className="px-1 py-0.5 rounded bg-black/70 hover:bg-black text-[8px] font-mono text-slate-200"
                            title="Nudge +0.1s"
                          >
                            +0.1s
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Playhead indicator line across track */}
                  <div
                    style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-sky-400 pointer-events-none z-10"
                  />
                </div>
              </div>
            );
          })}

          {/* SFX Track Lane (if SFX cues exist) */}
          {sfxSegments.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
              <div className="w-32 sm:w-40 flex-shrink-0 truncate text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-amber-500/20 text-amber-400">
                  ⚡
                </span>
                <span className="text-amber-300 font-mono text-[10px] uppercase">SFX Effects</span>
              </div>
              <div className="relative flex-1 h-7 bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden">
                {sfxSegments.map((seg) => {
                  const { effectiveStartTime, leftPct, widthPct, isDraggingThis } =
                    getSegmentPosition(seg);
                  const segDur = Math.max(0.2, seg.endTime - seg.startTime);
                  return (
                    <div
                      key={seg.id}
                      onPointerDown={(e) => handleSegmentPointerDown(e, seg)}
                      onPointerMove={handleSegmentPointerMove}
                      onPointerUp={(e) => handleSegmentPointerUp(e, seg)}
                      onPointerCancel={handleSegmentPointerCancel}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`SFX: ${seg.label} (${effectiveStartTime.toFixed(1)}s - ${(
                        effectiveStartTime + segDur
                      ).toFixed(1)}s)`}
                      className={`absolute top-0.5 bottom-0.5 rounded px-1.5 text-[9px] font-mono flex items-center gap-1 select-none transition-shadow cursor-grab active:cursor-grabbing ${
                        isDraggingThis
                          ? 'z-40 ring-2 ring-amber-400 bg-amber-500 text-slate-950 font-bold shadow-2xl'
                          : 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-400/40'
                      }`}
                    >
                      <GripVertical className="w-2.5 h-2.5 opacity-60" />
                      <span className="truncate">{seg.label}</span>
                    </div>
                  );
                })}
                {/* Playhead indicator line across track */}
                <div
                  style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-sky-400 pointer-events-none z-10"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Waveform Canvas */}
      <div className="mt-3 relative group">
        <canvas
          ref={canvasRef}
          width={900}
          height={80}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            handleSeek(pct * duration);
          }}
          className="w-full h-20 rounded-xl cursor-pointer border border-slate-800 hover:border-slate-700 transition-colors"
        />
        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-500 pointer-events-none">
          Κλικ για πλοήγηση (Scrub)
        </div>
      </div>

      {/* Transport Controls & Timecode */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={handlePause}
              className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
            title="Διακοπή (Stop)"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => handleSeek(0)}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
            title="Από την αρχή"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="ml-2 font-mono text-sm tracking-widest text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {formatTime(currentTime)} <span className="text-slate-600">/</span>{' '}
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Dual Stereo VU Meters (L and R) */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Activity className="w-4 h-4 text-emerald-400 mr-1" />
          <div className="space-y-1">
            {/* Left Channel Meter */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-2.5">L</span>
              <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-sm overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                  style={{ width: `${meterL * 100}%` }}
                />
              </div>
            </div>
            {/* Right Channel Meter */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-2.5">R</span>
              <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-sm overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                  style={{ width: `${meterR * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Volume & Download Actions */}
        <div className="flex items-center gap-3">
          {/* Master Volume */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Format Selection & Download Master Button */}
          {(downloadData || masterBuffer) && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {/* Format Toggle Pill */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleDownload('mp3')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFormat === 'mp3'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={t.broadcastMp3Desc}
                >
                  <FileAudio className="w-3 h-3" />
                  <span>MP3</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('wav')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFormat === 'wav'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={t.broadcastWavDesc}
                >
                  <FileAudio className="w-3 h-3" />
                  <span>WAV</span>
                </button>
              </div>

              {/* Main Download Button */}
              <button
                type="button"
                disabled={isConverting}
                onClick={() => handleDownload(selectedFormat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                  selectedFormat === 'mp3'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-300 hover:to-cyan-300 shadow-blue-500/20'
                }`}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                    <span>{t.convertingToMp3}</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>{t.savedNotification}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>
                      {selectedFormat === 'mp3' ? t.downloadMp3 : t.downloadWav}
                      {formatDownloadData[selectedFormat] ? ` (${formatDownloadData[selectedFormat]?.filename.split('.').pop()?.toUpperCase()})` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
