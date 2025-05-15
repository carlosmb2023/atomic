import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testConnection, setupDatabase } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Testar conexão com o banco de dados
    try {
      const connected = await testConnection();
      if (connected) {
        log('Conexão com o banco de dados estabelecida com sucesso');
        await setupDatabase();
      } else {
        log('Falha ao conectar com o banco de dados, usando armazenamento em memória');
      }
    } catch (error) {
      log(`Erro ao testar conexão com o banco de dados: ${error}`);
    }

    log('Configurando rotas da aplicação...');
    const server = await registerRoutes(app);
    log('Rotas configuradas com sucesso');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`ERROR: ${message}`, 'error');
      res.status(status).json({ message });
    });

    log('Configurando ambiente de desenvolvimento...');
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Ambiente de desenvolvimento configurado com Vite');
    } else {
      serveStatic(app);
      log('Arquivos estáticos configurados para produção');
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    log('Iniciando servidor na porta ' + port + '...');
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`✅ Servidor iniciado com sucesso na porta ${port}`);
    });
    
    // Adiciona um handler para erros não tratados
    server.on('error', (err) => {
      log(`❌ Erro no servidor: ${err}`, 'error');
    });
  } catch (err) {
    log(`❌ Erro fatal durante inicialização do servidor: ${err}`, 'error');
    console.error(err);
  }
})();
