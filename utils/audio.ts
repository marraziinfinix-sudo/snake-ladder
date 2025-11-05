// A single AudioContext for the entire application.
let audioCtx: AudioContext | null = null;
let isAudioInitialized = false;

// This function must be called after a user gesture.
export const initializeAudio = () => {
  if (isAudioInitialized || typeof window === 'undefined') return;
  
  try {
    // Use the || operator to support older browser implementations.
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context if it's in a suspended state (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isAudioInitialized = true;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser");
    isAudioInitialized = false;
  }
};

const getAudioContext = (): AudioContext | null => {
  if (!isAudioInitialized) {
    return null;
  }
  return audioCtx;
};


export const playDiceRollSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1200;
  bandpass.Q.value = 0.7;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.35);
};

export const playTokenMoveSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
};

export const playSnakeSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

export const playLadderSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const fundamental = 261.63; // C4
  const harmonics = [fundamental, fundamental * 2, fundamental * 3, fundamental * 4, fundamental * 5];
  
  harmonics.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = freq;
    
    gainNode.gain.setValueAtTime(0.05 / (i + 1), ctx.currentTime + i * 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime + i * 0.08);
    oscillator.stop(ctx.currentTime + i * 0.08 + 0.2);
  });
};

export const playVictorySound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    261.63, // C4
    329.63, // E4
    392.00, // G4
    523.25, // C5
  ];
  const startTime = ctx.currentTime;

  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;

    const noteStartTime = startTime + i * 0.15;
    gainNode.gain.setValueAtTime(0.2, noteStartTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(noteStartTime);
    oscillator.stop(noteStartTime + 0.4);
  });
};
