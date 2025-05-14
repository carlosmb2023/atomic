import axios from 'axios';
import { AgentExecution, InsertAgent } from '@shared/schema';
import { agentService } from './agent.service';
import { storage } from '../../storage';

/**
 * Serviço para agentes baseados em Mistral AI
 */
export class MistralAgentService {
  private apiKey: string | null = null;
  private apiBaseUrl: string = 'https://api.mistral.ai/v1';

  /**
   * Inicializa o cliente Mistral
   */
  private async init(): Promise<void> {
    if (this.apiKey) return;

    // Busca configuração do sistema
    const config = await storage.getSystemConfig();
    
    // Verifica se existe uma API key para Mistral
    if (!process.env.MISTRAL_API_KEY && (!config || !config.mistral_api_key)) {
      throw new Error('Chave de API do Mistral não configurada');
    }

    this.apiKey = process.env.MISTRAL_API_KEY || config?.mistral_api_key || '';
  }

  /**
   * Cria um novo agente Mistral
   */
  async createAgent(name: string, description: string = '', configuration: any = {}): Promise<any> {
    try {
      const agent: InsertAgent = {
        name,
        type: 'mistral',
        description: description || 'Agente baseado em Mistral AI',
        status: 'inactive',
        configuration: {
          ...configuration,
          model: configuration.model || 'mistral-medium',
          temperature: configuration.temperature || 0.7,
          max_tokens: configuration.max_tokens || 2000,
          tools_enabled: configuration.tools_enabled || true,
          memory_enabled: configuration.memory_enabled || true,
          system_prompt: configuration.system_prompt || 'Você é um assistente útil e eficiente.'
        }
      };

      return await agentService.createAgent(agent);
    } catch (error) {
      console.error('Erro ao criar agente Mistral:', error);
      throw error;
    }
  }

  /**
   * Executa uma tarefa com o agente
   */
  async executeTask(agentId: number, userId: number | null, objective: string): Promise<any> {
    try {
      // Busca o agente
      const agent = await agentService.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agente com ID ${agentId} não encontrado`);
      }

      // Verifica se é um agente Mistral
      if (agent.type !== 'mistral') {
        throw new Error('Este método só pode ser usado com agentes Mistral');
      }

      // Inicializa a conexão com Mistral
      await this.init();

      // Inicializa a execução
      const execution = await agentService.startExecution(agentId, userId, objective);

      // Busca ferramentas disponíveis para este agente
      const agentTools = await agentService.getToolsForAgent(agentId);
      
      // Formata as ferramentas para o formato Mistral
      const tools = agentTools.map(tool => {
        return {
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.configuration?.schema || { type: "object", properties: {} }
          }
        };
      });

      // Busca histórico de execuções anteriores para contexto
      const previousExecutions = await storage.getAgentExecutionsByAgent(agentId, 3);
      
      // Constrói o contexto com base em execuções anteriores
      let memoryContext = '';
      if (agent.configuration?.memory_enabled && previousExecutions.length > 0) {
        memoryContext = 'Contexto de execuções anteriores:\n\n';
        
        for (const prevExec of previousExecutions) {
          if (prevExec.id === execution.id) continue; // Pula a execução atual
          
          memoryContext += `Objetivo: ${prevExec.objective}\n`;
          
          if (prevExec.summary) {
            memoryContext += `Resultado: ${prevExec.summary}\n\n`;
          }
        }
      }

      // Registra passo de inicialização
      await agentService.addExecutionStep(
        execution.id,
        'initialization',
        `Inicializando agente para objetivo: ${objective}`,
        1
      );

      // Constrói o prompt do sistema
      const systemPrompt = agent.configuration?.system_prompt || 'Você é um assistente útil e eficiente.';
      const fullSystemPrompt = `${systemPrompt}\n\n${memoryContext}`.trim();

      // Faz a chamada para o Mistral
      const response = await axios.post(
        `${this.apiBaseUrl}/chat/completions`,
        {
          model: agent.configuration?.model || 'mistral-medium',
          temperature: agent.configuration?.temperature || 0.7,
          max_tokens: agent.configuration?.max_tokens || 2000,
          messages: [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: objective }
          ],
          tools: agent.configuration?.tools_enabled ? tools : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Processa a resposta
      const content = response.data.choices[0]?.message?.content || '';
      const toolCalls = response.data.choices[0]?.message?.tool_calls || [];

      // Registra resposta principal
      await agentService.addExecutionStep(
        execution.id,
        'response',
        content,
        2
      );

      // Se houver chamadas de ferramentas, processa cada uma
      if (toolCalls.length > 0) {
        let stepOrder = 3;
        
        for (const toolCall of toolCalls) {
          if (toolCall.type === 'function') {
            // Registra uso da ferramenta
            await agentService.addExecutionStep(
              execution.id,
              'tool_call',
              `Utilizando ferramenta: ${toolCall.function.name}`,
              stepOrder++,
              toolCall.function.name,
              { arguments: toolCall.function.arguments }
            );
            
            // Aqui seria implementada a execução real da ferramenta
            // Este é apenas um placeholder para demonstração
            const toolResponse = `Resultado da execução da ferramenta ${toolCall.function.name}`;
            
            // Registra resposta da ferramenta
            await agentService.addExecutionStep(
              execution.id,
              'tool_result',
              toolResponse,
              stepOrder++,
              toolCall.function.name
            );
          }
        }
      }

      // Finaliza a execução
      await agentService.completeExecution(
        execution.id, 
        `Execução concluída. ${content.slice(0, 100)}...`
      );

      // Retorna o resultado
      return {
        execution_id: execution.id,
        response: content,
        tool_calls: toolCalls.length
      };
    } catch (error) {
      console.error('Erro ao executar tarefa com agente Mistral:', error);
      
      // Se houver uma execução em andamento, marca como falha
      if (arguments[3] && typeof arguments[3] === 'object' && 'id' in arguments[3]) {
        const executionId = arguments[3].id;
        await agentService.failExecution(
          executionId,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
      
      throw error;
    }
  }

  /**
   * Retorna o histórico de uma execução
   */
  async getExecutionHistory(executionId: number): Promise<any> {
    try {
      // Busca a execução
      const execution = await storage.getAgentExecution(executionId);
      if (!execution) {
        throw new Error(`Execução com ID ${executionId} não encontrada`);
      }

      // Busca os passos da execução
      const steps = await storage.getAgentStepsByExecution(executionId);

      // Retorna o histórico completo
      return {
        execution,
        steps
      };
    } catch (error) {
      console.error('Erro ao buscar histórico de execução:', error);
      throw error;
    }
  }
}

// Exporta a instância do serviço
export const mistralAgentService = new MistralAgentService();