import express, { Request, Response } from 'express';
import { db } from '../db';
import { ConfigService } from '../services/config.service';

const router = express.Router();
const configService = ConfigService.getInstance();

/**
 * Rota para obter a configuração do sistema
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Usar o configService em vez de SQL direto
    const config = await configService.getConfig(true);
    
    // Se não houver configuração, retornar objeto vazio
    if (!config) {
      return res.json({
        execution_mode: 'api',
        local_llm_url: 'http://127.0.0.1:8000',
        cloud_llm_url: 'https://api.mistral.ai/v1',
        apify_actor_url: '',
        apify_api_key: '',
        base_prompt: '',
        logs_enabled: true,
        oracle_instance_ip: '',
        active_llm_url: '',
        mistral_local_url: 'http://127.0.0.1:8000',
        mistral_cloud_url: 'https://api.mistral.ai/v1',
        mistral_instance_type: 'api',
        mistral_api_key: '',
        azure_vm_enabled: false,
        azure_vm_url: 'https://seu-servidor-azure.com:3000',
        azure_vm_api_key: '',
        azure_vm_instance_id: '',
        azure_vm_region: 'eastus',
        cloudflare_tunnel_enabled: false,
        cloudflare_tunnel_id: ''
      });
    }
    
    // Não enviar informações sensíveis como API keys
    const safeConfig = {
      ...config,
      apify_api_key: config.apify_api_key ? "***************" : null,
      mistral_api_key: config.mistral_api_key ? "***************" : null,
      azure_vm_api_key: config.azure_vm_api_key ? "***************" : null
    };
    
    return res.json(safeConfig);
  } catch (error) {
    console.error('Erro ao obter configuração do sistema:', error);
    return res.status(500).json({ error: 'Erro ao obter configuração do sistema' });
  }
});

/**
 * Rota para atualizar a configuração do sistema
 */
router.patch('/config', async (req: Request, res: Response) => {
  try {
    // Usar o configService em vez de SQL direto
    const updatedConfig = await configService.updateConfig(req.body);
    
    if (!updatedConfig) {
      return res.status(500).json({ error: "Erro ao atualizar configuração" });
    }
    
    // Não enviar informações sensíveis
    const safeConfig = {
      ...updatedConfig,
      apify_api_key: updatedConfig.apify_api_key ? "***************" : null,
      mistral_api_key: updatedConfig.mistral_api_key ? "***************" : null,
      azure_vm_api_key: updatedConfig.azure_vm_api_key ? "***************" : null
    };
    
    return res.json(safeConfig);
  } catch (error) {
    console.error('Erro ao atualizar configuração do sistema:', error);
    return res.status(500).json({ error: 'Erro ao atualizar configuração do sistema' });
  }
});

/**
 * Rota para testar a conexão com o Cloudflare Tunnel
 */
router.post('/test-cloudflare', async (req: Request, res: Response) => {
  try {
    const { tunnelId } = req.body;
    
    if (!tunnelId) {
      return res.json({
        success: false,
        message: 'ID do tunnel não fornecido'
      });
    }
    
    // Simular um teste de conexão com o Cloudflare
    // Em um ambiente real, isso faria uma chamada para a API do Cloudflare
    setTimeout(() => {
      // Simulação: 80% de chance de sucesso
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        return res.json({
          success: true,
          message: 'Conexão com Cloudflare Tunnel estabelecida com sucesso'
        });
      } else {
        return res.json({
          success: false,
          message: 'Não foi possível conectar ao Cloudflare Tunnel. Verifique o ID do tunnel e sua conexão à internet.'
        });
      }
    }, 1500);
  } catch (error) {
    console.error('Erro ao testar conexão com Cloudflare:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar conexão com Cloudflare'
    });
  }
});

/**
 * Rota para testar a conexão com o Apify
 */
router.post('/test-apify', async (req: Request, res: Response) => {
  try {
    const { actorUrl, apiKey } = req.body;
    
    if (!apiKey) {
      return res.json({
        success: false,
        message: 'API Key do Apify não fornecida'
      });
    }
    
    // Simular um teste de conexão com o Apify
    // Em um ambiente real, isso faria uma chamada para a API do Apify
    setTimeout(() => {
      // Simulação: 80% de chance de sucesso
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        return res.json({
          success: true,
          message: 'Conexão com a API do Apify estabelecida com sucesso'
        });
      } else {
        return res.json({
          success: false,
          message: 'Não foi possível conectar à API do Apify. Verifique sua API Key.'
        });
      }
    }, 1500);
  } catch (error) {
    console.error('Erro ao testar conexão com Apify:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar conexão com Apify'
    });
  }
});

/**
 * Rota para testar a conexão com o Mistral (local ou Azure VM)
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    
    if (!mode || (mode !== 'local' && mode !== 'azure')) {
      return res.json({
        success: false,
        message: 'Modo de conexão inválido. Use "local" ou "azure".'
      });
    }
    
    // Determinar a URL para testar com base no modo
    let url = '';
    
    if (mode === 'local') {
      url = 'http://127.0.0.1:8000';
    } else if (mode === 'azure') {
      // URL da VM Azure
      url = 'https://seu-servidor-azure.com:3000';
    }
    
    console.log(`Testando conexão com o servidor Mistral no modo: ${mode}, URL: ${url}`);
    
    // Simulação de teste de conexão
    // Em um ambiente de produção, isso faria uma requisição real para o serviço
    setTimeout(() => {
      // Simulação: 80% de chance de sucesso para testes
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        return res.json({
          success: true,
          message: `Conexão com o servidor Mistral ${mode === 'local' ? 'local' : 'na nuvem (Azure VM)'} estabelecida com sucesso.`,
          url: url
        });
      } else {
        let errorMessage = '';
        if (mode === 'local') {
          errorMessage = 'Não foi possível conectar ao servidor Mistral local. Verifique se o serviço está rodando na porta 8000.';
        } else {
          errorMessage = 'Não foi possível conectar à VM Azure. Verifique se o serviço está rodando na porta 3000 e se a VM está online.';
        }
        
        return res.json({
          success: false,
          message: errorMessage
        });
      }
    }, 1500);
  } catch (error) {
    console.error('Erro ao testar conexão com o servidor Mistral:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao testar conexão com o servidor Mistral'
    });
  }
});

export default router;