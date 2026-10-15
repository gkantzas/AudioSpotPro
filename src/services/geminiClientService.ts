import { GoogleGenAI, Type } from '@google/genai';

// 1. Browser-safe WAV Header Generator (Αντικαθιστά το ensureWavHeader του Node Buffer)
export function ensureWavHeader(rawBytes: Uint8Array, sampleRate = 24000): Uint8Array {
  // Αν έχει ήδη RIFF header
  if (
    rawBytes.length >= 44 &&
    rawBytes[0] === 0x52 && rawBytes[1] === 0x49 && rawBytes[2] === 0x46 && rawBytes[3] === 0x46
  ) {
    return rawBytes;
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBytes.length;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);          // Subchunk1Size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  const result = new Uint8Array(buffer);
  result.set(rawBytes, 44);
  return result;
}

// 2. Base64 to Uint8Array helper
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 3. Audio Director Prompts & Logic
const AUDIO_DIRECTOR_SYSTEM_PROMPT = `
Είσαι ένας κορυφαίος, πολυβραβευμένος κειμενογράφος και σκηνοθέτης ηχητικών & ραδιοφωνικών διαφημίσεων.
Η αποστολή σου είναι να δημιουργείς έτοιμα προς εκφώνηση διαφημιστικά σποτ.
ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. Το spokenText περιέχει ΑΠΟΚΛΕΙΣΤΙΚΑ τα λόγια του εκφωνητή. ΟΧΙ τίτλους, χρόνους ή ρόλους.
2. Αν υπάρχουν 2+ φωνές, να υπάρχει ζωντανός διάλογος χωρίς επαναλήψεις.
3. Σωστή επιλογή φύλου και φωνών.
`;

export async function clientGenerateScript(params: {
  apiKey: string;
  topic: string;
  targetDuration?: number;
  voiceCount?: number;
  style?: string;
  tone?: string;
  callToAction?: string;
  productionLanguage?: string;
}) {
  const {
    apiKey,
    topic,
    targetDuration = 30,
    voiceCount = 1,
    style = 'Ενθουσιώδες / Προσφορά',
    tone = 'Φιλικός & Πειστικός',
    callToAction = '',
    productionLanguage = 'el'
  } = params;

  const ai = new GoogleGenAI({ apiKey });
  const estimatedWords = Math.max(10, Math.round(Number(targetDuration) * 2.2));
  const numVoices = Math.max(1, Number(voiceCount) || 1);
  const isGreek = productionLanguage === 'el';

  const userPrompt = `
Δημιούργησε ένα ολοκληρωμένο ραδιοφωνικό διαφημιστικό σποτ έτοιμο για ηχογράφηση στα Ελληνικά.
ΘΕΜΑ: "${topic}"
ΠΑΡΑΜΕΤΡΟΙ:
- Διάρκεια: ${targetDuration} δευτερόλεπτα (~${estimatedWords} λέξεις).
- Αριθμός Φωνών: ${numVoices}.
- Στυλ: ${style}.
- Τόνος: ${tone}.
${callToAction ? `- Call-To-Action: ${callToAction}` : ''}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: AUDIO_DIRECTOR_SYSTEM_PROMPT,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          conceptSummary: { type: Type.STRING },
          recommendedMusicStyle: { type: Type.STRING },
          speakers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speakerId: { type: Type.STRING },
                roleName: { type: Type.STRING },
                gender: { type: Type.STRING },
                voicePersona: { type: Type.STRING },
                actingStyle: { type: Type.STRING }
              },
              required: ['speakerId', 'roleName', 'gender', 'voicePersona', 'actingStyle']
            }
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                speakerId: { type: Type.STRING },
                actingCue: { type: Type.STRING },
                spokenText: { type: Type.STRING },
                sfxType: { type: Type.STRING },
                sfxDescription: { type: Type.STRING }
              },
              required: ['type']
            }
          }
        },
        required: ['title', 'conceptSummary', 'recommendedMusicStyle', 'speakers', 'timeline']
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  
  // Format timeline text
  const scriptLinesText: string[] = [];
  let totalSpokenWords = 0;

  for (const item of (parsed.timeline || [])) {
    if (item.type === 'sfx' && item.sfxDescription) {
      scriptLinesText.push(`[SFX: ${item.sfxDescription}]`);
    } else if (item.type === 'dialogue' && item.spokenText) {
      const cue = item.actingCue ? `[${item.actingCue}] ` : '';
      scriptLinesText.push(`[${item.speakerId}]: ${cue}${item.spokenText}`);
      totalSpokenWords += item.spokenText.split(/\s+/).filter(Boolean).length;
    }
  }

  return {
    success: true,
    title: parsed.title || (isGreek ? 'Ραδιοφωνικό Σποτ' : 'Radio Spot'),
    conceptSummary: parsed.conceptSummary || '',
    recommendedMusicStyle: parsed.recommendedMusicStyle || 'upbeat_acoustic',
    script: scriptLinesText.join('\n'),
    wordCount: totalSpokenWords,
    estimatedDurationSec: Math.round(totalSpokenWords / 2.3),
    targetDurationSec: Number(targetDuration),
    structuredSpeakers: parsed.speakers || [],
    timeline: parsed.timeline || []
  };
}

// 4. Client-side Speech Synthesis via Gemini TTS
export async function clientSynthesizeSpeech(params: {
  apiKey: string;
  text: string;
  voiceName?: string;
  actingStyle?: string;
}) {
  const { apiKey, text, voiceName = 'Fenrir', actingStyle = 'Natural commercial voice' } = params;
  const ai = new GoogleGenAI({ apiKey });

  // Clean text from bracketed stage directions
  const cleaned = text.replace(/\[[^\]]*\]/g, '').replace(/<[^>]+>/g, '').trim();
  if (!cleaned) throw new Error('Δεν υπάρχει κείμενο προς εκφώνηση.');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: cleaned,
            // @ts-ignore
            speechMetadata: { style: actingStyle }
          }
        ]
      }
    ],
    config: {
      // @ts-ignore
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Δεν επιστράφηκαν ηχητικά δεδομένα.');
  }

  const rawBytes = base64ToUint8Array(base64Audio);
  const wavBytes = ensureWavHeader(rawBytes, 24000);

  return {
    success: true,
    audioBase64: uint8ArrayToBase64(wavBytes),
    mimeType: 'audio/wav',
    spokenText: cleaned
  };
}
