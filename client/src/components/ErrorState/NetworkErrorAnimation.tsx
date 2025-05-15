import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorStateAnimation from './ErrorStateAnimation';

interface NetworkErrorAnimationProps {
  error: Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  statusCode?: number;
  timeout?: number; // Tempo em ms após o qual o erro desaparece automaticamente
}

export default function NetworkErrorAnimation({
  error,
  onRetry,
  onDismiss,
  statusCode,
  timeout
}: NetworkErrorAnimationProps) {
  const [visible, setVisible] = useState(!!error);
  
  // Atualizar visibilidade quando o erro mudar
  useEffect(() => {
    setVisible(!!error);
    
    // Se houver timeout definido, esconder automaticamente após o tempo
    if (error && timeout) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [error, timeout, onDismiss]);
  
  if (!error) return null;
  
  // Determinar tipo de erro baseado no código de status
  let errorType = 'network';
  let errorMessage = '';
  
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      errorType = 'auth';
      errorMessage = statusCode === 401 
        ? 'Não autorizado. Faça login novamente.'
        : 'Você não tem permissão para acessar este recurso.';
    } else if (statusCode >= 500) {
      errorType = 'server';
      errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
    } else if (statusCode === 404) {
      errorType = 'validation';
      errorMessage = 'Recurso não encontrado.';
    } else {
      errorMessage = `Erro de rede (${statusCode})`;
    }
  } else {
    // Se não tiver statusCode, mostrar a mensagem do erro
    errorMessage = typeof error === 'string' ? error : error.message || 'Erro de conexão';
  }
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50"
        >
          <ErrorStateAnimation
            type={errorType as any}
            message={errorMessage}
            onRetry={onRetry}
            onDismiss={() => {
              setVisible(false);
              if (onDismiss) onDismiss();
            }}
            dismissable={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}