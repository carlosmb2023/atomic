import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  profile_img: text("profile_img"),
  is_active: boolean("is_active").default(true),
});

// Arquivos
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  type: varchar("type", { length: 100 }),
  user_id: integer("user_id").references(() => users.id),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  description: text("description"),
  is_public: boolean("is_public").default(false),
});

// Projetos
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  user_id: integer("user_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  status: varchar("status", { length: 50 }).default("active"),
});

// Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  created_at: timestamp("created_at").defaultNow(),
  ip_address: varchar("ip_address", { length: 45 }),
});

// Configurações do Sistema
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  execution_mode: varchar("execution_mode", { length: 50 }).default("local").notNull(),
  local_llm_url: text("local_llm_url").default("http://127.0.0.1:11434").notNull(),
  cloud_llm_url: text("cloud_llm_url").default("https://oracle-api.carlosdev.app.br").notNull(),
  apify_actor_url: text("apify_actor_url"),
  apify_api_key: text("apify_api_key"),
  base_prompt: text("base_prompt").default("Você é um assistente útil e profissional."),
  logs_enabled: boolean("logs_enabled").default(true),
  updated_at: timestamp("updated_at").defaultNow(),
  updated_by: integer("updated_by").references(() => users.id),
  oracle_instance_ip: text("oracle_instance_ip"),
  active_llm_url: text("active_llm_url").default("http://127.0.0.1:11434").notNull(),
  // Campos específicos para Mistral
  mistral_local_url: text("mistral_local_url").default("http://127.0.0.1:8000"),
  mistral_cloud_url: text("mistral_cloud_url").default("https://api.mistral.ai/v1"),
  mistral_instance_type: varchar("mistral_instance_type", { length: 50 }).default("oracle_arm"),
  // Campos para Cloudflare Tunnel
  cloudflare_tunnel_enabled: boolean("cloudflare_tunnel_enabled").default(false),
  cloudflare_tunnel_id: text("cloudflare_tunnel_id"),
});

// Logs de LLM/Chat
export const llmLogs = pgTable("llm_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  prompt: text("prompt").notNull(),
  response: text("response"),
  source: varchar("source", { length: 50 }).notNull(), // 'local', 'cloud', 'apify'
  tokens_used: integer("tokens_used"),
  response_time_ms: integer("response_time_ms"),
  status: varchar("status", { length: 50 }).default("success"), // 'success', 'error'
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
  metadata: json("metadata"), // Informações adicionais (ex: parâmetros de chamada)
});

// Histórico de Chat
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  session_id: varchar("session_id", { length: 100 }).notNull(),
  messages: json("messages").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  title: varchar("title", { length: 255 }),
});

// Métricas Diárias
export const dailyMetrics = pgTable("daily_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().unique(),
  total_requests: integer("total_requests").default(0),
  total_tokens: integer("total_tokens").default(0),
  local_requests: integer("local_requests").default(0),
  cloud_requests: integer("cloud_requests").default(0),
  apify_requests: integer("apify_requests").default(0),
  successful_requests: integer("successful_requests").default(0),
  failed_requests: integer("failed_requests").default(0),
  avg_response_time: numeric("avg_response_time", { precision: 10, scale: 2 }).default("0"),
  metrics_history: json("metrics_history").default([]),  // Array JSON para armazenar métricas ao longo do tempo
  last_update: timestamp("last_update").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Deploy Logs
export const deployLogs = pgTable("deploy_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // 'create', 'start', 'stop', 'delete'
  status: varchar("status", { length: 50 }).notNull(), // 'success', 'failed', 'in_progress'
  instance_id: varchar("instance_id", { length: 255 }),
  instance_ip: varchar("instance_ip", { length: 45 }),
  details: text("details"),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  path: true,
  size: true,
  type: true,
  user_id: true,
  description: true,
  is_public: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  user_id: true,
  status: true,
});

export const insertLogSchema = createInsertSchema(logs).pick({
  user_id: true,
  action: true,
  details: true,
  ip_address: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).pick({
  execution_mode: true,
  local_llm_url: true,
  cloud_llm_url: true,
  apify_actor_url: true,
  apify_api_key: true,
  base_prompt: true,
  logs_enabled: true,
  updated_by: true,
  oracle_instance_ip: true,
  active_llm_url: true,
  mistral_local_url: true,
  mistral_cloud_url: true,
  mistral_instance_type: true,
  cloudflare_tunnel_enabled: true,
  cloudflare_tunnel_id: true,
});

export const insertLlmLogSchema = createInsertSchema(llmLogs).pick({
  user_id: true,
  prompt: true,
  response: true,
  source: true,
  tokens_used: true,
  response_time_ms: true,
  status: true,
  error_message: true,
  metadata: true,
});

export const insertChatHistorySchema = createInsertSchema(chatHistory).pick({
  user_id: true,
  session_id: true,
  messages: true,
  title: true,
});

export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics).pick({
  date: true,
  total_requests: true,
  total_tokens: true,
  local_requests: true,
  cloud_requests: true,
  apify_requests: true,
  successful_requests: true,
  failed_requests: true,
  avg_response_time: true,
});

export const insertDeployLogSchema = createInsertSchema(deployLogs).pick({
  user_id: true,
  action: true,
  status: true,
  instance_id: true,
  instance_ip: true,
  details: true,
});

// Tipos para os modelos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;

export type InsertLlmLog = z.infer<typeof insertLlmLogSchema>;
export type LlmLog = typeof llmLogs.$inferSelect;

export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatHistory = typeof chatHistory.$inferSelect;

export type InsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;
export type DailyMetrics = typeof dailyMetrics.$inferSelect;

export type InsertDeployLog = z.infer<typeof insertDeployLogSchema>;
export type DeployLog = typeof deployLogs.$inferSelect;

// Agentes
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'openai' ou 'mistral'
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  last_execution: timestamp("last_execution"),
  status: text("status").default("inactive"), // 'active', 'inactive', 'error'
  description: text("description"),
  configuration: json("configuration"), // Configurações específicas do agente
});

// Execuções dos agentes
export const agentExecutions = pgTable("agent_executions", {
  id: serial("id").primaryKey(),
  agent_id: integer("agent_id").references(() => agents.id),
  user_id: integer("user_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  objective: text("objective").notNull(),
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  started_at: timestamp("started_at").notNull(),
  completed_at: timestamp("completed_at"),
  summary: text("summary"),
  error_message: text("error_message"),
});

// Passos de execução dos agentes
export const agentSteps = pgTable("agent_steps", {
  id: serial("id").primaryKey(),
  execution_id: integer("execution_id").references(() => agentExecutions.id),
  created_at: timestamp("created_at").defaultNow(),
  step_type: text("step_type").notNull(), // 'thought', 'action', 'observation', 'conclusion'
  content: text("content").notNull(),
  order: integer("order").notNull(),
  tool_used: text("tool_used"),
  metadata: json("metadata"),
});

// Ferramentas dos agentes
export const agentTools = pgTable("agent_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  type: text("type").notNull(), // 'api', 'function', 'script', etc.
  configuration: json("configuration"), // Configuração da ferramenta
  is_active: boolean("is_active").default(true),
});

// Relação entre agentes e ferramentas
export const agentToolMappings = pgTable("agent_tool_mappings", {
  id: serial("id").primaryKey(),
  agent_id: integer("agent_id").references(() => agents.id),
  tool_id: integer("tool_id").references(() => agentTools.id),
  created_at: timestamp("created_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Schemas de inserção
export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  type: true,
  description: true,
  configuration: true,
  status: true
});

export const insertAgentExecutionSchema = createInsertSchema(agentExecutions).pick({
  agent_id: true,
  user_id: true,
  objective: true,
  status: true,
  started_at: true,
  completed_at: true,
  summary: true,
  error_message: true
});

export const insertAgentStepSchema = createInsertSchema(agentSteps).pick({
  execution_id: true,
  step_type: true,
  content: true,
  order: true,
  tool_used: true,
  metadata: true
});

export const insertAgentToolSchema = createInsertSchema(agentTools).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertAgentToolMappingSchema = createInsertSchema(agentToolMappings).omit({
  id: true,
  created_at: true
});

// Tipos
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertAgentExecution = z.infer<typeof insertAgentExecutionSchema>;
export type AgentExecution = typeof agentExecutions.$inferSelect;

export type InsertAgentStep = z.infer<typeof insertAgentStepSchema>;
export type AgentStep = typeof agentSteps.$inferSelect;

export type InsertAgentTool = z.infer<typeof insertAgentToolSchema>;
export type AgentTool = typeof agentTools.$inferSelect;

export type InsertAgentToolMapping = z.infer<typeof insertAgentToolMappingSchema>;
export type AgentToolMapping = typeof agentToolMappings.$inferSelect;
