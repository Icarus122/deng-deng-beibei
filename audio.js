const EVENT_TONES = Object.freeze({
  jump: [{ frequency: 420, endFrequency: 680, duration: 0.14, waveform: 'sine', volume: 0.12 }],
  land: [{ frequency: 145, endFrequency: 78, duration: 0.12, waveform: 'triangle', volume: 0.16 }],
  pickup: [{ frequency: 660, endFrequency: 990, duration: 0.16, waveform: 'sine', volume: 0.11 }],
  sprint: [{ frequency: 170, endFrequency: 280, duration: 0.2, waveform: 'sawtooth', volume: 0.075, speedSensitive: true }],
  hit: [{ frequency: 220, endFrequency: 92, duration: 0.16, waveform: 'square', volume: 0.11 }],
  caught: [
    { frequency: 523, duration: 0.12, waveform: 'triangle', volume: 0.1, delay: 0 },
    { frequency: 659, duration: 0.12, waveform: 'triangle', volume: 0.1, delay: 0.09 },
    { frequency: 784, duration: 0.18, waveform: 'triangle', volume: 0.1, delay: 0.18 },
  ],
  lost: [{ frequency: 410, endFrequency: 190, duration: 0.34, waveform: 'sine', volume: 0.1 }],
  checkpoint: [
    { frequency: 587, duration: 0.1, waveform: 'sine', volume: 0.09, delay: 0 },
    { frequency: 784, duration: 0.16, waveform: 'sine', volume: 0.09, delay: 0.08 },
  ],
});

export const AUDIO_EVENT_NAMES = Object.freeze(Object.keys(EVENT_TONES));

function getDefaultAudioContext() {
  return globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null;
}

export function createGameAudio({ AudioContextCtor = getDefaultAudioContext() } = {}) {
  let context = null;
  const activeVoices = new Set();

  if (typeof AudioContextCtor === 'function') {
    try {
      context = new AudioContextCtor();
    } catch {
      context = null;
    }
  }

  async function resume() {
    if (!context || typeof context.resume !== 'function') return false;

    try {
      await context.resume();
      return context.state === undefined || context.state === 'running';
    } catch {
      return false;
    }
  }

  async function suspend() {
    if (!context || typeof context.suspend !== 'function') return false;
    for (const { oscillator } of activeVoices) {
      try {
        oscillator.stop();
      } catch {
        // A voice that already stopped needs no further cleanup.
      }
    }

    try {
      await context.suspend();
      return context.state === undefined || context.state === 'suspended';
    } catch {
      return false;
    }
  }

  function play(eventName, { speed = 150 } = {}) {
    const tones = EVENT_TONES[eventName];
    if (!context || !tones) return false;

    const now = Number.isFinite(context.currentTime) ? context.currentTime : 0;
    const sprintPitch = Math.max(0.92, Math.min(1.12, 1 + (speed - 150) / 750));

    try {
      for (const tone of tones) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const startAt = now + (tone.delay ?? 0);
        const endAt = startAt + tone.duration;
        const pitch = tone.speedSensitive ? sprintPitch : 1;

        oscillator.type = tone.waveform;
        oscillator.frequency.setValueAtTime(tone.frequency * pitch, startAt);
        if (tone.endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency * pitch, endAt);
        }

        envelope.gain.setValueAtTime(0.0001, startAt);
        envelope.gain.exponentialRampToValueAtTime(tone.volume, startAt + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
        oscillator.connect(envelope);
        envelope.connect(context.destination);

        const voice = { oscillator, envelope };
        activeVoices.add(voice);
        oscillator.onended = () => {
          activeVoices.delete(voice);
          oscillator.disconnect();
          envelope.disconnect();
        };
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.02);
      }
      return true;
    } catch {
      return false;
    }
  }

  function dispose() {
    for (const { oscillator } of activeVoices) {
      try {
        oscillator.stop();
      } catch {
        // A voice that already stopped needs no further cleanup.
      }
    }
    activeVoices.clear();

    if (context && typeof context.close === 'function') {
      try {
        const closing = context.close();
        closing?.catch?.(() => {});
      } catch {
        // Closing audio is best-effort during page teardown.
      }
    }
    context = null;
  }

  return {
    get supported() {
      return context !== null;
    },
    resume,
    suspend,
    play,
    dispose,
  };
}
