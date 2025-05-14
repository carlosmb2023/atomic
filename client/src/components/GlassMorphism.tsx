import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassMorphismProps {
  children: ReactNode;
  className?: string;
  glowAccent?: boolean;
  borderGradient?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  neonEffect?: boolean;
  elevation?: 'flat' | 'raised' | 'floating';
}

export default function GlassMorphism({
  children,
  className = '',
  glowAccent = false,
  borderGradient = false,
  intensity = 'medium',
  neonEffect = false,
  elevation = 'flat'
}: GlassMorphismProps) {
  // Base style for all glass panels
  const baseStyle = 'backdrop-filter backdrop-blur-lg relative rounded-lg overflow-hidden';
  
  // Background opacity based on intensity
  const bgOpacity = {
    light: 'bg-black/20',
    medium: 'bg-black/40',
    heavy: 'bg-black/60',
  };
  
  // Border styles
  const borderStyle = borderGradient 
    ? 'border border-transparent bg-gradient-to-br from-white/5 via-white/10 to-white/5 bg-clip-border'
    : 'border border-white/10';
  
  // Elevation styles
  const elevationStyle = {
    flat: '',
    raised: 'shadow-lg',
    floating: 'shadow-xl transform hover:translate-y-[-2px] transition-transform duration-300',
  };
  
  // Neon effect
  const neonStyle = neonEffect
    ? 'after:absolute after:inset-0 after:rounded-lg after:shadow-[0_0_15px_rgba(22,119,255,0.3)] after:-z-10'
    : '';
  
  // Glow accent
  const glowAccentStyle = glowAccent
    ? 'before:absolute before:w-1/2 before:h-1/2 before:-top-1/2 before:-left-1/2 before:bg-primary/20 before:rounded-full before:blur-3xl before:-z-10'
    : '';

  return (
    <div
      className={cn(
        baseStyle,
        bgOpacity[intensity],
        borderStyle,
        elevationStyle[elevation],
        neonStyle,
        glowAccentStyle,
        className
      )}
    >
      {children}
    </div>
  );
}