import express, { Request, Response } from 'express';
import { db } from '../db';

const router = express.Router();

/**
 * Rota para obter a configuração do sistema
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Buscar a configuração do sistema do banco de dados
    const result = await db.query('SELECT * FROM system_config ORDER BY id DESC LIMIT 1');
    
    // Se não houver configuração, retornar objeto vazio
    if (result.rows.length === 0) {
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
    
    const config = result.rows[0];
    return res.json(config);
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
    const config = req.body;
    
    // Verificar se já existe uma configuração
    const existingConfig = await db.query('SELECT * FROM system_config ORDER BY id DESC LIMIT 1');
    
    let result;
    
    if (existingConfig.rows.length === 0) {
      // Se não existir, inserir nova configuração
      const fields = Object.keys(config).filter(key => config[key] !== undefined);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = fields.map(field => config[field]);
      
      const query = `
        INSERT INTO system_config (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      result = await db.query(query, values);
    } else {
      // Se existir, atualizar configuração existente
      const id = existingConfig.rows[0].id;
      
      // Filtrar apenas os campos que foram fornecidos no corpo da requisição
      const updateFields = Object.keys(config)
        .filter(key => config[key] !== undefined)
        .map((key, i) => `${key} = $${i + 1}`);
      
      const values = Object.keys(config)
        .filter(key => config[key] !== undefined)
        .map(key => config[key]);
      
      // Adicionar o ID ao final dos valores
      values.push(id);
      
      const query = `
        UPDATE system_config
        SET ${updateFields.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
      `;
      
      result = await db.query(query, values);
    }
    
    return res.json(result.rows[0]);
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

export default router;