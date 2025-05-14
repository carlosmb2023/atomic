import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Permitir self-signed em ambiente de desenvolvimento
neonConfig.fetchConnectionCache = true;

// Configuração da conexão ao banco de dados
const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
export const db = drizzle(sql);

// Função para testar a conexão com o banco de dados
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('🔌 Conexão com o banco de dados estabelecida:', result);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Função para criar tabelas no banco de dados
export async function initializeDatabase() {
  try {
    // Usuários
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        profile_img TEXT,
        is_active BOOLEAN DEFAULT TRUE
      )
    `;
    
    // Arquivos
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        type VARCHAR(100),
        user_id INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE
      )
    `;
    
    // Projetos
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'active'
      )
    `;
    
    // Logs
    await sql`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45)
      )
    `;
    
    // Configurações do Sistema
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        execution_mode VARCHAR(50) DEFAULT 'local' NOT NULL,
        local_llm_url TEXT DEFAULT 'http://127.0.0.1:11434' NOT NULL,
        cloud_llm_url TEXT DEFAULT 'https://oracle-api.carlosdev.app.br' NOT NULL,
        apify_actor_url TEXT,
        apify_api_key TEXT,
        base_prompt TEXT DEFAULT 'Você é um assistente útil e profissional.',
        logs_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id),
        oracle_instance_ip TEXT,
        active_llm_url TEXT DEFAULT 'http://127.0.0.1:11434' NOT NULL
      )
    `;
    
    // Logs de LLM/Chat
    await sql`
      CREATE TABLE IF NOT EXISTS llm_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        prompt TEXT NOT NULL,
        response TEXT,
        source VARCHAR(50) NOT NULL,
        tokens_used INTEGER,
        response_time_ms INTEGER,
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      )
    `;
    
    // Histórico de Chat
    await sql`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        title VARCHAR(255)
      )
    `;
    
    // Métricas Diárias
    await sql`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL UNIQUE,
        total_requests INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        local_requests INTEGER DEFAULT 0,
        cloud_requests INTEGER DEFAULT 0,
        apify_requests INTEGER DEFAULT 0,
        successful_requests INTEGER DEFAULT 0,
        failed_requests INTEGER DEFAULT 0,
        avg_response_time NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Deploy Logs
    await sql`
      CREATE TABLE IF NOT EXISTS deploy_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        instance_id VARCHAR(255),
        instance_ip VARCHAR(45),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Criar configuração inicial, se não existir
    const configExists = await sql`SELECT id FROM system_config LIMIT 1`;
    if (configExists.length === 0) {
      await sql`
        INSERT INTO system_config (
          execution_mode, 
          local_llm_url, 
          cloud_llm_url, 
          base_prompt, 
          logs_enabled, 
          active_llm_url
        ) VALUES (
          'local',
          'http://127.0.0.1:11434',
          'https://oracle-api.carlosdev.app.br',
          'Você é um assistente útil e profissional que responde de maneira concisa e clara.',
          TRUE,
          'http://127.0.0.1:11434'
        )
      `;
    }
    
    console.log('✅ Tabelas criadas com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    return false;
  }
}