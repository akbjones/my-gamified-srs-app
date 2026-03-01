let currentAudio: HTMLAudioElement | null = null;

export const stopAudio = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const playCardAudio = async (audioFile: string, targetText: string): Promise<void> => {
  stopAudio();

  // Try MP3 first
  if (audioFile) {
    try {
      const audio = new Audio(`/quest-audio/${audioFile}`);
      currentAudio = audio;
      await audio.play();
      return;
    } catch {
      // Fall through to SpeechSynthesis
    }
  }

  // SpeechSynthesis fallback
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};
