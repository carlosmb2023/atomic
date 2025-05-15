import { useCallback } from "react";

interface SoundEffectOptions {
  clickVolume?: number;
  successVolume?: number;
  errorVolume?: number;
  hoverVolume?: number;
}

/**
 * Hook para reproduzir efeitos sonoros na interface
 */
export const useSoundEffect = (options: SoundEffectOptions = {}) => {
  const {
    clickVolume = 0.2,
    successVolume = 0.3,
    errorVolume = 0.3,
    hoverVolume = 0.1,
  } = options;

  /**
   * Cria e reproduz um som com as configurações especificadas
   */
  const playSound = useCallback(
    (
      frequency: number,
      type: OscillatorType = "sine",
      duration: number = 50,
      volume: number = 0.2
    ) => {
      try {
        // Verificar se o contexto de áudio está disponível
        if (typeof window === "undefined" || !window.AudioContext) {
          return; // Sair silenciosamente em ambientes sem suporte
        }

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();

        // Diminuir gradualmente o volume
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration / 1000
        );

        // Parar o oscilador após a duração especificada
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, duration);
      } catch (error) {
        console.error("Erro ao reproduzir som:", error);
      }
    },
    []
  );

  // Som para cliques em botões
  const playClick = useCallback(() => {
    playSound(800, "sine", 40, clickVolume);
  }, [playSound, clickVolume]);

  // Som para eventos de sucesso
  const playSuccess = useCallback(() => {
    playSound(1200, "sine", 80, successVolume);
    setTimeout(() => playSound(1800, "sine", 100, successVolume), 80);
  }, [playSound, successVolume]);

  // Som para eventos de erro
  const playError = useCallback(() => {
    playSound(300, "square", 80, errorVolume);
    setTimeout(() => playSound(250, "square", 200, errorVolume), 100);
  }, [playSound, errorVolume]);

  // Som para hover de elementos
  const playHover = useCallback(() => {
    playSound(600, "sine", 30, hoverVolume);
  }, [playSound, hoverVolume]);

  return {
    playClick,
    playSuccess,
    playError,
    playHover,
    playSound,
  };
};