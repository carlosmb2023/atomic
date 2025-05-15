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
  
  /**
   * Define a chave API para o serviço Mistral
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('API Key do Mistral configurada com sucesso');
  }
  
  /**
   * Define se deve usar o servidor local
   */
  public setUseLocalServer(useLocal: boolean, localUrl?: string): void {
    this.mode = useLocal ? 'local' : 'api';
    if (localUrl) {
      this.localEndpoint = localUrl;
    }
    console.log(`Modo do Mistral alterado para: ${this.mode}`);
  }

  constructor() {
    console.log('🔄 Serviço Mistral inicializado. Modo: API');
    
    // Tentar ler a chave da API das variáveis de ambiente
    if (process.env.MISTRAL_API_KEY) {
      this.apiKey = process.env.MISTRAL_API_KEY;
      console.log('✓ Chave API do Mistral carregada das variáveis de ambiente');
    }
    
    // Garantir que estamos usando o agente específico solicitado
    this.agentId = 'ag:48009b45:20250515:programador-agente:d9bb1918';
    console.log(`✓ Usando agente Mistral específico: ${this.agentId}`);
    
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
      if (!config) {
        return null;
      }
      
      // Configuração encontrada na tabela system_config
      return {
        api_key: config.mistral_api_key || null,
        local_endpoint: config.mistral_local_url || null,
        mode: config.execution_mode === 'local' ? 'local' : 'api',
        agent_id: "ag:48009b45:20250515:programador-agente:d9bb1918", // Sempre usar o agente específico
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
      if (config.agent_id) this.agentId = config.agent_id || "ag:48009b45:20250515:programador-agente:d9bb1918";
      
      // Salvar no armazenamento persistente
      const systemConfig = await storage.getSystemConfig();
      
      if (systemConfig) {
        // Atualizar configuração existente
        await storage.updateSystemConfig({
          mistral_api_key: this.apiKey, 
          mistral_local_url: this.localEndpoint,
          execution_mode: this.mode === 'local' ? 'local' : 'api',
          updated_at: new Date()
        });
      } else {
        // Criar nova configuração do sistema
        const configData = {
          id: 1,
          execution_mode: this.mode === 'local' ? 'local' : 'api',
          mistral_api_key: this.apiKey,
          mistral_local_url: this.localEndpoint || "http://127.0.0.1:8000",
          mistral_cloud_url: "https://api.mistral.ai/v1",
          local_llm_url: "http://127.0.0.1:11434",
          cloud_llm_url: "https://oracle-api.carlosdev.app.br",
          active_llm_url: "http://127.0.0.1:11434",
          updated_at: new Date()
        };
        
        await storage.updateSystemConfig(configData);
      }
      
      console.log(`Configurações Mistral atualizadas com sucesso - Modo: ${this.mode}, Agente específico configurado`);
      
      // Reinicializar o cliente
      await this.initialize();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração Mistral:', error);
      return false;
    }
  }

  /**
   * Verifica a saúde do servidor local Mistral
   */
  public async checkLocalServerHealth(): Promise<{ isHealthy: boolean, message: string }> {
    try {
      if (!this.localEndpoint) {
        return { isHealthy: false, message: "Servidor local não configurado" };
      }
      
      const response = await axios.get(`${this.localEndpoint}/health`);
      return { 
        isHealthy: response.status === 200, 
        message: "Servidor Mistral local está operacional" 
      };
    } catch (error) {
      return { 
        isHealthy: false, 
        message: `Erro ao verificar servidor local: ${error.message || "Erro desconhecido"}` 
      };
    }
  }
  
  /**
   * Verifica a saúde da API Mistral
   */
  public async checkApiHealth(): Promise<{ isHealthy: boolean, message: string }> {
    try {
      if (!this.apiKey) {
        return { isHealthy: false, message: "API Key do Mistral não configurada" };
      }
      
      // Testar API com uma chamada simples
      await axios.get("https://api.mistral.ai/v1/models", {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      
      return { 
        isHealthy: true, 
        message: "API Mistral está operacional" 
      };
    } catch (error) {
      return { 
        isHealthy: false, 
        message: `Erro ao verificar API Mistral: ${error.message || "Erro de autenticação"}`
      };
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
   * Método compatível com a interface anterior para rotas
   */
  public async chatCompletion(prompt: string, options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<any> {
    const response = await this.sendMessage(prompt, options);
    return {
      text: response,
      usage: {
        total_tokens: (prompt.length + response.length) / 4 // Estimativa simples
      }
    };
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
        source: this.mode === 'api' ? 'cloud' : 'local',
        prompt,
        response,
        user_id: 1, // Default para sistema
        status: 'success',
        tokens_used: this.estimateTokens(prompt) + this.estimateTokens(response),
        metadata: JSON.stringify({
          model: this.mode === 'api' ? 'mistral-large-latest' : 'mistral-7b-instruct',
          agent_id: this.agentId,
          temperature: 0.7
        })
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