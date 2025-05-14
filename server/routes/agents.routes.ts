import express from 'express';
import { z } from 'zod';
import { agentService, getAgentServiceByType, mistralAgentService, openaiAgentService } from '../services/agents';
import { insertAgentSchema, insertAgentToolSchema } from '@shared/schema';

const router = express.Router();

/**
 * Obter todos os agentes
 */
router.get('/', async (req, res) => {
  try {
    const agents = await agentService.getAllAgents();
    res.json(agents);
  } catch (error) {
    console.error('Erro ao buscar todos os agentes:', error);
    res.status(500).json({ error: 'Erro ao buscar agentes' });
  }
});

/**
 * Obter agentes por tipo
 */
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const agents = await agentService.getAgentsByType(type);
    res.json(agents);
  } catch (error) {
    console.error(`Erro ao buscar agentes do tipo ${req.params.type}:`, error);
    res.status(500).json({ error: 'Erro ao buscar agentes pelo tipo' });
  }
});

/**
 * Obter um agente específico
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const agent = await agentService.getAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    res.json(agent);
  } catch (error) {
    console.error(`Erro ao buscar agente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao buscar agente' });
  }
});

/**
 * Criar um novo agente
 */
router.post('/', async (req, res) => {
  try {
    const result = insertAgentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const { type } = result.data;
    let agent;

    switch (type.toLowerCase()) {
      case 'openai':
        agent = await openaiAgentService.createAgent(
          result.data.name, 
          result.data.description || '', 
          result.data.configuration || {}
        );
        break;
      case 'mistral':
        agent = await mistralAgentService.createAgent(
          result.data.name, 
          result.data.description || '', 
          result.data.configuration || {}
        );
        break;
      default:
        agent = await agentService.createAgent(result.data);
    }

    res.status(201).json(agent);
  } catch (error) {
    console.error('Erro ao criar agente:', error);
    res.status(500).json({ error: 'Erro ao criar agente' });
  }
});

/**
 * Atualizar um agente
 */
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se o agente existe
    const existingAgent = await agentService.getAgent(id);
    if (!existingAgent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    // Valida os campos que podem ser atualizados
    const updateSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      configuration: z.any().optional()
    });

    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const updatedAgent = await agentService.updateAgent(id, result.data);
    res.json(updatedAgent);
  } catch (error) {
    console.error(`Erro ao atualizar agente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao atualizar agente' });
  }
});

/**
 * Excluir um agente
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se o agente existe
    const existingAgent = await agentService.getAgent(id);
    if (!existingAgent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    const success = await agentService.deleteAgent(id);
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Erro ao excluir agente' });
    }
  } catch (error) {
    console.error(`Erro ao excluir agente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao excluir agente' });
  }
});

/**
 * Executar uma tarefa com um agente
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se o agente existe
    const agent = await agentService.getAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    // Valida o corpo da requisição
    const executeSchema = z.object({
      objective: z.string(),
      userId: z.number().optional()
    });

    const result = executeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    // Obtém o serviço correto para o tipo de agente
    const agentServiceInstance = getAgentServiceByType(agent.type);
    
    // Executa a tarefa
    const execution = await agentServiceInstance.executeTask(
      id, 
      result.data.userId || null, 
      result.data.objective
    );

    res.json(execution);
  } catch (error) {
    console.error(`Erro ao executar tarefa com agente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao executar tarefa', details: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

/**
 * Obter histórico de execução
 */
router.get('/executions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const execution = await agentService.getAgentExecution(id);
    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Obtém o agente associado
    const agent = execution.agent_id 
      ? await agentService.getAgent(execution.agent_id)
      : null;

    // Se o agente for encontrado, usa o serviço específico
    if (agent) {
      const agentServiceInstance = getAgentServiceByType(agent.type);
      const history = await agentServiceInstance.getExecutionHistory(id);
      return res.json(history);
    }

    // Caso contrário, apenas retorna os passos
    const steps = await agentService.getAgentStepsByExecution(id);
    res.json({ execution, steps });
  } catch (error) {
    console.error(`Erro ao buscar histórico de execução ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao buscar histórico de execução' });
  }
});

/**
 * Listar todas as ferramentas disponíveis
 */
router.get('/tools/all', async (req, res) => {
  try {
    const tools = await agentService.getAllTools();
    res.json(tools);
  } catch (error) {
    console.error('Erro ao buscar ferramentas:', error);
    res.status(500).json({ error: 'Erro ao buscar ferramentas' });
  }
});

/**
 * Criar uma nova ferramenta
 */
router.post('/tools', async (req, res) => {
  try {
    const result = insertAgentToolSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const tool = await agentService.createTool(result.data);
    res.status(201).json(tool);
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error);
    res.status(500).json({ error: 'Erro ao criar ferramenta' });
  }
});

/**
 * Associar uma ferramenta a um agente
 */
router.post('/:agentId/tools/:toolId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const toolId = parseInt(req.params.toolId);
    
    if (isNaN(agentId) || isNaN(toolId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se o agente existe
    const agent = await agentService.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    // Verifica se a ferramenta existe
    const tool = await agentService.getAgentTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: 'Ferramenta não encontrada' });
    }

    const mapping = await agentService.assignToolToAgent(agentId, toolId);
    res.status(201).json(mapping);
  } catch (error) {
    console.error(`Erro ao associar ferramenta ${req.params.toolId} ao agente ${req.params.agentId}:`, error);
    res.status(500).json({ error: 'Erro ao associar ferramenta ao agente' });
  }
});

/**
 * Desassociar uma ferramenta de um agente
 */
router.delete('/:agentId/tools/:toolId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const toolId = parseInt(req.params.toolId);
    
    if (isNaN(agentId) || isNaN(toolId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const success = await agentService.removeToolFromAgent(agentId, toolId);
    if (success) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Mapeamento não encontrado' });
    }
  } catch (error) {
    console.error(`Erro ao desassociar ferramenta ${req.params.toolId} do agente ${req.params.agentId}:`, error);
    res.status(500).json({ error: 'Erro ao desassociar ferramenta do agente' });
  }
});

/**
 * Listar ferramentas associadas a um agente
 */
router.get('/:id/tools', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se o agente existe
    const agent = await agentService.getAgent(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    const tools = await agentService.getToolsForAgent(id);
    res.json(tools);
  } catch (error) {
    console.error(`Erro ao buscar ferramentas do agente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao buscar ferramentas do agente' });
  }
});

export default router;