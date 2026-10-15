/**
 * Professional WAV Audio Encoder
 * Encodes AudioBuffer into standard RIFF WAV with configurable sample rate, bit depth, and channel count.
 */

export interface WavExportOptions {
  sampleRate: number; // e.g. 24000, 44100, 48000, 96000
  bitDepth: 16 | 24 | 32; // 16-bit integer, 24-bit integer, 32-bit float
  channels: 1 | 2; // Mono or Stereo
}

export function encodeWav(audioBuffer: AudioBuffer, options: WavExportOptions): Blob {
  const { bitDepth, channels } = options;
  const numChannels = channels;
  const sampleRate = options.sampleRate || audioBuffer.sampleRate;
  
  // Resample if needed or take direct channel data
  const length = Math.floor(audioBuffer.duration * sampleRate);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // FMT chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  // AudioFormat: 1 for PCM, 3 for IEEE Float
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // DATA chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio samples with channel interleaving
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    // If input has fewer channels, duplicate or downmix
    if (c < audioBuffer.numberOfChannels) {
      channelData.push(audioBuffer.getChannelData(c));
    } else {
      channelData.push(audioBuffer.getChannelData(0));
    }
  }

  // If mono requested and buffer has stereo, average channels
  let getSample: (ch: number, sampleIdx: number) => number;
  if (numChannels === 1 && audioBuffer.numberOfChannels > 1) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    getSample = (_ch, idx) => {
      const srcIdx = Math.floor(idx * (audioBuffer.sampleRate / sampleRate));
      return (left[srcIdx] + right[srcIdx]) * 0.5;
    };
  } else {
    getSample = (ch, idx) => {
      const srcIdx = Math.floor(idx * (audioBuffer.sampleRate / sampleRate));
      const data = channelData[ch];
      return srcIdx < data.length ? data[srcIdx] : 0;
    };
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = getSample(c, i);
      // Hard clamp to prevent digital clipping
      s = Math.max(-1, Math.min(1, s));

      if (bitDepth === 16) {
        // 16-bit signed integer (-32768 to 32767)
        const intSample = s < 0 ? s * 32768 : s * 32767;
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else if (bitDepth === 24) {
        // 24-bit signed integer (-8388608 to 8388607)
        const intSample = Math.floor(s < 0 ? s * 8388608 : s * 8388607);
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        // 32-bit IEEE float
        view.setFloat32(offset, s, true);
        offset += 4;
      }
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
