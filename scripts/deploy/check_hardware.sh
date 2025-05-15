#!/bin/bash
#
# Script para verificar compatibilidade de hardware com o agente Mistral
# ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918
#

echo "🔍 Verificando compatibilidade de hardware com agente Mistral..."
echo "📌 ID do Agente: ag:48009b45:20250515:programador-agente:d9bb1918"
echo ""

# Cores da saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Requisitos mínimos
MIN_CORES=4
MIN_RAM=8 # GB
MIN_STORAGE=20 # GB
MIN_BANDWIDTH=100 # Mbps

# Verificar CPU
CPU_CORES=$(nproc)
CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d ":" -f 2 | sed 's/^ *//')

echo -e "${BLUE}CPU:${NC}"
echo "  Modelo: $CPU_MODEL"
echo -n "  Cores: $CPU_CORES"
if [ $CPU_CORES -ge $MIN_CORES ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC} (mínimo recomendado: $MIN_CORES)"
fi

# Verificar memória
MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_TOTAL_GB=$(echo "scale=1; $MEM_TOTAL_KB / 1024 / 1024" | bc)

echo -e "${BLUE}Memória RAM:${NC}"
echo -n "  Total: ${MEM_TOTAL_GB}GB"
if (( $(echo "$MEM_TOTAL_GB >= $MIN_RAM" | bc -l) )); then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC} (mínimo recomendado: ${MIN_RAM}GB)"
fi

# Verificar armazenamento
STORAGE_TOTAL_GB=$(df -h / | awk 'NR==2 {print $2}' | sed 's/G//')

echo -e "${BLUE}Armazenamento:${NC}"
echo -n "  Total: ${STORAGE_TOTAL_GB}GB"
if (( $(echo "$STORAGE_TOTAL_GB >= $MIN_STORAGE" | bc -l) )); then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC} (mínimo recomendado: ${MIN_STORAGE}GB)"
fi

# Verificar GPU
echo -e "${BLUE}GPU:${NC}"
if command -v nvidia-smi &> /dev/null; then
    GPU_MODEL=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    GPU_MEMORY=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -1)
    echo "  Modelo: $GPU_MODEL"
    echo "  Memória: $GPU_MEMORY"
    echo -e "  Status: ${GREEN}GPU NVIDIA detectada ✓${NC}"
else
    echo -e "  Status: ${YELLOW}Nenhuma GPU NVIDIA detectada (opcional)${NC}"
fi

# Resultado final
echo ""
echo -e "${BLUE}Resumo de Compatibilidade:${NC}"

TOTAL_CHECKS=3
PASSED_CHECKS=0

if [ $CPU_CORES -ge $MIN_CORES ]; then
    ((PASSED_CHECKS++))
fi

if (( $(echo "$MEM_TOTAL_GB >= $MIN_RAM" | bc -l) )); then
    ((PASSED_CHECKS++))
fi

if (( $(echo "$STORAGE_TOTAL_GB >= $MIN_STORAGE" | bc -l) )); then
    ((PASSED_CHECKS++))
fi

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✅ Hardware totalmente compatível com o agente Mistral.${NC}"
    echo "   Todas as verificações foram aprovadas."
    exit 0
elif [ $PASSED_CHECKS -ge $(($TOTAL_CHECKS / 2)) ]; then
    echo -e "${YELLOW}⚠️  Hardware parcialmente compatível com o agente Mistral.${NC}"
    echo "   $PASSED_CHECKS de $TOTAL_CHECKS verificações foram aprovadas."
    exit 1
else
    echo -e "${RED}❌ Hardware não compatível com o agente Mistral.${NC}"
    echo "   Apenas $PASSED_CHECKS de $TOTAL_CHECKS verificações foram aprovadas."
    echo "   Recomendamos atualizar os recursos de hardware para melhor desempenho."
    exit 2
fi