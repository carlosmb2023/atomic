import { db } from "../db";
import { SystemConfig, systemConfig } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "../vite";

/**
 * Serviço para gerenciar as configurações do sistema
 */
export class ConfigService {
  private static instance: ConfigService;
  private configCache: SystemConfig | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 30 * 1000; // 30 segundos

  private constructor() {}

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Obtém a configuração atual do sistema
   * @param forceRefresh Se true, ignora o cache e busca do banco
   */
  public async getConfig(forceRefresh = false): Promise<SystemConfig | null> {
    const now = Date.now();

    // Se o cache estiver válido e não forçar atualização, retorna o cache
    if (
      this.configCache &&
      !forceRefresh &&
      now - this.lastFetchTime < this.CACHE_DURATION_MS
    ) {
      return this.configCache;
    }

    try {
      // Busca a configuração mais recente no banco de dados pelo ID mais alto
      const configs = await db.select()
        .from(systemConfig)
        .orderBy(sql`${systemConfig.id} DESC`)
        .limit(1);
      
      if (configs.length === 0) {
        log("Nenhuma configuração encontrada no banco de dados");
        return null;
      }

      // Atualiza o cache
      this.configCache = configs[0];
      this.lastFetchTime = now;
      
      // Log para debug
      if (this.configCache) {
        console.log("Configuração carregada do banco:", {
          id: this.configCache.id,
          mistral_api_key: this.configCache.mistral_api_key ? "***" : undefined,
          mistral_instance_type: this.configCache.mistral_instance_type
        });
      }
      
      return this.configCache;
    } catch (error) {
      log(`Erro ao buscar configuração: ${error}`);
      return this.configCache; // Retorna o cache antigo em caso de erro
    }
  }

  /**
   * Atualiza as configurações do sistema
   * @param configData Dados parciais ou completos da configuração
   * @param userId ID do usuário que fez a atualização
   */
  public async updateConfig(configData: Partial<SystemConfig>, userId?: number): Promise<SystemConfig | null> {
    try {
      // Se não houver configuração inicial, cria uma
      const currentConfig = await this.getConfig(true);
      
      if (!currentConfig) {
        // Cria uma configuração inicial com valores padrão + os dados fornecidos
        const newConfig = await db.insert(systemConfig).values({
          execution_mode: 'local',
          local_llm_url: 'http://127.0.0.1:11434',
          cloud_llm_url: 'https://oracle-api.carlosdev.app.br',
          active_llm_url: 'http://127.0.0.1:11434',
          mistral_local_url: 'http://127.0.0.1:8000',
          mistral_cloud_url: 'https://api.mistral.ai/v1',
          mistral_instance_type: 'oracle_arm',
          base_prompt: 'Você é um assistente útil e profissional que responde de maneira concisa e clara.',
          logs_enabled: true,
          ...configData,
          updated_by: userId,
          updated_at: new Date()
        }).returning();
        
        this.configCache = newConfig[0];
        this.lastFetchTime = Date.now();
        
        // Log para debug
        if (this.configCache) {
          console.log("Nova configuração criada:", {
            id: this.configCache.id,
            mistral_api_key: this.configCache.mistral_api_key ? "***" : undefined,
            mistral_instance_type: this.configCache.mistral_instance_type
          });
        }
        
        return this.configCache;
      }
      
      // Atualiza a configuração existente mais recente
      const updated = await db.update(systemConfig)
        .set({
          ...configData,
          updated_by: userId,
          updated_at: new Date()
        })
        .where(eq(systemConfig.id, currentConfig.id))
        .returning();
      
      if (updated.length === 0) {
        log("Nenhuma configuração foi atualizada");
        return null;
      }
      
      // Atualiza o cache
      this.configCache = updated[0];
      this.lastFetchTime = Date.now();
      
      // Log para debug
      if (this.configCache) {
        console.log("Configuração atualizada:", {
          id: this.configCache.id,
          mistral_api_key: this.configCache.mistral_api_key ? "***" : undefined,
          mistral_instance_type: this.configCache.mistral_instance_type,
          ...configData
        });
      }
      
      return this.configCache;
    } catch (error) {
      log(`Erro ao atualizar configuração: ${error}`);
      return null;
    }
  }

  /**
   * Troca o modo de execução (local/cloud) e atualiza a URL ativa
   * @param mode Modo de execução ('local' ou 'cloud')
   * @param userId ID do usuário que fez a alteração
   */
  public async switchExecutionMode(mode: 'local' | 'cloud', userId?: number): Promise<SystemConfig | null> {
    try {
      const config = await this.getConfig(true);
      if (!config) return null;
      
      const activeUrl = mode === 'local' ? config.local_llm_url : config.cloud_llm_url;
      
      return this.updateConfig({
        execution_mode: mode,
        active_llm_url: activeUrl
      }, userId);
    } catch (error) {
      log(`Erro ao trocar modo de execução: ${error}`);
      return null;
    }
  }

  /**
   * Atualiza o IP da instância Oracle e a URL da nuvem
   * @param instanceIp IP da instância Oracle
   * @param userId ID do usuário que fez a alteração
   */
  public async updateOracleInstance(instanceIp: string, userId?: number): Promise<SystemConfig | null> {
    try {
      // Forma a URL da nuvem com o IP novo
      const cloudUrl = `http://${instanceIp}:11434`;
      
      const updated = await this.updateConfig({
        oracle_instance_ip: instanceIp,
        cloud_llm_url: cloudUrl
      }, userId);
      
      // Se o modo atual for 'cloud', atualiza também a URL ativa
      if (updated && updated.execution_mode === 'cloud') {
        return this.updateConfig({
          active_llm_url: cloudUrl
        }, userId);
      }
      
      return updated;
    } catch (error) {
      log(`Erro ao atualizar instância Oracle: ${error}`);
      return null;
    }
  }

  /**
   * Configura o Mistral na instância Oracle
   * @param instanceIp IP da instância Oracle
   * @param instanceType Tipo de instância (oracle_arm, oracle_x86, etc.)
   * @param userId ID do usuário que fez a alteração
   */
  public async configureMistralOracle(
    instanceIp: string, 
    instanceType: string = 'oracle_arm', 
    userId?: number
  ): Promise<SystemConfig | null> {
    try {
      // Forma a URL do Mistral Cloud baseada no IP da instância Oracle
      const mistralCloudUrl = `http://${instanceIp}:8000`;
      
      return this.updateConfig({
        oracle_instance_ip: instanceIp,
        mistral_cloud_url: mistralCloudUrl,
        mistral_instance_type: instanceType
      }, userId);
    } catch (error) {
      log(`Erro ao configurar Mistral na Oracle Cloud: ${error}`);
      return null;
    }
  }

  /**
   * Configura o Mistral local
   * @param localUrl URL do Mistral local
   * @param userId ID do usuário que fez a alteração
   */
  public async configureMistralLocal(localUrl: string, userId?: number): Promise<SystemConfig | null> {
    try {
      return this.updateConfig({
        mistral_local_url: localUrl
      }, userId);
    } catch (error) {
      log(`Erro ao configurar Mistral local: ${error}`);
      return null;
    }
  }
}