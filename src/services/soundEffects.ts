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

export interface SFXOption {
  id: SFXType;
  name: string;
  category: string;
  description: string;
  tags: string[];
  filename: string;
}

export const AVAILABLE_SFX: SFXOption[] = [
  // Retail & Sales
  { id: 'cash_register', name: 'Ταμειακή Μηχανή', category: 'Retail & Sales', description: 'Ήχος ταμειακής μηχανής cha-ching', tags: ['retail', 'sales', 'ταμείο'], filename: 'cash_register.ogg' },
  { id: 'coins_shuffling', name: 'Κέρματα & Χαρτονομίσματα', category: 'Retail & Sales', description: 'Ήχος κερμάτων', tags: ['coins', 'money', 'κέρματα'], filename: 'coins_shuffling.ogg' },
  { id: 'glass_toast', name: 'Τσούγκρισμα Ποτηριών', category: 'Retail & Sales', description: 'Τσούγκρισμα ποτηριών cheers', tags: ['toast', 'cheers', 'ποτήρια'], filename: 'glass_toast.ogg' },
  { id: 'champagne_cork', name: 'Φελλός Σαμπάνιας', category: 'Retail & Sales', description: 'Άνοιγμα σαμπάνιας', tags: ['champagne', 'celebration', 'σαμπάνια'], filename: 'pop_bubble.ogg' },

  // Alerts & Bells
  { id: 'bell_chime', name: 'Καμπανάκι / Chime', category: 'Alerts & Bells', description: 'Κρυστάλλινο καμπανάκι', tags: ['bell', 'chime', 'κουδούνι'], filename: 'medium_bell_ringing.ogg' },
  { id: 'doorbell', name: 'Κουδούνι Εξώπορτας', category: 'Alerts & Bells', description: 'Κουδούνι πόρτας ding-dong', tags: ['doorbell', 'ding-dong', 'πόρτα'], filename: 'doorbell.ogg' },
  { id: 'creaking_door', name: 'Παλιά Πόρτα (Τρίξιμο)', category: 'Alerts & Bells', description: 'Τρίξιμο παλιάς πόρτας', tags: ['door', 'creak', 'πόρτα'], filename: 'creaking_door.ogg' },
  { id: 'sliding_glass_door', name: 'Συρόμενη Τζαμαρία', category: 'Alerts & Bells', description: 'Συρόμενη πόρτα', tags: ['sliding', 'door', 'τζαμαρία'], filename: 'sliding_glass_door.ogg' },
  { id: 'wood_door', name: 'Ξύλινη Πόρτα', category: 'Alerts & Bells', description: 'Κλείσιμο ξύλινης πόρτας', tags: ['wood', 'door', 'πόρτα'], filename: 'wood_door.ogg' },
  { id: 'cell_phone_vibrate', name: 'Δόνηση Κινητού', category: 'Alerts & Bells', description: 'Δόνηση smartphone', tags: ['phone', 'vibrate', 'κινητό'], filename: 'cell_phone_vibrate.ogg' },
  { id: 'phone_alerts', name: 'Ήχος Κλήσης', category: 'Alerts & Bells', description: 'Μελωδικός ήχος κλήσης', tags: ['phone', 'alert', 'κλήση'], filename: 'phone_alerts.ogg' },
  { id: 'phone_ring', name: 'Τηλεφωνικός Ήχος', category: 'Alerts & Bells', description: 'Κλασικό τηλέφωνο', tags: ['phone', 'ring', 'τηλέφωνο'], filename: 'phone_ring.ogg' },
  { id: 'pop_notification', name: 'Ειδοποίηση Pop', category: 'Alerts & Bells', description: 'Ήχος bubble notification', tags: ['pop', 'notification', 'ειδοποίηση'], filename: 'pop_bubble.ogg' },
  { id: 'dinner_bell', name: 'Τρίγωνο / Reception', category: 'Alerts & Bells', description: 'Κουδούνι ρεσεψιόν', tags: ['bell', 'dinner', 'reception'], filename: 'dinner_bell.ogg' },
  { id: 'digital_watch_alarm', name: 'Ψηφιακό Χρονόμετρο', category: 'Alerts & Bells', description: 'Ψηφιακό μπιπ χρονομέτρου', tags: ['watch', 'alarm', 'χρονόμετρο'], filename: 'digital_watch_alarm.ogg' },
  { id: 'alarm_clock', name: 'Ξυπνητήρι', category: 'Alerts & Bells', description: 'Κλασικό ξυπνητήρι', tags: ['alarm', 'clock', 'ξυπνητήρι'], filename: 'alarm_clock.ogg' },
  { id: 'clock_ticking', name: 'Τικ-Τακ Ρολογιού', category: 'Alerts & Bells', description: 'Συνεχές τικ-τακ', tags: ['clock', 'tick', 'ρολόι'], filename: 'clock_ticking.ogg' },
  { id: 'bugle_tune', name: 'Σάλπισμα / Fanfare', category: 'Alerts & Bells', description: 'Στρατιωτικό σάλπισμα εγερτηρίου', tags: ['bugle', 'fanfare', 'σάλπισμα'], filename: 'bugle_tune.ogg' },
  { id: 'radio_beep', name: 'Σήμα Ώρας / Beep', category: 'Alerts & Bells', description: 'Ραδιοφωνικό pips σήμα ώρας', tags: ['radio', 'beep', 'σήμα'], filename: 'radio_beep.ogg' },

  // Cinematic & Impacts
  { id: 'whoosh', name: 'Whoosh Μετάβασης', category: 'Cinematic & Impacts', description: 'Γρήγορο πέρασμα αέρα transition', tags: ['whoosh', 'transition', 'μετάβαση'], filename: 'whoosh_swoosh.ogg' },
  { id: 'cinematic_sweep', name: 'Κλιμάκωση / Riser', category: 'Cinematic & Impacts', description: 'Ανοδικό cinematic sweep', tags: ['riser', 'sweep', 'κλιμάκωση'], filename: 'cinematic_sweep.ogg' },
  { id: 'cinematic_suspense', name: 'Αγωνία / Drone', category: 'Cinematic & Impacts', description: 'Υποβλητικό drone αγωνίας', tags: ['suspense', 'drone', 'αγωνία'], filename: 'cinematic_suspense.ogg' },
  { id: 'sub_impact', name: 'Sub Boom / 808', category: 'Cinematic & Impacts', description: 'Βαρύ βαθύ sub boom', tags: ['sub', 'impact', 'boom'], filename: 'sub_impact.ogg' },
  { id: 'glass_breaking', name: 'Σπάσιμο Τζαμιού', category: 'Cinematic & Impacts', description: 'Θρυμματισμός γυαλιού', tags: ['glass', 'break', 'γυαλί'], filename: 'glass_breaking.ogg' },
  { id: 'body_punch', name: 'Χτύπημα / Punch', category: 'Cinematic & Impacts', description: 'Δυνατή γροθιά action hit', tags: ['punch', 'hit', 'χτύπημα'], filename: 'body_punch.ogg' },
  { id: 'wood_impact', name: 'Χτύπημα σε Ξύλο', category: 'Cinematic & Impacts', description: 'Χτύπημα σε ξύλινη επιφάνεια', tags: ['wood', 'hit', 'ξύλο'], filename: 'wood_impact.ogg' },
  { id: 'impact_crash', name: 'Σύγκρουση / Crash', category: 'Cinematic & Impacts', description: 'Δυνατή σύγκρουση', tags: ['crash', 'impact', 'σύγκρουση'], filename: 'impact_crash.ogg' },
  { id: 'magic_sparkle', name: 'Μαγική Αστερόσκονη', category: 'Cinematic & Impacts', description: 'Μαγικός λαμπερός ήχος sparkle', tags: ['magic', 'sparkle', 'μαγεία'], filename: 'magic_sparkle.ogg' },
  { id: 'wind_chimes', name: 'Ανεμοκουδούνια', category: 'Cinematic & Impacts', description: 'Ήχος chimes στον άνεμο', tags: ['chimes', 'wind', 'άνεμος'], filename: 'wind_chimes.ogg' },

  // Vehicles & City
  { id: 'car_screech', name: 'Φρενάρισμα Αυτοκινήτου', category: 'Vehicles & City', description: 'Έντονο στρίγγλισμα ελαστικών', tags: ['car', 'brake', 'φρένα'], filename: 'car_screech.ogg' },
  { id: 'car_horn', name: 'Κόρνα Αυτοκινήτου', category: 'Vehicles & City', description: 'Κόρνα επιβατικού οχήματος', tags: ['car', 'horn', 'κόρνα'], filename: 'car_horn.ogg' },
  { id: 'air_horn', name: 'Κόρνα DJ / Stadium', category: 'Vehicles & City', description: 'Κόρνα γηπέδου stadium blast', tags: ['airhorn', 'stadium', 'dj'], filename: 'air_horn.ogg' },
  { id: 'emergency_siren', name: 'Σειρήνα', category: 'Vehicles & City', description: 'Σειρήνα άμεσης δράσης', tags: ['siren', 'emergency', 'σειρήνα'], filename: 'emergency_siren.ogg' },

  // Crowd & Events
  { id: 'applause', name: 'Χειροκρότημα', category: 'Crowd & Events', description: 'Θερμό χειροκρότημα κοινού', tags: ['applause', 'clapping', 'χειροκρότημα'], filename: 'applause.ogg' },
  { id: 'crowd_cheer', name: 'Επευφημίες Κοινού', category: 'Crowd & Events', description: 'Ζητωκραυγές γηπέδου / κοινού', tags: ['crowd', 'cheer', 'κοινό'], filename: 'crowd_cheer.ogg' },
  { id: 'coffee_shop', name: 'Ατμόσφαιρα Καφέ', category: 'Crowd & Events', description: 'Ήχοι καφετέριας & chatter', tags: ['coffee', 'ambience', 'καφέ'], filename: 'coffee_shop.ogg' },

  // Office & Tech
  { id: 'camera_click', name: 'Κλικ Φωτογραφικής', category: 'Office & Tech', description: 'Κλικ κλείστρου φωτογραφικής μηχανής', tags: ['camera', 'click', 'κάμερα'], filename: 'camera_click.ogg' },
  { id: 'typing_keyboard', name: 'Πληκτρολόγιο', category: 'Office & Tech', description: 'Πληκτρολόγηση σε μηχανικό πληκτρολόγιο', tags: ['typing', 'keyboard', 'πληκτρολόγιο'], filename: 'typing_keyboard.ogg' },
  { id: 'button_push', name: 'Πάτημα Διακόπτη', category: 'Office & Tech', description: 'Κλικ ηλεκτρικού διακόπτη', tags: ['button', 'switch', 'κουμπί'], filename: 'button_push.ogg' },
  { id: 'record_scratch', name: 'Σκρατς Βινυλίου', category: 'Office & Tech', description: 'Απότομο σταμάτημα/σκρατς βινυλίου', tags: ['scratch', 'vinyl', 'βινύλιο'], filename: 'record_scratch.ogg' },

  // Nature & Weather
  { id: 'heavy_rain', name: 'Δυνατή Βροχή', category: 'Nature & Weather', description: 'Ήχος καταιγίδας & καταρρακτώδους βροχής', tags: ['rain', 'weather', 'βροχή'], filename: 'heavy_rain.ogg' },
  { id: 'distant_thunder', name: 'Μακρινή Βροντή', category: 'Nature & Weather', description: 'Μακρινό υπόκωφο μπουμπουνητό', tags: ['thunder', 'weather', 'βροντή'], filename: 'distant_thunder.ogg' },
  { id: 'thunder_storm', name: 'Κεραυνός & Καταιγίδα', category: 'Nature & Weather', description: 'Δυνατός κεραυνός με ωστικό κύμα', tags: ['thunder', 'storm', 'κεραυνός'], filename: 'thunder_crack.ogg' },

  // Cartoon & Comedy
  { id: 'cartoon_boing', name: 'Ελατήριο Boing', category: 'Cartoon & Comedy', description: 'Κωμικό ελατήριο boing', tags: ['cartoon', 'boing', 'ελατήριο'], filename: 'cartoon_boing.ogg' },
  { id: 'slide_whistle', name: 'Σφυρίχτρα Slide', category: 'Cartoon & Comedy', description: 'Ανοδική/καθοδική κωμική σφυρίχτρα', tags: ['whistle', 'slide', 'σφυρίχτρα'], filename: 'slide_whistle.ogg' },
  { id: 'cartoon_cowbell', name: 'Κωμικό Κουδούνι', category: 'Cartoon & Comedy', description: 'Κουδούνι slapstick', tags: ['cowbell', 'comedy', 'κουδούνι'], filename: 'cartoon_cowbell.ogg' },
  { id: 'clown_horn', name: 'Κόρνα Κλόουν', category: 'Cartoon & Comedy', description: 'Διπλό honk κλόουν', tags: ['horn', 'clown', 'κόρνα'], filename: 'clown_horn.ogg' },
];

const SFX_FILE_MAPPING: Record<string, string[]> = {
  bell_chime: ['medium_bell_ringing.ogg', 'bell_chime.ogg', 'bell_chime.mp3'],
  whoosh: ['whoosh_swoosh.ogg', 'whoosh.ogg', 'whoosh.mp3'],
  thunder_storm: ['thunder_crack.ogg', 'thunder_storm.ogg', 'thunder_storm.mp3'],
  cash_register: ['cash_register.ogg', 'cash_register.mp3'],
  champagne_cork: ['pop_bubble.ogg', 'champagne_cork.ogg', 'champagne_cork.mp3'],
  pop_notification: ['pop_bubble.ogg', 'pop_notification.ogg', 'pop_notification.mp3'],
  cell_phone_vibrate: ['cell_phone_vibrate.ogg', 'cell_phone_vibrate.mp3'],
  clock_ticking: ['clock_ticking.ogg', 'clock_ticking.mp3'],
  alarm_clock: ['alarm_clock.ogg', 'alarm_clock.mp3'],
  car_screech: ['car_screech.ogg', 'car_screech.mp3'],
  doorbell: ['doorbell.ogg', 'doorbell.mp3'],
  sub_impact: ['sub_impact.ogg', 'sub_impact.mp3'],
};

const sfxBufferCache = new Map<string, AudioBuffer>();

function getDynamicBasePath(): string {
  if (typeof window === 'undefined') return './';
  const path = window.location.pathname;
  if (path.includes('/AudioSpotPro/')) {
    return '/AudioSpotPro/';
  }
  return import.meta.env.BASE_URL || './';
}

function resolveSfxUrl(filename: string): string {
  const base = getDynamicBasePath();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${cleanBase}sfx/${cleanFile}`;
}

async function loadAudioAsset(ctx: BaseAudioContext, sfxType: SFXType): Promise<AudioBuffer> {
  const cached = sfxBufferCache.get(sfxType);
  if (cached) return cached;

  const candidateFiles = SFX_FILE_MAPPING[sfxType] || [
    `${sfxType}.ogg`,
    `${sfxType}.mp3`,
    `${sfxType}.wav`
  ];

  let lastError: any = null;

  for (const filename of candidateFiles) {
    const url = resolveSfxUrl(filename);
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

  throw lastError || new Error(`No audio file found for SFX type: ${sfxType}`);
}

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
    console.warn(`[SFX Engine] Fallback procedural synthesis for "${sfxType}":`, err);
    return renderProceduralSFX(ctx, sfxType, volume);
  }
}

export async function auditionSFX(sfxType: SFXType, volume = 1.0): Promise<void> {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = await renderSFXBuffer(audioCtx, sfxType, volume);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(0);
  } catch (err) {
    console.warn(`Failed to audition SFX "${sfxType}":`, err);
  }
}

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