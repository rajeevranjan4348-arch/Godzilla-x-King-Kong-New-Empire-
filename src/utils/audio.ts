let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playTone = (frequency: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playClick = () => playTone(800, 'sine', 0.05, 0.02);
export const playTabSwitch = () => playTone(600, 'triangle', 0.08, 0.02);
export const playNotification = () => {
  playTone(523.25, 'sine', 0.15, 0.03); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.25, 0.03), 100); // E5
};
export const playSystemOn = () => {
  playTone(440, 'square', 0.1, 0.02);
  setTimeout(() => playTone(660, 'square', 0.15, 0.02), 100);
  setTimeout(() => playTone(880, 'square', 0.2, 0.02), 200);
};
export const playSystemOff = () => {
  playTone(880, 'square', 0.1, 0.02);
  setTimeout(() => playTone(660, 'square', 0.15, 0.02), 100);
  setTimeout(() => playTone(440, 'square', 0.2, 0.02), 200);
};
export const playAction = () => playTone(400, 'sine', 0.1, 0.02);
