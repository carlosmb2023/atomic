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
    
    console.log('✅ Tabelas criadas com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    return false;
  }
}