import { useCallback, useMemo } from 'react';

// Define sound types
export type SoundType = 'hover' | 'click' | 'success' | 'error' | 'notification';

// Create a cache for sound instances to avoid recreating them
const soundCache: Record<string, HTMLAudioElement> = {};

/**
 * Hook for playing UI sound effects
 * @param volume Volume between 0 and 1
 * @returns Functions to play different sound effects
 */
export function useSoundEffect(volume = 0.2) {
  // Create base64 encoded sound data - small simple sounds to avoid needing external files
  const sounds = useMemo(() => ({
    hover: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABUgJAJAQQAB9CAAAZgAAAAA//tQwAADB3wCUAGPeuI8L/NQckAaFMBQCgKBoGB+D8H4Pw/+D/4P1AgGAwEHQEAgEHQfB8Hwf////////////IBAIBAIOgIBAIOg+D4Pg//+ggEAgEAgIBAIBAIG',
    click: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABUgJAJAQQAB9CAAAZgAAAAA//tQwAADBzQa4A1h64KAAA0wAAABo1FEFFTGAYD+iCUQDxGKx+n//RERERERAABAAB/a7n/7nd6IiIiIgCDwPnOc/L/kTPQeec5znOc49BznOc5P+c5wPOc5znOczj0HOc5znOc5znOc',
    success: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABUgJAJAQQAB9CAAAZgAAAAA//tQwAADB3AHcBWPXSJiCTQgckBUEOmAxnGaHv/gwh7/jOcZxnpUq3////xnGcZxnGcZxjOAYTjOM4zn//8ZxnGcZxnGcZxnGcJxnGcZxn//+M4zjOM4zjOM4zn/wcZxnGfxnOc5z',
    error: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABUgJAJAQQAB9CAAAZgAAAAA//tQwAADB3gLEAGMeuJDl+sQckBQHFt/bGu0AAJgeBUkxC8Wv/0/ZPuT2//a9v9r//v2rWvb9/v/++1+1a1/r/r/2va9v9r//9v//t//9/7f/+3///t9M6qQGUAACBIEgIEgATf/',
    notification: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAABUgJAJAQQAB9CAAAZgAAAAA//tQwAADB4gLMAGPeOIdl+qwckAaBnl+A6qrqBAKAUBQFAUDH8QBoDoJAAAAA9BT59R6IPQUffkQegp++o9EPuqPvyIPv/qPRD7qj78iD7/6j0Q+6o+/Ig+/+o9EP3VH35EH3/1H',
  }), []);

  // Function to get or create an audio element for a sound
  const getAudio = useCallback((soundType: SoundType): HTMLAudioElement => {
    if (!soundCache[soundType] && sounds[soundType]) {
      soundCache[soundType] = new Audio(sounds[soundType]);
    }
    return soundCache[soundType];
  }, [sounds]);

  // Play sound function
  const playSound = useCallback((soundType: SoundType) => {
    // Check if sound is enabled (could be linked to user preference)
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;
    
    const audio = getAudio(soundType);
    if (audio) {
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(err => {
        // Ignore autoplay restrictions errors - common in browsers
        console.debug('Sound playback blocked:', err);
      });
    }
  }, [getAudio, volume]);

  // Return functions for each sound type
  return {
    playHover: () => playSound('hover'),
    playClick: () => playSound('click'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playNotification: () => playSound('notification'),
    
    // Generic function to play any sound type
    play: playSound,
    
    // Toggle sound on/off
    toggleSound: () => {
      const current = localStorage.getItem('soundEnabled') !== 'false';
      localStorage.setItem('soundEnabled', (!current).toString());
      return !current;
    },
    
    // Check if sound is enabled
    isSoundEnabled: () => localStorage.getItem('soundEnabled') !== 'false'
  };
}