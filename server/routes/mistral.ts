import express, { Request, Response } from 'express';
import { db } from '../db';
import axios from 'axios';
import { mistralService } from '../services/mistral.service';

const router = express.Router();

/**
 * Rota para testar conexão com diferentes servidores Mistral
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    
    if (!mode) {
      return res.json({
        success: false,
        message: 'Modo de conexão não especificado'
      });
    }
    
    // Buscar configuração atual
    const configResult = await db.query('SELECT * FROM system_config ORDER BY id DESC LIMIT 1');
    const config = configResult.rows[0] || {};
    
    let url = '';
    let apiKey = '';
    
    // Determinar URL e API Key baseado no modo
    switch (mode) {
      case 'api':
        url = config.mistral_cloud_url || 'https://api.mistral.ai/v1';
        apiKey = config.mistral_api_key || '';
        break;
      case 'local':
        url = config.mistral_local_url || 'http://127.0.0.1:8000';
        apiKey = ''; // Geralmente não necessário para servidor local
        break;
      case 'azure':
        if (!config.azure_vm_enabled) {
          return res.json({
            success: false,
            message: 'Azure VM não está habilitada nas configurações'
          });
        }
        url = config.azure_vm_url || '';
        apiKey = config.azure_vm_api_key || '';
        break;
      default:
        return res.json({
          success: false,
          message: 'Modo de conexão inválido'
        });
    }
    
    if (!url) {
      return res.json({
        success: false,
        message: 'URL não configurada para este modo'
      });
    }
    
    // Para o modo API, verificar se tem API Key
    if (mode === 'api' && !apiKey) {
      return res.json({
        success: false,
        message: 'API Key do Mistral não configurada'
      });
    }
    
    // Realizar teste de conexão
    let testResponse;
    
    try {
      // Construir headers baseado no modo
      const headers: Record<string, string> = {};
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      headers['Content-Type'] = 'application/json';
      
      // Endpoint a ser testado baseado no modo
      let testEndpoint = '';
      
      switch (mode) {
        case 'api':
          testEndpoint = `${url}/models`;
          break;
        case 'local':
        case 'azure':
          testEndpoint = `${url}/health`;
          break;
      }
      
      // Enviar requisição de teste
      const response = await axios.get(testEndpoint, { headers, timeout: 5000 });
      
      if (response.status >= 200 && response.status < 300) {
        testResponse = {
          success: true,
          message: `Conexão com ${mode === 'api' ? 'API Mistral' : mode === 'local' ? 'servidor local' : 'VM Azure'} estabelecida com sucesso`,
          details: mode === 'api' ? 'Modelos disponíveis recuperados' : 'Servidor respondeu com status OK'
        };
      } else {
        testResponse = {
          success: false,
          message: `Erro ao conectar: Código ${response.status}`,
          details: response.statusText
        };
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        testResponse = {
          success: false,
          message: 'Não foi possível conectar ao servidor',
          details: 'Verifique se o servidor está em execução e acessível'
        };
      } else if (error.code === 'ETIMEDOUT') {
        testResponse = {
          success: false,
          message: 'Tempo limite de conexão excedido',
          details: 'O servidor demorou muito para responder'
        };
      } else {
        testResponse = {
          success: false,
          message: `Erro ao testar conexão: ${error.message}`,
          details: error.response?.data || 'Sem detalhes adicionais'
        };
      }
    }
    
    return res.json(testResponse);
  } catch (error: any) {
    console.error('Erro ao testar conexão Mistral:', error);
    return res.status(500).json({
      success: false,
      message: `Erro interno ao testar conexão: ${error.message}`
    });
  }
});

export default router;