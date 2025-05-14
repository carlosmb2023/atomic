import { useState, useEffect } from 'react';
import { useSoundEffect } from '@/hooks/use-sound-effect';

interface SoundToggleProps {
  className?: string;
}

export default function SoundToggle({ className = '' }: SoundToggleProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const { toggleSound, playClick } = useSoundEffect();

  // Initialize on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('soundEnabled');
    setIsSoundEnabled(savedPreference !== 'false');
  }, []);

  const handleToggle = () => {
    if (isSoundEnabled) {
      playClick(); // Play sound before disabling
    }
    
    const newState = toggleSound();
    setIsSoundEnabled(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors ${
        isSoundEnabled ? 'bg-primary/20' : 'bg-muted/30'
      } hover:bg-primary/30 ${className}`}
      aria-label={isSoundEnabled ? 'Desativar sons' : 'Ativar sons'}
      title={isSoundEnabled ? 'Desativar sons' : 'Ativar sons'}
    >
      {isSoundEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
      
      {/* Animated wave indicators */}
      {isSoundEnabled && (
        <span className="absolute inset-0 pointer-events-none">
          <span className="absolute inset-0 rounded-full animate-ping-slow opacity-20 bg-primary"></span>
        </span>
      )}
    </button>
  );
}