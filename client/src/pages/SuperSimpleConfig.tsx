import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function SuperSimpleConfig() {
  const [mode, setMode] = useState('local');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.patch('/api/system/config', {
        execution_mode: mode
      });
      
      toast.success(`Configurado para usar o ${
        mode === 'local' ? 'Servidor Local (porta 8000)' : 'Servidor Nuvem (Azure VM na porta 3000)'
      }`);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-6 bg-background border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Configurações do Sistema</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="mode" className="block mb-2 text-sm font-medium">
              Selecione o Servidor
            </label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full p-2 border rounded bg-background text-foreground"
            >
              <option value="local">Servidor Local (porta 8000)</option>
              <option value="cloud">Servidor Nuvem / Azure VM (porta 3000)</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </form>
      </div>
    </div>
  );
}