import { LlmService } from "./llm.service";
import { ApifyService, ApifySearchResult } from "./apify.service";
import { ConfigService } from "./config.service";
import { db } from "../db";
import { chatHistory, insertChatHistorySchema } from "../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { log } from "../vite";
import { eq } from "drizzle-orm";

/**
 * Tipos de mensagens no chat
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool'
}

/**
 * Representa uma mensagem no chat
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Representa uma sessão de chat
 */
export interface ChatSession {
  id: string;
  userId: number;
  title?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Serviço para gerenciar conversas de chat
 */
export class ChatService {
  private static instance: ChatService;
  private llmService: LlmService;
  private apifyService: ApifyService;
  private configService: ConfigService;

  private constructor() {
    this.llmService = LlmService.getInstance();
    this.apifyService = ApifyService.getInstance();
    this.configService = ConfigService.getInstance();
  }

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Cria uma nova sessão de chat
   * @param userId ID do usuário que criou a sessão
   */
  public async createSession(userId: number): Promise<ChatSession> {
    const config = await this.configService.getConfig();
    const systemMessage = config?.base_prompt || "Você é um assistente útil e profissional.";
    
    const sessionId = uuidv4();
    const now = Date.now();
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      messages: [
        {
          id: uuidv4(),
          role: MessageRole.SYSTEM,
          content: systemMessage,
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    
    // Persiste a sessão no banco de dados
    await db.insert(chatHistory).values({
      session_id: sessionId,
      user_id: userId,
      messages: session.messages,
      created_at: new Date(now),
      updated_at: new Date(now)
    });
    
    return session;
  }

  /**
   * Recupera uma sessão de chat pelo ID
   * @param sessionId ID da sessão
   * @param userId ID do usuário (para verificação de acesso)
   */
  public async getSession(sessionId: string, userId?: number): Promise<ChatSession | null> {
    try {
      const query = db.select().from(chatHistory).where(eq(chatHistory.session_id, sessionId));
      
      // Se userId for fornecido, filtra por usuário também
      if (userId) {
        query.where(eq(chatHistory.user_id, userId));
      }
      
      const result = await query.limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const chatData = result[0];
      
      return {
        id: chatData.session_id,
        userId: chatData.user_id,
        title: chatData.title || undefined,
        messages: Array.isArray(chatData.messages) ? chatData.messages : [],
        createdAt: chatData.created_at?.getTime() || Date.now(),
        updatedAt: chatData.updated_at?.getTime() || Date.now()
      };
    } catch (error) {
      log(`Erro ao buscar sessão de chat: ${error}`);
      return null;
    }
  }

  /**
   * Lista todas as sessões de chat de um usuário
   * @param userId ID do usuário
   */
  public async listSessions(userId: number): Promise<ChatSession[]> {
    try {
      const result = await db.select().from(chatHistory)
        .where(eq(chatHistory.user_id, userId))
        .orderBy(chatHistory.updated_at, 'desc');
      
      return result.map(chatData => ({
        id: chatData.session_id,
        userId: chatData.user_id,
        title: chatData.title || undefined,
        messages: Array.isArray(chatData.messages) ? chatData.messages : [],
        createdAt: chatData.created_at?.getTime() || Date.now(),
        updatedAt: chatData.updated_at?.getTime() || Date.now()
      }));
    } catch (error) {
      log(`Erro ao listar sessões de chat: ${error}`);
      return [];
    }
  }

  /**
   * Adiciona uma mensagem do usuário e obtém resposta do LLM
   * @param sessionId ID da sessão
   * @param userMessage Mensagem enviada pelo usuário
   * @param userId ID do usuário
   */
  public async sendMessage(
    sessionId: string, 
    userMessage: string, 
    userId: number
  ): Promise<{
    assistantMessage: ChatMessage;
    apifyResults?: ApifySearchResult[];
    session: ChatSession;
  }> {
    // Recupera a sessão
    let session = await this.getSession(sessionId, userId);
    if (!session) {
      session = await this.createSession(userId);
    }
    
    // Verifica se é um comando para o Apify
    const isApifyCommand = userMessage.startsWith('#scrape') || 
                           userMessage.startsWith('#buscar');
    
    // Cria a mensagem do usuário
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      role: MessageRole.USER,
      content: userMessage,
      timestamp: Date.now()
    };
    
    // Adiciona a mensagem do usuário à sessão
    session.messages.push(userChatMessage);
    
    let assistantMessage: ChatMessage;
    let apifyResults: ApifySearchResult[] | undefined;
    
    if (isApifyCommand) {
      // Extrai a consulta de busca
      const query = userMessage.replace(/^#(scrape|buscar)\s+/, "").trim();
      
      // Faz a busca com o Apify
      apifyResults = await this.apifyService.search(query, { userId });
      
      // Cria a mensagem do assistente com os resultados
      const formattedResults = this.formatApifyResults(apifyResults);
      assistantMessage = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        content: formattedResults,
        timestamp: Date.now(),
        metadata: {
          apifyResults: apifyResults,
          query: query
        }
      };
    } else {
      // Prepara o prompt para o LLM com todo o histórico da conversa
      const chatHistory = session.messages
        .filter(msg => msg.role !== MessageRole.SYSTEM)
        .map(msg => `${msg.role === MessageRole.USER ? 'Humano' : 'Assistente'}: ${msg.content}`)
        .join('\n\n');
      
      const systemMessage = session.messages.find(msg => msg.role === MessageRole.SYSTEM)?.content;
      
      // Obtém a resposta do LLM
      const llmResponse = await this.llmService.sendPrompt(
        `${chatHistory}\n\nHumano: ${userMessage}\n\nAssistente:`, 
        {
          userId: userId,
          systemPrompt: systemMessage
        }
      );
      
      // Cria a mensagem do assistente com a resposta
      assistantMessage = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        content: llmResponse.text || "Desculpe, não consegui gerar uma resposta.",
        timestamp: Date.now(),
        metadata: {
          source: llmResponse.source,
          responseTimeMs: llmResponse.responseTimeMs,
          tokens: llmResponse.tokens
        }
      };
    }
    
    // Adiciona a resposta do assistente à sessão
    session.messages.push(assistantMessage);
    session.updatedAt = Date.now();
    
    // Atualiza o título se for a primeira interação
    if (session.messages.filter(msg => msg.role === MessageRole.USER).length === 1) {
      // Usa o conteúdo da primeira mensagem como título (limitado a 50 caracteres)
      session.title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
    }
    
    // Persiste a sessão atualizada
    await db.update(chatHistory)
      .set({
        messages: session.messages,
        updated_at: new Date(session.updatedAt),
        title: session.title
      })
      .where(eq(chatHistory.session_id, sessionId));
    
    return {
      assistantMessage,
      apifyResults,
      session
    };
  }

  /**
   * Formata os resultados do Apify em texto legível
   */
  private formatApifyResults(results: ApifySearchResult[]): string {
    if (results.length === 0) {
      return "Não encontrei resultados para sua busca. Tente modificar os termos ou fazer outra pergunta.";
    }
    
    const formatted = results.map((result, index) => {
      return `**${index + 1}. ${result.title}**\n${result.description || 'Sem descrição'}\nFonte: ${result.source} | [Link](${result.url})${result.date ? ` | Data: ${result.date}` : ''}`;
    }).join('\n\n');
    
    return `Encontrei ${results.length} resultados para sua busca:\n\n${formatted}`;
  }
}