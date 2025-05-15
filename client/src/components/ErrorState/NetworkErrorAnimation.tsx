import React from 'react';
import { Wifi, WifiOff, ServerOff, ShieldAlert, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { ErrorStateAnimation, ErrorType } from './ErrorStateAnimation';

interface NetworkErrorAnimationProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  statusCode?: number;
  errorType?: ErrorType;
}

export const NetworkErrorAnimation: React.FC<NetworkErrorAnimationProps> = ({
  error,
  onRetry,
  onDismiss,
  statusCode,
  errorType = 'network'
}) => {
  if (!error) return null;

  // Determina o ícone, título e mensagem com base no tipo de erro
  let icon = <WifiOff />;
  let title = 'Erro de Conexão';
  
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      icon = <ShieldAlert />;
      title = 'Erro de Autenticação';
      errorType = 'auth';
    } else if (statusCode === 404) {
      icon = <Ban />;
      title = 'Recurso não encontrado';
      errorType = 'server';
    } else if (statusCode >= 500) {
      icon = <ServerOff />;
      title = 'Erro de Servidor';
      errorType = 'server';
    }
  } else if (errorType === 'network') {
    icon = <WifiOff />;
    title = 'Erro de Conexão';
  } else if (errorType === 'server') {
    icon = <ServerOff />;
    title = 'Erro de Servidor';
  } else if (errorType === 'auth') {
    icon = <ShieldAlert />;
    title = 'Erro de Autenticação';
  }
  
  return (
    <div className="relative z-50">
      <ErrorStateAnimation
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        errorType={errorType}
        title={title}
        hideIcon={true}
      />
      
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-16 h-16 flex items-center justify-center"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-red-500/20 blur-lg"
          />
          <motion.div
            className="relative text-red-500 p-2 bg-black/50 backdrop-blur-sm rounded-full border border-red-500/30 shadow-lg"
            animate={{ rotate: [0, -5, 0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
          >
            {icon}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};