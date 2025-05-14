import { useCallback } from "react";
import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Clear any existing particles
    container.innerHTML = "";
    
    // Create particles
    const particleCount = Math.min(40, Math.floor(window.innerWidth / 40));
    const colors = ['#1677ff', '#e600ff', '#00ffe7', '#00e68a'];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      
      // Random properties
      const size = Math.random() * 5 + 2;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 10 + 15;
      const opacity = Math.random() * 0.5 + 0.1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Apply styles
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.backgroundColor = color;
      particle.style.borderRadius = '50%';
      particle.style.opacity = opacity.toString();
      particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
      particle.style.transition = 'all 3s ease-in-out';
      
      // Add animation
      const keyframes = `
        @keyframes float-${i} {
          0% { transform: translate(0, 0); }
          25% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); }
          50% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); }
          75% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); }
          100% { transform: translate(0, 0); }
        }
      `;
      
      const style = document.createElement('style');
      style.innerHTML = keyframes;
      document.head.appendChild(style);
      
      particle.style.animation = `float-${i} ${duration}s infinite ease-in-out`;
      particle.style.animationDelay = `${delay}s`;
      
      container.appendChild(particle);
    }
    
    // Clean up
    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-full z-[-10] overflow-hidden pointer-events-none"
    />
  );
}
