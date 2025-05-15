#!/bin/bash

# Script para inicialização em ambiente de deploy
# Compatível com o agente Mistral ID: ag:48009b45:20250515:programador-agente:d9bb1918

echo "🔧 Iniciando deploy para o agente Mistral..."
echo "🤖 ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918"

# Verificar se as variáveis de ambiente necessárias estão definidas
if [ -z "$MISTRAL_API_KEY" ]; then
  echo "⚠️  AVISO: MISTRAL_API_KEY não está definida. A funcionalidade do agente será limitada."
fi

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  AVISO: DATABASE_URL não está definida. O sistema usará armazenamento em memória."
fi

# Verificar recursos do sistema
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
TOTAL_CORES=$(nproc)

echo "💻 Recursos disponíveis: $TOTAL_CORES cores, $TOTAL_MEM MB RAM"

if [ $TOTAL_MEM -lt 8192 ]; then
  echo "⚠️  AVISO: Memória disponível (${TOTAL_MEM}MB) abaixo do recomendado (8192MB)."
fi

if [ $TOTAL_CORES -lt 4 ]; then
  echo "⚠️  AVISO: Número de cores disponíveis ($TOTAL_CORES) abaixo do recomendado (4)."
fi

# Exportar variáveis de ambiente importantes
export NODE_ENV=production
export MISTRAL_AGENT_ID=ag:48009b45:20250515:programador-agente:d9bb1918

# Configurar maior alocação de memória para Node.js em sistemas com recursos adequados
if [ $TOTAL_MEM -gt 8192 ]; then
  echo "✅ Configurando Node.js com alocação de memória aumentada"
  export NODE_OPTIONS="--max-old-space-size=4096"
else
  export NODE_OPTIONS="--max-old-space-size=2048"
fi

# Compilar o projeto para produção
echo "🔨 Compilando aplicação para produção..."
npm run build

# Verificar se a compilação foi bem-sucedida
if [ $? -ne 0 ]; then
  echo "❌ Erro durante a compilação. Abortando deploy."
  exit 1
fi

# Iniciar a aplicação usando o script start.js
echo "🚀 Iniciando aplicação com configurações otimizadas para o agente Mistral..."
node start.js

# Este script nunca deve chegar aqui, pois start.js mantém o processo em execução
echo "❌ O servidor foi encerrado inesperadamente."
exit 1