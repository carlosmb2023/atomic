import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  delayMs?: number; // Delay antes de mostrar o loading para evitar flashes
  timeout?: number; // Tempo após o qual mostrar mensagem de erro
  errorMessage?: string;
  spinnerSize?: number;
  showLoader?: boolean;
}

export default function LoadingFallback({
  message = 'Carregando...',
  delayMs = 300,
  timeout = 30000, // 30s de timeout padrão
  errorMessage = 'A operação está demorando mais do que o esperado.',
  spinnerSize = 20,
  showLoader = true
}: LoadingFallbackProps) {
  const [show, setShow] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    // Mostrar componente apenas depois do delay para evitar flashes
    const delayTimer = setTimeout(() => setShow(true), delayMs);
    
    // Mostrar mensagem de timeout após o tempo definido
    const timeoutTimer = setTimeout(() => setShowTimeout(true), timeout);
    
    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [delayMs, timeout]);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center w-full py-3"
        >
          {showLoader && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center mb-2"
            >
              <Loader2 size={spinnerSize} className="text-primary" />
            </motion.div>
          )}
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">{message}</p>
            
            <AnimatePresence>
              {showTimeout && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-amber-500 mt-2 max-w-md"
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}