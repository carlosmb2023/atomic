import { useEffect, useState } from "react";

interface AiBackgroundImageProps {
  opacity?: number;
  animationSpeed?: number;
  pulseIntensity?: number;
}

export default function AiBackgroundImage({
  opacity = 0.8,
  animationSpeed = 20,
  pulseIntensity = 0.05
}: AiBackgroundImageProps) {
  const [animationOffset, setAnimationOffset] = useState(0);
  
  useEffect(() => {
    // Create a subtle animation effect
    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 0.1) % 100);
    }, animationSpeed);
    
    return () => clearInterval(interval);
  }, [animationSpeed]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-10] overflow-hidden pointer-events-none">
      {/* Main background image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/ai_background.png)',
          opacity: opacity,
          filter: `brightness(${1 + Math.sin(animationOffset * 0.1) * pulseIntensity})`,
          transform: `scale(${1 + Math.sin(animationOffset * 0.05) * 0.02})`,
          transition: 'filter 2s ease-in-out, transform 2s ease-in-out'
        }}
      />
      
      {/* Overlay effect with animation */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0))',
          opacity: 0.3 + Math.sin(animationOffset * 0.1) * 0.1,
          transform: `translateX(${Math.sin(animationOffset * 0.05) * 2}%)`,
          transition: 'opacity 1s ease-in-out, transform 1s ease-in-out'
        }}
      />
      
      {/* Particle overlay for enhanced AI theme */}
      <div className="absolute top-0 left-0 w-full h-full">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = 1 + Math.random() * 3;
          const posX = Math.random() * 100;
          const posY = Math.random() * 100;
          const delay = Math.random() * 5;
          const duration = 15 + Math.random() * 20;
          const opacity = 0.1 + Math.random() * 0.4;
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${posX}%`,
                top: `${posY}%`,
                backgroundColor: '#05ccff',
                boxShadow: `0 0 ${size * 2}px #05ccff`,
                opacity: opacity,
                animation: `floatParticle ${duration}s infinite ease-in-out`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
      
      {/* Network lines effect */}
      <svg 
        className="absolute top-0 left-0 w-full h-full opacity-20"
        style={{
          transform: `translateY(${Math.sin(animationOffset * 0.02) * 1}%) scale(${1 + Math.sin(animationOffset * 0.05) * 0.01})`,
          transition: 'transform 3s ease-in-out'
        }}
      >
        {Array.from({ length: 15 }).map((_, i) => {
          const start = {
            x: Math.random() * 100,
            y: Math.random() * 100
          };
          
          const end = {
            x: Math.random() * 100,
            y: Math.random() * 100
          };
          
          return (
            <line
              key={i}
              x1={`${start.x}%`}
              y1={`${start.y}%`}
              x2={`${end.x}%`}
              y2={`${end.y}%`}
              stroke="#05ccff"
              strokeWidth="0.5"
              strokeDasharray="5,5"
              style={{
                animation: `pulseLine ${3 + Math.random() * 4}s infinite alternate`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}