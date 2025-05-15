// Definição de tipos para hooks personalizados

declare module '@/hooks/use-title' {
  export const useTitle: (title: string) => void;
}

declare module '@/hooks/use-sound-effect' {
  interface SoundEffectOptions {
    clickVolume?: number;
    successVolume?: number;
    errorVolume?: number;
    hoverVolume?: number;
  }
  
  export const useSoundEffect: (options?: SoundEffectOptions) => {
    playClick: () => void;
    playSuccess: () => void;
    playError: () => void;
    playHover: () => void;
    playSound: (frequency: number, type?: OscillatorType, duration?: number, volume?: number) => void;
  };
}