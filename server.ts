import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const portArg = process.argv.find((arg, i) => process.argv[i - 1] === '--port');
const PORT = Number(portArg) || (process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3000);

app.use(express.raw({ type: ['audio/wav', 'audio/x-wav', 'application/octet-stream'], limit: '100mb' }));
app.use(express.json({ limit: '50mb' }));

// Server-side Gemini client utility
const defaultApiKey = process.env.GEMINI_API_KEY || '';
let geminiTtsRateLimitedUntil = 0;

function getGeminiClient(customKey?: string): GoogleGenAI {
  const effectiveKey = (customKey && customKey.trim()) || defaultApiKey;
  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ai = getGeminiClient();

// Helper: Ensure audio buffer has a valid 44-byte WAV RIFF header (24kHz, 16-bit, mono)
function ensureWavHeader(rawBuffer: Buffer, sampleRate = 24000): Buffer {
  if (
    rawBuffer.length >= 44 &&
    rawBuffer.toString('ascii', 0, 4) === 'RIFF' &&
    rawBuffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return rawBuffer;
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, rawBuffer]);
}

// System prompt as an award-winning master audio/radio copywriter
const AUDIO_DIRECTOR_SYSTEM_PROMPT = `
Είσαι ένας κορυφαίος, πολυβραβευμένος κειμενογράφος και σκηνοθέτης ηχητικών & ραδιοφωνικών διαφημίσεων (Senior Audio Spot Copywriter & Creative Audio Director).
Η αποστολή σου είναι να δημιουργείς έτοιμα προς εκφώνηση διαφημιστικά σποτ που ακούγονται σαν πραγματικές, επαγγελματικές ραδιοφωνικές διαφημίσεις στον αέρα.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΠΑΡΑΓΩΓΗΣ:
1. ΔΙΑΧΩΡΙΣΜΟΣ ΣΕΝΑΡΙΟΥ & ΕΚΦΩΝΗΣΗΣ:
   - Το πεδίο "spokenText" σε κάθε γραμμή διαλόγου πρέπει να περιέχει ΑΠΟΚΛΕΙΣΤΙΚΑ ΚΑΙ ΜΟΝΟ τα λόγια που λέει ο ηθοποιός/εκφωνητής στο μικρόφωνο.
   - ΑΠΑΓΟΡΕΥΕΤΑΙ να βάζεις μέσα στο "spokenText" τίτλους, χρόνους (π.χ. 0:00-0:05), ονόματα ρόλων, επεξηγήσεις σκηνής ή ηχητικά εφέ. Ο ακροατής της διαφήμισης πρέπει να ακούσει ΜΟΝΟ την ίδια τη διαφήμιση!

2. ΠΡΑΓΜΑΤΙΚΟΣ ΔΙΑΛΟΓΟΣ & ΣΥΝΔΙΑΛΛΑΓΗ ΦΩΝΩΝ (ΟΧΙ ΕΠΑΝΑΛΗΨΗ):
   - Όταν υπάρχουν 2 ή περισσότερες φωνές, το σποτ ΠΡΕΠΕΙ να είναι ένας ενιαίος, ζωντανός διάλογος ή γρήγορη εναλλαγή ρόλων (π.χ. Φωνή 1 ρωτάει/ανοίγει -> Φωνή 2 απαντάει/αντιδρά -> Φωνή 1 παρουσιάζει την προσφορά -> Φωνή 2 κλείνει με ενθουσιασμό ή Call-To-Action).
   - ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η κάθε φωνή να λέει το ίδιο κείμενο με την άλλη! Κάθε φωνή λέει ΜΟΝΟ το δικό της κομμάτι/ατάκα στη σωστή χρονική σειρά μέσα στο σποτ.
   - Στο πεδίο "speakerId" κάθε στοιχείου του "timeline", χρησιμοποιούμε ΑΚΡΙΒΩΣ τους κωδικούς "Φωνή 1", "Φωνή 2", "Φωνή 3" κ.ο.κ.

3. ΣΩΣΤΗ ΕΠΙΛΟΓΗ ΦΥΛΟΥ & ΦΩΝΗΣ (GENDER MATCHING):
   - Για ΚΑΘΕ χαρακτήρα/εκφωνητή, καθόρισε με απόλυτη ακρίβεια το φύλο του ("male" για άνδρα, "female" για γυναίκα) με βάση το όνομα και τον ρόλο του (π.χ. Αφηγητής/Πελάτης/Γιώργος -> "male", Αφηγήτρια/Πελάτισσα/Μαρία/Γυναίκα -> "female").
   - Αντιστοίχισε ΑΥΣΤΗΡΑ ανδρικές φωνές ("Puck", "Fenrir", "Charon", "Orus", "Enceladus", "Iapetus") σε άνδρες ("male") και γυναικείες φωνές ("Kore", "Zephyr", "Aoede", "Leda", "Callirrhoe", "Despina") σε γυναίκες ("female").
   - Όταν υπάρχουν 2 ή περισσότερες φωνές σε διάλογο, προτίμησε εναλλαγή ανδρικής και γυναικείας φωνής ώστε ο διάλογος να ξεχωρίζει καθαρά στο αυτί του ακροατή!

4. ΧΡΟΝΟΣ & ΡΥΘΜΟΣ:
   - Τήρησε ΑΥΣΤΗΡΑ τον επιλεγμένο χρόνο. Ο ρυθμός εκφώνησης είναι ~2.3 λέξεις ανά δευτερόλεπτο (π.χ. ~35 λέξεις συνολικά για 15s, ~68 λέξεις συνολικά για 30s, ~135 λέξεις συνολικά για 60s).

5. ΥΠΟΚΡΙΤΙΚΗ & ΜΥΣΤΙΚΕΣ ΕΝΤΟΛΕΣ ΦΩΝΗΣ (actingCue):
   - Στο πεδίο "actingCue" βάλε σύντομη οδηγία ερμηνείας σε αγκύλες, π.χ. "[ενθουσιασμός]", "[ψίθυρος]", "[γέλιο]", "[χασμουρητό]", "[έντονα]", "[χαλαρά]", "[ειρωνικά]".

6. ΗΧΗΤΙΚΑ ΕΦΕ (SFX):
   - Τοποθέτησε ηχητικά εφέ (type: "sfx") στα κατάλληλα σημεία της ροής (στην αρχή για hook, ανάμεσα στις ατάκες ή στο κλείσιμο).
   - Διαθέσιμα sfxType: "cash_register", "doorbell", "phone_ring", "car_screech", "whoosh", "sub_impact", "crowd_cheer", "camera_click", "radio_beep", "bell_chime".
`;

// API route to generate structured radio spot script
app.post('/api/generate-script', async (req, res) => {
  try {
    const {
      topic = '',
      targetDuration = 30,
      voiceCount = 1,
      style = 'Ενθουσιώδες / Προσφορά',
      tone = 'Φιλικός & Πειστικός',
      callToAction = '',
      productionLanguage = 'el',
    } = req.body;

    if (!topic || topic.trim() === '') {
      res.status(400).json({ error: 'Παρακαλώ εισάγετε θέμα για τη διαφήμιση.' });
      return;
    }

    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const activeAi = clientKey ? getGeminiClient(clientKey) : ai;

    const estimatedWords = Math.max(10, Math.round(Number(targetDuration) * 2.2));
    const numVoices = Math.max(1, Number(voiceCount) || 1);
    const isGreek = productionLanguage === 'el';

    const langConfigs: Record<
      string,
      {
        langName: string;
        voicePrefix: string;
        defaultRole: string;
        genderLabels: { male: string; female: string };
        systemPrompt: string;
        userPromptHeading: string;
        langMandate: string;
      }
    > = {
      el: {
        langName: 'Greek',
        voicePrefix: 'Φωνή',
        defaultRole: 'Αφηγητής',
        genderLabels: { male: 'Άνδρας', female: 'Γυναίκα' },
        systemPrompt: AUDIO_DIRECTOR_SYSTEM_PROMPT,
        userPromptHeading: 'Δημιούργησε ένα ολοκληρωμένο ραδιοφωνικό διαφημιστικό σποτ έτοιμο για ηχογράφηση.',
        langMandate: 'ΓΛΩΣΣΑ ΠΑΡΑΓΩΓΗΣ: ΕΛΛΗΝΙΚΑ (GREEK). Όλα τα λόγια (spokenText), τίτλοι και ρόλοι να γραφτούν στα άπταιστα Ελληνικά για ραδιοφωνική μετάδοση.',
      },
      en: {
        langName: 'English',
        voicePrefix: 'Voice',
        defaultRole: 'Narrator',
        genderLabels: { male: 'Male', female: 'Female' },
        systemPrompt: `You are a world-class, award-winning Senior Radio Commercial Copywriter & Creative Audio Director producing broadcast radio ads for top English-speaking radio stations (US/UK/Global).
Your mission is to produce broadcast-ready commercial scripts for professional studio voice recording.

CRITICAL LANGUAGE MANDATE:
The entire generated spot — EVERY SINGLE spoken dialogue line ("spokenText"), the commercial "title", the "conceptSummary", and the speaker "roleName" (e.g. "Narrator", "Customer", "Host", "Alex") — MUST BE WRITTEN 100% IN NATIVE, NATURAL BROADCAST ENGLISH.
CRITICAL: Even if the user brief, topic, or instructions below are submitted in Greek or any other language, YOU MUST ADAPT/TRANSLATE THE CORE ADVERTISING MESSAGE INTO NATURAL, VIBRANT, HIGH-CONVERTING ENGLISH COPY.
ZERO GREEK WORDS are allowed in the spoken dialogue lines or title.

RULES:
1. SPOKEN TEXT PURITY: In "spokenText", include ONLY the pure dialogue spoken into the microphone. NO brackets, NO role names, NO timecodes.
2. NATURAL DIALOGUE: If multiple voices exist, create a fast-paced conversational dialogue between distinct roles (Voice 1, Voice 2). Never repeat text!
3. GENDER & VOICES: Accurate male/female matching.
4. SFX: Insert broadcast sound effects (cash_register, car_screech, doorbell, phone_ring, whoosh, etc.).`,
        userPromptHeading: 'Create a complete, broadcast-ready radio commercial script.',
        langMandate: 'CRITICAL MANDATORY LANGUAGE: ENGLISH (US/UK). ALL dialogue lines ("spokenText"), spot title, and concept summary MUST BE 100% IN NATURAL BROADCAST ENGLISH. Even if the topic below was provided in Greek, translate and write the commercial entirely in English.',
      },
      es: {
        langName: 'Spanish',
        voicePrefix: 'Voz',
        defaultRole: 'Locutor',
        genderLabels: { male: 'Hombre', female: 'Mujer' },
        systemPrompt: `Eres un director creativo y guionista de cuñas publicitarias para radio comercial en español.
MANDATO ABSOLUTO DE IDIOMA: Todo el guion (diálogos spokenText, título, conceptSummary) DEBE ESTAR 100% EN ESPAÑOL NATURAL Y PROFESIONAL. Si el tema fue ingresado en otro idioma, tradúcelo y adáptalo completamente al español.`,
        userPromptHeading: 'Crea una cuña de radio comercial completa en español.',
        langMandate: 'IDIOMA MANDATORIO: ESPAÑOL. Todos los diálogos y títulos deben estar en español.',
      },
      fr: {
        langName: 'French',
        voicePrefix: 'Voix',
        defaultRole: 'Narrateur',
        genderLabels: { male: 'Homme', female: 'Femme' },
        systemPrompt: `Tu es un directeur artistique et concepteur-rédacteur radio primé pour spots publicitaires en français.
MANDAT LINGUISTIQUE: L'intégralité du spot (dialogues spokenText, titre, conceptSummary) DOIT ÊTRE 100% EN FRANÇAIS DE QUALITÉ DIFFUSION. Si le brief est dans une autre langue, traduis et adapte-le en français.`,
        userPromptHeading: 'Crée un spot radio commercial complet en français.',
        langMandate: 'LANGUE OBLIGATOIRE: FRANÇAIS. Tous les dialogues et titres doivent être rédigés en français.',
      },
      de: {
        langName: 'German',
        voicePrefix: 'Stimme',
        defaultRole: 'Sprecher',
        genderLabels: { male: 'Mann', female: 'Frau' },
        systemPrompt: `Du bist ein preisgekrönter Werbetexter und Regisseur für Radio-Werbespots auf Deutsch.
SPRACH-VORGABE: Der gesamte Werbespot (gesprochener Text, Titel, Zusammenfassung) MUSS ZU 100% IN NATÜRLICHEM, ÜBERZEUGENDEM WERBEDEUTSCH VERFASST SEIN.`,
        userPromptHeading: 'Erstelle einen professionellen Radio-Werbespot auf Deutsch.',
        langMandate: 'VERPFLICHTENDE SPRACHE: DEUTSCH. Alle Dialoge und Titel müssen auf Deutsch sein.',
      },
    };

    const currentLangConfig = langConfigs[productionLanguage] || langConfigs.en;

    const userPrompt = `
${currentLangConfig.userPromptHeading}

${currentLangConfig.langMandate}

CAMPAIGN TOPIC & BRIEF:
"${topic}"

PARAMETERS:
- Target Duration: ${targetDuration} seconds (Target ~${estimatedWords} spoken words total across all speakers).
- Number of Voices: ${numVoices} ${
      numVoices === 1
        ? '(1 Solo Voice/Announcer)'
        : `(Conversational dialogue alternating between ${numVoices} distinct roles: ${currentLangConfig.voicePrefix} 1, ${currentLangConfig.voicePrefix} 2${
            numVoices > 2 ? `, ${currentLangConfig.voicePrefix} 3...` : ''
          })`
    }.
- Style: ${style}.
- Tone: ${tone}.
${callToAction ? `- Call-To-Action (Closing): ${callToAction}` : ''}

STRICT PRODUCTION RULES:
1. Spoken Text Language: "spokenText" MUST BE 100% in ${currentLangConfig.langName}! If the topic was provided in Greek, TRANSLATE & ADAPT to ${currentLangConfig.langName}.
2. Voice Matching: Ensure gender ("male" | "female") and voicePersona strictly match the role and name.
3. Engaging Dialogue: If ${numVoices} voices, create a natural back-and-forth dialogue where characters talk to or answer each other. Never repeat identical lines.
4. Pure Audio: In "spokenText" put ONLY the clean words to be spoken. NO speaker tags, NO timestamps, NO descriptions.
`;

    // Attempt generation with ultra-fast models: try gemini-3.5-flash-lite first (<1s), fallback to gemini-3.8-flash
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let rawJson = '';
    let lastError: any = null;

    for (const modelCandidate of candidateModels) {
      try {
        const response = await activeAi.models.generateContent({
          model: modelCandidate,
          contents: userPrompt,
          config: {
            systemInstruction: currentLangConfig.systemPrompt,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: `Spot Title in ${currentLangConfig.langName}`,
                },
                conceptSummary: {
                  type: Type.STRING,
                  description: `Brief 1-sentence concept summary in ${currentLangConfig.langName}`,
                },
                recommendedMusicStyle: {
                  type: Type.STRING,
                  description:
                    'Recommended music: upbeat_acoustic, modern_electro, warm_piano, energetic_rock, lofi_chill, or cinematic_trailer',
                },
                speakers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speakerId: {
                        type: Type.STRING,
                        description: `Strictly "${currentLangConfig.voicePrefix} 1", "${currentLangConfig.voicePrefix} 2", etc.`,
                      },
                      roleName: {
                        type: Type.STRING,
                        description: `Role name in ${currentLangConfig.langName}, e.g. "Narrator", "Customer", "Store Manager"`,
                      },
                      gender: {
                        type: Type.STRING,
                        description: 'Strictly "male" or "female"',
                      },
                      voicePersona: {
                        type: Type.STRING,
                        description: 'If male: "Puck", "Fenrir", or "Charon". If female: "Kore", "Zephyr", or "Aoede"',
                      },
                      actingStyle: {
                        type: Type.STRING,
                        description: `Voice acting direction for TTS in English, e.g. "Energetic commercial announcer in ${currentLangConfig.langName}"`,
                      },
                    },
                    required: ['speakerId', 'roleName', 'gender', 'voicePersona', 'actingStyle'],
                  },
                },
                timeline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description: '"dialogue" for speech line or "sfx" for sound effect',
                      },
                      speakerId: {
                        type: Type.STRING,
                        description: `For dialogue: "${currentLangConfig.voicePrefix} 1", "${currentLangConfig.voicePrefix} 2", etc.`,
                      },
                      actingCue: {
                        type: Type.STRING,
                        description: isGreek
                          ? 'π.χ. "[ενθουσιασμός]", "[ψίθυρος]", "[γέλιο]", "[έντονα]"'
                          : 'e.g. "[enthusiastic]", "[whisper]", "[laughing]", "[urgent]", "[relaxed]"',
                      },
                      spokenText: {
                        type: Type.STRING,
                        description: `ONLY the spoken words for this line in ${currentLangConfig.langName}. NO titles, role names, or stage directions.`,
                      },
                      sfxType: {
                        type: Type.STRING,
                        description:
                          'For sfx: cash_register, doorbell, phone_ring, car_screech, whoosh, sub_impact, crowd_cheer, camera_click, radio_beep, or bell_chime',
                      },
                      sfxDescription: {
                        type: Type.STRING,
                        description: 'Short SFX description',
                      },
                    },
                    required: ['type'],
                  },
                },
              },
              required: ['title', 'conceptSummary', 'recommendedMusicStyle', 'speakers', 'timeline'],
            },
          },
        });

        const textOutput = response.text?.trim();
        if (textOutput) {
          rawJson = textOutput;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelCandidate} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!rawJson) {
      throw lastError || new Error('All AI models failed to generate script.');
    }

    const parsed = JSON.parse(rawJson);

    const maleVoices = ['Puck', 'Fenrir', 'Charon', 'Orus', 'Enceladus', 'Iapetus'];
    const femaleVoices = ['Kore', 'Zephyr', 'Aoede', 'Leda', 'Callirrhoe', 'Despina'];

    const validatedSpeakers = (parsed.speakers || []).map((spk: any, idx: number) => {
      const canonicalId = `${currentLangConfig.voicePrefix} ${idx + 1}`;
      const originalId = String(spk.speakerId || canonicalId).trim();
      const roleName = spk.roleName || (idx === 0 ? currentLangConfig.defaultRole : `${currentLangConfig.voicePrefix} ${idx + 1}`);
      let gender: 'male' | 'female' = spk.gender === 'female' ? 'female' : 'male';
      const lowerRole = roleName.toLowerCase();

      // Check female indicators (Greek, English, Spanish, French, German)
      if (
        lowerRole.includes('γυναίκ') ||
        lowerRole.includes('αφηγήτρια') ||
        lowerRole.includes('εκφωνήτρια') ||
        lowerRole.includes('πελάτισσα') ||
        lowerRole.includes('μαρία') ||
        lowerRole.includes('ελένη') ||
        lowerRole.includes('κατερίνα') ||
        lowerRole.includes('σοφία') ||
        lowerRole.includes('άννα') ||
        lowerRole.includes('μητέρα') ||
        lowerRole.includes('μαμά') ||
        lowerRole.includes('female') ||
        lowerRole.includes('woman') ||
        lowerRole.includes('girl') ||
        lowerRole.includes('mother') ||
        lowerRole.includes('mom') ||
        lowerRole.includes('lady') ||
        lowerRole.includes('sarah') ||
        lowerRole.includes('emma') ||
        lowerRole.includes('mujer') ||
        lowerRole.includes('femme') ||
        lowerRole.includes('frau')
      ) {
        gender = 'female';
      } else if (
        lowerRole.includes('άνδρ') ||
        lowerRole.includes('άντρ') ||
        lowerRole.includes('αφηγητής') ||
        lowerRole.includes('εκφωνητής') ||
        lowerRole.includes('πελάτης') ||
        lowerRole.includes('γιώργος') ||
        lowerRole.includes('κώστας') ||
        lowerRole.includes('δημήτρης') ||
        lowerRole.includes('νίκος') ||
        lowerRole.includes('πατέρας') ||
        lowerRole.includes('male') ||
        lowerRole.includes('man') ||
        lowerRole.includes('boy') ||
        lowerRole.includes('father') ||
        lowerRole.includes('dad') ||
        lowerRole.includes('guy') ||
        lowerRole.includes('hombre') ||
        lowerRole.includes('homme') ||
        lowerRole.includes('mann')
      ) {
        gender = 'male';
      }

      let voicePersona = spk.voicePersona;
      if (gender === 'female' && !femaleVoices.includes(voicePersona)) {
        voicePersona = femaleVoices[idx % femaleVoices.length];
      } else if (gender === 'male' && !maleVoices.includes(voicePersona)) {
        voicePersona = maleVoices[idx % maleVoices.length];
      }

      const defaultActingStyle = isGreek
        ? gender === 'female'
          ? 'Clear, expressive Greek female commercial voiceover'
          : 'Clear, authoritative Greek male commercial voiceover'
        : gender === 'female'
        ? `Clear, expressive female commercial voiceover in ${currentLangConfig.langName}`
        : `Clear, authoritative male commercial voiceover in ${currentLangConfig.langName}`;

      return {
        speakerId: canonicalId,
        originalId,
        roleName,
        gender,
        voicePersona,
        actingStyle: spk.actingStyle || defaultActingStyle,
      };
    });

    // Helper to match a timeline item's speakerId to our validatedSpeakers
    const findSpeakerForTimelineItem = (rawSpeakerId: string, dialogueTurnIndex: number) => {
      if (!validatedSpeakers.length) {
        return {
          speakerId: `${currentLangConfig.voicePrefix} 1`,
          roleName: currentLangConfig.defaultRole,
          gender: 'male' as const,
        };
      }
      const cleanedId = String(rawSpeakerId || '').trim();
      // 1. Exact canonical or original match
      let found = validatedSpeakers.find(
        (s: any) =>
          s.speakerId.toLowerCase() === cleanedId.toLowerCase() ||
          s.originalId.toLowerCase() === cleanedId.toLowerCase() ||
          s.roleName.toLowerCase() === cleanedId.toLowerCase()
      );
      if (found) return found;

      // 2. Match by number in string (e.g. "Voice 2", "Φωνή 2", "2")
      const numMatch = cleanedId.match(/(\d+)/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < validatedSpeakers.length) {
          return validatedSpeakers[idx];
        }
      }

      // 3. Match by partial roleName inclusion
      found = validatedSpeakers.find(
        (s: any) =>
          cleanedId.toLowerCase().includes(s.roleName.toLowerCase()) ||
          s.roleName.toLowerCase().includes(cleanedId.toLowerCase())
      );
      if (found) return found;

      // 4. Fallback: alternate by turn index
      return validatedSpeakers[dialogueTurnIndex % validatedSpeakers.length];
    };

    const rawTimeline = Array.isArray(parsed.timeline) ? parsed.timeline : [];
    const dialogueEntries = rawTimeline.filter((it: any) => it.type === 'dialogue' && it.spokenText);
    const resolvedSpeakerIds = new Set(
      dialogueEntries.map((it: any, i: number) => findSpeakerForTimelineItem(it.speakerId, i).speakerId)
    );
    const forceAlternate = validatedSpeakers.length > 1 && dialogueEntries.length > 1 && resolvedSpeakerIds.size === 1;

    const scriptLinesText: string[] = [];
    let totalSpokenWords = 0;
    let dialogueTurn = 0;

    for (const item of rawTimeline) {
      if (item.type === 'sfx' && item.sfxDescription) {
        const sfxTag = item.sfxType ? `${item.sfxDescription} (${item.sfxType})` : item.sfxDescription;
        scriptLinesText.push(`[SFX: ${sfxTag}]`);
      } else if (item.type === 'dialogue' && item.spokenText) {
        const spk = forceAlternate
          ? validatedSpeakers[dialogueTurn % validatedSpeakers.length]
          : findSpeakerForTimelineItem(item.speakerId, dialogueTurn);
        dialogueTurn++;

        const genderLabel = spk.gender === 'female' ? currentLangConfig.genderLabels.female : currentLangConfig.genderLabels.male;
        const cueStr = item.actingCue
          ? item.actingCue.startsWith('[')
            ? `${item.actingCue} `
            : `[${item.actingCue}] `
          : '';
        const cleanSpoken = String(item.spokenText)
          .replace(/^\[?(?:Φωνή|Voice|Speaker|Voz|Voix|Stimme)\s*\d+[^\]:]*\]?:\s*/i, '')
          .trim();

        if (cleanSpoken) {
          scriptLinesText.push(`[${spk.speakerId} - ${spk.roleName} (${genderLabel})]: ${cueStr}${cleanSpoken}`);
          totalSpokenWords += cleanSpoken.split(/\s+/).filter(Boolean).length;
        }
      }
    }

    const formattedScript = scriptLinesText.join('\n');
    const calculatedDurationSec = Math.round(totalSpokenWords / 2.3);

    const defaultTitle = isGreek ? 'Ραδιοφωνικό Σποτ' : 'Commercial Radio Spot';

    res.json({
      success: true,
      title: parsed.title || defaultTitle,
      conceptSummary: parsed.conceptSummary || '',
      recommendedMusicStyle: parsed.recommendedMusicStyle || 'upbeat_acoustic',
      script: formattedScript,
      wordCount: totalSpokenWords,
      estimatedDurationSec: calculatedDurationSec,
      targetDurationSec: Number(targetDuration),
      structuredSpeakers: validatedSpeakers,
    });
  } catch (err: any) {
    console.error('Error generating radio script:', err);
    res.status(500).json({
      error: err?.message || 'Αποτυχία παραγωγής σεναρίου. Παρακαλώ δοκιμάστε ξανά.',
    });
  }
});

// Helper to translate Greek vocal cues into expressive acting styles and strip ALL non-spoken tags
function prepareExpressiveSpeechInput(
  rawText: string,
  cuesList: string[],
  baseStyle: string
): {
  cleanedTextForTts: string;
  actingStylePrompt: string;
} {
  const styleModifiers: string[] = [baseStyle];
  let text = rawText;

  const allCues = cuesList.join(' ').toLowerCase() + ' ' + text.toLowerCase();

  if (allCues.includes('ψίθυρος') || allCues.includes('ψιθυριστά') || allCues.includes('whisper')) {
    styleModifiers.push('whispering softly and intimately');
  }
  if (
    allCues.includes('ενθουσιασμός') ||
    allCues.includes('ενθουσιωδώς') ||
    allCues.includes('χαρούμενα') ||
    allCues.includes('excited') ||
    allCues.includes('enthusiastic') ||
    allCues.includes('upbeat')
  ) {
    styleModifiers.push('very enthusiastic, bright, excited and upbeat commercial delivery');
  }
  if (
    allCues.includes('έντονα') ||
    allCues.includes('δυναμικά') ||
    allCues.includes('επείγον') ||
    allCues.includes('urgent') ||
    allCues.includes('dynamic') ||
    allCues.includes('punchy')
  ) {
    styleModifiers.push('punchy, dynamic, urgent and persuasive radio ad energy');
  }
  if (
    allCues.includes('χαλαρά') ||
    allCues.includes('ζεστά') ||
    allCues.includes('ήρεμα') ||
    allCues.includes('relaxed') ||
    allCues.includes('warm') ||
    allCues.includes('smooth')
  ) {
    styleModifiers.push('warm, relaxed, smooth and reassuring tone');
  }
  if (
    allCues.includes('ειρωνικά') ||
    allCues.includes('παιχνιδιάρικα') ||
    allCues.includes('playful') ||
    allCues.includes('witty')
  ) {
    styleModifiers.push('playful, witty, expressive acting');
  }
  if (
    allCues.includes('γέλιο') ||
    allCues.includes('γελώντας') ||
    allCues.includes('<laugh>') ||
    allCues.includes('laugh') ||
    allCues.includes('laughing') ||
    allCues.includes('smiling')
  ) {
    styleModifiers.push('smiling, cheerful, amused laughing tone');
  }
  if (
    allCues.includes('χασμουρητό') ||
    allCues.includes('νυσταγμένα') ||
    allCues.includes('κουρασμένα') ||
    allCues.includes('tired') ||
    allCues.includes('sleepy')
  ) {
    styleModifiers.push('tired, sleepy, yawning tone');
  }

  // Strip ALL bracketed and XML stage tags so the announcer ONLY speaks the pure dialogue
  text = text
    .replace(/\[SFX:[^\]]*\]/gi, '')
    .replace(/\[(?:ΜΟΥΣΙΚΗ|MUSIC):[^\]]*\]/gi, '')
    .replace(/\[(?:παύση|pause)[^\]]*\]/gi, '... ')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\((?:ήχος|sound|μουσική|music|φωνή|voice|speaker|παύση|pause|γέλιο|laugh|γελάει|ακούγεται)[^)]*\)/gi, '')
    .replace(/^(?:\*\*|\[)?(?:Φωνή|Voice|Speaker|Voz|Voix|Stimme)\s*\d+[^:]*:\s*/i, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanedTextForTts: text,
    actingStylePrompt: styleModifiers.join(', '),
  };
}

// In-memory cache for synthesized speech to avoid repeated quota usage
const ttsCache = new Map<string, { audioBase64: string; mimeType: string; isFallbackVoice: boolean }>();

// In-memory cache for Lyria 3 AI generated studio music tracks
const musicCache = new Map<string, { audioBase64: string; mimeType: string }>();

/**
 * Splits Greek text into safe clause chunks (<= 85 chars)
 * to guarantee 100% success on the Google Human Greek Speech engine (avoiding HTTP 400 errors).
 */
function splitTextIntoSafeChunks(text: string, maxLen = 85): string[] {
  const sentences = text.match(/[^,.;:!?\n…]+[,.;:!?\n…]*/g) || [text];
  const safeChunks: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxLen) {
      safeChunks.push(trimmed);
    } else {
      const words = trimmed.split(/\s+/);
      let cur = '';
      for (const w of words) {
        if (!w) continue;
        if ((cur + ' ' + w).trim().length > maxLen) {
          if (cur) safeChunks.push(cur.trim());
          cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      }
      if (cur) safeChunks.push(cur.trim());
    }
  }

  return safeChunks.length > 0 ? safeChunks : [text.slice(0, maxLen)];
}

// All 30 authentic Google Gemini prebuilt voices separated by gender
const ALL_MALE_PREBUILT_VOICES = [
  'Fenrir',
  'Puck',
  'Charon',
  'Orus',
  'Enceladus',
  'Iapetus',
  'Umbriel',
  'Algieba',
  'Algenib',
  'Rasalgethi',
  'Achird',
  'Zubenelgenubi',
  'Sadaltager',
  'Sadachbia',
  'Schedar',
];

const ALL_FEMALE_PREBUILT_VOICES = [
  'Kore',
  'Zephyr',
  'Aoede',
  'Leda',
  'Callirrhoe',
  'Autonoe',
  'Despina',
  'Erinome',
  'Laomedeia',
  'Pulcherrima',
  'Achernar',
  'Vindemiatrix',
  'Sulafat',
  'Gacrux',
  'Alnilam',
];

let flashTtsRateLimitedUntil = 0;
let flashLiteTtsRateLimitedUntil = 0;

// API route to synthesize voice audio using Gemini 3.8 TTS (30 voices) with Google Human Greek Speech fallback
app.post('/api/synthesize-speech', async (req, res) => {
  try {
    const {
      text = '',
      cues = [],
      voiceName = 'Fenrir',
      gender = 'male',
      styleInstruction = 'Professional, natural radio commercial actor in Greek',
      productionLanguage = 'el',
    } = req.body;

    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const effectiveKey = (clientKey && clientKey.trim()) || defaultApiKey;

    const { cleanedTextForTts, actingStylePrompt } = prepareExpressiveSpeechInput(
      text,
      Array.isArray(cues) ? cues : [],
      styleInstruction
    );

    if (!cleanedTextForTts) {
      res.status(400).json({ error: 'Δεν δόθηκε καθαρό κείμενο για εκφώνηση.' });
      return;
    }

    let selectedVoice = voiceName;
    if (gender === 'female') {
      if (!ALL_FEMALE_PREBUILT_VOICES.includes(selectedVoice)) {
        selectedVoice = 'Kore';
      }
    } else {
      if (!ALL_MALE_PREBUILT_VOICES.includes(selectedVoice)) {
        selectedVoice = 'Fenrir';
      }
    }

    // Check in-memory cache first
    const cacheKey = `${selectedVoice}_${gender}_${cleanedTextForTts}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      res.json({
        success: true,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        isFallbackVoice: cached.isFallbackVoice,
        spokenText: cleanedTextForTts,
        cached: true,
      });
      return;
    }

    let audioDataBuffer: Buffer | null = null;
    let resultMimeType = 'audio/wav';
    let isFallbackVoice = false;

    if (effectiveKey) {
      const activeAi = getGeminiClient(clientKey);
      const modelsToTry: string[] = [];
      if (clientKey || Date.now() > flashTtsRateLimitedUntil) {
        modelsToTry.push('gemini-3.8-flash-tts');
      }
      if (clientKey || Date.now() > flashLiteTtsRateLimitedUntil) {
        modelsToTry.push('gemini-3.8-flash-lite-tts');
      }

      for (const ttsModel of modelsToTry) {
        if (audioDataBuffer) break;
        try {
          const response = await activeAi.models.generateContent({
            model: ttsModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanedTextForTts,
                    speechMetadata: {
                      style: actingStylePrompt,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const rawBuf = Buffer.from(base64Audio, 'base64');
            audioDataBuffer = ensureWavHeader(rawBuf, 24000);
            resultMimeType = 'audio/wav';
            isFallbackVoice = false;
          }
        } catch {
          if (!clientKey) {
            if (ttsModel === 'gemini-3.8-flash-tts') {
              flashTtsRateLimitedUntil = Date.now() + 10 * 60 * 1000;
            } else {
              flashLiteTtsRateLimitedUntil = Date.now() + 10 * 60 * 1000;
            }
          }
        }
      }
    }

    // High-Fidelity Google Human Greek Speech Engine fallback
    if (!audioDataBuffer) {
      const chunks = splitTextIntoSafeChunks(cleanedTextForTts, 85);
      const audioBuffers: Buffer[] = [];
      const ttsLang = (productionLanguage || 'el').slice(0, 2);

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmed)}&tl=${encodeURIComponent(ttsLang)}&client=tw-ob`;
        try {
          const ttsRes = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: 'https://translate.google.com/',
            },
          });
          if (ttsRes.ok) {
            const partBuf = Buffer.from(await ttsRes.arrayBuffer());
            if (partBuf.length > 0) {
              audioBuffers.push(partBuf);
            }
          }
        } catch {
          // Chunk error handled gracefully
        }
      }

      if (audioBuffers.length > 0) {
        audioDataBuffer = Buffer.concat(audioBuffers);
        resultMimeType = 'audio/mpeg';
        isFallbackVoice = true;
      }
    }

    if (!audioDataBuffer) {
      throw new Error('Δεν ήταν δυνατή η ανάκτηση φωνητικού αρχείου.');
    }

    const base64Final = audioDataBuffer.toString('base64');
    ttsCache.set(cacheKey, {
      audioBase64: base64Final,
      mimeType: resultMimeType,
      isFallbackVoice,
    });

    res.json({
      success: true,
      audioBase64: base64Final,
      mimeType: resultMimeType,
      isFallbackVoice,
      spokenText: cleanedTextForTts,
    });
  } catch (err: any) {
    res.json({
      success: false,
      fallback: true,
      error: err?.message || 'TTS unavailable',
    });
  }
});

// Studio music descriptions mapped for Google Lyria 3 AI Music Engine
const LYRIA_STYLE_PROMPTS: Record<string, string> = {
  upbeat_acoustic:
    'Generate a 30-second upbeat commercial instrumental background track with bright acoustic guitar strumming, warm bassline, crisp handclaps, and light studio drums, cheerful and positive radio ad feel, no vocals.',
  energetic_rock:
    'Generate a 30-second energetic driving rock instrumental commercial track with punchy electric guitar riffs, tight studio drums, and dynamic bass for a high-energy radio spot, no vocals.',
  funk_groove:
    'Generate a 30-second groovy funk instrumental background track with funky rhythm guitar, slap bass, tight brass stabs, and upbeat drums for a fun commercial, no vocals.',
  heavy_bass_drop:
    'Generate a 30-second high-impact electronic commercial promo track with deep sub bass, modern trap-pop drums, and exciting synthesizer drops, no vocals.',
  modern_electro:
    'Generate a 30-second modern electro-pop commercial instrumental with warm sidechained synth pads, crisp electronic beat, and bright plucks for a tech brand ad, no vocals.',
  deep_house:
    'Generate a 30-second stylish deep house instrumental commercial track with warm Rhodes chords, smooth sub bass, and 122 BPM four-on-the-floor groove for fashion and lifestyle, no vocals.',
  minimal_tech:
    'Generate a 30-second clean minimalist corporate tech instrumental with warm analog marimba pulses, soft synth pads, and subtle precise percussion, no vocals.',
  trap_urban:
    'Generate a 30-second modern urban hip-hop trap instrumental beat with deep 808 bass, crisp hi-hat rolls, and atmospheric keys, studio quality, no vocals.',
  corporate_inspirational:
    'Generate a 30-second uplifting corporate inspirational instrumental with warm grand piano, muted delayed guitar, and lush strings building confidence and trust, no vocals.',
  warm_piano:
    'Generate a 30-second warm emotional acoustic grand piano and soft cello strings instrumental track, intimate and reassuring broadcast quality, no vocals.',
  lofi_chill:
    'Generate a 30-second cozy lo-fi chillhop instrumental with jazzy Fender Rhodes electric piano chords, boom-bap dusty drums, and warm upright bass for a cafe commercial, no vocals.',
  bossa_nova:
    'Generate a 30-second sunny Brazilian bossa nova instrumental with nylon-string acoustic guitar, soft shakers, upright bass, and warm summer breeze vibe, no vocals.',
  folk_indie:
    'Generate a 30-second warm indie folk acoustic instrumental with fingerpicked wooden guitar, tambourine, and organic upright bass, authentic artisanal feel, no vocals.',
  ambient_wellness:
    'Generate a 30-second serene spa ambient wellness instrumental with lush atmospheric pads, soft harp arpeggios, and peaceful harmonic warmth, no vocals.',
  cinematic_trailer:
    'Generate a 30-second epic cinematic orchestral trailer instrumental with deep brass, dramatic string staccatos, and booming percussion builds, no vocals.',
};

// API route to generate real studio background music using Google Lyria 3 (lyria-3-clip-preview)
app.post('/api/generate-music', async (req, res) => {
  try {
    const {
      style = 'upbeat_acoustic',
      customPrompt = '',
      seedModifier = 0,
    } = req.body;

    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const effectiveKey = (clientKey && clientKey.trim()) || defaultApiKey;

    if (!effectiveKey) {
      res.json({
        success: false,
        fallback: true,
        message: 'No API key configured for Lyria music generation.',
      });
      return;
    }

    const variationFlavors = [
      'arrangement variation A with warm analog mix',
      'arrangement variation B with dynamic rhythmic groove',
      'arrangement variation C with bright melodic hooks',
      'arrangement variation D with lush stereo instrumentation',
      'arrangement variation E with punchy studio mastering',
    ];
    const flavor = variationFlavors[Math.abs(Number(seedModifier) || 0) % variationFlavors.length];

    const baseStylePrompt =
      customPrompt && customPrompt.trim().length > 3
        ? `Generate a 30-second studio-quality commercial instrumental background music track: ${customPrompt.trim()}. Instrumental only, no vocals.`
        : LYRIA_STYLE_PROMPTS[style] || LYRIA_STYLE_PROMPTS.upbeat_acoustic;

    const fullMusicPrompt = `${baseStylePrompt} (${flavor})`;
    const cacheKey = `${style}_${seedModifier}_${customPrompt.trim()}`;

    if (musicCache.has(cacheKey)) {
      const cached = musicCache.get(cacheKey)!;
      res.json({
        success: true,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        cached: true,
      });
      return;
    }

    const activeAi = getGeminiClient(clientKey);
    const stream = await activeAi.models.generateContentStream({
      model: 'lyria-3-clip-preview',
      contents: fullMusicPrompt,
    });

    let audioBase64 = '';
    let mimeType = 'audio/mpeg';

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      throw new Error('Lyria returned empty audio stream.');
    }

    musicCache.set(cacheKey, { audioBase64, mimeType });

    res.json({
      success: true,
      audioBase64,
      mimeType,
    });
  } catch (err: any) {
    res.json({
      success: false,
      fallback: true,
      error: err?.message || 'Lyria music generation fallback',
    });
  }
});

// Broadcast Quality WAV to MP3 Conversion Endpoint via FFmpeg
app.post('/api/convert-wav-to-mp3', async (req, res) => {
  try {
    let wavBuffer: Buffer | null = null;
    const bitrateHeader = req.headers['x-bitrate'] || '256k';
    const bitrateStr = typeof bitrateHeader === 'string' && bitrateHeader.endsWith('k')
      ? bitrateHeader
      : `${bitrateHeader}k`;

    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      wavBuffer = req.body;
    } else if (req.body && typeof req.body.wavBase64 === 'string') {
      wavBuffer = Buffer.from(req.body.wavBase64, 'base64');
    }

    if (!wavBuffer || wavBuffer.length === 0) {
      return res.status(400).json({ error: 'No WAV audio data provided for conversion' });
    }

    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-codec:a', 'libmp3lame',
      '-b:a', bitrateStr,
      '-f', 'mp3',
      'pipe:1',
    ]);

    const mp3Chunks: Buffer[] = [];
    let errOutput = '';

    ffmpeg.stdout.on('data', (chunk: Buffer) => {
      mp3Chunks.push(chunk);
    });

    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      errOutput += chunk.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0 && mp3Chunks.length > 0) {
        const mp3Buffer = Buffer.concat(mp3Chunks);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', mp3Buffer.length.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="commercial.mp3"');
        return res.status(200).send(mp3Buffer);
      } else {
        console.error('FFmpeg MP3 transcoding failed with exit code:', code, errOutput);
        return res.status(500).json({ error: 'FFmpeg transcoding failed', details: errOutput });
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('FFmpeg execution error:', err);
      return res.status(500).json({ error: 'Failed to start FFmpeg', details: err.message });
    });

    ffmpeg.stdin.write(wavBuffer);
    ffmpeg.stdin.end();
  } catch (err: any) {
    console.error('Error during WAV to MP3 conversion:', err);
    res.status(500).json({ error: err?.message || 'Server error during MP3 conversion' });
  }
});

app.use('/sfx', express.static(path.resolve(__dirname, 'public', 'sfx'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

// Serve frontend with Vite in dev, or dist in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`AudioSpot Studio Server running on http://localhost:${PORT}`);
});
