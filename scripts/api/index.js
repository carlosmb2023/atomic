require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const winston = require('winston');

// Configuração de logs
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mistral-api.log' })
  ]
});

// Configurações
const app = express();
const PORT = process.env.PORT || 3000;
const MISTRAL_URL = process.env.MISTRAL_URL || 'http://localhost:8000';

// Conexão com o PostgreSQL
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  logger.info('Conectado ao PostgreSQL');
} else {
  logger.warn('URL do banco de dados não definida, histórico não será persistido');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Registra solicitações
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rota de status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Mistral API Bridge',
    version: '1.0.0'
  });
});

// Rota para chat completion com Mistral
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const startTime = Date.now();
    const requestBody = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    // Log de solicitação
    logger.info(`Solicitação de chat de usuário: ${userId}`);
    
    // Envia solicitação para o Mistral
    const response = await axios.post(`${MISTRAL_URL}/v1/chat/completions`, requestBody);
    
    // Calcula métricas
    const duration = Date.now() - startTime;
    const tokens = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Salva log no banco de dados se disponível
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO mistral_logs (user_id, request_type, prompt, tokens_in, tokens_out, duration_ms, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [
            userId,
            'chat',
            JSON.stringify(requestBody.messages),
            tokens.prompt_tokens,
            tokens.completion_tokens,
            duration
          ]
        );
      } catch (dbError) {
        logger.error('Erro ao salvar log no banco de dados', { error: dbError.message });
      }
    }
    
    res.json(response.data);
  } catch (error) {
    logger.error('Erro na solicitação para Mistral', { 
      error: error.message,
      response: error.response?.data
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Erro ao processar solicitação',
        message: error.message
      });
    }
  }
});

// Rota para completion padrão com Mistral
app.post('/v1/completions', async (req, res) => {
  try {
    const startTime = Date.now();
    const requestBody = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    logger.info(`Solicitação de completion de usuário: ${userId}`);
    
    const response = await axios.post(`${MISTRAL_URL}/v1/completions`, requestBody);
    
    const duration = Date.now() - startTime;
    const tokens = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO mistral_logs (user_id, request_type, prompt, tokens_in, tokens_out, duration_ms, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [
            userId,
            'completion',
            requestBody.prompt,
            tokens.prompt_tokens,
            tokens.completion_tokens,
            duration
          ]
        );
      } catch (dbError) {
        logger.error('Erro ao salvar log no banco de dados', { error: dbError.message });
      }
    }
    
    res.json(response.data);
  } catch (error) {
    logger.error('Erro na solicitação para Mistral', { 
      error: error.message,
      response: error.response?.data
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Erro ao processar solicitação',
        message: error.message
      });
    }
  }
});

// Criar tabela de logs se o banco de dados estiver disponível
async function initDatabase() {
  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mistral_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          request_type VARCHAR(50) NOT NULL,
          prompt TEXT NOT NULL,
          tokens_in INTEGER NOT NULL DEFAULT 0,
          tokens_out INTEGER NOT NULL DEFAULT 0,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mistral_logs_user_id ON mistral_logs(user_id)
      `);
      
      logger.info('Tabela de logs criada/verificada com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar banco de dados', { error: error.message });
    }
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  logger.info(`Mistral API Bridge rodando na porta ${PORT}`);
  logger.info(`Conectado ao Mistral em ${MISTRAL_URL}`);
  
  await initDatabase();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promessa rejeitada não tratada', { reason, promise });
});