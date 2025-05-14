// Importações necessárias
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { log } from './vite';
import pkg from 'pg';
import ws from 'ws';
const { Pool } = pkg;

// Configurar websocket para Neon
neonConfig.webSocketConstructor = ws;

// Variável para armazenar a instância do banco de dados
let db: any;

// Função para detectar o tipo de conexão (Neon vs PostgreSQL padrão)
function isNeonConnection(url: string): boolean {
  return url.includes('neon') || url.startsWith('postgres://db.') || url.includes('.neon.tech');
}

// Função para inicializar o banco de dados
function initDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      log('⚠️ Variável DATABASE_URL não definida', 'error');
      throw new Error('DATABASE_URL não definida');
    }
    
    // A única forma compatível é usar apenas Neon
    log('🌐 Usando conexão Neon Serverless');
    
    try {
      // Configurando o cliente Neon com suporte a WebSocket
      const sqlClient = neon(connectionString);
      
      // Criando uma instância Drizzle-ORM com o cliente
      db = drizzle(sqlClient, { schema });
      
      log('✅ Banco de dados inicializado com Neon');
      return true;
    } catch (error) {
      log(`❌ Erro ao inicializar banco de dados: ${error}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao inicializar banco de dados: ${error}`, 'error');
    return false;
  }
}

// Tentar inicializar o banco de dados na importação
try {
  initDatabase();
} catch (error) {
  log(`❌ Falha ao conectar ao banco de dados: ${error}`, 'error');
}

/**
 * Testa a conexão com o banco de dados
 */
export async function testConnection() {
  try {
    if (!db) {
      log('❌ Cliente de banco de dados não inicializado', 'error');
      return false;
    }
    
    // Tenta executar uma query simples para verificar a conexão
    try {
      // Usando uma consulta SQL básica que funciona com qualquer provedor
      await db.execute(sql`SELECT 1 AS test`);
      log('🔌 Conexão com o banco de dados estabelecida com sucesso');
      
      // Tenta buscar configurações, mas se falhar por tabela não existente, ainda
      // considera a conexão bem-sucedida
      try {
        const result = await db.select().from(schema.systemConfig).limit(1);
        log(`Configurações encontradas: ${result.length}`);
      } catch (schemaError) {
        log(`Aviso: Tabelas podem não existir ainda. ${schemaError}`, 'warn');
        // Não falha aqui pois a conexão está OK, só o schema que pode não estar pronto
      }
      
      return true;
    } catch (error) {
      log(`❌ Erro ao testar banco de dados: ${error}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao testar conexão com o banco de dados: ${error}`, 'error');
    return false;
  }
}

/**
 * Configura o banco de dados para uso
 */
export async function setupDatabase() {
  try {
    const connected = await testConnection();
    if (!connected) {
      return false;
    }
    
    // Verificar se existe uma configuração do sistema
    const configs = await db.select().from(schema.systemConfig).limit(1);
    
    if (configs.length === 0) {
      // Criar configuração inicial
      await db.insert(schema.systemConfig).values({
        execution_mode: 'local',
        local_llm_url: 'http://127.0.0.1:11434',
        cloud_llm_url: 'https://oracle-api.carlosdev.app.br',
        base_prompt: 'Você é um assistente útil e profissional que responde de maneira concisa e clara.',
        logs_enabled: true,
        active_llm_url: 'http://127.0.0.1:11434'
      });
      
      log('✅ Configuração inicial criada com sucesso');
    }
    
    log('✅ Banco de dados configurado com sucesso');
    return true;
  } catch (error) {
    log(`❌ Erro ao configurar banco de dados: ${error}`, 'error');
    return false;
  }
}

// Exportar a instância do banco de dados para uso em outros módulos
export { db };