import { 
  users, files, projects, logs, 
  systemConfig, llmLogs, chatHistory, dailyMetrics, deployLogs,
  agents, agentExecutions, agentSteps, agentTools, agentToolMappings
} from "@shared/schema";
import type { 
  User, InsertUser, 
  File, InsertFile, 
  Project, InsertProject, 
  Log, InsertLog,
  SystemConfig, InsertSystemConfig,
  LlmLog, InsertLlmLog,
  ChatHistory, InsertChatHistory,
  DailyMetrics, InsertDailyMetrics,
  DeployLog, InsertDeployLog,
  Agent, InsertAgent,
  AgentExecution, InsertAgentExecution,
  AgentStep, InsertAgentStep,
  AgentTool, InsertAgentTool,
  AgentToolMapping, InsertAgentToolMapping
} from "@shared/schema";
import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Arquivos
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, fileData: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Projetos
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getLogsByUser(userId: number): Promise<Log[]>;
  
  // Configurações do Sistema
  getSystemConfig(): Promise<SystemConfig | undefined>;
  updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig | undefined>;
  
  // LLM Logs
  createLlmLog(log: InsertLlmLog): Promise<LlmLog>;
  getLlmLogsByUser(userId: number, limit?: number): Promise<LlmLog[]>;
  
  // Chat History
  getChatSession(sessionId: string): Promise<ChatHistory | undefined>;
  getChatSessionsByUser(userId: number): Promise<ChatHistory[]>;
  createChatSession(session: InsertChatHistory): Promise<ChatHistory>;
  updateChatSession(sessionId: string, sessionData: Partial<ChatHistory>): Promise<ChatHistory | undefined>;
  deleteChatSession(sessionId: string): Promise<boolean>;
  
  // Métricas Diárias
  getDailyMetrics(date: Date): Promise<DailyMetrics | undefined>;
  updateDailyMetrics(date: Date, metrics: Partial<DailyMetrics>): Promise<DailyMetrics | undefined>;
  
  // Deploy Logs
  createDeployLog(log: InsertDeployLog): Promise<DeployLog>;
  getRecentDeployLogs(limit?: number): Promise<DeployLog[]>;
  
  // Agentes
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  getAgentsByType(type: string): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Execuções de Agentes
  getAgentExecution(id: number): Promise<AgentExecution | undefined>;
  getAgentExecutionsByAgent(agentId: number, limit?: number): Promise<AgentExecution[]>;
  getAgentExecutionsByUser(userId: number, limit?: number): Promise<AgentExecution[]>;
  createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution>;
  updateAgentExecution(id: number, executionData: Partial<AgentExecution>): Promise<AgentExecution | undefined>;
  
  // Passos de Execução de Agentes
  getAgentStepsByExecution(executionId: number): Promise<AgentStep[]>;
  createAgentStep(step: InsertAgentStep): Promise<AgentStep>;
  
  // Ferramentas de Agentes
  getAgentTool(id: number): Promise<AgentTool | undefined>;
  getAllAgentTools(): Promise<AgentTool[]>;
  getActiveAgentTools(): Promise<AgentTool[]>;
  createAgentTool(tool: InsertAgentTool): Promise<AgentTool>;
  updateAgentTool(id: number, toolData: Partial<AgentTool>): Promise<AgentTool | undefined>;
  
  // Mapeamento de Ferramentas de Agentes
  getAgentToolsByAgent(agentId: number): Promise<AgentTool[]>;
  createAgentToolMapping(mapping: InsertAgentToolMapping): Promise<AgentToolMapping>;
  updateAgentToolMapping(agentId: number, toolId: number, isActive: boolean): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }
  
  // Arquivos
  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id)).limit(1);
    return result[0];
  }
  
  async getFilesByUser(userId: number): Promise<File[]> {
    return db.select().from(files).where(eq(files.user_id, userId));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(files).values(file).returning();
    return result[0];
  }
  
  async updateFile(id: number, fileData: Partial<File>): Promise<File | undefined> {
    const result = await db.update(files).set(fileData).where(eq(files.id, id)).returning();
    return result[0];
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id)).returning({ id: files.id });
    return result.length >
0;
  }
  
  // Projetos
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.user_id, userId));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return result[0];
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    return result.length > 0;
  }
  
  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const result = await db.insert(logs).values(log).returning();
    return result[0];
  }
  
  async getLogsByUser(userId: number): Promise<Log[]> {
    return db.select().from(logs).where(eq(logs.user_id, userId));
  }

  // Configurações do Sistema
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    const result = await db.select().from(systemConfig).limit(1);
    return result[0];
  }
  
  async updateSystemConfig(configData: Partial<SystemConfig>): Promise<SystemConfig | undefined> {
    // Busca a configuração existente
    const current = await this.getSystemConfig();
    
    if (!current) {
      // Se não existir, cria uma nova
      const config = {
        ...configData,
        updated_at: new Date()
      };
      const result = await db.insert(systemConfig).values(config).returning();
      return result[0];
    }
    
    // Se existir, atualiza
    const result = await db.update(systemConfig)
      .set({
        ...configData,
        updated_at: new Date()
      })
      .where(eq(systemConfig.id, current.id))
      .returning();
    
    return result[0];
  }
  
  // LLM Logs
  async createLlmLog(log: InsertLlmLog): Promise<LlmLog> {
    const result = await db.insert(llmLogs).values(log).returning();
    return result[0];
  }
  
  async getLlmLogsByUser(userId: number, limit: number = 50): Promise<LlmLog[]> {
    return db.select()
      .from(llmLogs)
      .where(eq(llmLogs.user_id, userId))
      .orderBy(desc(llmLogs.created_at))
      .limit(limit);
  }
  
  // Chat History
  async getChatSession(sessionId: string): Promise<ChatHistory | undefined> {
    const result = await db.select()
      .from(chatHistory)
      .where(eq(chatHistory.session_id, sessionId))
      .limit(1);
    
    return result[0];
  }
  
  async getChatSessionsByUser(userId: number): Promise<ChatHistory[]> {
    return db.select()
      .from(chatHistory)
      .where(eq(chatHistory.user_id, userId))
      .orderBy(desc(chatHistory.updated_at));
  }
  
  async createChatSession(session: InsertChatHistory): Promise<ChatHistory> {
    const result = await db.insert(chatHistory).values(session).returning();
    return result[0];
  }
  
  async updateChatSession(sessionId: string, sessionData: Partial<ChatHistory>): Promise<ChatHistory | undefined> {
    const result = await db.update(chatHistory)
      .set({
        ...sessionData,
        updated_at: new Date()
      })
      .where(eq(chatHistory.session_id, sessionId))
      .returning();
    
    return result[0];
  }
  
  async deleteChatSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(chatHistory)
      .where(eq(chatHistory.session_id, sessionId))
      .returning({ id: chatHistory.id });
    
    return result.length > 0;
  }
  
  // Métricas Diárias
  async getDailyMetrics(date: Date): Promise<DailyMetrics | undefined> {
    // Zero out the time part for consistent comparison
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const result = await db.select()
      .from(dailyMetrics)
      .where(sql`DATE(${dailyMetrics.date}) = DATE(${startOfDay})`)
      .limit(1);
    
    return result[0];
  }
  
  async updateDailyMetrics(date: Date, metricsData: Partial<DailyMetrics>): Promise<DailyMetrics | undefined> {
    // Zero out the time part for consistent comparison
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Check if metrics for this date exist
    const existingMetrics = await this.getDailyMetrics(startOfDay);
    
    if (!existingMetrics) {
      // Create new metrics
      const newMetrics = {
        date: startOfDay,
        ...metricsData,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await db.insert(dailyMetrics).values(newMetrics).returning();
      return result[0];
    }
    
    // Update existing metrics
    const result = await db.update(dailyMetrics)
      .set({
        ...metricsData,
        updated_at: new Date()
      })
      .where(eq(dailyMetrics.id, existingMetrics.id))
      .returning();
    
    return result[0];
  }
  
  // Deploy Logs
  async createDeployLog(log: InsertDeployLog): Promise<DeployLog> {
    const result = await db.insert(deployLogs).values(log).returning();
    return result[0];
  }
  
  async getRecentDeployLogs(limit: number = 10): Promise<DeployLog[]> {
    return db.select()
      .from(deployLogs)
      .orderBy(desc(deployLogs.created_at))
      .limit(limit);
  }
  
  // ========== Implementação dos métodos para Agentes ==========
  
  // Agentes
  async getAgent(id: number): Promise<Agent | undefined> {
    try {
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      return agent;
    } catch (error) {
      console.error('Erro ao buscar agente:', error);
      return undefined;
    }
  }
  
  async getAgentByName(name: string): Promise<Agent | undefined> {
    try {
      const [agent] = await db.select().from(agents).where(eq(agents.name, name));
      return agent;
    } catch (error) {
      console.error('Erro ao buscar agente por nome:', error);
      return undefined;
    }
  }
  
  async getAgentsByType(type: string): Promise<Agent[]> {
    try {
      return await db.select().from(agents).where(eq(agents.type, type));
    } catch (error) {
      console.error('Erro ao buscar agentes por tipo:', error);
      return [];
    }
  }
  
  async getAllAgents(): Promise<Agent[]> {
    try {
      return await db.select().from(agents);
    } catch (error) {
      console.error('Erro ao buscar todos os agentes:', error);
      return [];
    }
  }
  
  async createAgent(agent: InsertAgent): Promise<Agent> {
    try {
      const [createdAgent] = await db.insert(agents).values(agent).returning();
      return createdAgent;
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      throw error;
    }
  }
  
  async updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const [updatedAgent] = await db
        .update(agents)
        .set({ ...agentData, updated_at: new Date() })
        .where(eq(agents.id, id))
        .returning();
      return updatedAgent;
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      return undefined;
    }
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(agents).where(eq(agents.id, id));
      return !!result.rowCount && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      return false;
    }
  }
  
  // Execuções de Agentes
  async getAgentExecution(id: number): Promise<AgentExecution | undefined> {
    try {
      const [execution] = await db.select().from(agentExecutions).where(eq(agentExecutions.id, id));
      return execution;
    } catch (error) {
      console.error('Erro ao buscar execução de agente:', error);
      return undefined;
    }
  }
  
  async getAgentExecutionsByAgent(agentId: number, limit: number = 10): Promise<AgentExecution[]> {
    try {
      return await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agent_id, agentId))
        .orderBy(desc(agentExecutions.created_at))
        .limit(limit);
    } catch (error) {
      console.error('Erro ao buscar execuções por agente:', error);
      return [];
    }
  }
  
  async getAgentExecutionsByUser(userId: number, limit: number = 10): Promise<AgentExecution[]> {
    try {
      return await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.user_id, userId))
        .orderBy(desc(agentExecutions.created_at))
        .limit(limit);
    } catch (error) {
      console.error('Erro ao buscar execuções por usuário:', error);
      return [];
    }
  }
  
  async createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution> {
    try {
      const [createdExecution] = await db.insert(agentExecutions).values(execution).returning();
      
      // Atualiza o agente com a data da última execução
      if (execution.agent_id) {
        await this.updateAgent(execution.agent_id, { 
          last_execution: new Date(), 
          status: 'active' 
        });
      }
      
      return createdExecution;
    } catch (error) {
      console.error('Erro ao criar execução de agente:', error);
      throw error;
    }
  }
  
  async updateAgentExecution(id: number, executionData: Partial<AgentExecution>): Promise<AgentExecution | undefined> {
    try {
      const [updatedExecution] = await db
        .update(agentExecutions)
        .set(executionData)
        .where(eq(agentExecutions.id, id))
        .returning();
      
      // Se a execução for concluída, atualiza o status do agente
      if (executionData.status === 'completed' && updatedExecution.agent_id) {
        await this.updateAgent(updatedExecution.agent_id, { status: 'inactive' });
      }
      
      return updatedExecution;
    } catch (error) {
      console.error('Erro ao atualizar execução de agente:', error);
      return undefined;
    }
  }
  
  // Passos de Execução de Agentes
  async getAgentStepsByExecution(executionId: number): Promise<AgentStep[]> {
    try {
      return await db
        .select()
        .from(agentSteps)
        .where(eq(agentSteps.execution_id, executionId))
        .orderBy(agentSteps.order);
    } catch (error) {
      console.error('Erro ao buscar passos de execução:', error);
      return [];
    }
  }
  
  async createAgentStep(step: InsertAgentStep): Promise<AgentStep> {
    try {
      const [createdStep] = await db.insert(agentSteps).values(step).returning();
      return createdStep;
    } catch (error) {
      console.error('Erro ao criar passo de execução:', error);
      throw error;
    }
  }
  
  // Ferramentas de Agentes
  async getAgentTool(id: number): Promise<AgentTool | undefined> {
    try {
      const [tool] = await db.select().from(agentTools).where(eq(agentTools.id, id));
      return tool;
    } catch (error) {
      console.error('Erro ao buscar ferramenta:', error);
      return undefined;
    }
  }
  
  async getAllAgentTools(): Promise<AgentTool[]> {
    try {
      return await db.select().from(agentTools);
    } catch (error) {
      console.error('Erro ao buscar todas as ferramentas:', error);
      return [];
    }
  }
  
  async getActiveAgentTools(): Promise<AgentTool[]> {
    try {
      return await db.select().from(agentTools).where(eq(agentTools.is_active, true));
    } catch (error) {
      console.error('Erro ao buscar ferramentas ativas:', error);
      return [];
    }
  }
  
  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    try {
      const [createdTool] = await db.insert(agentTools).values(tool).returning();
      return createdTool;
    } catch (error) {
      console.error('Erro ao criar ferramenta:', error);
      throw error;
    }
  }
  
  async updateAgentTool(id: number, toolData: Partial<AgentTool>): Promise<AgentTool | undefined> {
    try {
      const [updatedTool] = await db
        .update(agentTools)
        .set({ ...toolData, updated_at: new Date() })
        .where(eq(agentTools.id, id))
        .returning();
      return updatedTool;
    } catch (error) {
      console.error('Erro ao atualizar ferramenta:', error);
      return undefined;
    }
  }
  
  // Mapeamento de Ferramentas de Agentes
  async getAgentToolsByAgent(agentId: number): Promise<AgentTool[]> {
    try {
      // Busca todos os mapeamentos ativos para o agente
      const toolMappings = await db
        .select()
        .from(agentToolMappings)
        .where(eq(agentToolMappings.agent_id, agentId))
        .where(eq(agentToolMappings.is_active, true));
      
      if (toolMappings.length === 0) return [];
      
      // Busca todas as ferramentas associadas
      const toolIds = toolMappings.map(mapping => mapping.tool_id);
      
      // Busca as ferramentas e verifica se estão ativas
      return await db
        .select()
        .from(agentTools)
        .where(sql`${agentTools.id} IN (${toolIds})`)
        .where(eq(agentTools.is_active, true));
    } catch (error) {
      console.error('Erro ao buscar ferramentas por agente:', error);
      return [];
    }
  }
  
  async createAgentToolMapping(mapping: InsertAgentToolMapping): Promise<AgentToolMapping> {
    try {
      const [createdMapping] = await db.insert(agentToolMappings).values(mapping).returning();
      return createdMapping;
    } catch (error) {
      console.error('Erro ao criar mapeamento de ferramenta:', error);
      throw error;
    }
  }
  
  async updateAgentToolMapping(agentId: number, toolId: number, isActive: boolean): Promise<boolean> {
    try {
      const result = await db
        .update(agentToolMappings)
        .set({ is_active: isActive })
        .where(eq(agentToolMappings.agent_id, agentId))
        .where(eq(agentToolMappings.tool_id, toolId));
      
      return !!result.rowCount && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao atualizar mapeamento de ferramenta:', error);
      return false;
    }
  }
}

// Implementação com memória como fallback
export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private fileMap: Map<number, File>;
  private projectMap: Map<number, Project>;
  private logMap: Map<number, Log>;
  private systemConfigMap: Map<number, SystemConfig>;
  private llmLogMap: Map<number, LlmLog>;
  private chatHistoryMap: Map<string, ChatHistory>;
  private dailyMetricsMap: Map<string, DailyMetrics>;
  private deployLogMap: Map<number, DeployLog>;
  
  // Novos mapas para agentes
  private agentMap: Map<number, Agent>;
  private agentExecutionMap: Map<number, AgentExecution>;
  private agentStepMap: Map<number, AgentStep[]>;
  private agentToolMap: Map<number, AgentTool>;
  private agentToolMappingMap: Map<string, AgentToolMapping>;
  
  private currentIds = {
    users: 1,
    files: 1,
    projects: 1,
    logs: 1,
    llmLogs: 1,
    chatHistory: 1,
    dailyMetrics: 1,
    deployLogs: 1,
    agents: 1,
    agentExecutions: 1,
    agentSteps: 1,
    agentTools: 1,
    agentToolMappings: 1
  };

  constructor() {
    this.userMap = new Map();
    this.fileMap = new Map();
    this.projectMap = new Map();
    this.logMap = new Map();
    this.systemConfigMap = new Map();
    this.llmLogMap = new Map();
    this.chatHistoryMap = new Map();
    this.dailyMetricsMap = new Map();
    this.deployLogMap = new Map();
    
    // Inicialização dos mapas para agentes
    this.agentMap = new Map();
    this.agentExecutionMap = new Map();
    this.agentStepMap = new Map();
    this.agentToolMap = new Map();
    this.agentToolMappingMap = new Map();
    
    // Configuração padrão
    this.systemConfigMap.set(1, {
      id: 1,
      execution_mode: 'local',
      local_llm_url: 'http://127.0.0.1:11434',
      cloud_llm_url: 'https://oracle-api.carlosdev.app.br',
      active_llm_url: 'http://127.0.0.1:11434',
      apify_actor_url: null,
      apify_api_key: null,
      base_prompt: 'Você é um assistente útil e profissional.',
      logs_enabled: true,
      updated_at: new Date(),
      updated_by: null,
      oracle_instance_ip: null
    });
  }

  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: now,
      last_login: null,
      profile_img: null,
      is_active: true 
    };
    this.userMap.set(user.id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.userMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.userMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.userMap.delete(id);
  }
  
  // Arquivos
  async getFile(id: number): Promise<File | undefined> {
    return this.fileMap.get(id);
  }
  
  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.fileMap.values()).filter(file => file.user_id === userId);
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentIds.files++;
    const now = new Date();
    const newFile: File = {
      ...file,
      id,
      uploaded_at: now,
      is_public: file.is_public || false,
      type: file.type || null,
      user_id: file.user_id || null,
      description: file.description || null
    };
    this.fileMap.set(id, newFile);
    return newFile;
  }
  
  async updateFile(id: number, fileData: Partial<File>): Promise<File | undefined> {
    const file = this.fileMap.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...fileData };
    this.fileMap.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.fileMap.delete(id);
  }
  
  // Projetos
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectMap.get(id);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projectMap.values()).filter(project => project.user_id === userId);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentIds.projects++;
    const now = new Date();
    const newProject: Project = {
      ...project,
      id,
      created_at: now,
      updated_at: now,
      status: project.status || 'active',
      description: project.description || null
    };
    this.projectMap.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projectMap.get(id);
    if (!project) return undefined;
    
    const updatedProject = { 
      ...project, 
      ...projectData,
      updated_at: new Date()
    };
    this.projectMap.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projectMap.delete(id);
  }
  
  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentIds.logs++;
    const now = new Date();
    const newLog: Log = {
      ...log,
      id,
      created_at: now,
      user_id: log.user_id || null,
      details: log.details || null,
      ip_address: log.ip_address || null
    };
    this.logMap.set(id, newLog);
    return newLog;
  }
  
  async getLogsByUser(userId: number): Promise<Log[]> {
    return Array.from(this.logMap.values()).filter(log => log.user_id === userId);
  }
  
  // Configurações do Sistema
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    return this.systemConfigMap.get(1);
  }
  
  async updateSystemConfig(configData: Partial<SystemConfig>): Promise<SystemConfig | undefined> {
    const current = await this.getSystemConfig();
    if (!current) return undefined;
    
    const updatedConfig: SystemConfig = { 
      ...current, 
      ...configData, 
      updated_at: new Date() 
    };
    
    this.systemConfigMap.set(1, updatedConfig);
    return updatedConfig;
  }
  
  // LLM Logs
  async createLlmLog(log: InsertLlmLog): Promise<LlmLog> {
    const id = this.currentIds.llmLogs++;
    const now = new Date();
    
    const newLog: LlmLog = {
      id,
      prompt: log.prompt,
      response: log.response || null,
      source: log.source,
      tokens_used: log.tokens_used || null,
      response_time_ms: log.response_time_ms || null,
      status: log.status || 'success',
      error_message: log.error_message || null,
      user_id: log.user_id || null,
      created_at: now,
      metadata: log.metadata || null
    };
    
    this.llmLogMap.set(id, newLog);
    return newLog;
  }
  
  async getLlmLogsByUser(userId: number, limit: number = 50): Promise<LlmLog[]> {
    const logs: LlmLog[] = [];
    for (const log of this.llmLogMap.values()) {
      if (log.user_id === userId) {
        logs.push(log);
      }
    }
    
    return logs
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, limit);
  }
  
  // Chat History
  async getChatSession(sessionId: string): Promise<ChatHistory | undefined> {
    return this.chatHistoryMap.get(sessionId);
  }
  
  async getChatSessionsByUser(userId: number): Promise<ChatHistory[]> {
    const sessions: ChatHistory[] = [];
    for (const session of this.chatHistoryMap.values()) {
      if (session.user_id === userId) {
        sessions.push(session);
      }
    }
    
    return sessions.sort((a, b) => (b.updated_at?.getTime() || 0) - (a.updated_at?.getTime() || 0));
  }
  
  async createChatSession(session: InsertChatHistory): Promise<ChatHistory> {
    const id = this.currentIds.chatHistory++;
    const now = new Date();
    
    const newSession: ChatHistory = {
      id,
      user_id: session.user_id,
      session_id: session.session_id,
      messages: session.messages,
      title: session.title || null,
      created_at: now,
      updated_at: now
    };
    
    this.chatHistoryMap.set(session.session_id, newSession);
    return newSession;
  }
  
  async updateChatSession(sessionId: string, sessionData: Partial<ChatHistory>): Promise<ChatHistory | undefined> {
    const session = this.chatHistoryMap.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...sessionData, 
      updated_at: new Date() 
    };
    
    this.chatHistoryMap.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  async deleteChatSession(sessionId: string): Promise<boolean> {
    return this.chatHistoryMap.delete(sessionId);
  }
  
  // Métricas Diárias
  async getDailyMetrics(date: Date): Promise<DailyMetrics | undefined> {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    for (const metrics of this.dailyMetricsMap.values()) {
      const metricsDate = metrics.date?.toISOString().split('T')[0];
      if (metricsDate === dateKey) {
        return metrics;
      }
    }
    
    return undefined;
  }
  
  async updateDailyMetrics(date: Date, metricsData: Partial<DailyMetrics>): Promise<DailyMetrics | undefined> {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if metrics for this date exist
    let existingMetrics: DailyMetrics | undefined;
    let existingKey: string = '';
    
    for (const [key, metrics] of this.dailyMetricsMap.entries()) {
      const metricsDate = metrics.date?.toISOString().split('T')[0];
      if (metricsDate === dateKey) {
        existingMetrics = metrics;
        existingKey = key;
        break;
      }
    }
    
    if (!existingMetrics) {
      // Create new metrics
      const id = this.currentIds.dailyMetrics++;
      const now = new Date();
      
      const newMetrics: DailyMetrics = {
        id,
        date,
        total_requests: metricsData.total_requests || 0,
        total_tokens: metricsData.total_tokens || 0,
        local_requests: metricsData.local_requests || 0,
        cloud_requests: metricsData.cloud_requests || 0,
        apify_requests: metricsData.apify_requests || 0,
        successful_requests: metricsData.successful_requests || 0,
        failed_requests: metricsData.failed_requests || 0,
        avg_response_time: metricsData.avg_response_time || "0",
        created_at: now,
        updated_at: now
      };
      
      this.dailyMetricsMap.set(dateKey, newMetrics);
      return newMetrics;
    }
    
    // Update existing metrics
    const updatedMetrics = { 
      ...existingMetrics, 
      ...metricsData, 
      updated_at: new Date() 
    };
    
    this.dailyMetricsMap.set(existingKey, updatedMetrics);
    return updatedMetrics;
  }
  
  // Deploy Logs
  async createDeployLog(log: InsertDeployLog): Promise<DeployLog> {
    const id = this.currentIds.deployLogs++;
    const now = new Date();
    
    const newLog: DeployLog = {
      id,
      user_id: log.user_id || null,
      action: log.action,
      status: log.status,
      instance_id: log.instance_id || null,
      instance_ip: log.instance_ip || null,
      details: log.details || null,
      created_at: now
    };
    
    this.deployLogMap.set(id, newLog);
    return newLog;
  }
  
  async getRecentDeployLogs(limit: number = 10): Promise<DeployLog[]> {
    const logs = Array.from(this.deployLogMap.values());
    
    return logs
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, limit);
  }
  
  // ========== Implementação dos métodos para Agentes ==========
  
  // Agentes
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agentMap.get(id);
  }
  
  async getAgentByName(name: string): Promise<Agent | undefined> {
    return Array.from(this.agentMap.values()).find(agent => agent.name === name);
  }
  
  async getAgentsByType(type: string): Promise<Agent[]> {
    return Array.from(this.agentMap.values()).filter(agent => agent.type === type);
  }
  
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agentMap.values());
  }
  
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.currentIds.agents++;
    const now = new Date();
    
    const newAgent: Agent = {
      id,
      ...agent,
      created_at: now,
      updated_at: now,
      last_execution: null
    };
    
    this.agentMap.set(id, newAgent);
    return newAgent;
  }
  
  async updateAgent(id: number, agentData: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agentMap.get(id);
    if (!agent) return undefined;
    
    const updatedAgent: Agent = {
      ...agent,
      ...agentData,
      updated_at: new Date()
    };
    
    this.agentMap.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agentMap.delete(id);
  }
  
  // Execuções de Agentes
  async getAgentExecution(id: number): Promise<AgentExecution | undefined> {
    return this.agentExecutionMap.get(id);
  }
  
  async getAgentExecutionsByAgent(agentId: number, limit: number = 10): Promise<AgentExecution[]> {
    return Array.from(this.agentExecutionMap.values())
      .filter(execution => execution.agent_id === agentId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
  
  async getAgentExecutionsByUser(userId: number, limit: number = 10): Promise<AgentExecution[]> {
    return Array.from(this.agentExecutionMap.values())
      .filter(execution => execution.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
  
  async createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution> {
    const id = this.currentIds.agentExecutions++;
    const now = new Date();
    
    const newExecution: AgentExecution = {
      id,
      ...execution,
      created_at: now
    };
    
    this.agentExecutionMap.set(id, newExecution);
    
    // Atualiza o agente com a data da última execução
    if (execution.agent_id) {
      this.updateAgent(execution.agent_id, { 
        last_execution: now,
        status: 'active'
      });
    }
    
    return newExecution;
  }
  
  async updateAgentExecution(id: number, executionData: Partial<AgentExecution>): Promise<AgentExecution | undefined> {
    const execution = this.agentExecutionMap.get(id);
    if (!execution) return undefined;
    
    const updatedExecution: AgentExecution = {
      ...execution,
      ...executionData
    };
    
    this.agentExecutionMap.set(id, updatedExecution);
    
    // Se a execução for concluída, atualiza o status do agente
    if (executionData.status === 'completed' && execution.agent_id) {
      this.updateAgent(execution.agent_id, { status: 'inactive' });
    }
    
    return updatedExecution;
  }
  
  // Passos de Execução de Agentes
  async getAgentStepsByExecution(executionId: number): Promise<AgentStep[]> {
    const steps = this.agentStepMap.get(executionId) || [];
    return [...steps].sort((a, b) => a.order - b.order);
  }
  
  async createAgentStep(step: InsertAgentStep): Promise<AgentStep> {
    const id = this.currentIds.agentSteps++;
    const now = new Date();
    
    const newStep: AgentStep = {
      id,
      ...step,
      created_at: now
    };
    
    // Inicializa o array de passos se necessário
    if (!this.agentStepMap.has(step.execution_id)) {
      this.agentStepMap.set(step.execution_id, []);
    }
    
    const steps = this.agentStepMap.get(step.execution_id) || [];
    steps.push(newStep);
    this.agentStepMap.set(step.execution_id, steps);
    
    return newStep;
  }
  
  // Ferramentas de Agentes
  async getAgentTool(id: number): Promise<AgentTool | undefined> {
    return this.agentToolMap.get(id);
  }
  
  async getAllAgentTools(): Promise<AgentTool[]> {
    return Array.from(this.agentToolMap.values());
  }
  
  async getActiveAgentTools(): Promise<AgentTool[]> {
    return Array.from(this.agentToolMap.values())
      .filter(tool => tool.is_active);
  }
  
  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    const id = this.currentIds.agentTools++;
    const now = new Date();
    
    const newTool: AgentTool = {
      id,
      ...tool,
      created_at: now,
      updated_at: now
    };
    
    this.agentToolMap.set(id, newTool);
    return newTool;
  }
  
  async updateAgentTool(id: number, toolData: Partial<AgentTool>): Promise<AgentTool | undefined> {
    const tool = this.agentToolMap.get(id);
    if (!tool) return undefined;
    
    const updatedTool: AgentTool = {
      ...tool,
      ...toolData,
      updated_at: new Date()
    };
    
    this.agentToolMap.set(id, updatedTool);
    return updatedTool;
  }
  
  // Mapeamento de Ferramentas de Agentes
  async getAgentToolsByAgent(agentId: number): Promise<AgentTool[]> {
    // Encontra todos os mapeamentos para o agente
    const mappings = Array.from(this.agentToolMappingMap.values())
      .filter(mapping => mapping.agent_id === agentId && mapping.is_active);
    
    // Obtém as ferramentas correspondentes
    const tools: AgentTool[] = [];
    for (const mapping of mappings) {
      const tool = await this.getAgentTool(mapping.tool_id);
      if (tool && tool.is_active) {
        tools.push(tool);
      }
    }
    
    return tools;
  }
  
  async createAgentToolMapping(mapping: InsertAgentToolMapping): Promise<AgentToolMapping> {
    const id = this.currentIds.agentToolMappings++;
    const now = new Date();
    const key = `${mapping.agent_id}-${mapping.tool_id}`;
    
    const newMapping: AgentToolMapping = {
      id,
      ...mapping,
      created_at: now
    };
    
    this.agentToolMappingMap.set(key, newMapping);
    return newMapping;
  }
  
  async updateAgentToolMapping(agentId: number, toolId: number, isActive: boolean): Promise<boolean> {
    const key = `${agentId}-${toolId}`;
    const mapping = this.agentToolMappingMap.get(key);
    
    if (!mapping) return false;
    
    const updatedMapping: AgentToolMapping = {
      ...mapping,
      is_active: isActive
    };
    
    this.agentToolMappingMap.set(key, updatedMapping);
    return true;
  }
}

// Escolha a implementação baseada na configuração
const useDb = process.env.NODE_ENV === 'production' || process.env.USE_DB === 'true';

// Export a instância apropriada
export const storage = useDb ? new DbStorage() : new MemStorage();
