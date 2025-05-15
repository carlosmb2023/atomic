import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, XOctagon, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ErrorType = 'network' | 'validation' | 'auth' | 'server' | 'unknown';

interface ErrorStateAnimationProps {
  type: ErrorType;
  message: string;
  onRetry?: () => void;
  details?: string;
  dismissable?: boolean;
  onDismiss?: () => void;
}

const errorIcons = {
  network: WifiOff,
  validation: AlertCircle,
  auth: XOctagon,
  server: AlertTriangle,
  unknown: AlertCircle
};

const errorColors = {
  network: 'text-amber-500',
  validation: 'text-purple-500',
  auth: 'text-rose-500',
  server: 'text-red-500',
  unknown: 'text-orange-500'
};

export default function ErrorStateAnimation({
  type,
  message,
  onRetry,
  details,
  dismissable = true,
  onDismiss
}: ErrorStateAnimationProps) {
  const [visible, setVisible] = useState(true);
  const [shake, setShake] = useState(false);
  
  const Icon = errorIcons[type];
  const colorClass = errorColors[type];
  
  // Criar efeito de tremor/shake
  useEffect(() => {
    setShake(true);
    const timer = setTimeout(() => setShake(false), 820);
    return () => clearTimeout(timer);
  }, [type, message]);
  
  // Reproduzir efeito sonoro para o erro (apenas uma vez)
  useEffect(() => {
    const audio = new Audio('/audio/error-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.error('Erro ao reproduzir som:', e));
  }, []);
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300);
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            x: shake ? [-5, 5, -5, 5, -3, 3, -2, 2, 0] : 0
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.3,
            x: { duration: 0.8 }
          }}
          className="flex flex-col p-4 rounded-lg bg-background/90 backdrop-blur-md border border-destructive/30 shadow-lg max-w-md w-full"
        >
          <div className="flex items-start">
            <div className={`mr-3 p-2 rounded-full bg-destructive/10 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                {message}
              </h3>
              
              {details && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  {details}
                </motion.p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-3">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            )}
            
            {dismissable && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
              >
                Fechar
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}