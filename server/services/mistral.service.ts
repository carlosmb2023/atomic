/**
 * Serviço do Mistral AI para comunicação com a API Mistral
 * Suporta o agente específico: ag:48009b45:20250515:programador-agente:d9bb1918
 */

import axios from 'axios';
import { storage } from '../storage';
import { createHash } from 'crypto';

// Interface para as credenciais da API Mistral
interface MistralCredentials {
  api_key?: string;
  local_endpoint?: string;
  mode: 'api' | 'local' | 'replit';
  agent_id: string;
}

// Interface para resposta de status do Mistral
interface MistralStatus {
  available: boolean;
  mode: string;
  api_configured: boolean;
  local_configured: boolean;
  agent_id: string;
  message: string;
}

// Enum para os tipos de agentes
enum AgentType {
  GenericAI = 'generic',
  Programador = 'programador',
  Analisador = 'analisador',
  Criativo = 'criativo',
}

// Interface para configuração do agente
interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  tools_enabled: boolean;
}

// Classe do serviço Mistral
class MistralService {
  private apiKey: string | null = null;
  private localEndpoint: string | null = null;
  private mode: 'api' | 'local' | 'replit' = 'api';
  private agentId: string = 'ag:48009b45:20250515:programador-agente:d9bb1918';
  private initialized: boolean = false;
  private apiClient: any = null;

  constructor() {
    console.log('🔄 Serviço Mistral inicializado. Modo: API');
    
    // Tentar ler a chave da API das variáveis de ambiente
    if (process.env.MISTRAL_API_KEY) {
      this.apiKey = process.env.MISTRAL_API_KEY;
    }
    
    // Configurar o ID do agente da variável de ambiente ou usar o padrão
    if (process.env.MISTRAL_AGENT_ID) {
      this.agentId = process.env.MISTRAL_AGENT_ID;
    }
    
    this.initialize();
  }

  /**
   * Inicializa o serviço Mistral com as configurações disponíveis
   */
  private async initialize(): Promise<void> {
    try {
      // Tentar buscar configuração do banco de dados ou armazenamento
      const config = await this.loadConfigFromStorage();
      
      if (config) {
        if (config.api_key) this.apiKey = config.api_key;
        if (config.local_endpoint) this.localEndpoint = config.local_endpoint;
        this.mode = config.mode;
        if (config.agent_id) this.agentId = config.agent_id;
      }
      
      // Configurar cliente HTTP para API
      this.apiClient = axios.create({
        baseURL: this.mode === 'local' && this.localEndpoint
          ? this.localEndpoint
          : 'https://api.mistral.ai/v1',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
        },
        timeout: 30000 // 30 segundos
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Erro ao inicializar serviço Mistral:', error);
      this.initialized = false;
    }
  }

  /**
   * Carrega configuração do armazenamento
   */
  private async loadConfigFromStorage(): Promise<MistralCredentials | null> {
    try {
      const config = await storage.getSystemConfig();
      if (!config || !config.mistral_config) {
        return null;
      }
      
      // Configuração encontrada
      const mistralConfig = JSON.parse(config.mistral_config);
      return {
        api_key: mistralConfig.api_key,
        local_endpoint: mistralConfig.local_endpoint,
        mode: mistralConfig.mode || 'api',
        agent_id: mistralConfig.agent_id || this.agentId,
      };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  }

  /**
   * Atualiza as configurações do serviço Mistral
   */
  public async updateConfig(config: Partial<MistralCredentials>): Promise<boolean> {
    try {
      // Atualizar as configurações locais
      if (config.api_key) this.apiKey = config.api_key;
      if (config.local_endpoint) this.localEndpoint = config.local_endpoint;
      if (config.mode) this.mode = config.mode;
      if (config.agent_id) this.agentId = config.agent_id;
      
      // Salvar no armazenamento persistente
      const systemConfig = await storage.getSystemConfig();
      
      const mistralConfig = {
        api_key: this.apiKey,
        local_endpoint: this.localEndpoint,
        mode: this.mode,
        agent_id: this.agentId,
      };
      
      if (systemConfig) {
        // Atualizar configuração existente
        await storage.updateSystemConfig({
          mistral_config: JSON.stringify(mistralConfig)
        });
      } else {
        // Criar nova configuração do sistema
        const configData = {
          id: 1,
          app_name: 'WebAiDashboard',
          theme: 'dark',
          mistral_config: JSON.stringify(mistralConfig),
          openai_config: '{}',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await storage.updateSystemConfig(configData);
      }
      
      // Reinicializar o cliente
      await this.initialize();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração Mistral:', error);
      return false;
    }
  }

  /**
   * Verifica o status da conexão com Mistral
   */
  public async checkStatus(): Promise<MistralStatus> {
    // Verificar se as configurações estão presentes
    const apiConfigured = !!this.apiKey;
    const localConfigured = !!this.localEndpoint;
    
    let available = false;
    let message = 'Mistral não configurado';
    
    if (!this.initialized) {
      message = 'Serviço Mistral não inicializado';
    } else if (this.mode === 'api' && apiConfigured) {
      try {
        // Testar conexão com a API
        const response = await this.apiClient.get('/models');
        if (response.status === 200) {
          available = true;
          message = 'Conexão com API Mistral estabelecida';
        }
      } catch (error) {
        message = 'Falha na conexão com API Mistral';
      }
    } else if (this.mode === 'local' && localConfigured) {
      try {
        // Testar conexão com endpoint local
        const response = await axios.get(`${this.localEndpoint}/health`);
        if (response.status === 200) {
          available = true;
          message = 'Conexão com Mistral local estabelecida';
        }
      } catch (error) {
        message = 'Falha na conexão com Mistral local';
      }
    } else if (this.mode === 'replit') {
      // No modo Replit, assumimos disponibilidade sem teste
      available = true;
      message = 'Modo Replit ativo (leve)';
    }
    
    return {
      available,
      mode: this.mode,
      api_configured: apiConfigured,
      local_configured: localConfigured,
      agent_id: this.agentId,
      message
    };
  }

  /**
   * Verifica compatibilidade do servidor atual com o agente especificado
   */
  public checkAgentCompatibility(): boolean {
    // Verificar se o ID do agente é o esperado
    return this.agentId === 'ag:48009b45:20250515:programador-agente:d9bb1918';
  }

  /**
   * Gera hash único para identificação do agente
   */
  public generateAgentHash(): string {
    const hash = createHash('sha256');
    hash.update(this.agentId);
    return hash.digest('hex').substring(0, 12);
  }

  /**
   * Envia uma mensagem para o modelo Mistral
   */
  public async sendMessage(prompt: string, options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const systemPrompt = options.systemPrompt || 'Você é um assistente AI útil e preciso.';
      const temperature = options.temperature || 0.7;
      const max_tokens = options.maxTokens || 1000;
      
      // No modo replit, usamos um processamento simulado leve
      if (this.mode === 'replit') {
        return `[Modo Replit] Resposta simulada para: ${prompt.substring(0, 50)}...`;
      }
      
      // Modo API ou Local
      const url = this.mode === 'api' ? '/chat/completions' : '/v1/chat/completions';
      
      const payload = {
        model: this.mode === 'api' ? 'mistral-large-latest' : 'mistral-7b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens,
        top_p: 1,
        stream: false
      };
      
      const response = await this.apiClient.post(url, payload);
      
      // Registrar no armazenamento
      await this.logInteraction(prompt, response.data.choices[0].message.content);
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao enviar mensagem para Mistral:', error);
      throw new Error('Falha ao comunicar com o agente Mistral');
    }
  }

  /**
   * Registra interação com o Mistral para análise
   */
  private async logInteraction(prompt: string, response: string): Promise<void> {
    try {
      const log = {
        user_id: 1, // Default para sistema
        model: this.mode === 'api' ? 'mistral-large-latest' : 'mistral-7b-instruct',
        prompt,
        response,
        tokens_used: this.estimateTokens(prompt) + this.estimateTokens(response),
        created_at: new Date(),
        agent_id: this.agentId
      };
      
      await storage.createLlmLog(log);
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
    }
  }

  /**
   * Estima o número de tokens em um texto (aproximado)
   */
  private estimateTokens(text: string): number {
    // Estimativa aproximada: 1 token ≈ 4 caracteres em inglês
    return Math.ceil(text.length / 4);
  }
}

// Instância única do serviço
export const mistralService = new MistralService();