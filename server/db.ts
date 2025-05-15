// Importações necessárias
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { log } from './vite';
import ws from 'ws';

// Configuração para WebSockets no Neon
if (typeof WebSocket === 'undefined') {
  // @ts-ignore
  global.WebSocket = ws;
}

// Variável para armazenar a instância do banco de dados
let db: any;
let dbInitialized = false;

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
      log('🌐 Tentando conexão com o banco de dados PostgreSQL');
        
      // Criar pool de conexões
      const pool = new Pool({
        connectionString,
      });
      
      // Criar a instância do Drizzle ORM
      db = drizzle(pool, { schema });
      
      // Testar a conexão com uma query simples
      const result = await db.execute(sql`SELECT 1 AS connected`);
      
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
    // Se o banco de dados ainda não foi inicializado, tentar inicializar
    if (!dbInitialized) {
      const initialized = await initDatabase();
      if (!initialized) {
        return false;
      }
    }
    
    if (!db) {
      log('❌ Cliente de banco de dados não inicializado', 'error');
      return false;
    }
    
    // Tenta executar uma query simples para verificar a conexão
    try {
      // Tenta com drizzle
      const testResult = await db.execute(sql`SELECT 1 AS test_value`);
      log('🔌 Conexão com o banco de dados estabelecida com sucesso');
      return true;
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
      log('❌ Falha ao conectar com o banco de dados, usando armazenamento em memória');
      return false;
    }
    
    try {
      // Criar tabelas necessárias se não existirem
      try {
        // Verifica se as tabelas existem através de uma consulta simples
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS system_config (
            id SERIAL PRIMARY KEY,
            execution_mode VARCHAR(50) NOT NULL DEFAULT 'local',
            local_llm_url TEXT NOT NULL DEFAULT 'http://127.0.0.1:11434',
            cloud_llm_url TEXT NOT NULL DEFAULT 'https://oracle-api.carlosdev.app.br',
            active_llm_url TEXT NOT NULL DEFAULT 'http://127.0.0.1:11434',
            base_prompt TEXT DEFAULT 'Você é um assistente útil e profissional.',
            logs_enabled BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by INTEGER,
            oracle_instance_ip TEXT,
            mistral_local_url TEXT DEFAULT 'http://127.0.0.1:8000',
            mistral_cloud_url TEXT DEFAULT 'https://api.mistral.ai/v1',
            mistral_instance_type VARCHAR(50) DEFAULT 'oracle_arm',
            mistral_api_key TEXT,
            apify_actor_url TEXT,
            apify_api_key TEXT,
            cloudflare_tunnel_enabled BOOLEAN DEFAULT FALSE,
            cloudflare_tunnel_id TEXT
          )
        `);
        
        log('✅ Tabela system_config verificada/criada com sucesso');
      } catch (tableError) {
        log(`⚠️ Erro ao verificar/criar tabelas: ${tableError}`, 'warn');
      }
      
      // Verificar se existe uma configuração do sistema
      try {
        // Obtém a referência ao pool que foi inicializado anteriormente
        const connectionString = process.env.DATABASE_URL;
        const pgPool = new Pool({ connectionString });
        
        // Utilizando SQL puro para verificar se existem configurações
        const { rows } = await pgPool.query('SELECT id FROM system_config ORDER BY id DESC LIMIT 1');
        
        let configExists = rows && rows.length > 0;
        let configId = configExists ? rows[0].id : null;
        
        if (configExists) {
          log(`Encontrada configuração existente com ID ${configId}`);
          
          // Verifica se existem múltiplas configurações
          const { rows: countRows } = await pgPool.query('SELECT COUNT(*) AS total FROM system_config');
          const totalConfigs = parseInt(countRows[0].total, 10);
          
          if (totalConfigs > 1) {
            log(`Existem ${totalConfigs} configurações. Realizando limpeza...`);
            
            // Remove todas as configurações exceto a mais recente
            await pgPool.query('DELETE FROM system_config WHERE id != $1', [configId]);
            log(`Tabela de configurações limpa. Mantida apenas a configuração mais recente (ID: ${configId})`);
          }
        } else {
          log('Nenhuma configuração existente encontrada');
          
          // Criar configuração inicial usando SQL puro
          const result = await pgPool.query(`
            INSERT INTO system_config 
            (execution_mode, local_llm_url, cloud_llm_url, active_llm_url, base_prompt, logs_enabled,
             mistral_local_url, mistral_cloud_url, mistral_instance_type)
            VALUES 
            ('local', 'http://127.0.0.1:11434', 'https://oracle-api.carlosdev.app.br', 
             'http://127.0.0.1:11434', 'Você é um assistente útil e profissional que responde de maneira concisa e clara.', true,
             'http://127.0.0.1:8000', 'https://api.mistral.ai/v1', 'oracle_arm')
            RETURNING id
          `);
          
          // Obtém o ID da configuração criada
          if (result.rows.length > 0) {
            configId = result.rows[0].id;
            log(`✅ Configuração inicial criada com sucesso (ID: ${configId})`);
          } else {
            log('⚠️ Configuração criada mas não foi possível obter o ID');
          }
        }
      } catch (countError) {
        log(`⚠️ Erro ao verificar configurações existentes: ${countError}`, 'warn');
        
        // Tenta inserir de qualquer forma, ignorando erros de duplicação
        try {
          await db.execute(sql`
            INSERT INTO system_config 
            (execution_mode, local_llm_url, cloud_llm_url, active_llm_url, base_prompt, logs_enabled) 
            VALUES 
            ('local', 'http://127.0.0.1:11434', 'https://oracle-api.carlosdev.app.br', 'http://127.0.0.1:11434', 'Você é um assistente útil e profissional que responde de maneira concisa e clara.', true)
            ON CONFLICT DO NOTHING
          `);
          log('✅ Tentativa de inserção de configuração realizada');
        } catch (insertError) {
          log(`⚠️ Erro ao inserir configuração: ${insertError}`, 'warn');
        }
      }
      
      log('✅ Banco de dados configurado com sucesso');
      return true;
    } catch (setupError) {
      log(`❌ Erro ao configurar tabelas do banco de dados: ${setupError}`, 'error');
      log('❌ Falha ao configurar banco de dados, usando armazenamento em memória');
      return false;
    }
  } catch (outerError) {
    log(`❌ Erro ao configurar banco de dados: ${outerError}`, 'error');
    return false;
  }
}

// Exportar a instância do banco de dados para uso em outros módulos
export { db };