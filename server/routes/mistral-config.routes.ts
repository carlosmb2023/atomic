import { Router } from 'express';
import { log } from '../vite';
import axios from 'axios';
import { storage } from '../storage';

const router = Router();

// Rota para testar conexão com diferentes servidores Mistral
router.post('/test-connection', async (req, res) => {
  try {
    const { mode } = req.body;
    
    if (!mode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Modo de conexão não especificado' 
      });
    }
    
    // Obter configuração atual do sistema
    const config = await storage.getSystemConfig();
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuração não encontrada' 
      });
    }
    
    // Testar com base no modo selecionado
    if (mode === 'api') {
      // Testar API Mistral
      if (!config.mistral_api_key) {
        return res.json({ 
          success: false, 
          message: 'API Key do Mistral não configurada' 
        });
      }
      
      try {
        // Testar API com uma chamada simples
        const response = await axios.get('https://api.mistral.ai/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.mistral_api_key}`
          }
        });
        
        if (response.status === 200) {
          return res.json({ 
            success: true, 
            message: 'Conexão com API Mistral estabelecida com sucesso', 
            models: response.data?.data?.length || 0 
          });
        } else {
          return res.json({ 
            success: false, 
            message: `Resposta inesperada da API: ${response.status}` 
          });
        }
      } catch (error: any) {
        return res.json({ 
          success: false, 
          message: `Erro ao conectar com API Mistral: ${error.message || 'Erro desconhecido'}` 
        });
      }
    } 
    else if (mode === 'local') {
      // Testar servidor local
      if (!config.mistral_local_url) {
        return res.json({ 
          success: false, 
          message: 'URL do servidor local não configurada' 
        });
      }
      
      try {
        // Tentar fazer uma chamada para o endpoint /health ou /models do servidor local
        const url = `${config.mistral_local_url}/health`;
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.status === 200) {
          return res.json({ 
            success: true, 
            message: 'Conexão com servidor local estabelecida com sucesso' 
          });
        } else {
          return res.json({ 
            success: false, 
            message: `Resposta inesperada do servidor local: ${response.status}` 
          });
        }
      } catch (error: any) {
        // Se /health falhar, tentar /models como alternativa
        try {
          const url = `${config.mistral_local_url}/models`;
          const response = await axios.get(url, { timeout: 5000 });
          
          if (response.status === 200) {
            return res.json({ 
              success: true, 
              message: 'Conexão com servidor local estabelecida com sucesso' 
            });
          }
        } catch (modelError) {
          // Ignorar erro do segundo teste
        }
        
        return res.json({ 
          success: false, 
          message: `Erro ao conectar com servidor local: ${error.message || 'Erro desconhecido'}` 
        });
      }
    }
    else if (mode === 'azure') {
      // Testar VM Azure
      if (!config.azure_vm_url) {
        return res.json({ 
          success: false, 
          message: 'URL da VM Azure não configurada' 
        });
      }
      
      try {
        // Configurar headers com base na presença de API key
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (config.azure_vm_api_key) {
          headers['Authorization'] = `Bearer ${config.azure_vm_api_key}`;
        }
        
        // Tentar fazer uma chamada para a VM
        const url = `${config.azure_vm_url}/models`;
        const response = await axios.get(url, { 
          headers,
          timeout: 8000 // Timeout maior para conexões remotas
        });
        
        if (response.status === 200) {
          return res.json({ 
            success: true, 
            message: 'Conexão com VM Azure estabelecida com sucesso',
            models: response.data?.data?.length || 0
          });
        } else {
          return res.json({ 
            success: false, 
            message: `Resposta inesperada da VM Azure: ${response.status}` 
          });
        }
      } catch (error: any) {
        return res.json({ 
          success: false, 
          message: `Erro ao conectar com VM Azure: ${error.message || 'Erro desconhecido'}` 
        });
      }
    }
    else {
      return res.json({ 
        success: false, 
        message: `Modo desconhecido: ${mode}` 
      });
    }
  } catch (error: any) {
    log(`Erro ao testar conexão Mistral: ${error}`);
    return res.status(500).json({ 
      success: false, 
      message: `Erro interno: ${error.message || 'Erro desconhecido'}` 
    });
  }
});

export default router;