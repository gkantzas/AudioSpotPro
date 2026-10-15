/**
 * MP3 Audio Encoder and Transcoder Service
 * Provides client-side (LAME) and server-side (FFmpeg) conversion from AudioBuffer or WAV to MP3.
 */
import { Mp3Encoder } from '@breezystack/lamejs';

export interface Mp3EncodeOptions {
  kbps?: number; // e.g. 128, 192, 256, 320 (default 256)
  channels?: 1 | 2;
  sampleRate?: number;
}

/**
 * Encodes an AudioBuffer directly to an MP3 Blob using client-side LAME encoder.
 * Fast, pure JavaScript, runs completely in the browser.
 */
export function encodeMp3FromAudioBuffer(
  audioBuffer: AudioBuffer,
  options: Mp3EncodeOptions = {}
): Blob {
  const kbps = options.kbps || 256;
  const numChannels = (options.channels || Math.min(2, audioBuffer.numberOfChannels)) as 1 | 2;

  // Standard MP3 MPEG audio sample rates
  const validRates = [48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000];
  let targetSampleRate = options.sampleRate || audioBuffer.sampleRate;
  if (!validRates.includes(targetSampleRate)) {
    targetSampleRate = targetSampleRate >= 48000 ? 48000 : 44100;
  }

  const length = Math.floor(audioBuffer.duration * targetSampleRate);
  const leftF = audioBuffer.getChannelData(0);
  const rightF = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftF;

  const leftInt = new Int16Array(length);
  const rightInt = numChannels === 2 ? new Int16Array(length) : null;
  const ratio = audioBuffer.sampleRate / targetSampleRate;

  for (let i = 0; i < length; i++) {
    const srcIdx = Math.floor(i * ratio);

    let l = srcIdx < leftF.length ? leftF[srcIdx] : 0;
    l = Math.max(-1, Math.min(1, l));
    leftInt[i] = l < 0 ? l * 32768 : l * 32767;

    if (rightInt) {
      let r = srcIdx < rightF.length ? rightF[srcIdx] : 0;
      r = Math.max(-1, Math.min(1, r));
      rightInt[i] = r < 0 ? r * 32768 : r * 32767;
    }
  }

  const encoder = new Mp3Encoder(numChannels, targetSampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < length; i += blockSize) {
    const leftChunk = leftInt.subarray(i, i + blockSize);
    let chunk: Uint8Array;
    if (numChannels === 2 && rightInt) {
      const rightChunk = rightInt.subarray(i, i + blockSize);
      chunk = encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      chunk = encoder.encodeBuffer(leftChunk);
    }
    if (chunk.length > 0) {
      mp3Data.push(chunk);
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    mp3Data.push(flushChunk);
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mpeg' });
}

/**
 * Converts a WAV Blob to an MP3 Blob.
 * Tries server-side FFmpeg transcode for maximum quality and speed;
 * falls back to client-side LAME encoder if server is unreachable.
 */
export async function convertWavBlobToMp3(
  wavBlob: Blob,
  audioBufferFallback?: AudioBuffer | null,
  kbps: number = 256
): Promise<Blob> {
  // Strategy 1: Server-side FFmpeg transcode (supports all bit depths: 16, 24, 32-bit float)
  try {
    const response = await fetch('/api/convert-wav-to-mp3', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
        'X-Bitrate': kbps.toString(),
      },
      body: wavBlob,
    });

    if (response.ok) {
      const mp3Blob = await response.blob();
      if (mp3Blob.size > 200) {
        return new Blob([mp3Blob], { type: 'audio/mpeg' });
      }
    }
  } catch (err) {
    console.warn('Server FFmpeg MP3 conversion failed, attempting client-side encoder:', err);
  }

  // Strategy 2: Client-side LAME encoding from audioBuffer
  if (audioBufferFallback) {
    try {
      return encodeMp3FromAudioBuffer(audioBufferFallback, { kbps });
    } catch (err) {
      console.error('Client-side LAME encoding from audioBuffer failed:', err);
    }
  }

  // Strategy 3: Decode WAV in browser AudioContext and encode
  const arrayBuffer = await wavBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return encodeMp3FromAudioBuffer(decodedBuffer, { kbps });
  } finally {
    try {
      await audioCtx.close();
    } catch {
      // ignore
    }
  }
}
