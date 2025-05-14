import { OpenAI } from 'openai';
import { AgentExecution, InsertAgent } from '@shared/schema';
import { agentService } from './agent.service';
import { storage } from '../../storage';

/**
 * Serviço para agentes baseados em OpenAI
 */
export class OpenAIAgentService {
  private client: OpenAI | null = null;

  /**
   * Inicializa o cliente OpenAI
   */
  private async initClient(): Promise<OpenAI> {
    if (this.client) return this.client;

    // Busca configuração do sistema
    const config = await storage.getSystemConfig();
    
    // Verifica se existe uma API key para OpenAI
    if (!process.env.OPENAI_API_KEY && (!config || !config.openai_api_key)) {
      throw new Error('Chave de API da OpenAI não configurada');
    }

    // Cria cliente OpenAI
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || config?.openai_api_key || '',
    });

    return this.client;
  }

  /**
   * Cria um novo agente OpenAI
   */
  async createAgent(name: string, description: string = '', configuration: any = {}): Promise<any> {
    try {
      const agent: InsertAgent = {
        name,
        type: 'openai',
        description: description || 'Agente baseado em OpenAI',
        status: 'inactive',
        configuration: {
          ...configuration,
          model: configuration.model || 'gpt-3.5-turbo',
          temperature: configuration.temperature || 0.7,
          max_tokens: configuration.max_tokens || 2000,
          tools_enabled: configuration.tools_enabled || true,
          memory_enabled: configuration.memory_enabled || true,
          system_prompt: configuration.system_prompt || 'Você é um assistente útil e eficiente.'
        }
      };

      return await agentService.createAgent(agent);
    } catch (error) {
      console.error('Erro ao criar agente OpenAI:', error);
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

      // Verifica se é um agente OpenAI
      if (agent.type !== 'openai') {
        throw new Error('Este método só pode ser usado com agentes OpenAI');
      }

      // Inicializa o cliente OpenAI
      await this.initClient();

      // Inicializa a execução
      const execution = await agentService.startExecution(agentId, userId, objective);

      // Busca ferramentas disponíveis para este agente
      const agentTools = await agentService.getToolsForAgent(agentId);

      // Formata as ferramentas para o formato OpenAI
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

      // Faz a chamada para a OpenAI
      const response = await this.client!.chat.completions.create({
        model: agent.configuration?.model || 'gpt-3.5-turbo',
        temperature: agent.configuration?.temperature || 0.7,
        max_tokens: agent.configuration?.max_tokens || 2000,
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: objective }
        ],
        tools: agent.configuration?.tools_enabled ? tools : undefined
      });

      // Processa a resposta
      const content = response.choices[0]?.message?.content || '';
      const toolCalls = response.choices[0]?.message?.tool_calls || [];

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
      console.error('Erro ao executar tarefa com agente OpenAI:', error);
      
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
export const openaiAgentService = new OpenAIAgentService();