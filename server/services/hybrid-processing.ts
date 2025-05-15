/**
 * Serviço de Processamento Híbrido para o Agente Mistral
 * ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918
 * 
 * Este serviço implementa um sistema inteligente para decidir automaticamente
 * entre o processamento local e na nuvem, otimizando desempenho e custo.
 */

import { mistralService } from './mistral.service';
import { storage } from '../storage';
import * as tf from '@tensorflow/tfjs-node';
import { createHash } from 'crypto';

// Interface para configuração do processamento híbrido
interface HybridProcessingConfig {
  localModelEnabled: boolean;
  apiModelEnabled: boolean;
  complexityThreshold: number;
  maxLocalTokens: number;
  tokenBudget: number;
  costSensitivity: number;
  preferLocalForPrivacy: boolean;
  localLatencyThreshold: number;
  apiLatencyThreshold: number;
}

// Interface para estatísticas de processamento
interface ProcessingStats {
  localRequestCount: number;
  apiRequestCount: number;
  localTokensUsed: number;
  apiTokensUsed: number;
  localAvgLatency: number;
  apiAvgLatency: number;
  totalCost: number;
  lastUpdated: Date;
}

// Enum para tipos de processamento
enum ProcessingType {
  LOCAL = 'local',
  API = 'api',
  HYBRID = 'hybrid'
}

// Classe principal do processamento híbrido
export class HybridProcessingService {
  private config: HybridProcessingConfig;
  private stats: ProcessingStats;
  private initialized: boolean = false;
  private complexityModel: tf.LayersModel | null = null;
  
  // Cache para decisões recentes
  private decisionCache: Map<string, ProcessingType> = new Map();
  
  constructor() {
    // Configuração padrão
    this.config = {
      localModelEnabled: true,
      apiModelEnabled: true,
      complexityThreshold: 0.7,
      maxLocalTokens: 1000,
      tokenBudget: 10000,
      costSensitivity: 0.8,
      preferLocalForPrivacy: true,
      localLatencyThreshold: 5000, // 5 segundos
      apiLatencyThreshold: 2000 // 2 segundos
    };
    
    // Estatísticas iniciais
    this.stats = {
      localRequestCount: 0,
      apiRequestCount: 0,
      localTokensUsed: 0,
      apiTokensUsed: 0,
      localAvgLatency: 0,
      apiAvgLatency: 0,
      totalCost: 0,
      lastUpdated: new Date()
    };
    
    this.initialize();
  }
  
  /**
   * Inicializa o serviço
   */
  private async initialize(): Promise<void> {
    try {
      // Carregar configuração do armazenamento persistente
      const systemConfig = await storage.getSystemConfig();
      if (systemConfig && systemConfig.hybrid_processing_config) {
        try {
          this.config = JSON.parse(systemConfig.hybrid_processing_config);
        } catch (e) {
          console.error('Erro ao analisar configuração de processamento híbrido:', e);
        }
      }
      
      // Carregar estatísticas anteriores se disponíveis
      const dailyMetrics = await storage.getDailyMetrics(new Date());
      if (dailyMetrics && dailyMetrics.processing_stats) {
        try {
          this.stats = JSON.parse(dailyMetrics.processing_stats);
        } catch (e) {
          console.error('Erro ao analisar estatísticas de processamento:', e);
        }
      }
      
      // Inicializar modelo de complexidade para classificação de consultas
      await this.initComplexityModel();
      
      this.initialized = true;
      console.log('🔄 Serviço de processamento híbrido inicializado');
    } catch (error) {
      console.error('Erro ao inicializar serviço de processamento híbrido:', error);
    }
  }
  
  /**
   * Inicializa modelo para determinar a complexidade da consulta
   */
  private async initComplexityModel(): Promise<void> {
    try {
      // Um modelo simples para classificação de complexidade
      // Em produção, recomenda-se usar um modelo pré-treinado mais sofisticado
      const model = tf.sequential();
      
      model.add(tf.layers.dense({
        units: 16,
        inputShape: [10],
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      this.complexityModel = model;
    } catch (error) {
      console.error('Erro ao inicializar modelo de complexidade:', error);
    }
  }
  
  /**
   * Determina o melhor modo de processamento para uma consulta
   */
  public async determineBestProcessingMode(query: string, options: {
    forceProcessingType?: ProcessingType,
    maxTokens?: number,
    isPrivacySensitive?: boolean
  } = {}): Promise<ProcessingType> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Se há um tipo de processamento forçado, respeitar
    if (options.forceProcessingType) {
      return options.forceProcessingType;
    }
    
    // Gerar hash do query para cache
    const queryHash = this.hashQuery(query);
    
    // Verificar cache
    if (this.decisionCache.has(queryHash)) {
      return this.decisionCache.get(queryHash)!;
    }
    
    // Se algum modo estiver desativado, usar o outro
    if (!this.config.localModelEnabled && this.config.apiModelEnabled) {
      return ProcessingType.API;
    }
    
    if (this.config.localModelEnabled && !this.config.apiModelEnabled) {
      return ProcessingType.LOCAL;
    }
    
    // Se nenhum modo estiver ativado, usar API por padrão
    if (!this.config.localModelEnabled && !this.config.apiModelEnabled) {
      console.warn('Nenhum modo de processamento ativado, usando API por padrão');
      return ProcessingType.API;
    }
    
    // Estimar complexidade da consulta
    const complexity = await this.estimateQueryComplexity(query);
    
    // Estimar número de tokens
    const estimatedTokens = this.estimateTokens(query) + (options.maxTokens || this.config.maxLocalTokens);
    
    // Verificar fatores de decisão
    const isComplexQuery = complexity > this.config.complexityThreshold;
    const exceedsLocalTokenLimit = estimatedTokens > this.config.maxLocalTokens;
    const isPrivacySensitive = options.isPrivacySensitive || this.config.preferLocalForPrivacy;
    
    // Avaliar disponibilidade de recursos
    const mistralStatus = await mistralService.checkStatus();
    const apiAvailable = mistralStatus.api_configured;
    const localAvailable = mistralStatus.local_configured;
    
    // Lógica de decisão
    let processingType: ProcessingType;
    
    if (isComplexQuery || exceedsLocalTokenLimit) {
      // Consultas complexas ou longas vão para API
      processingType = apiAvailable ? ProcessingType.API : ProcessingType.LOCAL;
    } else if (isPrivacySensitive) {
      // Consultas sensíveis à privacidade vão para local se possível
      processingType = localAvailable ? ProcessingType.LOCAL : ProcessingType.API;
    } else {
      // Para outras consultas, considerar estatísticas de latência
      if (this.stats.localAvgLatency <= this.config.localLatencyThreshold && 
          this.stats.localAvgLatency <= this.stats.apiAvgLatency) {
        processingType = ProcessingType.LOCAL;
      } else {
        processingType = ProcessingType.API;
      }
    }
    
    // Adicionar ao cache
    this.decisionCache.set(queryHash, processingType);
    
    // Limitar tamanho do cache
    if (this.decisionCache.size > 1000) {
      // Remover entrada mais antiga
      const firstKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(firstKey);
    }
    
    return processingType;
  }
  
  /**
   * Processa uma consulta usando o melhor modo
   */
  public async processQuery(query: string, options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    forceProcessingType?: ProcessingType;
    isPrivacySensitive?: boolean;
  } = {}): Promise<{
    response: string;
    processingType: ProcessingType;
    latency: number;
    tokensUsed: number;
  }> {
    // Determinar melhor modo de processamento
    const processingType = await this.determineBestProcessingMode(query, {
      forceProcessingType: options.forceProcessingType,
      maxTokens: options.maxTokens,
      isPrivacySensitive: options.isPrivacySensitive
    });
    
    const startTime = Date.now();
    let response: string;
    let tokensUsed: number;
    
    try {
      // Processar de acordo com o modo escolhido
      if (processingType === ProcessingType.API) {
        // Usar API Mistral
        response = await mistralService.sendMessage(query, {
          systemPrompt: options.systemPrompt,
          temperature: options.temperature,
          maxTokens: options.maxTokens
        });
        
        tokensUsed = this.estimateTokens(query) + this.estimateTokens(response);
        this.stats.apiRequestCount++;
        this.stats.apiTokensUsed += tokensUsed;
        
        // Atualizar latência média da API
        const latency = Date.now() - startTime;
        this.stats.apiAvgLatency = this.updateRunningAverage(
          this.stats.apiAvgLatency, 
          latency, 
          this.stats.apiRequestCount
        );
      } else {
        // Usar serviço local
        response = await mistralService.sendMessage(query, {
          systemPrompt: options.systemPrompt,
          temperature: options.temperature,
          maxTokens: options.maxTokens
        });
        
        tokensUsed = this.estimateTokens(query) + this.estimateTokens(response);
        this.stats.localRequestCount++;
        this.stats.localTokensUsed += tokensUsed;
        
        // Atualizar latência média local
        const latency = Date.now() - startTime;
        this.stats.localAvgLatency = this.updateRunningAverage(
          this.stats.localAvgLatency, 
          latency, 
          this.stats.localRequestCount
        );
      }
      
      // Atualizar estatísticas
      this.stats.lastUpdated = new Date();
      this.updateStats();
      
      // Calcular métricas finais
      const latency = Date.now() - startTime;
      
      return {
        response,
        processingType,
        latency,
        tokensUsed
      };
    } catch (error) {
      console.error(`Erro no processamento ${processingType}:`, error);
      
      // Se houver falha, tentar o modo alternativo
      const fallbackType = processingType === ProcessingType.API ? 
        ProcessingType.LOCAL : ProcessingType.API;
      
      try {
        console.log(`Tentando fallback para ${fallbackType}`);
        
        // Tenta modo fallback
        if (fallbackType === ProcessingType.API) {
          response = await mistralService.sendMessage(query, {
            systemPrompt: options.systemPrompt,
            temperature: options.temperature,
            maxTokens: options.maxTokens
          });
        } else {
          response = await mistralService.sendMessage(query, {
            systemPrompt: options.systemPrompt,
            temperature: options.temperature,
            maxTokens: options.maxTokens
          });
        }
        
        tokensUsed = this.estimateTokens(query) + this.estimateTokens(response);
        const latency = Date.now() - startTime;
        
        // Atualizar cache para evitar falhas futuras
        const queryHash = this.hashQuery(query);
        this.decisionCache.set(queryHash, fallbackType);
        
        return {
          response,
          processingType: fallbackType,
          latency,
          tokensUsed
        };
      } catch (fallbackError) {
        console.error('Falha no processamento de fallback:', fallbackError);
        throw new Error('Falha em todos os modos de processamento');
      }
    }
  }
  
  /**
   * Estima a complexidade de uma consulta
   */
  private async estimateQueryComplexity(query: string): Promise<number> {
    try {
      if (!this.complexityModel) {
        // Se o modelo não foi inicializado, usar heurística simples
        return this.estimateComplexityHeuristic(query);
      }
      
      // Vetorizar a consulta
      const features = this.extractQueryFeatures(query);
      const tensor = tf.tensor2d([features]);
      
      // Fazer a previsão
      const prediction = this.complexityModel.predict(tensor) as tf.Tensor;
      const complexity = (await prediction.data())[0];
      
      // Limpeza
      tensor.dispose();
      prediction.dispose();
      
      return complexity;
    } catch (error) {
      console.error('Erro ao estimar complexidade da consulta:', error);
      return this.estimateComplexityHeuristic(query);
    }
  }
  
  /**
   * Extrai características da consulta para análise de complexidade
   */
  private extractQueryFeatures(query: string): number[] {
    // Esta é uma implementação básica
    // Em produção, você usaria NLP mais avançado
    
    // Tokenização básica
    const tokens = query.toLowerCase().split(/\s+/);
    const charCount = query.length;
    const wordCount = tokens.length;
    const avgWordLength = charCount / (wordCount || 1);
    
    // Contar símbolos de código e técnicos
    const codeSymbols = (query.match(/[{}()\[\]<>:;=+\-*/%&|^!~]|if|else|for|while|function|class|import|export|return/g) || []).length;
    
    // Contar padrões complexos
    const jsonPatterns = (query.match(/{.*:.*}/g) || []).length;
    const codeBlocks = (query.match(/```.*```/gs) || []).length;
    const equations = (query.match(/\$.*\$/g) || []).length;
    
    // Detecção de idioma técnico
    const technicalTerms = (query.match(/algorithm|database|system|implementation|architecture|framework|module|interface|protocol|optimization/g) || []).length;
    
    // Comprimento de frase média
    const sentences = query.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = wordCount / (sentences.length || 1);
    
    return [
      charCount / 1000, // Normalizar para escala 0-1 para textos típicos
      wordCount / 100,
      avgWordLength / 10,
      codeSymbols / 20,
      jsonPatterns > 0 ? 1 : 0,
      codeBlocks > 0 ? 1 : 0,
      equations > 0 ? 1 : 0,
      technicalTerms / 5,
      avgSentenceLength / 20,
      sentences.length / 10
    ];
  }
  
  /**
   * Estima complexidade usando heurística simples quando o modelo não está disponível
   */
  private estimateComplexityHeuristic(query: string): number {
    const length = query.length;
    const hasCode = /[{}()\[\];=]|function|class|if|else/.test(query);
    const hasMarkdown = /#{1,6}\s|```|\*\*|__/.test(query);
    const hasTechnicalTerms = /api|database|server|function|algorithm|implementation/.test(query.toLowerCase());
    
    let complexity = 0.3; // Base
    
    // Ajustar com base em comprimento
    if (length > 500) complexity += 0.3;
    else if (length > 200) complexity += 0.15;
    
    // Ajustar com base em conteúdo
    if (hasCode) complexity += 0.3;
    if (hasMarkdown) complexity += 0.1;
    if (hasTechnicalTerms) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }
  
  /**
   * Gera hash de uma consulta para cache
   */
  private hashQuery(query: string): string {
    const hash = createHash('sha256');
    hash.update(query.trim().toLowerCase());
    return hash.digest('hex').substring(0, 16);
  }
  
  /**
   * Atualiza média móvel
   */
  private updateRunningAverage(currentAvg: number, newValue: number, count: number): number {
    if (count <= 1) return newValue;
    return currentAvg + (newValue - currentAvg) / count;
  }
  
  /**
   * Estima o número de tokens em um texto
   */
  private estimateTokens(text: string): number {
    // Estimativa simples: ~1.3 tokens por palavra
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }
  
  /**
   * Atualiza as estatísticas no armazenamento
   */
  private async updateStats(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Atualizar métricas diárias
      await storage.updateDailyMetrics(today, {
        processing_stats: JSON.stringify(this.stats)
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de processamento:', error);
    }
  }
  
  /**
   * Atualiza a configuração de processamento híbrido
   */
  public async updateConfig(newConfig: Partial<HybridProcessingConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Salvar no armazenamento
      const systemConfig = await storage.getSystemConfig();
      
      if (systemConfig) {
        await storage.updateSystemConfig({
          hybrid_processing_config: JSON.stringify(this.config)
        });
      } else {
        // Criar nova configuração
        await storage.updateSystemConfig({
          id: 1,
          hybrid_processing_config: JSON.stringify(this.config)
        });
      }
      
      // Limpar cache de decisões quando a configuração muda
      this.decisionCache.clear();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração de processamento híbrido:', error);
      return false;
    }
  }
  
  /**
   * Obter estatísticas atuais
   */
  public getStats(): ProcessingStats {
    return { ...this.stats };
  }
  
  /**
   * Obter configuração atual
   */
  public getConfig(): HybridProcessingConfig {
    return { ...this.config };
  }
}

// Instância singleton do serviço
export const hybridProcessingService = new HybridProcessingService();