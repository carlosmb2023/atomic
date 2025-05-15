/**
 * Serviço de Fine-tuning para o Agente Mistral
 * ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918
 * 
 * Este serviço implementa capacidades de ajuste fino e personalização do agente
 * com base no histórico de interações e feedback do usuário.
 */

import { storage } from '../storage';
import { mistralService } from './mistral.service';
import * as tf from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
interface FinetuningConfig {
  enabled: boolean;
  feedbackEnabled: boolean;
  adaptivePrompting: boolean;
  promptOptimizationTarget: 'accuracy' | 'creativity' | 'efficiency' | 'balanced';
  basePromptWeight: number;
  userFeedbackWeight: number;
  interactionHistoryWeight: number;
  contextRetentionDays: number;
  minInteractionsForAdaptation: number;
  maxExampleCount: number;
}

interface FeedbackEntry {
  id: string;
  queryId: string;
  userId: number;
  rating: number; // 1-5
  feedback: string | null;
  category: string | null;
  timestamp: Date;
}

interface ExampleInteraction {
  query: string;
  response: string;
  rating: number;
  category: string | null;
  timestamp: Date;
}

interface AgentPersonalization {
  id: number | null;
  agentId: string;
  userId: number | null;
  systemPrompt: string;
  examples: ExampleInteraction[];
  lastUpdated: Date;
}

// Classe principal de fine-tuning
export class AgentFinetuningService {
  private config: FinetuningConfig;
  private initialized: boolean = false;
  
  // Cache de personalizações por usuário/agente
  private personalizationCache: Map<string, AgentPersonalization> = new Map();
  
  constructor() {
    // Configuração padrão
    this.config = {
      enabled: true,
      feedbackEnabled: true,
      adaptivePrompting: true,
      promptOptimizationTarget: 'balanced',
      basePromptWeight: 0.7,
      userFeedbackWeight: 0.15,
      interactionHistoryWeight: 0.15,
      contextRetentionDays: 30,
      minInteractionsForAdaptation: 5,
      maxExampleCount: 10
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
      if (systemConfig && systemConfig.agent_finetuning_config) {
        try {
          this.config = JSON.parse(systemConfig.agent_finetuning_config);
        } catch (e) {
          console.error('Erro ao analisar configuração de fine-tuning:', e);
        }
      }
      
      this.initialized = true;
      console.log('🧠 Serviço de fine-tuning de agente inicializado');
    } catch (error) {
      console.error('Erro ao inicializar serviço de fine-tuning:', error);
    }
  }
  
  /**
   * Aplica fine-tuning para um prompt com base no histórico e feedback
   */
  public async applyFinetuning(
    basePrompt: string,
    userQuery: string,
    userId: number | null = null,
    agentId: string = 'ag:48009b45:20250515:programador-agente:d9bb1918'
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.config.enabled) {
      return basePrompt;
    }
    
    try {
      // Personalização para o agente/usuário específico
      const cacheKey = this.getCacheKey(userId, agentId);
      let personalization = this.personalizationCache.get(cacheKey);
      
      if (!personalization) {
        personalization = await this.loadPersonalization(userId, agentId);
        this.personalizationCache.set(cacheKey, personalization);
      }
      
      // Se não houver interações suficientes, usar prompt base
      if (personalization.examples.length < this.config.minInteractionsForAdaptation) {
        return basePrompt;
      }
      
      // Analisar a consulta para determinar a categoria/contexto
      const queryCategory = await this.analyzeQueryCategory(userQuery);
      
      // Buscar exemplos relevantes com base na categoria
      const relevantExamples = this.selectRelevantExamples(
        personalization.examples,
        queryCategory,
        userQuery,
        this.config.maxExampleCount
      );
      
      // Construir prompt otimizado
      let optimizedPrompt = basePrompt;
      
      // Adicionar exemplos relevantes ao prompt
      if (relevantExamples.length > 0) {
        optimizedPrompt += '\n\nExemplos de interações anteriores:';
        
        for (const example of relevantExamples) {
          optimizedPrompt += `\n\nUsuário: ${example.query}\nAssistente: ${example.response}`;
        }
        
        optimizedPrompt += '\n\nUse essas interações anteriores como referência para melhorar sua resposta, mantendo consistência com o estilo e o formato preferidos do usuário.';
      }
      
      // Adicionar adaptações específicas com base no alvo de otimização
      switch (this.config.promptOptimizationTarget) {
        case 'accuracy':
          optimizedPrompt += '\n\nPriorize a precisão e a corretude da informação acima de tudo. Prefira fornecer menos informação, mas garantir que ela seja correta e bem fundamentada.';
          break;
        case 'creativity':
          optimizedPrompt += '\n\nAdote uma abordagem criativa e inovadora. Explore diferentes perspectivas e apresente ideias originais quando apropriado.';
          break;
        case 'efficiency':
          optimizedPrompt += '\n\nSeja conciso e direto ao ponto. Foque em prover respostas eficientes e práticas que resolvam a questão com economia de palavras.';
          break;
        case 'balanced':
        default:
          optimizedPrompt += '\n\nMantença um equilíbrio entre precisão, criatividade e eficiência, adaptando-se ao contexto da pergunta.';
          break;
      }
      
      return optimizedPrompt;
      
    } catch (error) {
      console.error('Erro ao aplicar fine-tuning:', error);
      // Em caso de erro, retornar o prompt original sem modificações
      return basePrompt;
    }
  }
  
  /**
   * Registra feedback do usuário para uma interação
   */
  public async recordFeedback(
    queryId: string,
    userId: number,
    rating: number,
    feedback: string | null = null,
    category: string | null = null
  ): Promise<boolean> {
    if (!this.config.feedbackEnabled) {
      return false;
    }
    
    try {
      const feedbackEntry: FeedbackEntry = {
        id: uuidv4(),
        queryId,
        userId,
        rating: Math.max(1, Math.min(5, rating)), // Limitar entre 1-5
        feedback,
        category,
        timestamp: new Date()
      };
      
      // Registrar no armazenamento (exemplo - implementar conforme schema)
      // await storage.createAgentFeedback(feedbackEntry);
      
      // Atualizar cache de personalização
      await this.updatePersonalizationFromFeedback(queryId, feedbackEntry);
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      return false;
    }
  }
  
  /**
   * Carregar personalização para um agente/usuário
   */
  private async loadPersonalization(
    userId: number | null,
    agentId: string
  ): Promise<AgentPersonalization> {
    try {
      // Placeholder - substituir com lógica de acesso ao armazenamento conforme schema
      // const storedPersonalization = await storage.getAgentPersonalization(userId, agentId);
      
      // Se não existir, criar nova personalização
      // if (!storedPersonalization) {
        const basePrompt = 'Você é um assistente AI especializado, preciso e útil.';
        
        return {
          id: null,
          agentId,
          userId,
          systemPrompt: basePrompt,
          examples: [],
          lastUpdated: new Date()
        };
      // }
      
      // return storedPersonalization;
    } catch (error) {
      console.error('Erro ao carregar personalização:', error);
      
      // Fallback para personalização padrão
      return {
        id: null,
        agentId,
        userId,
        systemPrompt: 'Você é um assistente AI especializado, preciso e útil.',
        examples: [],
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Analisa a categoria da consulta
   */
  private async analyzeQueryCategory(query: string): Promise<string> {
    // Categorias possíveis
    const categories = [
      'programação',
      'design',
      'database',
      'infraestrutura',
      'api',
      'frontend',
      'backend',
      'mobile',
      'devops',
      'segurança',
      'geral'
    ];
    
    // Em uma implementação real, usar NLP ou chamar modelo para classificação
    // Aqui usamos uma heurística simplificada baseada em palavras-chave
    
    const query_lower = query.toLowerCase();
    
    if (/\b(código|program[a-z]+|function|class|método|variável|bug|depurar|compilar|biblioteca|framework)\b/.test(query_lower)) {
      return 'programação';
    }
    
    if (/\b(banco de dados|database|sql|query|tabela|join|index|mongo|postgres|mysql)\b/.test(query_lower)) {
      return 'database';
    }
    
    if (/\b(servidor|cloud|aws|azure|google cloud|kubernetes|docker|contêiner|vm|virtual machine)\b/.test(query_lower)) {
      return 'infraestrutura';
    }
    
    if (/\b(api|rest|graphql|endpoint|request|response|http|json|postman|curl)\b/.test(query_lower)) {
      return 'api';
    }
    
    if (/\b(html|css|javascript|react|vue|angular|dom|navegador|responsivo|layout|ui|ux)\b/.test(query_lower)) {
      return 'frontend';
    }
    
    if (/\b(nodejs|express|django|flask|spring|controller|middleware|rota|modelo|orm)\b/.test(query_lower)) {
      return 'backend';
    }
    
    if (/\b(ios|android|flutter|react native|app|mobile|smartphone|tablet)\b/.test(query_lower)) {
      return 'mobile';
    }
    
    if (/\b(ci|cd|pipeline|deploy|github actions|jenkins|automação|teste|build)\b/.test(query_lower)) {
      return 'devops';
    }
    
    if (/\b(segurança|vulnerabilidade|autenticação|autorização|criptografia|token|jwt|oauth|https)\b/.test(query_lower)) {
      return 'segurança';
    }
    
    if (/\b(design|ui|ux|interface|wireframe|mockup|prototype|figma|sketch|adobe)\b/.test(query_lower)) {
      return 'design';
    }
    
    // Padrão
    return 'geral';
  }
  
  /**
   * Seleciona exemplos relevantes para fine-tuning
   */
  private selectRelevantExamples(
    examples: ExampleInteraction[],
    category: string,
    query: string,
    maxCount: number
  ): ExampleInteraction[] {
    // Filtrar exemplos pela categoria
    let relevantExamples = examples.filter(ex => ex.category === category || ex.category === 'geral');
    
    // Ordenar por avaliação (melhores primeiro) e depois por data (mais recentes primeiro)
    relevantExamples.sort((a, b) => {
      // Primeiro por avaliação
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      // Depois por data
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    // Limitar número de exemplos
    return relevantExamples.slice(0, maxCount);
  }
  
  /**
   * Atualiza personalização com base em novo feedback
   */
  private async updatePersonalizationFromFeedback(
    queryId: string,
    feedbackEntry: FeedbackEntry
  ): Promise<void> {
    try {
      // Obter detalhes da interação original
      // Em uma implementação real, buscar do armazenamento
      // const interaction = await storage.getQueryById(queryId);
      
      // if (!interaction) return;
      
      const interaction = {
        query: "Como implementar um sistema de cache para melhorar performance?",
        response: "Para implementar um sistema de cache eficiente...",
        // outros campos
      };
      
      // Atualizar personalização do agente
      const cacheKey = this.getCacheKey(feedbackEntry.userId, 'ag:48009b45:20250515:programador-agente:d9bb1918');
      let personalization = this.personalizationCache.get(cacheKey);
      
      if (!personalization) {
        personalization = await this.loadPersonalization(
          feedbackEntry.userId,
          'ag:48009b45:20250515:programador-agente:d9bb1918'
        );
      }
      
      // Adicionar exemplo se a avaliação for boa (4-5)
      if (feedbackEntry.rating >= 4) {
        personalization.examples.push({
          query: interaction.query,
          response: interaction.response,
          rating: feedbackEntry.rating,
          category: feedbackEntry.category || await this.analyzeQueryCategory(interaction.query),
          timestamp: feedbackEntry.timestamp
        });
        
        // Limitar tamanho da lista de exemplos
        if (personalization.examples.length > this.config.maxExampleCount * 2) {
          // Remover os piores exemplos até atingir maxExampleCount
          personalization.examples.sort((a, b) => b.rating - a.rating);
          personalization.examples = personalization.examples.slice(0, this.config.maxExampleCount);
        }
        
        personalization.lastUpdated = new Date();
        
        // Atualizar cache
        this.personalizationCache.set(cacheKey, personalization);
        
        // Persistir mudanças
        // await storage.updateAgentPersonalization(personalization);
      }
      
    } catch (error) {
      console.error('Erro ao atualizar personalização com feedback:', error);
    }
  }
  
  /**
   * Gera chave para o cache de personalização
   */
  private getCacheKey(userId: number | null, agentId: string): string {
    return `${userId || 'global'}-${agentId}`;
  }
  
  /**
   * Atualiza a configuração de fine-tuning
   */
  public async updateConfig(newConfig: Partial<FinetuningConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Salvar no armazenamento
      const systemConfig = await storage.getSystemConfig();
      
      if (systemConfig) {
        await storage.updateSystemConfig({
          agent_finetuning_config: JSON.stringify(this.config)
        });
      } else {
        // Criar nova configuração
        await storage.updateSystemConfig({
          id: 1,
          agent_finetuning_config: JSON.stringify(this.config)
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração de fine-tuning:', error);
      return false;
    }
  }
  
  /**
   * Obter configuração atual
   */
  public getConfig(): FinetuningConfig {
    return { ...this.config };
  }
}

// Instância singleton do serviço
export const agentFinetuningService = new AgentFinetuningService();