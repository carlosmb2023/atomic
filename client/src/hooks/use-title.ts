import { useEffect } from 'react';

/**
 * Hook para atualizar o título da página
 * @param title Título a ser definido para a página
 */
export const useTitle = (title: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    // Restaurar o título original quando o componente for desmontado
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};