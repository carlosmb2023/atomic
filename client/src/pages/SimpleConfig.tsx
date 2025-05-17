import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function SimpleConfig() {
  const [loading, setLoading] = useState(false);

  const setLocalServer = async () => {
    setLoading(true);
    try {
      await axios.patch('/api/system/config', {
        execution_mode: 'local'
      });
      toast.success('Configurado para usar o Servidor Local (porta 8000)');
    } catch (error) {
      console.error('Erro ao configurar servidor local:', error);
      toast.error('Erro ao configurar servidor');
    } finally {
      setLoading(false);
    }
  };

  const setCloudServer = async () => {
    setLoading(true);
    try {
      await axios.patch('/api/system/config', {
        execution_mode: 'cloud'
      });
      toast.success('Configurado para usar o Servidor Nuvem (Azure VM na porta 3000)');
    } catch (error) {
      console.error('Erro ao configurar servidor na nuvem:', error);
      toast.error('Erro ao configurar servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        marginBottom: '30px',
        fontSize: '24px'
      }}>
        Configurações do Sistema
      </h1>
      
      <p style={{ marginBottom: '20px' }}>
        Escolha entre o Servidor Local ou o Servidor na Nuvem:
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '15px'
      }}>
        <button
          onClick={setLocalServer}
          disabled={loading}
          style={{
            padding: '15px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Servidor Local (porta 8000)
        </button>
        
        <button
          onClick={setCloudServer}
          disabled={loading}
          style={{
            padding: '15px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Servidor Nuvem / Azure VM (porta 3000)
        </button>
      </div>
      
      {loading && (
        <p style={{ marginTop: '20px' }}>
          Processando...
        </p>
      )}
    </div>
  );
}