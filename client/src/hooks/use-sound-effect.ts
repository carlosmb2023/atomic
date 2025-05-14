import { useState, useCallback, useEffect } from 'react';

interface SoundEffectOptions {
  enabled?: boolean;
}

export function useSoundEffect(options: SoundEffectOptions = {}) {
  const [enabled, setEnabled] = useState<boolean>(options.enabled ?? true);
  const [clickSound, setClickSound] = useState<HTMLAudioElement | null>(null);
  const [successSound, setSuccessSound] = useState<HTMLAudioElement | null>(null);
  const [errorSound, setErrorSound] = useState<HTMLAudioElement | null>(null);
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);
  const [hoverSound, setHoverSound] = useState<HTMLAudioElement | null>(null);

  // Inicializa os efeitos sonoros
  useEffect(() => {
    // Só inicializa no navegador (não durante SSR)
    if (typeof window !== 'undefined') {
      // Som de clique (suave)
      const click = new Audio('/sounds/click.mp3');
      click.volume = 0.3;
      setClickSound(click);

      // Som de hover (mais suave)
      const hover = new Audio('/sounds/hover.mp3');
      hover.volume = 0.15;
      setHoverSound(hover);
      
      // Som de sucesso 
      const success = new Audio('/sounds/success.mp3');
      success.volume = 0.4;
      setSuccessSound(success);

      // Som de erro
      const error = new Audio('/sounds/error.mp3');
      error.volume = 0.4;
      setErrorSound(error);

      // Som de notificação
      const notification = new Audio('/sounds/notification.mp3');
      notification.volume = 0.5;
      setNotificationSound(notification);
    }
  }, []);

  // Reproduz o som de clique
  const playClick = useCallback(() => {
    if (enabled && clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  }, [enabled, clickSound]);

  // Reproduz o som de sucesso
  const playSuccess = useCallback(() => {
    if (enabled && successSound) {
      successSound.currentTime = 0;
      successSound.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  }, [enabled, successSound]);

  // Reproduz o som de erro
  const playError = useCallback(() => {
    if (enabled && errorSound) {
      errorSound.currentTime = 0;
      errorSound.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  }, [enabled, errorSound]);

  // Reproduz o som de notificação
  const playNotification = useCallback(() => {
    if (enabled && notificationSound) {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  }, [enabled, notificationSound]);

  // Reproduz o som de hover
  const playHover = useCallback(() => {
    if (enabled && hoverSound) {
      hoverSound.currentTime = 0;
      hoverSound.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  }, [enabled, hoverSound]);

  return {
    enabled,
    setEnabled,
    playClick,
    playSuccess,
    playError,
    playNotification,
    playHover
  };
}