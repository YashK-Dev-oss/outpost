/** Read text only after a user action, when the browser supports speech. */
export function readAloud(text, enabled = true) {
  if (!enabled || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speechAvailable() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
