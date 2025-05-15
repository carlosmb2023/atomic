/**
 * Serviço de Cache Contextual com Embeddings para o Agente Mistral
 * ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918
 * 
 * Este serviço implementa um sistema de cache inteligente usando embeddings de texto
 * para armazenar e recuperar contextos similares, melhorando a consistência e
 * eficiência das respostas do agente.
 */

import { storage } from '../storage';
import * as tf from '@tensorflow/tfjs-node';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Interface para configuração do cache contextual
interface ContextCacheConfig {
  enabled: boolean;
  maxCacheSize: number; // Número máximo de entradas no cache
  similarityThreshold: number; // Limiar para considerar contextos similares (0-1)
  embeddingDimension: number; // Dimensão dos vetores de embedding
  cacheTTLDays: number; // Tempo de vida das entradas em dias
  enableUserSpecificCache: boolean; // Cache específico por usuário
  prioritizeMostRecent: boolean; // Priorizar contextos mais recentes
  contextWindowSize: number; // Número de mensagens para manter no contexto
}

// Interface para entrada no cache
interface CacheEntry {
  id: string;
  userId: number | null;
  agentId: string;
  query: string;
  queryEmbedding: number[];
  response: string;
  context: {
    previousMessages: {
      role: 'user' | 'assistant';
      content: string;
    }[];
    systemPrompt: string | null;
  };
  metadata: {
    category: string | null;
    timestamp: Date;
    tokensUsed: number;
    processingTime: number;
  };
  usageCount: number;
  lastUsed: Date;
  created: Date;
}

// Enum para estratégias de recuperação de contexto
enum ContextRetrievalStrategy {
  MOST_SIMILAR = 'most_similar',
  MOST_RECENT = 'most_recent',
  HYBRID = 'hybrid'
}

// Classe principal do cache contextual
export class ContextCacheService {
  private config: ContextCacheConfig;
  private initialized: boolean = false;
  private embedModel: tf.LayersModel | null = null;
  
  // Cache em memória - em produção seria substituído por uma solução de embedding database como Pinecone
  private cache: Map<string, CacheEntry[]> = new Map();
  
  constructor() {
    // Configuração padrão
    this.config = {
      enabled: true,
      maxCacheSize: 1000,
      similarityThreshold: 0.85,
      embeddingDimension: 512,
      cacheTTLDays: 30,
      enableUserSpecificCache: true,
      prioritizeMostRecent: true,
      contextWindowSize: 10
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
      if (systemConfig && systemConfig.context_cache_config) {
        try {
          this.config = JSON.parse(systemConfig.context_cache_config);
        } catch (e) {
          console.error('Erro ao analisar configuração de cache contextual:', e);
        }
      }
      
      // Inicializar modelo de embeddings
      await this.initEmbeddingModel();
      
      // Carregar cache do armazenamento persistente (simplificado)
      await this.loadCacheFromStorage();
      
      this.initialized = true;
      console.log('🧠 Serviço de cache contextual inicializado');
    } catch (error) {
      console.error('Erro ao inicializar serviço de cache contextual:', error);
    }
  }
  
  /**
   * Inicializa modelo para geração de embeddings
   */
  private async initEmbeddingModel(): Promise<void> {
    try {
      // Em uma implementação real, usaríamos um modelo pré-treinado específico para embeddings
      // Aqui usamos um modelo simples para demonstração
      const model = tf.sequential();
      
      model.add(tf.layers.embedding({
        inputDimension: 10000, // Vocabulário
        outputDimension: this.config.embeddingDimension,
        inputLength: 100 // Comprimento máximo de sequência
      }));
      
      model.add(tf.layers.globalAveragePooling1d());
      
      this.embedModel = model;
    } catch (error) {
      console.error('Erro ao inicializar modelo de embeddings:', error);
    }
  }
  
  /**
   * Carrega cache do armazenamento persistente
   */
  private async loadCacheFromStorage(): Promise<void> {
    // Em uma implementação real, carregaria do banco de dados
    // Aqui apenas inicializamos o cache vazio
    this.cache.clear();
  }
  
  /**
   * Gera embedding para um texto
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Em uma implementação real, usaríamos o modelo para gerar embeddings
    // Aqui usamos uma função hash como aproximação simples
    
    if (!this.embedModel) {
      return this.generateSimpleEmbedding(text);
    }
    
    try {
      // Tokenização e preparação da entrada (simplificado)
      const tokens = text.toLowerCase().split(/\s+/).slice(0, 100);
      const inputArray = new Array(100).fill(0);
      
      for (let i = 0; i < tokens.length && i < 100; i++) {
        const hash = createHash('sha256').update(tokens[i]).digest('hex');
        const tokenId = parseInt(hash.substring(0, 8), 16) % 10000;
        inputArray[i] = tokenId;
      }
      
      // Gerar embedding
      const inputTensor = tf.tensor2d([inputArray]);
      const embeddingTensor = this.embedModel.predict(inputTensor) as tf.Tensor;
      const embedding = await embeddingTensor.data();
      
      // Limpeza
      inputTensor.dispose();
      embeddingTensor.dispose();
      
      // Converter para array regular
      return Array.from(embedding);
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      return this.generateSimpleEmbedding(text);
    }
  }
  
  /**
   * Gera um embedding simples para fallback
   */
  private generateSimpleEmbedding(text: string): number[] {
    // Versão simplificada para backup - não eficiente para similaridade real
    const hash = createHash('sha256').update(text).digest('hex');
    const embedding = new Array(this.config.embeddingDimension).fill(0);
    
    // Usar bytes do hash para preencher o embedding
    for (let i = 0; i < Math.min(hash.length / 2, this.config.embeddingDimension); i++) {
      const byteValue = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
      embedding[i] = (byteValue / 255) * 2 - 1; // Normalizar para [-1, 1]
    }
    
    return embedding;
  }
  
  /**
   * Calcula similaridade entre dois embeddings
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    // Implementação do cosseno de similaridade
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const len = Math.min(embedding1.length, embedding2.length);
    
    for (let i = 0; i < len; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (norm1 * norm2);
  }
  
  /**
   * Busca no cache por contextos similares
   */
  public async findSimilarContext(
    query: string,
    userId: number | null = null,
    agentId: string = 'ag:48009b45:20250515:programador-agente:d9bb1918',
    strategy: ContextRetrievalStrategy = ContextRetrievalStrategy.HYBRID
  ): Promise<{
    found: boolean;
    entry?: CacheEntry;
    similarity?: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.config.enabled) {
      return { found: false };
    }
    
    try {
      // Gerar embedding para a consulta
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Chave de cache para o agente/usuário
      const cacheKey = this.getCacheKey(userId, agentId);
      
      // Obter entradas do cache
      const entries = this.cache.get(cacheKey) || [];
      if (entries.length === 0) {
        return { found: false };
      }
      
      let bestMatch: CacheEntry | null = null;
      let highestSimilarity = 0;
      
      // Estratégia baseada na configuração
      if (strategy === ContextRetrievalStrategy.MOST_RECENT) {
        // Ordenar por data (mais recente primeiro)
        const sortedEntries = [...entries].sort((a, b) => 
          b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime()
        );
        
        // Verificar similaridade apenas para as entradas mais recentes
        const recentEntries = sortedEntries.slice(0, 10);
        
        for (const entry of recentEntries) {
          const similarity = this.calculateSimilarity(queryEmbedding, entry.queryEmbedding);
          if (similarity > this.config.similarityThreshold && similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = entry;
          }
        }
      } else if (strategy === ContextRetrievalStrategy.MOST_SIMILAR) {
        // Buscar a entrada mais similar
        for (const entry of entries) {
          const similarity = this.calculateSimilarity(queryEmbedding, entry.queryEmbedding);
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = entry;
          }
        }
        
        // Verificar se atende ao limiar de similaridade
        if (highestSimilarity < this.config.similarityThreshold) {
          bestMatch = null;
        }
      } else {
        // Estratégia híbrida
        // Calcular score para cada entrada combinando similaridade e recência
        const now = new Date().getTime();
        let bestScore = 0;
        
        for (const entry of entries) {
          const similarity = this.calculateSimilarity(queryEmbedding, entry.queryEmbedding);
          if (similarity < this.config.similarityThreshold / 2) continue;
          
          // Calcular fator de recência (0-1, com 1 sendo mais recente)
          const ageMs = now - entry.metadata.timestamp.getTime();
          const ageDays = ageMs / (1000 * 60 * 60 * 24);
          const recencyFactor = Math.max(0, 1 - (ageDays / this.config.cacheTTLDays));
          
          // Calcular score combinado (70% similaridade, 30% recência)
          const score = similarity * 0.7 + recencyFactor * 0.3;
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
            highestSimilarity = similarity;
          }
        }
        
        // Verificar se o score é bom o suficiente
        if (bestScore < this.config.similarityThreshold * 0.7) {
          bestMatch = null;
        }
      }
      
      if (bestMatch) {
        // Atualizar estatísticas de uso
        bestMatch.usageCount++;
        bestMatch.lastUsed = new Date();
        
        return {
          found: true,
          entry: bestMatch,
          similarity: highestSimilarity
        };
      }
      
      return { found: false };
    } catch (error) {
      console.error('Erro ao buscar contexto similar:', error);
      return { found: false };
    }
  }
  
  /**
   * Adiciona uma nova entrada ao cache
   */
  public async addToCache(
    query: string,
    response: string,
    userId: number | null = null,
    agentId: string = 'ag:48009b45:20250515:programador-agente:d9bb1918',
    options: {
      previousMessages?: { role: 'user' | 'assistant', content: string }[];
      systemPrompt?: string;
      category?: string;
      tokensUsed?: number;
      processingTime?: number;
    } = {}
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.config.enabled) {
      return false;
    }
    
    try {
      // Gerar embedding para a consulta
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Criar nova entrada
      const entry: CacheEntry = {
        id: uuidv4(),
        userId,
        agentId,
        query,
        queryEmbedding,
        response,
        context: {
          previousMessages: options.previousMessages || [],
          systemPrompt: options.systemPrompt || null
        },
        metadata: {
          category: options.category || null,
          timestamp: new Date(),
          tokensUsed: options.tokensUsed || 0,
          processingTime: options.processingTime || 0
        },
        usageCount: 1,
        lastUsed: new Date(),
        created: new Date()
      };
      
      // Chave de cache para o agente/usuário
      const cacheKey = this.getCacheKey(userId, agentId);
      
      // Obter ou criar lista de entradas
      let entries = this.cache.get(cacheKey) || [];
      
      // Adicionar nova entrada
      entries.push(entry);
      
      // Verificar tamanho do cache
      if (entries.length > this.config.maxCacheSize) {
        // Ordenar por uso (menos usado primeiro) e depois por data (mais antigo primeiro)
        entries.sort((a, b) => {
          if (a.usageCount !== b.usageCount) {
            return a.usageCount - b.usageCount;
          }
          return a.created.getTime() - b.created.getTime();
        });
        
        // Remover entradas excedentes
        entries = entries.slice(entries.length - this.config.maxCacheSize);
      }
      
      // Atualizar cache
      this.cache.set(cacheKey, entries);
      
      // Em uma implementação real, persistir no armazenamento
      // await this.persistCacheEntry(entry);
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar ao cache:', error);
      return false;
    }
  }
  
  /**
   * Aplica contexto recuperado do cache à consulta atual
   */
  public async applyContextToQuery(
    query: string,
    cachedEntry: CacheEntry
  ): Promise<{
    enhancedPrompt: string;
    context: string;
  }> {
    try {
      // Construir contexto a partir das mensagens anteriores
      let contextString = '';
      
      // Adicionar mensagens anteriores
      const previousMessages = cachedEntry.context.previousMessages.slice(-this.config.contextWindowSize);
      if (previousMessages.length > 0) {
        contextString += 'Contexto da conversa anterior:\n\n';
        for (const msg of previousMessages) {
          contextString += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}\n\n`;
        }
      }
      
      // Adicionar informação sobre a resposta anterior
      contextString += `Em uma consulta similar ("${cachedEntry.query.substring(0, this.trimQueryLength(cachedEntry.query))}"), a resposta foi:\n\n${cachedEntry.response}\n\n`;
      
      // Criar prompt aprimorado
      const enhancedPrompt = `
${contextString}

Aplicando o contexto acima, responda à seguinte consulta:
${query}

Para consistência, considere o contexto fornecido e a abordagem das respostas anteriores.
`.trim();
      
      return {
        enhancedPrompt,
        context: contextString
      };
    } catch (error) {
      console.error('Erro ao aplicar contexto à consulta:', error);
      return {
        enhancedPrompt: query,
        context: ''
      };
    }
  }
  
  /**
   * Limita o comprimento da consulta para exibição
   */
  private trimQueryLength(query: string, maxLength: number = 100): number {
    return Math.min(query.length, maxLength);
  }
  
  /**
   * Gera chave para o cache
   */
  private getCacheKey(userId: number | null, agentId: string): string {
    if (this.config.enableUserSpecificCache && userId !== null) {
      return `${userId}-${agentId}`;
    }
    return `global-${agentId}`;
  }
  
  /**
   * Limpa entradas expiradas do cache
   */
  public async cleanExpiredEntries(): Promise<number> {
    let removedCount = 0;
    const now = new Date();
    const cacheTTLMs = this.config.cacheTTLDays * 24 * 60 * 60 * 1000;
    
    for (const [key, entries] of this.cache.entries()) {
      const validEntries = entries.filter(entry => {
        const age = now.getTime() - entry.created.getTime();
        return age <= cacheTTLMs;
      });
      
      removedCount += entries.length - validEntries.length;
      
      if (validEntries.length !== entries.length) {
        this.cache.set(key, validEntries);
      }
    }
    
    return removedCount;
  }
  
  /**
   * Atualiza a configuração de cache contextual
   */
  public async updateConfig(newConfig: Partial<ContextCacheConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Salvar no armazenamento
      const systemConfig = await storage.getSystemConfig();
      
      if (systemConfig) {
        await storage.updateSystemConfig({
          context_cache_config: JSON.stringify(this.config)
        });
      } else {
        // Criar nova configuração
        await storage.updateSystemConfig({
          id: 1,
          context_cache_config: JSON.stringify(this.config)
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração de cache contextual:', error);
      return false;
    }
  }
  
  /**
   * Obter estatísticas atuais do cache
   */
  public getCacheStats(): {
    totalEntries: number;
    entriesByAgent: Record<string, number>;
    averageUsageCount: number;
    memoryUsageEstimate: number;
  } {
    let totalEntries = 0;
    const entriesByAgent: Record<string, number> = {};
    let totalUsageCount = 0;
    
    for (const [key, entries] of this.cache.entries()) {
      totalEntries += entries.length;
      
      // Extrair ID do agente da chave
      const agentId = key.split('-').slice(1).join('-');
      entriesByAgent[agentId] = (entriesByAgent[agentId] || 0) + entries.length;
      
      // Somar contagens de uso
      for (const entry of entries) {
        totalUsageCount += entry.usageCount;
      }
    }
    
    // Estimar uso de memória (KB) - aproximação bem grosseira
    const averageEntrySize = 5; // ~5KB por entrada
    const memoryUsageEstimate = totalEntries * averageEntrySize;
    
    return {
      totalEntries,
      entriesByAgent,
      averageUsageCount: totalEntries > 0 ? totalUsageCount / totalEntries : 0,
      memoryUsageEstimate
    };
  }
  
  /**
   * Obter configuração atual
   */
  public getConfig(): ContextCacheConfig {
    return { ...this.config };
  }
}

// Instância singleton do serviço
export const contextCacheService = new ContextCacheService();