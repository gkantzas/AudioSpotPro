/**
 * Project Storage Service
 * Handles exporting and importing all studio settings, copywriting, voice racks,
 * and audio parameters to/from formatted JSON files.
 */

import { SpeakerConfig, ProductionSettings } from './audioProductionEngine';
import { UiLanguage, ProductionLanguage } from '../i18n/translations';

export interface AudioSpotProject {
  version: string;
  savedAt: string;
  uiLanguage: UiLanguage;
  productionLanguage: ProductionLanguage;
  spotTitle: string;
  spotConcept: string;
  script: string;
  targetDurationSeconds: number;
  brief: {
    topic: string;
    style: string;
    tone: string;
    voiceCount: number;
    callToAction: string;
  };
  speakers: SpeakerConfig[];
  settings: ProductionSettings;
  musicStudio: {
    customPrompt: string;
    seedModifier: number;
  };
}

/**
 * Exports current applet project state into a downloadable JSON file
 */
export function exportProjectToJson(project: AudioSpotProject): void {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Clean filename: audiospot-project-<safe-title>-<date>.json
  const safeTitle = (project.spotTitle || 'commercial')
    .toLowerCase()
    .replace(/[^a-z0-9α-ωά-ώ]+/gi, '-')
    .slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `audiospot-project-${safeTitle}-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses an uploaded JSON file into an AudioSpotProject object
 */
export async function importProjectFromJson(file: File): Promise<AudioSpotProject> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Μη έγκυρη μορφή αρχείου JSON.');
  }

  // Ensure default fallback values for any missing fields
  return {
    version: parsed.version || '1.0',
    savedAt: parsed.savedAt || new Date().toISOString(),
    uiLanguage: parsed.uiLanguage === 'en' ? 'en' : 'el',
    productionLanguage: parsed.productionLanguage || 'el',
    spotTitle: parsed.spotTitle || 'Ραδιοφωνικό Σποτ',
    spotConcept: parsed.spotConcept || '',
    script: parsed.script || '',
    targetDurationSeconds: Number(parsed.targetDurationSeconds) || 30,
    brief: {
      topic: parsed.brief?.topic || '',
      style: parsed.brief?.style || 'Ενθουσιώδες / Hard-sell Προσφορά',
      tone: parsed.brief?.tone || 'Φιλικός, πειστικός & γεμάτος ενέργεια',
      voiceCount: Number(parsed.brief?.voiceCount) || 1,
      callToAction: parsed.brief?.callToAction || '',
    },
    speakers: Array.isArray(parsed.speakers) ? parsed.speakers : [],
    settings: {
      targetDurationSeconds: Number(parsed.settings?.targetDurationSeconds) || 30,
      musicBedStyle: parsed.settings?.musicBedStyle || 'upbeat_acoustic',
      musicVolume: Number(parsed.settings?.musicVolume) ?? 0.32,
      enableDucking: parsed.settings?.enableDucking ?? true,
      duckingAmount: Number(parsed.settings?.duckingAmount) ?? 0.25,
      format: parsed.settings?.format === 'mp3' ? 'mp3' : 'wav',
      sampleRate: Number(parsed.settings?.sampleRate) || 48000,
      bitDepth: parsed.settings?.bitDepth || 24,
      channels: parsed.settings?.channels || 2,
    },
    musicStudio: {
      customPrompt: parsed.musicStudio?.customPrompt || '',
      seedModifier: Number(parsed.musicStudio?.seedModifier) || 0,
    },
  };
}
