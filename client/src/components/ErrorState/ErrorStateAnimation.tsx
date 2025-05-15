import React, { useEffect } from 'react';
import { AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Button } from '@/components/ui/button';

export type ErrorType = 'network' | 'server' | 'auth' | 'validation' | 'unknown';

interface ErrorStateAnimationProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  errorType?: ErrorType;
  title?: string;
  hideIcon?: boolean;
}

export const ErrorStateAnimation: React.FC<ErrorStateAnimationProps> = ({
  error,
  onRetry,
  onDismiss,
  errorType = 'unknown',
  title = 'Ocorreu um erro',
  hideIcon = false
}) => {
  const { playError } = useSoundEffect();
  
  useEffect(() => {
    if (error) {
      playError();
    }
  }, [error, playError]);
  
  if (!error) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-black/80 backdrop-blur-md border border-red-500/50 shadow-lg rounded-lg p-4 m-4">
          <div className="flex items-start space-x-4">
            {!hideIcon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="text-red-500 flex-shrink-0"
              >
                <AlertCircle size={24} />
              </motion.div>
            )}
            
            <div className="flex-1">
              <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-red-400 mb-1"
              >
                {title}
              </motion.h4>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-200 text-sm"
              >
                {error}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end mt-3 space-x-2"
              >
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="bg-transparent border-red-400 text-red-400 hover:bg-red-400/20"
                  >
                    <RefreshCw size={16} className="mr-1" /> Tentar novamente
                  </Button>
                )}
                
                {onDismiss && (
                  <Button
                    size="sm" 
                    variant="ghost"
                    onClick={onDismiss}
                    className="bg-transparent text-gray-400 hover:text-gray-200"
                  >
                    <XCircle size={16} className="mr-1" /> Fechar
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};