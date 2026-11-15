let context;
let musicTimer;
const tones = { tap: [440, 0.06], alert: [220, 0.16], success: [660, 0.12] };
const musicNotes = [196, 247, 294, 247, 220, 262, 330, 262];

function getAudioContext() {
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

function ensureContext() {
  const AudioContextClass = getAudioContext();
  if (!AudioContextClass) return false;
  context ||= new AudioContextClass();
  if (context.state === "suspended") context.resume();
  return true;
}

/** Play a short, optional interface tone. */
export function tone(kind = "tap", enabled = false) {
  if (!enabled || !ensureContext()) return;
  const [frequency, duration] = tones[kind] || tones.tap;
  context ||= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.055, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playMusicNote(frequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.16, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.4);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 1.4);
}

/** Start a quiet ambient loop after a user gesture. */
export function startMusic(enabled = false) {
  if (!enabled || musicTimer || !ensureContext()) return;
  let noteIndex = 0;
  playMusicNote(musicNotes[noteIndex]);
  musicTimer = setInterval(() => {
    noteIndex = (noteIndex + 1) % musicNotes.length;
    playMusicNote(musicNotes[noteIndex]);
  }, 1600);
}

/** Stop the ambient loop without closing the shared audio context. */
export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = undefined;
  }
}
