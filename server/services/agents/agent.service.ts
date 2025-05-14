import { Agent, AgentExecution, AgentStep, AgentTool, AgentToolMapping, InsertAgent, InsertAgentExecution, InsertAgentStep, InsertAgentTool, InsertAgentToolMapping } from '@shared/schema';
import { storage } from '../../storage';

/**
 * Classe base para serviços de agentes
 * Implementa as operações comuns a todos os tipos de agentes
 */
export class AgentService {
  /**
   * Obtém um agente por ID
   */
  async getAgent(id: number): Promise<Agent | undefined> {
    return storage.getAgent(id);
  }

  /**
   * Obtém um agente por nome
   */
  async getAgentByName(name: string): Promise<Agent | undefined> {
    return storage.getAgentByName(name);
  }

  /**
   * Obtém todos os agentes de um determinado tipo
   */
  async getAgentsByType(type: string): Promise<Agent[]> {
    return storage.getAgentsByType(type);
  }

  /**
   * Obtém todos os agentes
   */
  async getAllAgents(): Promise<Agent[]> {
    return storage.getAllAgents();
  }

  /**
   * Cria um novo agente
   */
  async createAgent(agent: InsertAgent): Promise<Agent> {
    return storage.createAgent(agent);
  }

  /**
   * Atualiza um agente existente
   */
  async updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined> {
    return storage.updateAgent(id, agentData);
  }

  /**
   * Remove um agente
   */
  async deleteAgent(id: number): Promise<boolean> {
    return storage.deleteAgent(id);
  }

  /**
   * Inicializa uma nova execução de agente
   */
  async startExecution(agentId: number, userId: number | null, objective: string): Promise<AgentExecution> {
    const execution: InsertAgentExecution = {
      agent_id: agentId,
      user_id: userId,
      objective,
      status: 'running',
      started_at: new Date()
    };

    return storage.createAgentExecution(execution);
  }

  /**
   * Finaliza uma execução de agente
   */
  async completeExecution(executionId: number, summary: string): Promise<AgentExecution | undefined> {
    return storage.updateAgentExecution(executionId, {
      status: 'completed',
      completed_at: new Date(),
      summary
    });
  }

  /**
   * Marca uma execução como falha
   */
  async failExecution(executionId: number, errorMessage: string): Promise<AgentExecution | undefined> {
    return storage.updateAgentExecution(executionId, {
      status: 'failed',
      completed_at: new Date(),
      error_message: errorMessage
    });
  }

  /**
   * Adiciona um passo à execução
   */
  async addExecutionStep(
    executionId: number, 
    stepType: string, 
    content: string, 
    order: number,
    toolUsed?: string,
    metadata?: any
  ): Promise<AgentStep> {
    const step: InsertAgentStep = {
      execution_id: executionId,
      step_type: stepType,
      content,
      order,
      tool_used: toolUsed || null,
      metadata: metadata || null
    };

    return storage.createAgentStep(step);
  }

  /**
   * Obtém todas as ferramentas disponíveis para um agente
   */
  async getToolsForAgent(agentId: number): Promise<AgentTool[]> {
    return storage.getAgentToolsByAgent(agentId);
  }

  /**
   * Atribui uma ferramenta a um agente
   */
  async assignToolToAgent(agentId: number, toolId: number): Promise<AgentToolMapping> {
    const mapping: InsertAgentToolMapping = {
      agent_id: agentId,
      tool_id: toolId,
      is_active: true
    };

    return storage.createAgentToolMapping(mapping);
  }

  /**
   * Remove uma ferramenta de um agente
   */
  async removeToolFromAgent(agentId: number, toolId: number): Promise<boolean> {
    return storage.updateAgentToolMapping(agentId, toolId, false);
  }

  /**
   * Cria uma nova ferramenta para agentes
   */
  async createTool(tool: InsertAgentTool): Promise<AgentTool> {
    return storage.createAgentTool(tool);
  }

  /**
   * Obtém todas as ferramentas disponíveis
   */
  async getAllTools(): Promise<AgentTool[]> {
    return storage.getAllAgentTools();
  }

  /**
   * Obtém todas as ferramentas ativas
   */
  async getActiveTools(): Promise<AgentTool[]> {
    return storage.getActiveAgentTools();
  }
}

// Exporta a instância do serviço
export const agentService = new AgentService();