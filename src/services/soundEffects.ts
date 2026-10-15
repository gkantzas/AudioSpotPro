/**
 * Broadcast SFX Engine (GitHub Pages & Vite Compatible)
 * Maps studio SFX types to physical audio filenames in public/sfx with procedural fallback.
 */

export type SFXType =
  // Retail & Sales
  | 'cash_register'
  | 'coins_shuffling'
  | 'glass_toast'
  | 'champagne_cork'
  // Alerts & Bells
  | 'doorbell'
  | 'creaking_door'
  | 'sliding_glass_door'
  | 'wood_door'
  | 'cell_phone_vibrate'
  | 'phone_alerts'
  | 'phone_ring'
  | 'pop_notification'
  | 'dinner_bell'
  | 'digital_watch_alarm'
  | 'alarm_clock'
  | 'clock_ticking'
  | 'bugle_tune'
  | 'radio_beep'
  | 'bell_chime'
  // Cinematic & Impacts
  | 'whoosh'
  | 'cinematic_sweep'
  | 'cinematic_suspense'
  | 'sub_impact'
  | 'glass_breaking'
  | 'body_punch'
  | 'wood_impact'
  | 'impact_crash'
  | 'magic_sparkle'
  | 'wind_chimes'
  // Vehicles & City
  | 'car_screech'
  | 'car_horn'
  | 'air_horn'
  | 'emergency_siren'
  // Crowd & Events
  | 'applause'
  | 'crowd_cheer'
  | 'coffee_shop'
  // Office & Tech
  | 'camera_click'
  | 'typing_keyboard'
  | 'button_push'
  | 'record_scratch'
  // Nature & Weather
  | 'heavy_rain'
  | 'distant_thunder'
  | 'thunder_storm'
  // Cartoon & Comedy
  | 'cartoon_boing'
  | 'slide_whistle'
  | 'cartoon_cowbell'
  | 'clown_horn';

// Αντιστοίχιση των SFXType με τα πραγματικά ονόματα αρχείων στο public/sfx
const SFX_FILE_ALIASES: Partial<Record<SFXType, string[]>> = {
  bell_chime: ['medium_bell_ringing', 'bell_chime'],
  whoosh: ['whoosh_swoosh', 'whoosh'],
  thunder_storm: ['thunder_crack', 'thunder_storm'],
  car_screech: ['car_screech', 'tires_screech'],
  sub_impact: ['sub_impact', 'bass_drop'],
  doorbell: ['doorbell', 'ding_dong'],
};

// Cache αποκωδικοποιημένων AudioBuffer
const sfxBufferCache = new Map<string, AudioBuffer>();

/**
 * Υπολογίζει σωστά το URL του asset είτε τρέχει σε localhost είτε στο GitHub Pages
 */
function resolveSfxUrl(filename: string): string {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${cleanBase}sfx/${cleanFile}`;
}

/**
 * Φορτώνει το πραγματικό audio asset από το public/sfx δοκιμάζοντας aliases και επεκτάσεις (.ogg, .mp3, .wav)
 */
async function loadAudioAsset(ctx: BaseAudioContext, sfxType: SFXType): Promise<AudioBuffer> {
  const cached = sfxBufferCache.get(sfxType);
  if (cached) return cached;

  const candidateNames = SFX_FILE_ALIASES[sfxType]
    ? [...SFX_FILE_ALIASES[sfxType]!, sfxType]
    : [sfxType];

  const extensions = ['ogg', 'mp3', 'wav'];
  let lastError: any = null;

  for (const name of candidateNames) {
    for (const ext of extensions) {
      const url = resolveSfxUrl(`${name}.${ext}`);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`SFX HTTP ${response.status} for ${url}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await (ctx as AudioContext).decodeAudioData(arrayBuffer);
        sfxBufferCache.set(sfxType, decodedBuffer);
        return decodedBuffer;
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error(`No audio file found for SFX type: ${sfxType}`);
}

/**
 * Παράγει το AudioBuffer: δοκιμάζει το φυσικό αρχείο και, αν αποτύχει, ενεργοποιεί το procedural synth
 */
export async function renderSFXBuffer(
  ctx: BaseAudioContext,
  sfxType: SFXType,
  volume = 1.0
): Promise<AudioBuffer> {
  try {
    const assetBuffer = await loadAudioAsset(ctx, sfxType);
    if (Math.abs(volume - 1.0) < 0.02) {
      return assetBuffer;
    }

    const scaled = ctx.createBuffer(
      assetBuffer.numberOfChannels,
      assetBuffer.length,
      assetBuffer.sampleRate
    );
    for (let ch = 0; ch < assetBuffer.numberOfChannels; ch++) {
      const src = assetBuffer.getChannelData(ch);
      const dest = scaled.getChannelData(ch);
      for (let i = 0; i < src.length; i++) {
        dest[i] = src[i] * volume;
      }
    }
    return scaled;
  } catch (err) {
    console.warn(`[SFX Engine] Could not load audio asset for "${sfxType}", using procedural synthesis fallback:`, err);
    return renderProceduralSFX(ctx, sfxType, volume);
  }
}

/**
 * Procedural Audio Synthesis Fallback (Web Audio API)
 */
function renderProceduralSFX(ctx: BaseAudioContext, sfxType: SFXType, volume = 1.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;

  switch (sfxType) {
    case 'cash_register': {
      const dur = 0.55;
      const buf = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);

      for (let i = 0; i < buf.length; i++) {
        const t = i / sampleRate;
        const env1 = Math.exp(-t * 12);
        const env2 = Math.exp(-Math.max(0, t - 0.08) * 8);

        const bell1 = Math.sin(2 * Math.PI * 1860 * t) * env1;
        const bell2 = Math.sin(2 * Math.PI * 3720 * t) * 0.4 * env1;
        const bell3 = Math.sin(2 * Math.PI * 2480 * t) * 0.5 * env2;

        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.25;
        const sample = (bell1 + bell2 + bell3 + noise) * 0.6 * volume;

        left[i] = sample;
        right[i] = sample;
      }
      return buf;
    }

    case 'whoosh': {
      const dur = 0.6;
      const buf = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);

      for (let i = 0; i < buf.length; i++) {
        const t = i / dur;
        const env = Math.sin(Math.PI * t);
        const noise = (Math.random() * 2 - 1) * env * 0.5 * volume;

        left[i] = noise * (1 - t);
        right[i] = noise * t;
      }
      return buf;
    }

    case 'sub_impact': {
      const dur = 0.8;
      const buf = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);

      for (let i = 0; i < buf.length; i++) {
        const t = i / sampleRate;
        const freq = 120 * Math.exp(-t * 6) + 38;
        const env = Math.exp(-t * 3.5);
        const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.7 * volume;

        left[i] = sample;
        right[i] = sample;
      }
      return buf;
    }

    case 'radio_beep':
    case 'bell_chime':
    default: {
      const dur = 0.45;
      const buf = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);

      for (let i = 0; i < buf.length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 7);
        const sample = (Math.sin(2 * Math.PI * 880 * t) + Math.sin(2 * Math.PI * 1760 * t) * 0.3) * env * 0.5 * volume;

        left[i] = sample;
        right[i] = sample;
      }
      return buf;
    }
  }
}