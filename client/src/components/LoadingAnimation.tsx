import { useState, useEffect } from 'react';

interface LoadingAnimationProps {
  duration?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingAnimation({
  duration = 2000,
  color = 'var(--cyber-green)',
  size = 'medium',
  text = 'Carregando...',
  fullScreen = false
}: LoadingAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after duration if a positive number is provided
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!visible) return null;

  // Size mappings
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-3',
    large: 'w-24 h-24 border-4'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div 
          className={`${sizeClasses[size]} rounded-full animate-spin`}
          style={{ 
            borderColor: `${color} transparent transparent transparent`,
          }}
        />
        {text && (
          <p className="text-center font-jetbrains text-sm animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}