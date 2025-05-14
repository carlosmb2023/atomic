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
let dbInitialized = false;

// Função para detectar o tipo de conexão (Neon vs PostgreSQL padrão)
function isNeonConnection(url: string): boolean {
  return url.includes('neon') || url.startsWith('postgres://db.') || url.includes('.neon.tech');
}

// Função para inicializar o banco de dados
async function initDatabase() {
  try {
    // Se o banco já foi inicializado, retornar para evitar inicializações múltiplas
    if (dbInitialized) return true;
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      log('⚠️ Variável DATABASE_URL não definida, usando armazenamento em memória', 'warn');
      return false;
    }
    
    try {
      // Determinar se estamos usando Neon ou Postgres padrão
      if (isNeonConnection(connectionString)) {
        // Usar o cliente Neon com WebSocket e HTTP fallback
        log('🌐 Tentando conexão com Neon Serverless');
        
        // Criar cliente SQL com Neon
        const sqlClient = neon(connectionString);
        
        // Criar a instância do Drizzle ORM com a tipagem correta
        db = drizzle(sqlClient as any, { schema });
      } else {
        // Usar conexão PostgreSQL padrão
        log('🌐 Tentando conexão com PostgreSQL padrão');
        
        // Criar pool de conexões
        const pool = new Pool({
          connectionString,
          ssl: process.env.NODE_ENV === 'production'
        });
        
        // Testar a conexão com uma query simples
        const client = await pool.connect();
        try {
          const res = await client.query('SELECT NOW()');
          log(`✅ Conexão PostgreSQL estabelecida: ${res.rows[0].now}`);
        } finally {
          client.release();
        }
        
        // Criar a instância do Drizzle ORM
        db = drizzle(pool as any, { schema });
      }
      
      // Marcar banco como inicializado
      dbInitialized = true;
      
      log('✅ Banco de dados inicializado com sucesso');
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
(async () => {
  try {
    await initDatabase();
  } catch (error) {
    log(`❌ Falha ao conectar ao banco de dados: ${error}`, 'error');
  }
})().catch(err => log(`❌ Falha na inicialização assíncrona: ${err}`, 'error'));

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
      // Tenta com drizzle
      const testResult = await db.execute(sql`SELECT 1 AS test_value`);
      log('🔌 Conexão com o banco de dados estabelecida com sucesso');
      
      try {
        // Verifica se a tabela de configurações existe
        const configResult = await db.select().from(schema.systemConfig).limit(1);
        log(`Configurações encontradas: ${configResult.length}`);
        return true;
      } catch (error) {
        // Tabela pode não existir ainda, o que é normal em um primeiro uso
        log(`ℹ️ Tabela de configurações não encontrada: ${error}`, 'info');
        return true; // Retorna verdadeiro pois a conexão está OK
      }
    } catch (queryError) {
      // Falha na query básica significa problema de conexão
      log(`❌ Erro ao testar conexão com o banco: ${queryError}`, 'error');
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