import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedContentProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  className?: string;
}

export default function AnimatedContent({
  children,
  delay = 0,
  duration = 0.5,
  animation = 'fadeIn',
  className = ''
}: AnimatedContentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, []);

  // Animation variants
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 }
    },
    slideDown: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    },
    bounce: {
      initial: { opacity: 0, y: 50 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 15
        }
      }
    }
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      className={className}
      initial={selectedAnimation.initial}
      animate={isVisible ? selectedAnimation.animate : selectedAnimation.initial}
      transition={{
        duration,
        delay,
        ...((selectedAnimation.animate as any).transition || {})
      }}
    >
      {children}
    </motion.div>
  );
}