import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { log } from "./vite";
import { db } from "./db";
import { users, files } from "../shared/schema";
import { eq } from "drizzle-orm";

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

  // Cria um servidor HTTP
  const httpServer = createServer(app);

  return httpServer;
}
