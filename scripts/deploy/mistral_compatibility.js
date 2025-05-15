/**
 * Script para verificação de compatibilidade com o Agente Mistral
 * ID: ag:48009b45:20250515:programador-agente:d9bb1918
 */

const https = require('https');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');

// ID do agente a ser verificado
const TARGET_AGENT_ID = 'ag:48009b45:20250515:programador-agente:d9bb1918';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Verifica as capacidades do sistema
 */
function checkSystemCapabilities() {
  console.log(`${colors.blue}Verificando compatibilidade do sistema com Agente Mistral${colors.reset}`);
  console.log(`${colors.blue}ID do Agente: ${colors.yellow}${TARGET_AGENT_ID}${colors.reset}\n`);
  
  // Verificar recursos do sistema
  const cpuCores = os.cpus().length;
  const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const architecture = os.arch();
  const platform = os.platform();
  
  console.log(`${colors.cyan}Sistema:${colors.reset}`);
  console.log(`  Plataforma: ${platform}`);
  console.log(`  Arquitetura: ${architecture}`);
  console.log(`  CPU Cores: ${cpuCores}`);
  console.log(`  Memória Total: ${totalMemoryGB}GB`);
  
  // Verificar requisitos mínimos
  const minCores = 4;
  const minMemoryGB = 8;
  
  const coresOk = cpuCores >= minCores;
  const memoryOk = totalMemoryGB >= minMemoryGB;
  
  console.log(`\n${colors.cyan}Requisitos:${colors.reset}`);
  console.log(`  CPU Cores: ${coresOk ? colors.green + '✓' : colors.red + '✗'} (mínimo ${minCores})${colors.reset}`);
  console.log(`  Memória: ${memoryOk ? colors.green + '✓' : colors.red + '✗'} (mínimo ${minMemoryGB}GB)${colors.reset}`);
  
  // Verificar Node.js
  const nodeVersion = process.version;
  const nodeVersionNum = parseFloat(nodeVersion.replace('v', ''));
  const nodeOk = nodeVersionNum >= 16.0;
  
  console.log(`  Node.js: ${nodeOk ? colors.green + '✓' : colors.red + '✗'} (versão ${nodeVersion})${colors.reset}`);
  
  return {
    coresOk,
    memoryOk,
    nodeOk,
    allOk: coresOk && memoryOk && nodeOk
  };
}

/**
 * Verifica configuração do ambiente
 */
function checkEnvironmentConfig() {
  console.log(`\n${colors.cyan}Configuração do Ambiente:${colors.reset}`);
  
  // Verificar variáveis de ambiente necessárias
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  const mistralAgentId = process.env.MISTRAL_AGENT_ID;
  const databaseUrl = process.env.DATABASE_URL;
  
  const mistralApiKeyOk = !!mistralApiKey;
  const mistralAgentIdOk = mistralAgentId === TARGET_AGENT_ID;
  const databaseUrlOk = !!databaseUrl;
  
  console.log(`  MISTRAL_API_KEY: ${mistralApiKeyOk ? colors.green + '✓' : colors.red + '✗'} ${mistralApiKeyOk ? '(configurada)' : '(não configurada)'}${colors.reset}`);
  console.log(`  MISTRAL_AGENT_ID: ${mistralAgentIdOk ? colors.green + '✓' : colors.yellow + '⚠️'} ${mistralAgentIdOk ? '(correspondente)' : mistralAgentId ? '(diferente do esperado)' : '(não configurada)'}${colors.reset}`);
  console.log(`  DATABASE_URL: ${databaseUrlOk ? colors.green + '✓' : colors.yellow + '⚠️'} ${databaseUrlOk ? '(configurada)' : '(não configurada - usando memória)'}${colors.reset}`);
  
  return {
    mistralApiKeyOk,
    mistralAgentIdOk,
    databaseUrlOk,
    allOk: mistralApiKeyOk && mistralAgentIdOk
  };
}

/**
 * Verifica conectividade com API Mistral
 */
async function checkMistralConnectivity() {
  console.log(`\n${colors.cyan}Conectividade com API Mistral:${colors.reset}`);
  
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  if (!mistralApiKey) {
    console.log(`  ${colors.red}✗ API Key não configurada${colors.reset}`);
    return false;
  }
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.mistral.ai',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`
      },
      timeout: 5000
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`  ${colors.green}✓ Conexão com API Mistral bem-sucedida${colors.reset}`);
        resolve(true);
      } else {
        console.log(`  ${colors.red}✗ Conexão com API Mistral falhou (status ${res.statusCode})${colors.reset}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`  ${colors.red}✗ Erro na conexão com API Mistral: ${error.message}${colors.reset}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`  ${colors.red}✗ Timeout na conexão com API Mistral${colors.reset}`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Verifica a hash de compatibilidade do agente
 */
function checkAgentHash() {
  console.log(`\n${colors.cyan}Verificação de Hash do Agente:${colors.reset}`);
  
  const hash = crypto.createHash('sha256');
  hash.update(TARGET_AGENT_ID);
  const agentHash = hash.digest('hex').substring(0, 12);
  
  console.log(`  ID do Agente: ${TARGET_AGENT_ID}`);
  console.log(`  Hash de Verificação: ${colors.yellow}${agentHash}${colors.reset}`);
  
  // Verificar se o arquivo de configuração existe
  const configExists = fs.existsSync('.env') || fs.existsSync('.env.local');
  if (configExists) {
    console.log(`  ${colors.green}✓ Arquivo de configuração encontrado${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠️ Arquivo de configuração não encontrado${colors.reset}`);
  }
  
  return {
    agentHash,
    configExists
  };
}

/**
 * Função principal
 */
async function main() {
  console.log(`${colors.magenta}========================================${colors.reset}`);
  console.log(`${colors.magenta} Verificador de Compatibilidade Mistral ${colors.reset}`);
  console.log(`${colors.magenta}========================================${colors.reset}\n`);
  
  // Verificar recursos do sistema
  const systemCheck = checkSystemCapabilities();
  
  // Verificar configuração do ambiente
  const envCheck = checkEnvironmentConfig();
  
  // Verificar conectividade com a API Mistral
  const mistralConnectivity = await checkMistralConnectivity();
  
  // Verificar hash do agente
  const agentCheck = checkAgentHash();
  
  // Resultados finais
  console.log(`\n${colors.magenta}=== Resultado Final ===${colors.reset}`);
  
  let totalChecks = 4; // Sistema, ambiente, conectividade, hash
  let passedChecks = 0;
  
  if (systemCheck.allOk) passedChecks++;
  if (envCheck.allOk) passedChecks++;
  if (mistralConnectivity) passedChecks++;
  if (agentCheck.configExists) passedChecks++;
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  if (percentage === 100) {
    console.log(`\n${colors.green}✅ Sistema totalmente compatível com o agente Mistral (100%)${colors.reset}`);
    console.log(`${colors.green}   Todas as verificações foram aprovadas.${colors.reset}`);
  } else if (percentage >= 75) {
    console.log(`\n${colors.yellow}⚠️ Sistema altamente compatível com o agente Mistral (${percentage}%)${colors.reset}`);
    console.log(`${colors.yellow}   ${passedChecks} de ${totalChecks} verificações foram aprovadas.${colors.reset}`);
  } else if (percentage >= 50) {
    console.log(`\n${colors.yellow}⚠️ Sistema parcialmente compatível com o agente Mistral (${percentage}%)${colors.reset}`);
    console.log(`${colors.yellow}   ${passedChecks} de ${totalChecks} verificações foram aprovadas.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Sistema não compatível com o agente Mistral (${percentage}%)${colors.reset}`);
    console.log(`${colors.red}   Apenas ${passedChecks} de ${totalChecks} verificações foram aprovadas.${colors.reset}`);
  }
  
  // Recomendações
  console.log(`\n${colors.cyan}Recomendações:${colors.reset}`);
  
  if (!systemCheck.coresOk) {
    console.log(`  ${colors.yellow}• Aumente o número de cores de CPU para ${minCores}+${colors.reset}`);
  }
  
  if (!systemCheck.memoryOk) {
    console.log(`  ${colors.yellow}• Aumente a memória RAM para ${minMemoryGB}GB+${colors.reset}`);
  }
  
  if (!systemCheck.nodeOk) {
    console.log(`  ${colors.yellow}• Atualize o Node.js para a versão 16 ou superior${colors.reset}`);
  }
  
  if (!envCheck.mistralApiKeyOk) {
    console.log(`  ${colors.yellow}• Configure a variável de ambiente MISTRAL_API_KEY${colors.reset}`);
  }
  
  if (!envCheck.mistralAgentIdOk) {
    console.log(`  ${colors.yellow}• Configure a variável de ambiente MISTRAL_AGENT_ID=${TARGET_AGENT_ID}${colors.reset}`);
  }
  
  if (!envCheck.databaseUrlOk) {
    console.log(`  ${colors.yellow}• Configure a variável de ambiente DATABASE_URL para persistência${colors.reset}`);
  }
  
  if (!mistralConnectivity) {
    console.log(`  ${colors.yellow}• Verifique a conectividade com a API Mistral e valide sua chave API${colors.reset}`);
  }
  
  if (!agentCheck.configExists) {
    console.log(`  ${colors.yellow}• Crie um arquivo .env com as configurações necessárias${colors.reset}`);
  }
  
  console.log(`\n${colors.magenta}========================================${colors.reset}`);
}

// Executar
main().catch(error => {
  console.error(`${colors.red}Erro fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});