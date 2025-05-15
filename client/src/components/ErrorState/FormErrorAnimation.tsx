import React, { useEffect } from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Button } from '@/components/ui/button';

interface FormErrorAnimationProps {
  errors: Record<string, string> | null;
  onDismiss?: () => void;
}

export const FormErrorAnimation: React.FC<FormErrorAnimationProps> = ({
  errors,
  onDismiss,
}) => {
  const { playError } = useSoundEffect();
  
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      playError();
    }
  }, [errors, playError]);
  
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="mt-4 mb-2"
      >
        <div className="rounded-md bg-red-950/30 border border-red-500/50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <AlertOctagon className="h-5 w-5 text-red-400" />
              </motion.div>
            </div>
            
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-400">
                Corrija os seguintes erros:
              </h3>
              
              <div className="mt-2 text-sm text-red-300">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(errors).map(([field, message], index) => (
                    <motion.li 
                      key={field}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                    >
                      <span className="font-semibold">{field}:</span> {message}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
            
            {onDismiss && (
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="inline-flex text-red-300 hover:bg-red-900/50 p-1.5"
                  >
                    <span className="sr-only">Fechar</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};