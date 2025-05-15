import React from 'react';
import { motion } from 'framer-motion';
import ErrorStateAnimation from './ErrorStateAnimation';
import { ErrorType } from './ErrorStateAnimation';

interface FormErrorAnimationProps {
  errors: Record<string, string[]> | null;
  onDismiss?: () => void;
  errorType?: ErrorType;
}

export default function FormErrorAnimation({ 
  errors, 
  onDismiss,
  errorType = 'validation' 
}: FormErrorAnimationProps) {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }
  
  // Extrair todas as mensagens de erro
  const errorMessages = Object.entries(errors).flatMap(([field, messages]) => 
    messages.map(message => `${field}: ${message}`)
  );
  
  if (errorMessages.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <ErrorStateAnimation
        type={errorType}
        message="Erro de validação no formulário"
        details={errorMessages.join('\n')}
        dismissable={true}
        onDismiss={onDismiss}
      />
    </motion.div>
  );
}