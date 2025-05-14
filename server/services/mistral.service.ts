import axios from 'axios';
import { storage } from '../storage';
import { log } from '../vite';

/**
 * Serviço para integração com Mistral AI
 * Suporta tanto API oficial quanto servidor local
 */
export class MistralService {
  private apiKey: string | null = null;
  private apiBaseUrl: string = 'https://api.mistral.ai/v1';
  private localUrl: string | null = null;
  private useLocalServer: boolean = false;

  constructor() {
    // Tentamos carregar a configuração inicial
    this.init().catch(err => {
      log(`⚠️ Erro ao inicializar serviço Mistral: ${err}`, 'warn');
    });
  }

  /**
   * Inicializa as configurações do serviço Mistral
   */
  async init(): Promise<void> {
    try {
      // Tenta buscar configuração do sistema
      const config = await storage.getSystemConfig();

      // Configura APIKey do env ou db
      if (process.env.MISTRAL_API_KEY) {
        this.apiKey = process.env.MISTRAL_API_KEY;
      } else if (config?.mistral_api_key) {
        this.apiKey = config.mistral_api_key;
      }

      // Configura URL local se disponível
      if (config?.mistral_local_url) {
        this.localUrl = config.mistral_local_url;
      } else {
        this.localUrl = 'http://localhost:8000';
      }

      // Configura preferência de servidor conforme o tipo selecionado
      if (config?.mistral_instance_type) {
        this.useLocalServer = config.mistral_instance_type === 'local';
        
        // Configura a API base URL dependendo do tipo
        if (config.mistral_instance_type === 'api') {
          this.apiBaseUrl = 'https://api.mistral.ai/v1';
        } else if (config.mistral_instance_type === 'replit') {
          // Se estiver usando o Replit, a URL será a do próprio app
          this.apiBaseUrl = '/api/mistral';
        }
      } else {
        // Fallback para API oficial por padrão
        this.useLocalServer = false;
      }

      log(`🔄 Serviço Mistral inicializado. Modo: ${this.useLocalServer ? 'Local' : 'API'}`);
    } catch (error) {
      log(`❌ Erro ao inicializar Mistral: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Força a atualização das configurações
   */
  async updateConfig(): Promise<void> {
    return this.init();
  }

  /**
   * Define se deve usar o servidor local
   */
  setUseLocalServer(useLocal: boolean): void {
    this.useLocalServer = useLocal;
  }

  /**
   * Define a URL do servidor local
   */
  setLocalUrl(url: string): void {
    this.localUrl = url;
  }

  /**
   * Define a chave API
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Verifica se temos as credenciais necessárias
   */
  private validateCredentials(): void {
    if (this.useLocalServer && !this.localUrl) {
      throw new Error('URL do servidor Mistral local não configurada');
    }

    if (!this.useLocalServer && !this.apiKey) {
      throw new Error('Chave de API do Mistral não configurada');
    }
  }

  /**
   * Executa um chat completion
   */
  async chatCompletion(messages: any[], options: any = {}): Promise<any> {
    try {
      await this.updateConfig();
      this.validateCredentials();

      const requestBody = {
        model: options.model || 'mistral-small',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options
      };

      let response;

      if (this.useLocalServer && this.localUrl) {
        // Usa servidor local
        log(`🤖 Usando servidor Mistral local: ${this.localUrl}`);
        response = await axios.post(`${this.localUrl}/v1/chat/completions`, requestBody);
      } else {
        // Usa API oficial
        log('🌐 Usando API Mistral oficial');
        response = await axios.post(`${this.apiBaseUrl}/chat/completions`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
      }

      return response.data;
    } catch (error) {
      // Captura erros da API
      if (axios.isAxiosError(error) && error.response) {
        log(`❌ Erro na API Mistral: ${error.response.data?.error?.message || error.message}`, 'error');
        throw new Error(`Erro na API Mistral: ${error.response.data?.error?.message || error.message}`);
      }
      
      // Outros erros
      log(`❌ Erro no serviço Mistral: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Verifica se o servidor local está disponível
   */
  async checkLocalServerHealth(): Promise<boolean> {
    try {
      if (!this.localUrl) return false;
      
      const response = await axios.get(`${this.localUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      log(`❌ Servidor Mistral local não disponível: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Verifica se a API oficial está disponível
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      if (!this.apiKey) return false;
      
      const response = await axios.get(`${this.apiBaseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      log(`❌ API Mistral não disponível: ${error}`, 'error');
      return false;
    }
  }
}

// Exporta uma instância única do serviço
export const mistralService = new MistralService();