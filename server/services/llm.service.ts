import { ConfigService } from "./config.service";
import { db } from "../db";
import { InsertLlmLog, llmLogs, insertDailyMetricsSchema, LlmLog, dailyMetrics } from "../../shared/schema";
import { log } from "../vite";
import { eq } from "drizzle-orm";

/**
 * Interface para configuração da chamada ao LLM 
 */
interface LlmRequestConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  userId?: number;
  systemPrompt?: string;
}

/**
 * Interface para o resultado da chamada ao LLM
 */
interface LlmResponse {
  success: boolean;
  text?: string;
  source: 'local' | 'cloud' | 'fallback';
  error?: string;
  tokens?: number;
  responseTimeMs: number;
}

/**
 * Serviço para interagir com os modelos LLM (Mistral)
 */
export class LlmService {
  private static instance: LlmService;
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): LlmService {
    if (!LlmService.instance) {
      LlmService.instance = new LlmService();
    }
    return LlmService.instance;
  }

  /**
   * Envia uma requisição para o LLM com fallback automático
   * @param prompt Texto a ser enviado para o modelo
   * @param config Configurações adicionais
   */
  public async sendPrompt(prompt: string, config: LlmRequestConfig = {}): Promise<LlmResponse> {
    const startTime = Date.now();
    let source: 'local' | 'cloud' | 'fallback' = 'local';
    let response: LlmResponse;
    
    try {
      // Obtém a configuração atual
      const systemConfig = await this.configService.getConfig();
      if (!systemConfig) {
        throw new Error("Configuração do sistema não encontrada");
      }
      
      // Define a URL com base no modo de execução 
      const primaryUrl = systemConfig.active_llm_url;
      let url: string;
      
      if (systemConfig.execution_mode === 'local') {
        url = systemConfig.local_llm_url;
        source = 'local';
      } else {
        url = systemConfig.cloud_llm_url;
        source = 'cloud';
      }
      
      const systemPrompt = config.systemPrompt || systemConfig.base_prompt;
      
      // Tenta fazer a requisição para a URL primária
      try {
        response = await this.callLlmApi(url, prompt, systemPrompt, config);
        response.source = source;
      } catch (error) {
        log(`Erro na conexão primária (${source}), tentando fallback: ${error}`);
        
        // Fallback: se estava usando local, tenta cloud e vice-versa
        const fallbackUrl = systemConfig.execution_mode === 'local' 
          ? systemConfig.cloud_llm_url 
          : systemConfig.local_llm_url;
        
        source = 'fallback';
        response = await this.callLlmApi(fallbackUrl, prompt, systemPrompt, config);
        response.source = source;
        
        // Atualiza a URL ativa no banco para usar o fallback a partir de agora
        await this.configService.updateConfig({ 
          active_llm_url: fallbackUrl 
        });
      }
      
      // Registra o log da chamada
      await this.logLlmCall({
        prompt,
        response: response.text || '',
        source,
        user_id: config.userId,
        tokens_used: response.tokens,
        response_time_ms: Date.now() - startTime,
        status: response.success ? 'success' : 'error',
        error_message: response.error,
        metadata: JSON.stringify(config)
      });

      // Atualiza as métricas diárias
      await this.updateDailyMetrics({
        source,
        success: response.success,
        tokens: response.tokens || 0,
        responseTime: Date.now() - startTime
      });
      
      return response;
    } catch (error) {
      const errorMsg = `Erro ao processar requisição LLM: ${error}`;
      log(errorMsg);
      
      // Registra o erro
      await this.logLlmCall({
        prompt,
        source: source,
        user_id: config.userId,
        response_time_ms: Date.now() - startTime,
        status: 'error',
        error_message: errorMsg,
        metadata: JSON.stringify(config)
      });

      // Atualiza as métricas diárias
      await this.updateDailyMetrics({
        source,
        success: false,
        tokens: 0,
        responseTime: Date.now() - startTime
      });
      
      return {
        success: false,
        source,
        error: errorMsg,
        responseTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Faz a chamada HTTP para a API do LLM
   */
  private async callLlmApi(
    baseUrl: string, 
    prompt: string, 
    systemPrompt: string,
    config: LlmRequestConfig
  ): Promise<LlmResponse> {
    const startTime = Date.now();
    const model = config.model || 'mistral';
    const url = `${baseUrl}/api/generate`;
    
    try {
      // Verifica se a instância está acessível
      const healthCheck = await fetch(`${baseUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      
      if (!healthCheck.ok) {
        throw new Error(`Instância indisponível: ${await healthCheck.text()}`);
      }
      
      // Faz a chamada para o modelo
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          system: systemPrompt,
          stream: config.stream || false,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000
        }),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do LLM: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        text: data.response,
        tokens: data.eval_count || data.tokens || 0,
        responseTimeMs: Date.now() - startTime
      };
    } catch (error) {
      log(`Erro ao chamar API do LLM: ${error}`);
      throw error;
    }
  }

  /**
   * Registra uma chamada ao LLM no banco de dados
   */
  private async logLlmCall(logData: Partial<InsertLlmLog>): Promise<LlmLog | null> {
    try {
      const systemConfig = await this.configService.getConfig();
      
      // Se logs estiverem desativados nas configurações, não registra
      if (systemConfig && !systemConfig.logs_enabled) {
        return null;
      }
      
      const result = await db.insert(llmLogs).values(logData).returning();
      return result[0] || null;
    } catch (error) {
      log(`Erro ao registrar log de LLM: ${error}`);
      return null;
    }
  }

  /**
   * Atualiza as métricas diárias do uso de LLM
   */
  private async updateDailyMetrics(metrics: {
    source: string;
    success: boolean;
    tokens: number;
    responseTime: number;
  }): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Busca as métricas do dia
      const existingMetrics = await db.select()
        .from(dailyMetrics)
        .where(eq(dailyMetrics.date, today))
        .limit(1);
      
      if (existingMetrics.length === 0) {
        // Cria um novo registro para o dia
        const newMetrics = {
          date: today,
          total_requests: 1,
          total_tokens: metrics.tokens,
          successful_requests: metrics.success ? 1 : 0,
          failed_requests: metrics.success ? 0 : 1,
          avg_response_time: metrics.responseTime,
          local_requests: metrics.source === 'local' ? 1 : 0,
          cloud_requests: metrics.source === 'cloud' ? 1 : 0,
          apify_requests: metrics.source === 'apify' ? 1 : 0,
        };
        
        await db.insert(dailyMetrics).values(newMetrics);
      } else {
        // Atualiza o registro existente
        const current = existingMetrics[0];
        const totalRequests = current.total_requests + 1;
        const totalTime = (current.avg_response_time * current.total_requests) + metrics.responseTime;
        const newAvgTime = totalTime / totalRequests;
        
        const updates = {
          total_requests: totalRequests,
          total_tokens: current.total_tokens + metrics.tokens,
          successful_requests: current.successful_requests + (metrics.success ? 1 : 0),
          failed_requests: current.failed_requests + (metrics.success ? 0 : 1),
          avg_response_time: newAvgTime,
          local_requests: current.local_requests + (metrics.source === 'local' ? 1 : 0),
          cloud_requests: current.cloud_requests + (metrics.source === 'cloud' ? 1 : 0),
          apify_requests: current.apify_requests + (metrics.source === 'apify' ? 1 : 0),
          updated_at: new Date()
        };
        
        await db.update(dailyMetrics)
          .set(updates)
          .where(eq(dailyMetrics.id, current.id));
      }
    } catch (error) {
      log(`Erro ao atualizar métricas diárias: ${error}`);
    }
  }
}