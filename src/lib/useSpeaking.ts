import { useEffect, useState } from 'react';

const SPEAKING_THRESHOLD = 16;
const SPEAKING_HOLD_MS = 220;

export function useSpeaking(stream: MediaStream | null, enabled = true): boolean {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!enabled || !stream || stream.getAudioTracks().length === 0) {
      setSpeaking(false);
      return;
    }

    const audio = new AudioContext();
    let source: MediaStreamAudioSourceNode;
    try {
      source = audio.createMediaStreamSource(stream);
    } catch {
      void audio.close();
      setSpeaking(false);
      return;
    }

    const analyser = audio.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.45;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    let lastSpoke = 0;
    let active = false;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      const avg = sum / data.length;
      const now = performance.now();
      const next = avg >= SPEAKING_THRESHOLD ? ((lastSpoke = now), true) : now - lastSpoke < SPEAKING_HOLD_MS;
      if (next !== active) {
        active = next;
        setSpeaking(next);
      }
      frame = requestAnimationFrame(tick);
    };

    void audio.resume();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void audio.close();
      setSpeaking(false);
    };
  }, [stream, enabled]);

  return speaking;
}
