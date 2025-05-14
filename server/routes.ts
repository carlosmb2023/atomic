import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { log } from "./vite";
import { db } from "./db";
import { users, files } from "../shared/schema";
import { eq } from "drizzle-orm";
import { ChatService } from "./services/chat.service";
import { LlmService } from "./services/llm.service";
import { ConfigService } from "./services/config.service";
import { OracleService, DeployStatus } from "./services/oracle.service";
import { ApifyService } from "./services/apify.service";
import { v4 as uuidv4 } from "uuid";

// Set up multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API status endpoint
  app.get("/api", (_req, res) => {
    res.json({ status: "Sistema online e operacional", time: new Date().toISOString() });
  });
  
  // Usuários endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, email, fullName, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios" });
      }
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Nome de usuário já existe" });
      }
      
      // Criar usuário
      const newUser = await storage.createUser({
        username,
        password,
        email,
        fullName,
        role: role || "user"
      });
      
      // Registrar log
      await storage.createLog({
        action: "user_create",
        details: `Usuário ${username} criado`,
        ip_address: req.ip,
        user_id: newUser.id
      });
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      });
    } catch (error) {
      log(`Erro ao criar usuário: ${error}`);
      return res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });
  
  app.get("/api/users", async (_req, res) => {
    try {
      const allUsers = await db.select().from(users);
      return res.json(allUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        created_at: user.created_at
      })));
    } catch (error) {
      log(`Erro ao listar usuários: ${error}`);
      return res.status(500).json({ error: "Erro ao listar usuários" });
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      log(`Erro ao buscar usuário: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });
  
  // Auth endpoints
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      // Atualizar último login
      if (user.id) {
        await storage.updateUser(user.id, {
          last_login: new Date()
        });
        
        // Registrar log
        await storage.createLog({
          action: "login",
          details: `Login bem-sucedido para ${username}`,
          ip_address: req.ip,
          user_id: user.id
        });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      log(`Erro no login: ${error}`);
      return res.status(500).json({ error: "Erro ao processar login" });
    }
  });
  
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios" });
      }
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Nome de usuário já existe" });
      }
      
      // Criar usuário
      const newUser = await storage.createUser({
        username,
        password,
        email,
        fullName,
        role: "user"
      });
      
      // Registrar log
      await storage.createLog({
        action: "register",
        details: `Novo registro: ${username}`,
        ip_address: req.ip,
        user_id: newUser.id
      });
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      });
    } catch (error) {
      log(`Erro no registro: ${error}`);
      return res.status(500).json({ error: "Erro ao processar registro" });
    }
  });
  
  // File upload endpoint with database
  app.post("/upload", upload.array("files"), async (req, res) => {
    try {
      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).send("No files uploaded");
      }
      
      const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
      const description = req.body.description || "";
      const isPublic = req.body.is_public === "true";
      
      // Salvar arquivos no banco de dados
      const savedFiles = await Promise.all(
        uploadedFiles.map(async (file) => {
          const fileRecord = await storage.createFile({
            filename: file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype || "",
            user_id: userId,
            description: description,
            is_public: isPublic
          });
          
          return fileRecord;
        })
      );
      
      // Registrar log se tiver userId
      if (userId) {
        await storage.createLog({
          action: "upload_files",
          details: `Enviou ${uploadedFiles.length} arquivo(s)`,
          ip_address: req.ip,
          user_id: userId
        });
      }
      
      const fileNames = savedFiles.map(file => file.filename);
      return res.status(200).json({ 
        message: "Files uploaded successfully", 
        files: fileNames 
      });
    } catch (error) {
      log(`Erro ao fazer upload: ${error}`);
      return res.status(500).send("Error uploading files");
    }
  });
  
  // List files endpoint with database integration
  app.get("/files", async (req, res) => {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
      
      if (userId) {
        // Obter arquivos do usuário específico
        const userFiles = await storage.getFilesByUser(userId);
        return res.json(userFiles.map(file => ({
          id: file.id,
          filename: file.filename,
          size: file.size,
          type: file.type,
          uploaded_at: file.uploaded_at,
          description: file.description,
          is_public: file.is_public
        })));
      } else {
        // Obter todos os arquivos públicos
        const publicFiles = await db.select().from(files).where(eq(files.is_public, true));
        
        if (publicFiles.length > 0) {
          return res.json(publicFiles.map(file => ({
            id: file.id,
            filename: file.filename,
            size: file.size,
            type: file.type,
            uploaded_at: file.uploaded_at,
            description: file.description
          })));
        } else {
          // Se não houver arquivos no banco, retorna do sistema de arquivos
          fs.readdir(uploadsDir, (err, filesList) => {
            if (err) {
              log(`Erro ao listar diretório: ${err}`);
              return res.status(500).send("Error reading files");
            }
            return res.status(200).json(filesList);
          });
        }
      }
    } catch (error) {
      log(`Erro ao listar arquivos: ${error}`);
      return res.status(500).send("Error listing files");
    }
  });
  
  // Get file info endpoint
  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        return res.status(400).json({ error: "ID de arquivo inválido" });
      }
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }
      
      // Verificar permissões
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
      if (!file.is_public && file.user_id !== userId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      return res.json({
        id: file.id,
        filename: file.filename,
        size: file.size,
        type: file.type,
        uploaded_at: file.uploaded_at,
        description: file.description,
        is_public: file.is_public,
        user_id: file.user_id
      });
    } catch (error) {
      log(`Erro ao buscar arquivo: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar arquivo" });
    }
  });
  
  // Download file endpoint with database integration
  app.get("/download/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadsDir, filename);
      
      // Verificar se o arquivo existe no disco
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Arquivo não encontrado");
      }
      
      // Buscar informações do arquivo no banco
      const dbFiles = await db.select().from(files).where(eq(files.filename, filename));
      const fileInfo = dbFiles[0];
      
      // Verificar permissões se o arquivo não for público
      if (fileInfo && !fileInfo.is_public) {
        const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
        if (!userId || userId !== fileInfo.user_id) {
          return res.status(403).send("Acesso não autorizado");
        }
      }
      
      // Registrar log de download
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
      if (userId) {
        await storage.createLog({
          action: "download_file",
          details: `Download de ${filename}`,
          ip_address: req.ip,
          user_id: userId
        });
      }
      
      return res.download(filePath);
    } catch (error) {
      log(`Erro ao baixar arquivo: ${error}`);
      return res.status(500).send("Erro ao baixar arquivo");
    }
  });

  // ===================================================
  // Rotas para Sistema de Chat e LLM
  // ===================================================
  
  // Instâncias dos serviços
  const chatService = ChatService.getInstance();
  const llmService = LlmService.getInstance();
  const configService = ConfigService.getInstance();
  const oracleService = OracleService.getInstance();
  const apifyService = ApifyService.getInstance();
  
  // Rota para enviar mensagem ao LLM diretamente
  app.post("/api/llm/prompt", async (req, res) => {
    try {
      const { prompt, userId, model, temperature, maxTokens, systemPrompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "O prompt é obrigatório" });
      }
      
      const response = await llmService.sendPrompt(prompt, {
        userId: userId ? parseInt(userId) : undefined,
        model,
        temperature: temperature ? parseFloat(temperature) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
        systemPrompt
      });
      
      if (!response.success) {
        return res.status(500).json({ error: response.error, source: response.source });
      }
      
      return res.json({
        text: response.text,
        source: response.source,
        tokens: response.tokens,
        responseTimeMs: response.responseTimeMs
      });
    } catch (error) {
      log(`Erro ao processar prompt LLM: ${error}`);
      return res.status(500).json({ error: "Erro ao processar prompt" });
    }
  });
  
  // Rotas para chat
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }
      
      const session = await chatService.createSession(parseInt(userId));
      
      return res.status(201).json(session);
    } catch (error) {
      log(`Erro ao criar sessão de chat: ${error}`);
      return res.status(500).json({ error: "Erro ao criar sessão de chat" });
    }
  });
  
  app.get("/api/chat/sessions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      if (!userId) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }
      
      const sessions = await chatService.listSessions(userId);
      
      return res.json(sessions);
    } catch (error) {
      log(`Erro ao listar sessões de chat: ${error}`);
      return res.status(500).json({ error: "Erro ao listar sessões de chat" });
    }
  });
  
  app.get("/api/chat/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (!sessionId) {
        return res.status(400).json({ error: "ID da sessão é obrigatório" });
      }
      
      const session = await chatService.getSession(sessionId, userId);
      
      if (!session) {
        return res.status(404).json({ error: "Sessão não encontrada" });
      }
      
      return res.json(session);
    } catch (error) {
      log(`Erro ao buscar sessão de chat: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar sessão de chat" });
    }
  });
  
  app.post("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message, userId } = req.body;
      
      if (!sessionId || !message || !userId) {
        return res.status(400).json({ error: "Parâmetros incompletos" });
      }
      
      const response = await chatService.sendMessage(
        sessionId,
        message,
        parseInt(userId)
      );
      
      return res.json(response);
    } catch (error) {
      log(`Erro ao enviar mensagem: ${error}`);
      return res.status(500).json({ error: "Erro ao enviar mensagem" });
    }
  });
  
  // ===================================================
  // Rotas para Configuração do Sistema
  // ===================================================
  
  app.get("/api/system/config", async (_req, res) => {
    try {
      const config = await configService.getConfig();
      
      if (!config) {
        return res.status(404).json({ error: "Configuração não encontrada" });
      }
      
      // Não enviar informações sensíveis como API keys
      const safeConfig = {
        ...config,
        apify_api_key: config.apify_api_key ? "***************" : null
      };
      
      return res.json(safeConfig);
    } catch (error) {
      log(`Erro ao buscar configuração: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar configuração" });
    }
  });
  
  app.patch("/api/system/config", async (req, res) => {
    try {
      const { 
        execution_mode, local_llm_url, cloud_llm_url, apify_actor_url,
        apify_api_key, base_prompt, logs_enabled, updated_by
      } = req.body;
      
      const updatedConfig = await configService.updateConfig({
        ...(execution_mode && { execution_mode }),
        ...(local_llm_url && { local_llm_url }),
        ...(cloud_llm_url && { cloud_llm_url }),
        ...(apify_actor_url && { apify_actor_url }),
        ...(apify_api_key && { apify_api_key }),
        ...(base_prompt && { base_prompt }),
        ...(logs_enabled !== undefined && { logs_enabled }),
        ...(updated_by && { updated_by: parseInt(updated_by) })
      });
      
      if (!updatedConfig) {
        return res.status(500).json({ error: "Erro ao atualizar configuração" });
      }
      
      // Não enviar informações sensíveis
      const safeConfig = {
        ...updatedConfig,
        apify_api_key: updatedConfig.apify_api_key ? "***************" : null
      };
      
      return res.json(safeConfig);
    } catch (error) {
      log(`Erro ao atualizar configuração: ${error}`);
      return res.status(500).json({ error: "Erro ao atualizar configuração" });
    }
  });
  
  app.post("/api/system/mode/switch", async (req, res) => {
    try {
      const { mode, userId } = req.body;
      
      if (!mode || (mode !== 'local' && mode !== 'cloud')) {
        return res.status(400).json({ error: "Modo inválido. Use 'local' ou 'cloud'" });
      }
      
      const result = await configService.switchExecutionMode(
        mode, 
        userId ? parseInt(userId) : undefined
      );
      
      if (!result) {
        return res.status(500).json({ error: "Erro ao trocar modo de execução" });
      }
      
      return res.json({ 
        success: true, 
        mode: result.execution_mode,
        active_url: result.active_llm_url
      });
    } catch (error) {
      log(`Erro ao trocar modo de execução: ${error}`);
      return res.status(500).json({ error: "Erro ao trocar modo de execução" });
    }
  });
  
  // ===================================================
  // Rotas para Deploy na Oracle Cloud
  // ===================================================
  
  app.post("/api/oracle/deploy", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }
      
      // Verificar se já existe um deploy em andamento
      if (oracleService.isDeployInProgress()) {
        return res.status(409).json({ 
          error: "Já existe um deploy em andamento",
          status: DeployStatus.IN_PROGRESS
        });
      }
      
      // Iniciar deploy de forma assíncrona
      const deployPromise = oracleService.startDeploy(parseInt(userId));
      
      // Retornar imediatamente que o deploy foi iniciado
      res.status(202).json({ 
        message: "Deploy iniciado com sucesso", 
        status: DeployStatus.STARTING
      });
      
      // Processar o deploy em background
      deployPromise.then(result => {
        log(`Deploy concluído: ${JSON.stringify(result)}`);
      }).catch(error => {
        log(`Erro no deploy: ${error}`);
      });
    } catch (error) {
      log(`Erro ao iniciar deploy: ${error}`);
      return res.status(500).json({ error: "Erro ao iniciar deploy" });
    }
  });
  
  app.get("/api/oracle/status", async (req, res) => {
    try {
      const inProgress = oracleService.isDeployInProgress();
      
      // Buscar logs recentes de deploy
      const recentLogs = await storage.getRecentDeployLogs(1);
      
      if (recentLogs.length === 0) {
        return res.json({
          status: "unknown",
          inProgress
        });
      }
      
      const latestLog = recentLogs[0];
      
      return res.json({
        status: latestLog.status,
        action: latestLog.action,
        inProgress,
        instanceIp: latestLog.instance_ip,
        lastUpdate: latestLog.created_at
      });
    } catch (error) {
      log(`Erro ao buscar status do deploy: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar status do deploy" });
    }
  });
  
  app.post("/api/oracle/instance/stop", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }
      
      // Verificar se já existe um deploy em andamento
      if (oracleService.isDeployInProgress()) {
        return res.status(409).json({ 
          error: "Já existe um deploy em andamento",
          status: DeployStatus.IN_PROGRESS
        });
      }
      
      // Iniciar a parada da instância de forma assíncrona
      const stopPromise = oracleService.stopInstance(parseInt(userId));
      
      // Retornar imediatamente que a parada foi iniciada
      res.status(202).json({ 
        message: "Parada da instância iniciada com sucesso", 
        status: DeployStatus.STARTING
      });
      
      // Processar a parada em background
      stopPromise.then(result => {
        log(`Parada concluída: ${JSON.stringify(result)}`);
      }).catch(error => {
        log(`Erro na parada: ${error}`);
      });
    } catch (error) {
      log(`Erro ao parar instância: ${error}`);
      return res.status(500).json({ error: "Erro ao parar instância" });
    }
  });
  
  // ===================================================
  // Rota para Busca com Apify
  // ===================================================
  
  app.post("/api/apify/search", async (req, res) => {
    try {
      const { query, userId, maxResults } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Consulta de busca é obrigatória" });
      }
      
      const results = await apifyService.search(query, {
        userId: userId ? parseInt(userId) : undefined,
        maxResults: maxResults ? parseInt(maxResults) : undefined
      });
      
      return res.json(results);
    } catch (error) {
      log(`Erro na busca Apify: ${error}`);
      return res.status(500).json({ error: "Erro ao realizar busca" });
    }
  });
  
  // ===================================================
  // Rotas para Métricas e Estatísticas
  // ===================================================
  
  app.get("/api/metrics/daily", async (req, res) => {
    try {
      const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = req.query.end ? new Date(req.query.end as string) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      // Buscar métricas diárias para o período
      const metricsQuery = await db.select()
        .from(dailyMetrics)
        .where(
          sql`${dailyMetrics.date} >= ${startDate} AND ${dailyMetrics.date} <= ${endDate}`
        )
        .orderBy(dailyMetrics.date);
      
      return res.json(metricsQuery);
    } catch (error) {
      log(`Erro ao buscar métricas: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar métricas" });
    }
  });
  
  app.get("/api/logs/llm", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      if (!userId) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }
      
      const logs = await storage.getLlmLogsByUser(userId, limit);
      
      return res.json(logs);
    } catch (error) {
      log(`Erro ao buscar logs LLM: ${error}`);
      return res.status(500).json({ error: "Erro ao buscar logs LLM" });
    }
  });
  
  // Cria um servidor HTTP
  const httpServer = createServer(app);

  return httpServer;
}
