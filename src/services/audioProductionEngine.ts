/**
 * Core Audio Production & Mixdown Engine
 * Orchestrates multi-speaker voice synthesis, sound effects, procedural music bed, and broadcast mastering.
 */

import { renderSFXBuffer, SFXType } from './soundEffects';
import { renderMusicBedBuffer, MusicBedStyle } from './musicBedGenerator';
import { encodeWav, WavExportOptions } from './wavEncoder';
import { convertWavBlobToMp3 } from './mp3Encoder';

export interface VoiceTimbre {
  id: string; // 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Aoede'
  name: string;
  gender: 'male' | 'female';
  genderLabel: string;
  tone: string;
  bestFor: string;
  geminiVoice: string;
  defaultActingStyle: string;
}

export const AVAILABLE_TIMBRES: VoiceTimbre[] = [
  // 10 MALE VOICES (ΑΝΔΡΙΚΕΣ ΦΩΝΕΣ)
  {
    id: 'Fenrir',
    name: 'Fenrir — Βαθιά & Επιβλητική',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Ζεστή μπάσα ανδρική χροιά, αυθεντικότητα, κύρος',
    bestFor: 'Αυτοκίνητο, Τραπεζικά, Πολυτέλεια, Κεντρικός Αφηγητής',
    geminiVoice: 'Fenrir',
    defaultActingStyle: 'Deep, warm, authoritative Greek male radio commercial announcer',
  },
  {
    id: 'Puck',
    name: 'Puck — Ζωντανή & Νεανική',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Νεανικός, γρήγορος, ενθουσιώδης ανδρικός τόνος',
    bestFor: 'Black Friday, Προσφορές, Retail, Tech, Διάλογοι',
    geminiVoice: 'Puck',
    defaultActingStyle: 'Energetic, upbeat, youthful Greek male commercial actor',
  },
  {
    id: 'Charon',
    name: 'Charon — Κλασική Ραδιοφωνική',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Στιβαρή, ώριμη ανδρική εκφωνητική φωνή',
    bestFor: 'Θεσμικά σποτ, Ειδήσεις, Trailers, Σοβαρή Αφήγηση',
    geminiVoice: 'Charon',
    defaultActingStyle: 'Classic, steady, mature Greek male broadcast narrator',
  },
  {
    id: 'Nikos',
    name: 'Νίκος — Φιλικός & Καθημερινός',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Προσιτή, χαλαρή, καθημερινή φωνή της διπλανής πόρτας',
    bestFor: 'Delivery, Εστιατόρια, Apps, Καθημερινοί ρόλοι',
    geminiVoice: 'Puck',
    defaultActingStyle: 'Friendly, casual, relatable Greek male neighbor voice',
  },
  {
    id: 'Alexandros',
    name: 'Αλέξανδρος — Σοβαρός & Εταιρικός',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Επαγγελματικός, αξιόπιστος, πειστικός',
    bestFor: 'B2B, Χρηματοοικονομικά, Real Estate, Τεχνολογία',
    geminiVoice: 'Fenrir',
    defaultActingStyle: 'Professional, articulate, confident Greek corporate male speaker',
  },
  {
    id: 'Giorgos',
    name: 'Γιώργος — Δυναμικός Hard-Sell',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Ένταση, ρυθμός, αίσθηση επείγοντος',
    bestFor: 'Εκπτώσεις-Σοκ, Mega Sales, Συναυλίες, Sports Promo',
    geminiVoice: 'Puck',
    defaultActingStyle: 'High-energy, fast-paced, urgent radio hard-sell announcer',
  },
  {
    id: 'Dimitris',
    name: 'Δημήτρης — Ζεστός & Καθησυχαστικός',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Μαλακός, καθησυχαστικός, εμπνέει απόλυτη εμπιστοσύνη',
    bestFor: 'Υγεία, Ασφαλιστικά, Οικογένεια, Ευεξία',
    geminiVoice: 'Charon',
    defaultActingStyle: 'Gentle, soothing, trustworthy Greek male doctor or advisor',
  },
  {
    id: 'Panagiotis',
    name: 'Παναγιώτης — Ώριμος & Πατρικός',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Σοφός, έμπειρος, ζεστός οικογενειάρχης',
    bestFor: 'Σπίτι, Ανακαίνιση, Παραδοσιακά προϊόντα',
    geminiVoice: 'Charon',
    defaultActingStyle: 'Wise, experienced, warm mature Greek family man',
  },
  {
    id: 'Kostas',
    name: 'Κώστας — Χιουμοριστικός & Παιχνιδιάρικος',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Εκφραστικός, κωμικός, ανατρεπτικός',
    bestFor: 'Χιουμοριστικά σκετσάκια, έξυπνοι διάλογοι',
    geminiVoice: 'Puck',
    defaultActingStyle: 'Humorous, comedic, expressive and witty Greek actor',
  },
  {
    id: 'Leonidas',
    name: 'Λεωνίδας — Κινηματογραφικός Trailer Bass',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Υπερ-βαθύ μπάσο, επιβλητικότητα blockbuster',
    bestFor: 'Cinema Trailers, Μεγάλα Φεστιβάλ, Luxury Launch',
    geminiVoice: 'Fenrir',
    defaultActingStyle: 'Epic, deep cinematic trailer narrator, authoritative and dramatic',
  },

  {
    id: 'Thanasis',
    name: 'Θανάσης — Αυθεντικός & Λαϊκός',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Ζεστή, γνήσια, άμεση λαϊκή χροιά',
    bestFor: 'Ταβέρνες, Κρεοπωλεία, Τοπικές αγορές, Παραδοσιακά καταστήματα',
    geminiVoice: 'Charon',
    defaultActingStyle: 'Authentic, friendly, down-to-earth Greek market vendor voice',
  },
  {
    id: 'Stefanos',
    name: 'Στέφανος — Tech Geek & Startup',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Σύγχρονος, γρήγορος, γεμάτος ενθουσιασμό για καινοτομία',
    bestFor: 'Apps, SaaS, AI, Τεχνολογικά προϊόντα, Gadgets',
    geminiVoice: 'Puck',
    defaultActingStyle: 'Modern, innovative, energetic Greek tech enthusiast',
  },
  {
    id: 'Antonis',
    name: 'Αντώνης — Αθλητικός & Sports Promo',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Εκρηκτική ενέργεια, ρυθμός, αθλητικό πάθος',
    bestFor: 'Γυμναστήρια, Αθλητικά είδη, Στοίχημα, Live Events',
    geminiVoice: 'Puck',
    defaultActingStyle: 'High-energy, passionate Greek sports commentator',
  },
  {
    id: 'Marios',
    name: 'Μάριος — Γοητευτικός & Nightlife',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Βαθύς, αισθησιακός, σαγηνευτικός ανδρικός τόνος',
    bestFor: 'Cocktail Bars, Clubs, Αρώματα, Πολυτελή Αυτοκίνητα',
    geminiVoice: 'Fenrir',
    defaultActingStyle: 'Charming, smooth, seductive Greek male luxury voice',
  },
  {
    id: 'Konstantinos',
    name: 'Κωνσταντίνος — Επίσημος Παρουσιαστής',
    gender: 'male',
    genderLabel: 'Άνδρας ♂',
    tone: 'Άψογη άρθρωση, επισημότητα, καθαρότητα ραδιοφώνου',
    bestFor: 'Συναυλίες, Μεγάλα Συνέδρια, Εκθέσεις, Κρατικοί Φορείς',
    geminiVoice: 'Charon',
    defaultActingStyle: 'Distinguished, formal, articulate Greek master of ceremonies',
  },

  // FEMALE VOICES (ΓΥΝΑΙΚΕΙΕΣ ΦΩΝΕΣ)
  {
    id: 'Kore',
    name: 'Kore — Κομψή & Εκλεπτυσμένη',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Καθαρή, εκλεπτυσμένη, πειστική γυναικεία άρθρωση',
    bestFor: 'Brands, Υγεία, Καλλυντικά, Κεντρική Αφηγήτρια',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Polished, clear, confident Greek female commercial voiceover',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr — Φιλική & Φωτεινή',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Προσιτή, ζεστή, νεανική γυναικεία φωνή',
    bestFor: 'Delivery, Εστιατόρια, Apps, Διάλογοι, Social Promo',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Friendly, bright, natural Greek female conversational actor',
  },
  {
    id: 'Aoede',
    name: 'Aoede — Εκφραστική & Μελωδική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Ζεστή, συναισθηματική, θεατρική γυναικεία χροιά',
    bestFor: 'Storytelling, Οικογένεια, Φιλοξενία, Συναισθηματικά Σποτ',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Warm, expressive, emotional and melodic Greek female voice actor',
  },
  {
    id: 'Maria',
    name: 'Μαρία — Επαγγελματική & Εταιρική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Σίγουρη, δυναμική, επαγγελματίας σύμβουλος',
    bestFor: 'Εταιρικά βίντεο, B2B, Εκπαίδευση, Banking',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Professional, articulate, authoritative Greek businesswoman',
  },
  {
    id: 'Eleni',
    name: 'Ελένη — Νεανική & Δυναμική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Γεμάτη ενέργεια, σπορ, σύγχρονη',
    bestFor: 'Fitness, Μόδα, Νέες Εφαρμογές, Φεστιβάλ',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'High-energy, dynamic, modern young Greek woman',
  },
  {
    id: 'Katerina',
    name: 'Κατερίνα — Ζεστή & Οικεία',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Γλυκιά, προστατευτική, οικογενειακή',
    bestFor: 'Σούπερ Μάρκετ, Παιδικά Προϊόντα, Τρόφιμα',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Sweet, caring, gentle Greek family voice',
  },
  {
    id: 'Sofia',
    name: 'Σοφία — Καθησυχαστική & Ιατρική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Ήρεμη, εμπνέει ασφάλεια, αριστοκρατική',
    bestFor: 'Διαγνωστικά Κέντρα, Οδοντιατρικά, Φαρμακευτικά',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Calm, reassuring, elite Greek medical or wellness advisor',
  },
  {
    id: 'Anna',
    name: 'Άννα — Χαρούμενη & Γρήγορη',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Παιχνιδιάρικη, γρήγορη ραδιοφωνική ατάκα',
    bestFor: 'Προσφορές 1+1, Εκπτωτικά κουπόνια, Ραδιοφωνικά κουίζ',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Cheerful, fast-talking, playful commercial broadcaster',
  },
  {
    id: 'Christina',
    name: 'Χριστίνα — Αισθησιακή & Ατμοσφαιρική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Βελούδινη, ατμοσφαιρική, σαγηνευτική',
    bestFor: 'Αρώματα, Νυχτερινά Bars, Κοσμήματα, Luxury Escapes',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Sensual, velvety, alluring smooth luxury commercial whisper',
  },
  {
    id: 'Natalia',
    name: 'Ναταλία — Σύγχρονη Podcaster & Influencer',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Μοντέρνα, φυσική, σαν story στο Instagram',
    bestFor: 'Social Media Promo, Podcasts, Gen-Z Events, e-shops',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Trendy, natural, authentic Greek social media creator voice',
  },
  {
    id: 'Despina',
    name: 'Δέσποινα — Παραδοσιακή & Αυθεντική',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Ζεστή, φιλόξενη, σπιτική ατμόσφαιρα',
    bestFor: 'Φούρνοι, Ζαχαροπλαστεία, Τοπικά προϊόντα, Ταβέρνες',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Warm, hospitable, authentic Greek homemaker & baker',
  },
  {
    id: 'Marina',
    name: 'Μαρίνα — Ταξιδιωτική & Καλοκαιρινή',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Αέρινη, φωτεινή, μεταδίδει καλοκαιρινή ανεμελιά',
    bestFor: 'Ξενοδοχεία, Τουριστικά πακέτα, Ακτοπλοϊκά, Παραλίες',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Breezy, sunny, inviting Greek travel & tourism host',
  },
  {
    id: 'Stella',
    name: 'Στέλλα — Σύμβουλος & Φωνή Λογικής',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Σοβαρή, μελετημένη, εμπνέει απόλυτη σιγουριά',
    bestFor: 'Ασφάλειες, Νομικά γραφεία, Επενδύσεις, Εκπαίδευση',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Confident, articulate, trustworthy Greek professional counselor',
  },
  {
    id: 'Artemis',
    name: 'Άρτεμις — Cinematic Mystery & Suspense',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Υποβλητική, μυστηριώδης, θεατρική',
    bestFor: 'Escape Rooms, Θέατρο, Video Games, Halloween Events',
    geminiVoice: 'Kore',
    defaultActingStyle: 'Dramatic, mysterious, atmospheric cinematic narrator',
  },
  {
    id: 'Ioanna',
    name: 'Ιωάννα — Ραδιοφωνική Παραγωγός (DJ)',
    gender: 'female',
    genderLabel: 'Γυναίκα ♀',
    tone: 'Ρυθμική, μουσική, γεμάτη ραδιοφωνική εμπειρία',
    bestFor: 'Μουσικά φεστιβάλ, Συναυλίες, Μουσικά events, Ραδιοφωνικοί σταθμοί',
    geminiVoice: 'Zephyr',
    defaultActingStyle: 'Upbeat, rhythmic, cool Greek radio music host',
  },
];

export interface SpeakerConfig {
  speakerTag: string; // e.g. "Φωνή 1"
  displayName: string; // e.g. "Αφηγητής" or "Μαρία"
  gender: 'male' | 'female';
  timbreId: string; // 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Aoede'
  speed: number; // 0.8x to 1.4x
  pitch: number; // -4 to +4
  volume: number; // 0.0 to 1.5
  pan: number; // -1.0 (Left) to +1.0 (Right)
  actingStyle?: string;
}

export interface ScriptLine {
  id: string;
  type: 'dialogue' | 'sfx_only';
  speakerTag: string;
  originalText: string;
  spokenText: string; // Pure spoken words ONLY (never titles, speaker names, or stage directions)
  cues: string[];
  sfxTriggers: SFXType[];
  sfxVolume?: number; // Custom per-cue volume override e.g. 0.8
  pauseAfterSeconds: number;
}

export interface ProductionSettings {
  targetDurationSeconds: number;
  musicBedStyle: MusicBedStyle;
  musicVolume: number; // 0.0 to 1.0 (e.g. 0.35)
  enableDucking: boolean;
  duckingAmount: number; // 0.25 (-12dB)
  sfxVolume: number; // 0.0 to 1.5 (default 1.0 = 100%)
  format: 'wav' | 'mp3';
  sampleRate: number; // 22050, 24000, 44100, 48000, 96000
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2; // Mono or Stereo
}

/**
 * Infers gender ('male' | 'female') from a Greek role description or name
 */
export function inferGenderFromText(text: string): 'male' | 'female' | null {
  const lower = text.toLowerCase();
  const femaleKeywords = [
    'γυναίκ',
    'γυναικ',
    'female',
    'woman',
    'girl',
    'mother',
    'mom',
    'lady',
    'actress',
    'αφηγήτρια',
    'εκφωνήτρια',
    'πελάτισσα',
    'μαρία',
    'ελένη',
    'κατερίνα',
    'σοφία',
    'άννα',
    'δήμητρα',
    'ιωάννα',
    'ευαγγελία',
    'γεωργία',
    'μητέρα',
    'μαμά',
    'φίλη',
    'κοπέλα',
    'κυρία',
    'δασκάλα',
    'γιατρίνα',
    'πωλήτρια',
    'σύζυγος (γυναίκα)',
  ];
  const maleKeywords = [
    'άνδρ',
    'άντρ',
    'ανδρ',
    'male',
    'man',
    'boy',
    'father',
    'dad',
    'guy',
    'gentleman',
    'actor',
    'αφηγητής',
    'εκφωνητής',
    'πελάτης',
    'γιώργος',
    'κώστας',
    'δημήτρης',
    'νίκος',
    'γιάννης',
    'παναγιώτης',
    'βασίλης',
    'χρήστος',
    'πατέρας',
    'μπαμπάς',
    'φίλος',
    'κύριος',
    'πωλητής',
    'οδηγός',
  ];

  for (const kw of femaleKeywords) {
    if (lower.includes(kw)) return 'female';
  }
  for (const kw of maleKeywords) {
    if (lower.includes(kw)) return 'male';
  }
  return null;
}

/**
 * Returns the default voice timbre ID for a given gender and speaker index
 */
export function getDefaultTimbreForGender(gender: 'male' | 'female', index: number = 0): VoiceTimbre {
  const pool = AVAILABLE_TIMBRES.filter((t) => t.gender === gender);
  return pool[index % pool.length] || AVAILABLE_TIMBRES[0];
}

/**
 * Maps an SFX text description to our procedural SFXType (supports Greek and English)
 */
/**
 * Parses an SFX tag string to extract both SFXType and any custom volume level (e.g. "@ 80%" or "@ 0.7")
 */
export function parseSFXTag(sfxText: string): { type: SFXType; volume?: number } {
  let volume: number | undefined;
  const volMatch = sfxText.match(/@\s*(\d+(?:[.,]\d+)?)\s*(%)?/);
  if (volMatch) {
    const rawVal = parseFloat(volMatch[1].replace(',', '.'));
    if (!isNaN(rawVal)) {
      volume = volMatch[2] === '%' || rawVal > 2.0 ? rawVal / 100 : rawVal;
      volume = Math.max(0.05, Math.min(2.0, volume));
    }
  }

  const cleanText = sfxText.replace(/@\s*\d+(?:[.,]\d+)?\s*%?/, '').trim();
  const type = mapTextToSFXType(cleanText);
  return { type, volume };
}

/**
 * Maps an SFX text description to our studio SFXType (supports extensive Greek and English aliases)
 */
export function mapTextToSFXType(sfxText: string): SFXType {
  const lower = sfxText.toLowerCase();

  // Retail & Sales
  if (lower.includes('cash_register') || lower.includes('ταμεί') || lower.includes('cash') || lower.includes('ching') || lower.includes('ταμειακ')) {
    return 'cash_register';
  }
  if (lower.includes('coin') || lower.includes('κέρμα') || lower.includes('χαρτονόμισμα') || lower.includes('shuffl')) {
    return 'coins_shuffling';
  }
  if (lower.includes('toast') || lower.includes('τσούγκρισμα') || lower.includes('ποτήρ') || lower.includes('cheers') || lower.includes('clink')) {
    return 'glass_toast';
  }
  if (lower.includes('champagne') || lower.includes('σαμπάνι') || lower.includes('cork') || lower.includes('φελλ')) {
    return 'champagne_cork';
  }

  // Alerts & Bells
  if (lower.includes('doorbell') || lower.includes('κουδούνι εξώπορτας') || lower.includes('ding-dong') || lower.includes('ding dong')) {
    return 'doorbell';
  }
  if (lower.includes('creak') || lower.includes('τρίξιμο') || lower.includes('παλιά πόρτα')) {
    return 'creaking_door';
  }
  if (lower.includes('sliding') || lower.includes('συρόμεν') || lower.includes('τζαμαρία')) {
    return 'sliding_glass_door';
  }
  if (lower.includes('ξύλινη πόρτα') || lower.includes('wood door') || lower.includes('πόρτα') || lower.includes('door')) {
    return 'wood_door';
  }
  if (lower.includes('vibrat') || lower.includes('δόνηση') || lower.includes('buzz')) {
    return 'cell_phone_vibrate';
  }
  if (lower.includes('phone_alert') || lower.includes('ringtone') || lower.includes('ήχος κλήσης') || lower.includes('μελωδία')) {
    return 'phone_alerts';
  }
  if (lower.includes('phone_ring') || lower.includes('τηλέφων') || lower.includes('κλήση') || lower.includes('ring') || lower.includes('telephone')) {
    return 'phone_ring';
  }
  if (lower.includes('pop_notification') || lower.includes('notification') || lower.includes('bubble') || lower.includes('ειδοποίησ') || lower.includes('pop')) {
    return 'pop_notification';
  }
  if (lower.includes('dinner_bell') || lower.includes('τρίγωνο') || lower.includes('reception') || lower.includes('τραπέζι')) {
    return 'dinner_bell';
  }
  if (lower.includes('digital_watch') || lower.includes('χρονομετρ') || lower.includes('timer') || lower.includes('ψηφιακό')) {
    return 'digital_watch_alarm';
  }
  if (lower.includes('alarm_clock') || lower.includes('ξυπνητήρ') || lower.includes('alarm')) {
    return 'alarm_clock';
  }
  if (lower.includes('clock') || lower.includes('ρολό') || lower.includes('τικ') || lower.includes('tick') || lower.includes('countdown')) {
    return 'clock_ticking';
  }
  if (lower.includes('bugle') || lower.includes('σάλπισμα') || lower.includes('fanfare') || lower.includes('εγερτήριο')) {
    return 'bugle_tune';
  }
  if (lower.includes('radio_beep') || lower.includes('pips') || lower.includes('tuning') || lower.includes('σήμα ώρας') || lower.includes('beep')) {
    return 'radio_beep';
  }
  if (lower.includes('bell_chime') || lower.includes('chime') || lower.includes('κρυστάλλιν') || lower.includes('καμπάνα') || lower.includes('bell')) {
    return 'bell_chime';
  }

  // Cinematic & Impacts
  if (lower.includes('whoosh') || lower.includes('πέρασμ') || lower.includes('μετάβασ') || lower.includes('αέρα') || lower.includes('swoosh') || lower.includes('transition')) {
    return 'whoosh';
  }
  if (lower.includes('riser') || lower.includes('sweep') || lower.includes('κλιμάκωση') || lower.includes('sci-fi sweep')) {
    return 'cinematic_sweep';
  }
  if (lower.includes('suspense') || lower.includes('αγωνία') || lower.includes('drone') || lower.includes('σκοτεινό')) {
    return 'cinematic_suspense';
  }
  if (lower.includes('sub_impact') || lower.includes('boom') || lower.includes('808') || lower.includes('μπάσο') || lower.includes('trailer')) {
    return 'sub_impact';
  }
  if (lower.includes('glass_break') || lower.includes('σπάσιμο τζαμιού') || lower.includes('shatter') || lower.includes('τζάμι')) {
    return 'glass_breaking';
  }
  if (lower.includes('punch') || lower.includes('γροθιά') || lower.includes('χτύπημα πυγμαχίας') || lower.includes('action hit')) {
    return 'body_punch';
  }
  if (lower.includes('wood_impact') || lower.includes('ξύλο') || lower.includes('thud') || lower.includes('ταμπλό')) {
    return 'wood_impact';
  }
  if (lower.includes('impact') || lower.includes('crash') || lower.includes('σύγκρουση') || lower.includes('σπάσιμο') || lower.includes('χτύπημα')) {
    return 'impact_crash';
  }
  if (lower.includes('sparkle') || lower.includes('magic') || lower.includes('μαγικ') || lower.includes('αστερόσκονη') || lower.includes('stardust')) {
    return 'magic_sparkle';
  }
  if (lower.includes('wind_chime') || lower.includes('ανεμοκουδούνι') || lower.includes('chimes ανέμου')) {
    return 'wind_chimes';
  }

  // Vehicles & City
  if (lower.includes('car_screech') || lower.includes('φρέν') || lower.includes('λάστιχ') || lower.includes('skid') || lower.includes('screech') || lower.includes('brake')) {
    return 'car_screech';
  }
  if (lower.includes('car_horn') || lower.includes('κόρν') || lower.includes('horn') || lower.includes('honk')) {
    return 'car_horn';
  }
  if (lower.includes('air_horn') || lower.includes('airhorn') || lower.includes('stadium blast') || lower.includes('κόρνα dj')) {
    return 'air_horn';
  }
  if (lower.includes('siren') || lower.includes('σειρήνα') || lower.includes('ασθενοφόρο') || lower.includes('police') || lower.includes('περιπολικό')) {
    return 'emergency_siren';
  }

  // Crowd & Events
  if (lower.includes('applause') || lower.includes('χειροκρότημα') || lower.includes('clapping') || lower.includes('claps') || lower.includes('ovations')) {
    return 'applause';
  }
  if (lower.includes('cheer') || lower.includes('επευφημ') || lower.includes('κοινό') || lower.includes('πλήθος') || lower.includes('γήπεδο') || lower.includes('stadium')) {
    return 'crowd_cheer';
  }
  if (lower.includes('coffee') || lower.includes('café') || lower.includes('καφέ') || lower.includes('καφετέρια') || lower.includes('bistro') || lower.includes('ambience')) {
    return 'coffee_shop';
  }

  // Office & Tech
  if (lower.includes('camera') || lower.includes('κάμερα') || lower.includes('φωτογραφ') || lower.includes('shutter') || lower.includes('κλικ')) {
    return 'camera_click';
  }
  if (lower.includes('typing') || lower.includes('keyboard') || lower.includes('πληκτρολόγ') || lower.includes('clicks')) {
    return 'typing_keyboard';
  }
  if (lower.includes('button') || lower.includes('διακόπτης') || lower.includes('switch') || lower.includes('push')) {
    return 'button_push';
  }
  if (lower.includes('record_scratch') || lower.includes('scratch') || lower.includes('σκρατς') || lower.includes('vinyl') || lower.includes('βινύλι')) {
    return 'record_scratch';
  }

  // Nature & Weather
  if (lower.includes('rain') || lower.includes('βροχή') || lower.includes('καταιγίδα') || lower.includes('downpour')) {
    return 'heavy_rain';
  }
  if (lower.includes('distant_thunder') || lower.includes('μακρινή βροντή') || lower.includes('μπουμπουνητό')) {
    return 'distant_thunder';
  }
  if (lower.includes('thunder') || lower.includes('βροντ') || lower.includes('κεραυν') || lower.includes('lightning') || lower.includes('storm')) {
    return 'thunder_storm';
  }

  // Cartoon & Comedy
  if (lower.includes('boing') || lower.includes('ελατήριο') || lower.includes('spring')) {
    return 'cartoon_boing';
  }
  if (lower.includes('slide_whistle') || lower.includes('σφυρίχτρα') || lower.includes('whistle')) {
    return 'slide_whistle';
  }
  if (lower.includes('cowbell') || lower.includes('κωμικό κουδούνι')) {
    return 'cartoon_cowbell';
  }
  if (lower.includes('clown') || lower.includes('κλόουν') || lower.includes('honk honk')) {
    return 'clown_horn';
  }

  return 'bell_chime';
}

/**
 * Parses the script from the editor into a clean commercial production timeline.
 * Handles all speaker notations ([Φωνή 1], Φωνή 2:, [Μαρία]:, standalone speaker headers, conversational dashes),
 * strips out script headers, titles, timestamps, speaker labels, and stage notes
 * so that ONLY actual commercial dialogue is spoken by each voice actor at their exact turn.
 */
export function parseScript(rawScript: string, speakerConfigs: SpeakerConfig[]): ScriptLine[] {
  const lines = rawScript.split('\n');
  const parsed: ScriptLine[] = [];
  let currentSpeaker = speakerConfigs[0]?.speakerTag || 'Φωνή 1';
  let lineCounter = 0;
  let dashTurnIndex = 0;

  // Helper to resolve speaker tag from any label (e.g. "Φωνή 2", "Μαρία", "Αφηγητής", "Γυναίκα")
  const resolveSpeakerTag = (rawLabel: string): string | null => {
    const clean = rawLabel.replace(/^\[|\]$/g, '').trim();
    if (!clean) return null;

    // 1. Explicit "Φωνή X" or "Voice X" or "Speaker X"
    const voiceNumMatch = clean.match(/(?:Φωνή|Φωνη|Speaker|Voice|Voz|Voix|Stimme)\s*(\d+)/i);
    if (voiceNumMatch) {
      const num = voiceNumMatch[1];
      const matched = speakerConfigs.find(
        (s) =>
          s.speakerTag === `Φωνή ${num}` ||
          s.speakerTag === `Voice ${num}` ||
          s.speakerTag.toLowerCase() === `φωνή ${num}` ||
          s.speakerTag.toLowerCase() === `voice ${num}` ||
          s.speakerTag.toLowerCase().includes(num)
      );
      if (matched) return matched.speakerTag;
      const isVoice = speakerConfigs.some((s) => s.speakerTag.toLowerCase().startsWith('voice'));
      return isVoice ? `Voice ${num}` : `Φωνή ${num}`;
    }

    // 2. Match by configured displayName (e.g. "Μαρία", "Αφηγητής", "Narrator", "Customer")
    const lowerClean = clean.toLowerCase();
    for (const spk of speakerConfigs) {
      const nameLower = spk.displayName.trim().toLowerCase();
      if (nameLower && nameLower.length >= 2 && (lowerClean === nameLower || lowerClean.includes(nameLower))) {
        return spk.speakerTag;
      }
    }

    // 3. Match by inferred gender if speakerConfigs has a speaker of that gender
    const inferredGender = inferGenderFromText(clean);
    if (inferredGender) {
      const genderMatch = speakerConfigs.find((s) => s.gender === inferredGender);
      if (genderMatch) return genderMatch.speakerTag;
    }

    return null;
  };

  for (const rawLine of lines) {
    // Strip markdown bold/italics and leading/trailing whitespace
    let cleanedLine = rawLine.replace(/\*\*/g, '').trim();
    if (!cleanedLine) continue;

    // 1. Skip structural dividers and markdown headings
    if (
      cleanedLine.startsWith('===') ||
      cleanedLine.startsWith('---') ||
      cleanedLine.startsWith('#') ||
      cleanedLine.startsWith('//')
    ) {
      continue;
    }

    // 2. Skip script metadata headers (Τίτλος, Title, Σύνοψη, Synopsis, Concept, κλπ.)
    if (
      /^(?:τίτλος|title|σύνοψη|synopsis|concept|διάρκεια|duration|ύφος|style|μουσική υπόκρουση|music|σκηνή\s*\d*|scene\s*\d*|σημείωση|note|οδηγίες|instructions|προτεινόμενη)/i.test(
        cleanedLine
      )
    ) {
      continue;
    }

    // 3. Strip leading timestamps like "(0:00 - 0:05)" or "00:00 - 00:05:"
    cleanedLine = cleanedLine
      .replace(/^\(?\d{1,2}:\d{2}\s*(?:-\s*\d{1,2}:\d{2})?\)?\s*[:-]?\s*/i, '')
      .trim();
    if (!cleanedLine) continue;

    // 4. Ignore standalone [ΜΟΥΣΙΚΗ: ...] or [MUSIC: ...] lines
    if (/^\[(?:ΜΟΥΣΙΚΗ|MUSIC):[^\]]*\]$/i.test(cleanedLine)) {
      continue;
    }

    // 5. Check if the line is a standalone [SFX: ...] cue
    const standaloneSfxMatch = cleanedLine.match(/^\[SFX:\s*([^\]]+)\]$/i);
    if (standaloneSfxMatch) {
      lineCounter++;
      const { type: sfxType, volume: sfxVol } = parseSFXTag(standaloneSfxMatch[1]);
      parsed.push({
        id: `sfx-${lineCounter}`,
        type: 'sfx_only',
        speakerTag: currentSpeaker,
        originalText: rawLine.trim(),
        spokenText: '',
        cues: [],
        sfxTriggers: [sfxType],
        sfxVolume: sfxVol,
        pauseAfterSeconds: 0.15,
      });
      continue;
    }

    // 6. Check if the line is a standalone speaker header (e.g. "[Φωνή 2 - Μαρία (Γυναίκα)]" or "[Voice 1 - Narrator (Male)]" or "Voice 2:")
    const standaloneSpeakerHeader = cleanedLine.match(/^\[?((?:Φωνή|Voice|Speaker|Voz|Voix|Stimme)\s*\d+[^\]:]*)\]?\s*:?\s*$/i);
    if (standaloneSpeakerHeader) {
      const resolved = resolveSpeakerTag(standaloneSpeakerHeader[1]);
      if (resolved) currentSpeaker = resolved;
      continue;
    }

    // 7. Match speaker prefix in various formats:
    // Format A: "[Voice 1 - Narrator (Male)]: Text..." or "[Φωνή 1 - Αφηγητής (Άνδρας)]: Κείμενο..."
    let spokenContent = cleanedLine;
    let speakerMatchedOnLine = false;

    const bracketSpeakerMatch = cleanedLine.match(/^\[?((?:Φωνή|Voice|Speaker|Voz|Voix|Stimme)\s*(\d+)[^\]:]*)\]?\s*:\s*(.*)/i);
    if (bracketSpeakerMatch) {
      const resolved = resolveSpeakerTag(bracketSpeakerMatch[1]);
      if (resolved) currentSpeaker = resolved;
      spokenContent = bracketSpeakerMatch[3].trim();
      speakerMatchedOnLine = true;
    } else {
      // Format B: Line starts with "[Voice X ...]" or "[Φωνή X ...]" without colon
      const inlineSpeakerMatch = cleanedLine.match(/^\[((?:Φωνή|Voice|Speaker|Voz|Voix|Stimme)\s*(\d+)[^\]]*)\]\s*(.*)/i);
      if (inlineSpeakerMatch) {
        const resolved = resolveSpeakerTag(inlineSpeakerMatch[1]);
        if (resolved) currentSpeaker = resolved;
        spokenContent = inlineSpeakerMatch[3].trim();
        speakerMatchedOnLine = true;
      } else {
        // Format C: Line starts with role name prefix like "[Μαρία]: Κείμενο" or "Narrator: Text"
        const rolePrefixMatch = cleanedLine.match(/^\[?([Α-Ωα-ωΆ-Ώά-ώA-Za-z0-9\s()-]{2,32})\]?\s*:\s+(.+)/);
        if (rolePrefixMatch) {
          const candidateLabel = rolePrefixMatch[1].trim();
          const resolved = resolveSpeakerTag(candidateLabel);
          if (resolved) {
            currentSpeaker = resolved;
            spokenContent = rolePrefixMatch[2].trim();
            speakerMatchedOnLine = true;
          }
        }
      }
    }

    // Format D: Conversational dialogue dash ("- Text..." or "— Text...") when multiple speakers exist
    if (!speakerMatchedOnLine && /^[-–—]\s+/.test(spokenContent) && speakerConfigs.length > 1) {
      spokenContent = spokenContent.replace(/^[-–—]\s+/, '').trim();
      currentSpeaker = speakerConfigs[dashTurnIndex % speakerConfigs.length].speakerTag;
      dashTurnIndex++;
    }

    if (!spokenContent) continue;

    // 8. Extract inline SFX triggers: [SFX: ...]
    const sfxTriggers: SFXType[] = [];
    let inlineSfxVolume: number | undefined;
    const sfxRegex = /\[SFX:\s*([^\]]+)\]/gi;
    let sfxMatch;
    while ((sfxMatch = sfxRegex.exec(spokenContent)) !== null) {
      const parsedSfx = parseSFXTag(sfxMatch[1]);
      sfxTriggers.push(parsedSfx.type);
      if (parsedSfx.volume !== undefined) {
        inlineSfxVolume = parsedSfx.volume;
      }
    }

    // 9. Extract custom pause duration if present: e.g. [παύση 1.5s] or [pause 1s]
    let pauseAfterSeconds = 0.18;
    const pauseMatch = spokenContent.match(/\[(?:παύση|pause)\s*(\d+(?:[.,]\d+)?)\s*s?\]/i);
    if (pauseMatch) {
      const pVal = parseFloat(pauseMatch[1].replace(',', '.'));
      if (!isNaN(pVal) && pVal > 0 && pVal <= 5) {
        pauseAfterSeconds = pVal;
      }
    }

    // 10. Extract acting cues: [γέλιο], [ψίθυρος], [excited], [urgent], <laugh>, etc.
    const cues: string[] = [];
    const cueRegex = /\[([^\]]+)\]|<(laugh|sigh|breath|gasp)>/gi;
    let cueMatch;
    while ((cueMatch = cueRegex.exec(spokenContent)) !== null) {
      const fullTag = cueMatch[0];
      if (!/^\[(?:SFX|ΜΟΥΣΙΚΗ|MUSIC|Φωνή|Voice|Speaker|Voz|Voix|Stimme)/i.test(fullTag)) {
        cues.push(fullTag);
      }
    }

    // 11. Build clean spoken text for the commercial (pure spoken words only; acting cues are kept in `cues`)
    const cleanSpokenForDisplay = spokenContent
      .replace(/\[SFX:[^\]]*\]/gi, '')
      .replace(/\[(?:ΜΟΥΣΙΚΗ|MUSIC):[^\]]*\]/gi, '')
      .replace(/\[(?:παύση|pause)[^\]]*\]/gi, '... ')
      // Strip all bracketed or XML stage directions so they are NEVER spoken as words
      .replace(/\[[^\]]*\]/g, '')
      .replace(/<[^>]+>/g, '')
      // Strip stage notes in parentheses like "(γελάει)" or "(laughing)"
      .replace(/\((?:ήχος|sound|μουσική|music|φωνή|voice|speaker|παύση|pause|γελάει|γέλιο|laugh|ακούγεται|ψιθυριστά|whisper|έντονα|urgent)[^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanSpokenForDisplay.length > 0) {
      // Prevent duplicate consecutive lines where two voices accidentally say the exact same text
      const prevDialogue = [...parsed].reverse().find((p) => p.type === 'dialogue');
      if (
        prevDialogue &&
        prevDialogue.spokenText.toLowerCase().trim() === cleanSpokenForDisplay.toLowerCase().trim()
      ) {
        continue;
      }

      lineCounter++;
      parsed.push({
        id: `line-${lineCounter}`,
        type: 'dialogue',
        speakerTag: currentSpeaker,
        originalText: rawLine.trim(),
        spokenText: cleanSpokenForDisplay,
        cues,
        sfxTriggers,
        sfxVolume: inlineSfxVolume,
        pauseAfterSeconds,
      });
    } else if (sfxTriggers.length > 0) {
      lineCounter++;
      parsed.push({
        id: `sfx-${lineCounter}`,
        type: 'sfx_only',
        speakerTag: currentSpeaker,
        originalText: rawLine.trim(),
        spokenText: '',
        cues: [],
        sfxTriggers,
        sfxVolume: inlineSfxVolume,
        pauseAfterSeconds: 0.15,
      });
    }
  }

  return parsed;
}

/**
 * Shifts pitch of an AudioBuffer while preserving natural speaking tempo
 * using Overlap-Add (OLA) time-stretching + linear resampling.
 * Prevents male voice pitch-shifts from sounding slowed down.
 */
function shiftPitchPreserveTempo(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  pitchSemitones: number,
  tempoCompensation: number = 1.0
): AudioBuffer {
  if (Math.abs(pitchSemitones) < 0.05 && Math.abs(tempoCompensation - 1.0) < 0.02) {
    return buffer;
  }

  const pitchRatio = Math.pow(2, pitchSemitones / 12);
  // Target time-stretch factor before resampling so final duration = buffer.duration / tempoCompensation
  const stretchFactor = pitchRatio / tempoCompensation;
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;

  // Step 1: OLA time-stretch by stretchFactor using 28ms Hanning grain window
  const windowSize = Math.floor(sampleRate * 0.028);
  const hopOut = Math.floor(windowSize / 2);
  const hopIn = Math.max(1, Math.round(hopOut / stretchFactor));
  const stretchedLength = Math.max(windowSize, Math.round(buffer.length * stretchFactor));

  const hanning = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    hanning[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  const stretchedChannels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const out = new Float32Array(stretchedLength);
    const norm = new Float32Array(stretchedLength);

    let inPos = 0;
    let outPos = 0;
    while (outPos + windowSize < stretchedLength && inPos + windowSize < src.length) {
      for (let i = 0; i < windowSize; i++) {
        const w = hanning[i];
        out[outPos + i] += src[inPos + i] * w;
        norm[outPos + i] += w;
      }
      inPos += hopIn;
      outPos += hopOut;
    }

    for (let i = 0; i < stretchedLength; i++) {
      if (norm[i] > 0.001) {
        out[i] /= norm[i];
      }
    }
    stretchedChannels.push(out);
  }

  // Step 2: Resample by pitchRatio to shift pitch while landing on exact natural tempo
  const finalLength = Math.max(1, Math.round(stretchedLength / pitchRatio));
  const outBuffer = ctx.createBuffer(numChannels, finalLength, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const src = stretchedChannels[ch];
    const dest = outBuffer.getChannelData(ch);
    const srcLen = src.length;
    for (let i = 0; i < finalLength; i++) {
      const srcIdx = i * pitchRatio;
      const baseIdx = Math.floor(srcIdx);
      const frac = srcIdx - baseIdx;
      if (baseIdx + 1 < srcLen) {
        dest[i] = src[baseIdx] * (1 - frac) + src[baseIdx + 1] * frac;
      } else if (baseIdx < srcLen) {
        dest[i] = src[baseIdx];
      }
    }
  }

  return outBuffer;
}

/**
 * Synthesizes a single spoken line into an AudioBuffer.
 * Uses server speech synthesis with strict gender voicing, authentic human Greek inflection,
 * and distinct voice persona characteristics so each speaker sounds unique.
 */
export async function synthesizeLineAudio(
  audioCtx: BaseAudioContext,
  line: ScriptLine,
  speakerConfig: SpeakerConfig,
  productionLanguage: string = 'el'
): Promise<AudioBuffer> {
  // Find timbre and enforce gender consistency
  let timbre = AVAILABLE_TIMBRES.find((t) => t.id === speakerConfig.timbreId);
  if (!timbre || timbre.gender !== speakerConfig.gender) {
    timbre = getDefaultTimbreForGender(speakerConfig.gender, 0);
  }

  // Retrieve optional user API key from browser storage
  const userApiKey =
    typeof window !== 'undefined'
      ? localStorage.getItem('user_gemini_api_key') || ''
      : '';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userApiKey) {
    headers['x-gemini-api-key'] = userApiKey;
  }

  try {
    const res = await fetch('/api/synthesize-speech', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: line.spokenText,
        cues: line.cues,
        voiceName: timbre.geminiVoice,
        gender: speakerConfig.gender,
        styleInstruction: speakerConfig.actingStyle || timbre.defaultActingStyle,
        productionLanguage,
        customApiKey: userApiKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const binaryStr = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const bufferCopy = bytes.buffer.slice(0);
        const decoded = await (audioCtx as AudioContext).decodeAudioData(bufferCopy);
        let trimmed = trimLeadingTrailingSilence(audioCtx, decoded);

        // Determine per-timbre subtle offset so multiple speakers of the same gender sound distinct
        const timbreIndex = Math.max(0, AVAILABLE_TIMBRES.findIndex((t) => t.id === timbre!.id));
        const personaOffset = ((timbreIndex % 5) - 2) * 0.35; // -0.7 to +0.7 semitones variation per persona

        if (data.isFallbackVoice) {
          // When using Google Human Greek Speech fallback (which has a female base voice),
          // shift male voices to a warm baritone while preserving 100% natural speaking speed!
          const genderBaseShift = speakerConfig.gender === 'male' ? -2.9 : 0.3;
          const totalPitch = genderBaseShift + personaOffset + (speakerConfig.pitch || 0);
          const tempoComp = speakerConfig.gender === 'male' ? 1.06 : 1.04;
          trimmed = shiftPitchPreserveTempo(audioCtx, trimmed, totalPitch, tempoComp);
        } else if (Math.abs(speakerConfig.pitch || 0) > 0.1) {
          // Native Gemini 3.8 TTS already has authentic male/female vocal cords; only apply user pitch slider
          trimmed = shiftPitchPreserveTempo(audioCtx, trimmed, speakerConfig.pitch || 0, 1.0);
        }

        return trimmed;
      }
    }
  } catch (err) {
    console.warn('Speech synthesis network notice:', err);
  }

  // Emergency offline silence/formant pad (never triggers overlapping window.speechSynthesis during render)
  return synthesizeBrowserWebSpeechAudio(audioCtx, line.spokenText, speakerConfig);
}

/**
 * Trims excessive leading/trailing dead silence from TTS audio buffers
 * so that commercial dialogue pacing is tight and broadcast-ready.
 */
function trimLeadingTrailingSilence(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const data = buffer.getChannelData(0);
  const threshold = 0.008;
  let startSample = 0;
  let endSample = data.length - 1;

  while (startSample < data.length && Math.abs(data[startSample]) < threshold) {
    startSample++;
  }
  while (endSample > startSample && Math.abs(data[endSample]) < threshold) {
    endSample--;
  }

  // Keep a small 35ms natural pad around the speech
  const padSamples = Math.floor(buffer.sampleRate * 0.035);
  startSample = Math.max(0, startSample - padSamples);
  endSample = Math.min(data.length - 1, endSample + padSamples);

  const trimmedLength = Math.max(1, endSample - startSample + 1);
  const out = ctx.createBuffer(buffer.numberOfChannels, trimmedLength, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const chData = buffer.getChannelData(ch);
    const outData = out.getChannelData(ch);
    for (let i = 0; i < trimmedLength; i++) {
      outData[i] = chData[startSample + i];
    }
  }

  return out;
}

/**
 * Emergency Offline Audio Buffer Fallback
 */
async function synthesizeBrowserWebSpeechAudio(
  audioCtx: BaseAudioContext,
  text: string,
  config: SpeakerConfig
): Promise<AudioBuffer> {
  const cleanWords = text.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, cleanWords.length);
  const effectiveSpeed = config.speed || 1.0;
  const estimatedDuration = Math.max(0.6, wordCount / (2.4 * effectiveSpeed));

  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(sampleRate * estimatedDuration);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  return buffer;
}

export interface RenderProgressCallback {
  (step: string, progressPercent: number): void;
}

export interface TimelineTrackSegment {
  id: string;
  type: 'voice' | 'sfx';
  speakerTag: string;
  displayName: string;
  gender: 'male' | 'female';
  label: string;
  startTime: number;
  endTime: number;
  originalStartTime?: number;
  originalEndTime?: number;
  audioBuffer?: AudioBuffer;
  volume?: number;
  pan?: number;
  speed?: number;
}

/**
 * Full Spot Production Mixdown:
 * Produces the final broadcast radio commercial combining expressive voice performances
 * in sequential conversational order, timed sound effects, and auto-ducked background music bed.
 */
export async function renderFullSpotMixdown(
  parsedLines: ScriptLine[],
  speakerConfigs: SpeakerConfig[],
  settings: ProductionSettings,
  onProgress?: RenderProgressCallback,
  customAudioBuffer?: AudioBuffer | null,
  musicSeedModifier: number = 0,
  customMusicPrompt: string = '',
  productionLanguage: string = 'el'
): Promise<{
  masterBuffer: AudioBuffer;
  totalDuration: number;
  timelineSegments: TimelineTrackSegment[];
  musicBuffer: AudioBuffer | null;
}> {
  onProgress?.('Προετοιμασία στούντιο & έλεγχος ρόλων...', 8);

  const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: settings.sampleRate,
  });

  interface TimelineEvent {
    type: 'voice' | 'sfx';
    startTime: number;
    duration: number;
    buffer: AudioBuffer;
    volume: number;
    pan: number;
    speed: number;
  }

  const events: TimelineEvent[] = [];
  const timelineSegments: TimelineTrackSegment[] = [];
  const voiceActiveRanges: { start: number; end: number }[] = [];

  // Start after a 0.65s Music Intro so the listener feels the commercial vibe immediately
  let currentTime = settings.musicBedStyle !== 'none' ? 0.65 : 0.25;

  const dialogueItems = parsedLines.filter((l) => l.type === 'dialogue');
  let completedDialogues = 0;

  for (let i = 0; i < parsedLines.length; i++) {
    const item = parsedLines[i];

    // Case A: Standalone Sound Effect line [SFX: ...]
    if (item.type === 'sfx_only') {
      for (const sfxType of item.sfxTriggers) {
        const sfxVol = (settings.sfxVolume ?? 1.0) * (item.sfxVolume ?? 1.0);
        const sfxBuf = await renderSFXBuffer(tempCtx, sfxType, sfxVol);
        const sfxStart = currentTime;
        const sfxAdvance = Math.min(0.65, sfxBuf.duration * 0.55);

        events.push({
          type: 'sfx',
          startTime: sfxStart,
          duration: sfxBuf.duration,
          buffer: sfxBuf,
          volume: sfxVol,
          pan: 0,
          speed: 1.0,
        });

        timelineSegments.push({
          id: `${item.id}-${sfxType}`,
          type: 'sfx',
          speakerTag: 'SFX',
          displayName: `SFX: ${sfxType}`,
          gender: 'male',
          label: item.originalText.replace(/^\[SFX:\s*|\s*\]$/gi, ''),
          startTime: sfxStart,
          endTime: sfxStart + sfxBuf.duration,
          originalStartTime: sfxStart,
          originalEndTime: sfxStart + sfxBuf.duration,
          audioBuffer: sfxBuf,
          volume: sfxVol,
          pan: 0,
          speed: 1.0,
        });

        // Advance timeline slightly so the SFX is heard clearly before the next line starts
        currentTime += sfxAdvance;
      }
      continue;
    }

    // Case B: Spoken Commercial Dialogue Line (each speaker enters at their exact sequential turn)
    const speaker =
      speakerConfigs.find((s) => s.speakerTag === item.speakerTag) ||
      speakerConfigs[0] || {
        speakerTag: 'Φωνή 1',
        displayName: 'Αφηγητής',
        gender: 'male',
        timbreId: 'Fenrir',
        speed: 1.0,
        pitch: 0,
        volume: 1.0,
        pan: 0,
      };

    completedDialogues++;
    const genderBadge = speaker.gender === 'female' ? '♀' : '♂';
    onProgress?.(
      `Ηχογράφηση ατάκας (${completedDialogues}/${dialogueItems.length}): ${speaker.displayName} ${genderBadge}...`,
      12 + (completedDialogues / Math.max(1, dialogueItems.length)) * 45
    );

    const voiceBuf = await synthesizeLineAudio(tempCtx, item, speaker, productionLanguage);
    const effectiveSpeed = Math.max(0.75, Math.min(1.45, speaker.speed || 1.0));
    const effectiveDuration = voiceBuf.duration / effectiveSpeed;
    const lineStartTime = currentTime;
    const lineEndTime = lineStartTime + effectiveDuration;

    events.push({
      type: 'voice',
      startTime: lineStartTime,
      duration: effectiveDuration,
      buffer: voiceBuf,
      volume: speaker.volume,
      pan: speaker.pan,
      speed: effectiveSpeed,
    });

    timelineSegments.push({
      id: item.id,
      type: 'voice',
      speakerTag: speaker.speakerTag,
      displayName: speaker.displayName,
      gender: speaker.gender,
      label: item.spokenText,
      startTime: lineStartTime,
      endTime: lineEndTime,
      originalStartTime: lineStartTime,
      originalEndTime: lineEndTime,
      audioBuffer: voiceBuf,
      volume: speaker.volume,
      pan: speaker.pan,
      speed: effectiveSpeed,
    });

    voiceActiveRanges.push({
      start: lineStartTime,
      end: lineEndTime,
    });

    // Trigger any inline SFX attached to this line (e.g. at the end of the punchline)
    for (const sfxType of item.sfxTriggers) {
      const inlineVol = (settings.sfxVolume ?? 1.0) * (item.sfxVolume ?? 1.0);
      const sfxBuf = await renderSFXBuffer(tempCtx, sfxType, inlineVol);
      const inlineSfxStart = Math.max(0, lineEndTime - 0.15);
      events.push({
        type: 'sfx',
        startTime: inlineSfxStart,
        duration: sfxBuf.duration,
        buffer: sfxBuf,
        volume: inlineVol,
        pan: 0,
        speed: 1.0,
      });
      timelineSegments.push({
        id: `${item.id}-sfx-${sfxType}`,
        type: 'sfx',
        speakerTag: 'SFX',
        displayName: `SFX: ${sfxType}`,
        gender: 'male',
        label: sfxType,
        startTime: inlineSfxStart,
        endTime: inlineSfxStart + sfxBuf.duration,
        originalStartTime: inlineSfxStart,
        originalEndTime: inlineSfxStart + sfxBuf.duration,
        audioBuffer: sfxBuf,
        volume: inlineVol,
        pan: 0,
        speed: 1.0,
      });
    }

    // Natural conversational turn handoff between different speakers vs same speaker
    const nextDialogue = parsedLines.slice(i + 1).find((l) => l.type === 'dialogue');
    const isSpeakerSwitch = nextDialogue && nextDialogue.speakerTag !== item.speakerTag;
    const turnGap = item.pauseAfterSeconds || (isSpeakerSwitch ? 0.12 : 0.2);

    currentTime = lineEndTime + turnGap;
  }

  // Add a 1.3s Music Outro swell after the final spoken word for a real radio commercial finish
  const outroTail = settings.musicBedStyle !== 'none' ? 1.3 : 0.4;
  const totalDuration = Math.max(2.0, currentTime + outroTail);

  onProgress?.('Σύνθεση studio μουσικής επένδυσης (Google Lyria 3)...', 65);
  const musicBuffer = await renderMusicBedBuffer(
    tempCtx,
    settings.musicBedStyle,
    totalDuration,
    customAudioBuffer,
    musicSeedModifier,
    customMusicPrompt
  );

  onProgress?.('Πολυκάναλη μίξη διαλόγων, SFX & Auto-Ducking...', 80);

  const offlineCtx = new OfflineAudioContext(
    2,
    Math.max(1, Math.floor(settings.sampleRate * totalDuration)),
    settings.sampleRate
  );

  // Broadcast Master Bus (Warmth + Limiter)
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.96;

  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -1.5;
  limiter.knee.value = 3;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.12;

  masterGain.connect(limiter);
  limiter.connect(offlineCtx.destination);

  // Schedule Voice and SFX tracks at their exact timeline cue points
  for (const ev of events) {
    const src = offlineCtx.createBufferSource();
    src.buffer = ev.buffer;

    if (ev.type === 'voice') {
      src.playbackRate.value = ev.speed;
    }

    const gain = offlineCtx.createGain();
    gain.gain.value = ev.volume;

    const panner = offlineCtx.createStereoPanner();
    panner.pan.value = ev.pan;

    src.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);

    src.start(ev.startTime);
  }

  // Schedule Music Bed with Broadcast Intro, Auto-Ducking under Voice, and Outro Swell
  if (musicBuffer && settings.musicBedStyle !== 'none') {
    const musicSource = offlineCtx.createBufferSource();
    musicSource.buffer = musicBuffer;

    const musicGain = offlineCtx.createGain();
    const fullMusicVol = settings.musicVolume;
    const duckedMusicVol = fullMusicVol * settings.duckingAmount;

    // Fade in intro
    musicGain.gain.setValueAtTime(0.001, 0);
    musicGain.gain.linearRampToValueAtTime(fullMusicVol, 0.3);

    if (settings.enableDucking && voiceActiveRanges.length > 0) {
      const firstVoiceStart = voiceActiveRanges[0].start;
      const lastVoiceEnd = voiceActiveRanges[voiceActiveRanges.length - 1].end;

      // Hold full intro volume until just before first voice
      musicGain.gain.setValueAtTime(fullMusicVol, Math.max(0.3, firstVoiceStart - 0.15));
      musicGain.gain.linearRampToValueAtTime(duckedMusicVol, firstVoiceStart + 0.08);

      // Swell back up after the final spoken word for the radio outro tag
      musicGain.gain.setValueAtTime(duckedMusicVol, lastVoiceEnd);
      musicGain.gain.linearRampToValueAtTime(fullMusicVol, Math.min(totalDuration - 0.4, lastVoiceEnd + 0.35));
    }

    // Smooth fade out at the very end of the commercial
    const fadeOutStart = Math.max(0.5, totalDuration - 0.9);
    musicGain.gain.setValueAtTime(fullMusicVol, fadeOutStart);
    musicGain.gain.linearRampToValueAtTime(0.0001, totalDuration);

    musicSource.connect(musicGain);
    musicGain.connect(masterGain);
    musicSource.start(0);
  }

  onProgress?.('Τελικό Broadcast Mastering & εξαγωγή...', 92);

  const renderedBuffer = await offlineCtx.startRendering();
  try {
    await tempCtx.close();
  } catch {
    // ignore
  }
  onProgress?.('Η διαφήμιση είναι έτοιμη!', 100);

  return { masterBuffer: renderedBuffer, totalDuration, timelineSegments, musicBuffer };
}

/**
 * Ultra-fast timeline remix (~50ms) using in-memory cached voice & SFX audio buffers.
 * Called immediately after user drag-and-drops voice cues on the timeline.
 */
export async function remixWithUpdatedTimeline(
  segments: TimelineTrackSegment[],
  musicBuffer: AudioBuffer | null,
  settings: ProductionSettings
): Promise<{
  masterBuffer: AudioBuffer;
  totalDuration: number;
  timelineSegments: TimelineTrackSegment[];
}> {
  // 1. Calculate new total duration based on furthest segment end time + outro tail
  const maxSegmentEnd = segments.reduce((max, s) => Math.max(max, s.endTime), 0);
  const outroTail = settings.musicBedStyle !== 'none' ? 1.3 : 0.4;
  const totalDuration = Math.max(2.0, maxSegmentEnd + outroTail);

  const offlineCtx = new OfflineAudioContext(
    2,
    Math.max(1, Math.floor(settings.sampleRate * totalDuration)),
    settings.sampleRate
  );

  // Broadcast Master Bus (Warmth + Limiter)
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.96;

  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -1.5;
  limiter.knee.value = 3;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.12;

  masterGain.connect(limiter);
  limiter.connect(offlineCtx.destination);

  // Schedule Voice and SFX tracks at their updated startTime points
  const voiceActiveRanges: { start: number; end: number }[] = [];

  for (const seg of segments) {
    if (!seg.audioBuffer) continue;

    const src = offlineCtx.createBufferSource();
    src.buffer = seg.audioBuffer;

    if (seg.type === 'voice') {
      src.playbackRate.value = seg.speed || 1.0;
    }

    const gain = offlineCtx.createGain();
    gain.gain.value = seg.volume ?? 1.0;

    const panner = offlineCtx.createStereoPanner();
    panner.pan.value = seg.pan ?? 0;

    src.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);

    src.start(Math.max(0, seg.startTime));

    if (seg.type === 'voice') {
      voiceActiveRanges.push({
        start: seg.startTime,
        end: seg.endTime,
      });
    }
  }

  // Sort ranges for clean music ducking
  voiceActiveRanges.sort((a, b) => a.start - b.start);

  // Schedule Music Bed with Broadcast Intro, Auto-Ducking under updated voice positions, and Outro Swell
  if (musicBuffer && settings.musicBedStyle !== 'none') {
    const musicSource = offlineCtx.createBufferSource();
    musicSource.buffer = musicBuffer;

    const musicGain = offlineCtx.createGain();
    const fullMusicVol = settings.musicVolume;
    const duckedMusicVol = fullMusicVol * settings.duckingAmount;

    // Fade in intro
    musicGain.gain.setValueAtTime(0.001, 0);
    musicGain.gain.linearRampToValueAtTime(fullMusicVol, 0.3);

    if (settings.enableDucking && voiceActiveRanges.length > 0) {
      const firstVoiceStart = voiceActiveRanges[0].start;
      const lastVoiceEnd = voiceActiveRanges.reduce((max, r) => Math.max(max, r.end), 0);

      // Hold full intro volume until just before first voice
      musicGain.gain.setValueAtTime(fullMusicVol, Math.max(0.3, firstVoiceStart - 0.15));
      musicGain.gain.linearRampToValueAtTime(duckedMusicVol, Math.max(0.35, firstVoiceStart + 0.08));

      // Swell back up after the final spoken word for the radio outro tag
      musicGain.gain.setValueAtTime(duckedMusicVol, lastVoiceEnd);
      musicGain.gain.linearRampToValueAtTime(
        fullMusicVol,
        Math.min(totalDuration - 0.4, lastVoiceEnd + 0.35)
      );
    }

    // Smooth fade out at the very end of the commercial
    const fadeOutStart = Math.max(0.5, totalDuration - 0.9);
    musicGain.gain.setValueAtTime(fullMusicVol, fadeOutStart);
    musicGain.gain.linearRampToValueAtTime(0.0001, totalDuration);

    musicSource.connect(musicGain);
    musicGain.connect(masterGain);
    musicSource.start(0);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return {
    masterBuffer: renderedBuffer,
    totalDuration,
    timelineSegments: segments,
  };
}

/**
 * Exports final audio buffer into a downloadable Blob (WAV or MP3 with chosen specs)
 */
export async function exportAudioFile(
  masterBuffer: AudioBuffer,
  settings: ProductionSettings
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  return exportAudioInFormat(masterBuffer, settings, settings.format);
}

/**
 * Exports final audio buffer in a specified format ('wav' or 'mp3')
 */
export async function exportAudioInFormat(
  masterBuffer: AudioBuffer,
  settings: ProductionSettings,
  format: 'wav' | 'mp3'
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const exportOpts: WavExportOptions = {
    sampleRate: settings.sampleRate,
    bitDepth: settings.bitDepth,
    channels: settings.channels,
  };

  const wavBlob = encodeWav(masterBuffer, exportOpts);
  const ext = format === 'mp3' ? 'mp3' : 'wav';
  const durationStr = Math.round(masterBuffer.duration);
  const sampleRateKhz = (settings.sampleRate / 1000).toFixed(1);
  const chStr = settings.channels === 2 ? 'stereo' : 'mono';
  const filename = `spot-${durationStr}s-${sampleRateKhz}kHz-${settings.bitDepth}bit-${chStr}.${ext}`;

  if (format === 'mp3') {
    // Perform genuine MP3 conversion
    const mp3Blob = await convertWavBlobToMp3(wavBlob, masterBuffer, 256);
    return {
      blob: mp3Blob,
      filename,
      mimeType: 'audio/mpeg',
    };
  }

  return {
    blob: wavBlob,
    filename,
    mimeType: 'audio/wav',
  };
}
