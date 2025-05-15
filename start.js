/**
 * Script de inicialização otimizado para deploy
 * Garante que o agente Mistral seja inicializado corretamente
 */

const dotenv = require('dotenv');
dotenv.config();

// Verificar configurações críticas
if (!process.env.MISTRAL_API_KEY) {
  console.error('⚠️ AVISO: MISTRAL_API_KEY não configurada. A funcionalidade do agente Mistral será limitada.');
}

console.log('🚀 Iniciando servidor em modo produção');
console.log(`🤖 Agente Mistral ID: ag:48009b45:20250515:programador-agente:d9bb1918`);

// Definir configurações de hardware recomendadas
const RECOMMENDED_MEMORY = 8 * 1024 * 1024 * 1024; // 8GB em bytes
const RECOMMENDED_CORES = 4;

// Verificar recursos disponíveis
const os = require('os');
const availableMemory = os.totalmem();
const availableCores = os.cpus().length;

console.log(`💻 Recursos disponíveis: ${availableCores} cores, ${Math.round(availableMemory / (1024 * 1024 * 1024))}GB RAM`);

if (availableMemory < RECOMMENDED_MEMORY) {
  console.warn(`⚠️ AVISO: Memória disponível (${Math.round(availableMemory / (1024 * 1024 * 1024))}GB) abaixo do recomendado (8GB).`);
}

if (availableCores < RECOMMENDED_CORES) {
  console.warn(`⚠️ AVISO: Número de cores disponíveis (${availableCores}) abaixo do recomendado (4).`);
}

// Definir variáveis de ambiente para otimização
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.MISTRAL_AGENT_ID = 'ag:48009b45:20250515:programador-agente:d9bb1918';

// Configurar otimizações de Node.js para produção
if (process.env.NODE_ENV === 'production') {
  // Aumentar o número máximo de listeners para evitar warnings
  require('events').defaultMaxListeners = 25;
  
  // Aumentar o tamanho do heap para aplicações maiores
  // Isso é configurado via flags na linha de comando, documentado aqui
  console.log('🔧 Recomendação: Inicie o Node.js com a flag --max-old-space-size=4096 para melhor desempenho');
}

// Iniciar aplicação
async function startServer() {
  try {
    // Teste de conexão com a API Mistral
    const https = require('https');
    
    // Definir timeout curto para o teste
    const timeout = 5000; // 5 segundos
    
    console.log('🌐 Testando conectividade com API Mistral...');
    
    const testApiConnection = () => {
      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.mistral.ai',
          port: 443,
          path: '/v1/health',
          method: 'GET',
          timeout: timeout
        }, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
        
        req.on('error', () => {
          resolve(false);
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    };
    
    const apiAvailable = await testApiConnection();
    
    if (apiAvailable) {
      console.log('✅ Conexão com API Mistral bem-sucedida');
    } else {
      console.warn('⚠️ Não foi possível conectar à API Mistral. Verificando configurações...');
    }
    
    // Importar e iniciar o servidor principal
    console.log('📂 Carregando aplicação principal...');
    
    if (process.env.NODE_ENV === 'production') {
      // Em produção, carregamos a versão compilada
      require('./dist/server');
    } else {
      // Em desenvolvimento, usamos o arquivo TypeScript diretamente
      require('tsx')('./server/index.ts');
    }
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer().catch(err => {
  console.error('❌ Erro fatal ao iniciar aplicação:', err);
  process.exit(1);
});