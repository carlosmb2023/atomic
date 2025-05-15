import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  spinnerSize?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Carregando...',
  fullScreen = false,
  overlay = false,
  spinnerSize = 30
}) => {
  const containerClass = `
    ${fullScreen ? 'fixed inset-0' : 'w-full'}
    ${overlay ? 'bg-black/50 backdrop-blur-sm' : ''}
    flex flex-col items-center justify-center
    ${fullScreen ? 'min-h-screen z-50' : 'min-h-[200px]'}
  `;

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center p-6 rounded-lg"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
          }}
          className="text-cyan-400"
        >
          <Loader2 size={spinnerSize} className="mb-4" />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-300 font-medium text-center"
        >
          {message}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            transition: { 
              duration: 1.8, 
              repeat: Infinity,
              ease: "easeInOut" 
            }
          }}
          className="mt-8 flex space-x-2"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500" style={{ animationDelay: "0.4s" }}></div>
        </motion.div>
      </motion.div>
    </div>
  );
};