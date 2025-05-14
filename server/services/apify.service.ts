import { ConfigService } from "./config.service";
import { db } from "../db";
import { InsertLlmLog, llmLogs } from "../../shared/schema";
import { log } from "../vite";

/**
 * Resultados da busca com o Apify Actor
 */
export interface ApifySearchResult {
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  source: string;
  date?: string;
}

/**
 * Interface para configuração da chamada ao Apify
 */
interface ApifyRequestConfig {
  userId?: number;
  maxResults?: number;
  timeout?: number;
}

/**
 * Serviço para interagir com o Actor Apify
 */
export class ApifyService {
  private static instance: ApifyService;
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): ApifyService {
    if (!ApifyService.instance) {
      ApifyService.instance = new ApifyService();
    }
    return ApifyService.instance;
  }

  /**
   * Executa uma busca via Apify Actor
   * @param query Texto da consulta de busca
   * @param config Configurações adicionais
   */
  public async search(query: string, config: ApifyRequestConfig = {}): Promise<ApifySearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Obtém a configuração com a URL e API key do Apify
      const systemConfig = await this.configService.getConfig();
      if (!systemConfig) {
        throw new Error("Configuração do sistema não encontrada");
      }
      
      const apifyUrl = systemConfig.apify_actor_url;
      const apifyKey = systemConfig.apify_api_key;
      
      if (!apifyUrl) {
        throw new Error("URL do Apify Actor não configurada");
      }
      
      if (!apifyKey) {
        throw new Error("API Key do Apify não configurada");
      }
      
      // Faz a chamada para o Apify Actor
      const response = await fetch(apifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apifyKey}`
        },
        body: JSON.stringify({
          query: query,
          maxResults: config.maxResults || 10
        }),
        signal: AbortSignal.timeout(config.timeout || 60000) // 60 segundos timeout por padrão
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do Apify: ${await response.text()}`);
      }
      
      const results = await response.json();
      
      // Registra o log da chamada
      await this.logApifyCall({
        prompt: query,
        response: JSON.stringify(results),
        source: 'apify',
        user_id: config.userId,
        response_time_ms: Date.now() - startTime,
        status: 'success',
        metadata: JSON.stringify(config)
      });
      
      return Array.isArray(results) ? results : [];
    } catch (error) {
      const errorMsg = `Erro ao buscar no Apify: ${error}`;
      log(errorMsg);
      
      // Registra o erro
      await this.logApifyCall({
        prompt: query,
        source: 'apify',
        user_id: config.userId,
        response_time_ms: Date.now() - startTime,
        status: 'error',
        error_message: errorMsg,
        metadata: JSON.stringify(config)
      });
      
      return [];
    }
  }
  
  /**
   * Registra uma chamada ao Apify no banco de dados
   */
  private async logApifyCall(logData: Partial<InsertLlmLog>): Promise<void> {
    try {
      const systemConfig = await this.configService.getConfig();
      
      // Se logs estiverem desativados nas configurações, não registra
      if (systemConfig && !systemConfig.logs_enabled) {
        return;
      }
      
      await db.insert(llmLogs).values(logData);
    } catch (error) {
      log(`Erro ao registrar log de Apify: ${error}`);
    }
  }
}