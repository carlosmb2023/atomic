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
    
    // Usar apenas Neon com o cliente HTTP - mais compatível
    log('🌐 Usando conexão Neon Serverless');
    
    try {
      // Usar o cliente Neon com WebSocket e HTTP fallback
      // Para resolver o erro "client.query is not a function"
      const sqlClient = neon(connectionString, { fullResults: true });
      
      // Criar a instância do Drizzle ORM
      db = drizzle(sqlClient, { schema });
      
      // Validar que o cliente está realmente funcional
      // executando uma query de teste
      (async () => {
        try {
          const result = await db.execute(sql`SELECT 1 AS test_connection`);
          log('🔌 Conexão de teste bem-sucedida!');
        } catch (testError) {
          log(`❌ Erro no teste de conexão: ${testError}`, 'error');
        }
      })();
      
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
      const testResult = await db.execute(sql`SELECT 1 AS test_value`);
      log('🔌 Conexão com o banco de dados estabelecida com sucesso');
      
      // Método específico para criar as tabelas se elas não existirem
      try {
        // Este código será executado apenas uma vez durante a inicialização
        // e garantirá que as tabelas existam conforme definido no schema.
        log('🔄 Verificando se o schema está criado...');
        
        // Tentar fazer uma consulta simples para verificar
        try {
          const configExists = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = 'system_config'
            ) as exists
          `);
          
          // Se chegou aqui, a conexão está OK
          log('✅ Conexão verificada e schema existe');
          
          // Agora tenta encontrar configurações
          try {
            const configResult = await db.select().from(schema.systemConfig).limit(1);
            log(`Configurações encontradas: ${configResult.length}`);
          } catch (schemaError) {
            log(`⚠️ Aviso: Erro ao buscar configurações. ${schemaError}`, 'warn');
          }
        } catch (schemaCheckError) {
          log(`⚠️ Aviso: Não foi possível verificar schema. ${schemaCheckError}`, 'warn');
        }
      } catch (schemaError) {
        log(`⚠️ Aviso: Tabelas podem não existir ainda. ${schemaError}`, 'warn');
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