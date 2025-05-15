import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para reproduzir efeitos sonoros nas micro-interações
 * Os sons são carregados sob demanda e reutilizados
 */
export const useSoundEffect = () => {
  // Cache de áudio para os efeitos sonoros
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  // Estado global se o som está habilitado
  const isSoundEnabled = useRef<boolean>(true);
  
  // Inicializa as preferências de som do usuário
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('soundEnabled');
    if (savedSoundPreference !== null) {
      isSoundEnabled.current = savedSoundPreference === 'true';
    }
  }, []);
  
  /**
   * Reproduz um arquivo de áudio
   * @param soundPath Caminho para o arquivo de áudio
   * @param volume Volume do som (0.0 a 1.0)
   */
  const playSound = useCallback((soundPath: string, volume: number = 0.3) => {
    if (!isSoundEnabled.current) return;
    
    try {
      let audio = audioCache.current[soundPath];
      
      if (!audio) {
        audio = new Audio(soundPath);
        audioCache.current[soundPath] = audio;
      }
      
      // Reseta o áudio para poder reproduzir novamente
      audio.currentTime = 0;
      audio.volume = volume;
      
      // Promise.resolve necessário porque o play pode retornar uma Promise
      Promise.resolve(audio.play()).catch(err => {
        console.error(`Erro ao reproduzir som ${soundPath}:`, err);
      });
    } catch (error) {
      console.error('Erro ao manipular áudio:', error);
    }
  }, []);
  
  /**
   * Ativa ou desativa todos os sons
   */
  const toggleSound = useCallback(() => {
    isSoundEnabled.current = !isSoundEnabled.current;
    localStorage.setItem('soundEnabled', isSoundEnabled.current.toString());
    return isSoundEnabled.current;
  }, []);
  
  /**
   * Verifica se o som está habilitado
   */
  const isSoundEnabledFn = useCallback(() => {
    return isSoundEnabled.current;
  }, []);
  
  // Sons específicos para interações comuns
  const playHover = useCallback(() => {
    playSound('/audio/hover-sound.mp3', 0.1);
  }, [playSound]);
  
  const playClick = useCallback(() => {
    playSound('/audio/click-sound.mp3', 0.2);
  }, [playSound]);
  
  const playSuccess = useCallback(() => {
    playSound('/audio/success-sound.mp3', 0.3);
  }, [playSound]);
  
  const playError = useCallback(() => {
    playSound('/audio/error-sound.mp3', 0.3);
  }, [playSound]);
  
  const playNotification = useCallback(() => {
    playSound('/audio/notification-sound.mp3', 0.4);
  }, [playSound]);
  
  return {
    playSound,
    playHover,
    playClick,
    playSuccess,
    playError,
    playNotification,
    toggleSound,
    isSoundEnabled: isSoundEnabledFn
  };
};