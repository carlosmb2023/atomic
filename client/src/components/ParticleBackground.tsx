import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Clear any existing particles
    container.innerHTML = "";
    
    // Create particles
    const particleCount = Math.min(30, Math.floor(window.innerWidth / 40));
    const colors = ['#1677ff', '#e600ff', '#00ffe7'];
    
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
      particle.style.animation = `float ${duration}s infinite ease-in-out`;
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
