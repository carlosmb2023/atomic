#!/bin/bash

# Script para instalar e configurar o modelo Mistral em um ambiente local
# Uso: bash setup-local-mistral.sh

# Cores para mensagens
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Instalação do Mistral Local =====${NC}"
echo "Este script irá configurar o Mistral AI localmente usando Docker"
echo ""

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker primeiro.${NC}"
    echo "Você pode instalar o Docker em: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose não encontrado. Tentando instalar...${NC}"
    
    # Tentar instalar o Docker Compose
    if command -v pip3 &> /dev/null; then
        pip3 install docker-compose
    elif command -v pip &> /dev/null; then
        pip install docker-compose
    else
        echo -e "${RED}Python pip não encontrado. Por favor, instale o Docker Compose manualmente.${NC}"
        echo "Instruções: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Verificar se a instalação foi bem-sucedida
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Falha ao instalar Docker Compose. Por favor, instale manualmente.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Docker Compose instalado com sucesso!${NC}"
fi

# Criar diretório para o Mistral
MISTRAL_DIR="$HOME/mistral"
mkdir -p "$MISTRAL_DIR"
cd "$MISTRAL_DIR"

echo "Criando docker-compose.yml..."
cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  mistral:
    image: ghcr.io/mistralai/mistral-src:latest
    container_name: mistral-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - HOST=0.0.0.0
      - MODEL=mistralai/Mistral-7B-Instruct-v0.2
    volumes:
      - mistral_data:/app/data
      - mistral_cache:/root/.cache
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
              count: all

volumes:
  mistral_data:
  mistral_cache:
EOL

echo "Criando arquivo .env..."
cat > .env << 'EOL'
# Configurações do Mistral
PORT=8000
HOST=0.0.0.0
MODEL=mistralai/Mistral-7B-Instruct-v0.2
EOL

# Verificar se há GPU disponível
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}GPU NVIDIA detectada. Configurando para uso com GPU.${NC}"
else
    echo -e "${YELLOW}GPU NVIDIA não detectada. O modelo rodará na CPU (será mais lento).${NC}"
    # Modificar o docker-compose.yml para remover a seção de GPU
    sed -i '/deploy:/,/count: all/d' docker-compose.yml
fi

# Criar script de controle
echo "Criando script de controle..."
cat > mistral-control.sh << 'EOL'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

case "$1" in
    start)
        echo -e "${GREEN}Iniciando Mistral API...${NC}"
        docker-compose up -d
        echo "Verificando status..."
        sleep 3
        curl -s http://localhost:8000/health | grep -q "ok" && echo -e "${GREEN}Mistral API rodando!${NC}" || echo -e "${RED}Falha ao iniciar Mistral API${NC}"
        ;;
    stop)
        echo -e "${YELLOW}Parando Mistral API...${NC}"
        docker-compose down
        ;;
    status)
        echo -e "Verificando status do Mistral API..."
        if curl -s http://localhost:8000/health | grep -q "ok"; then
            echo -e "${GREEN}Mistral API está rodando!${NC}"
        else
            echo -e "${RED}Mistral API não está respondendo.${NC}"
        fi
        ;;
    logs)
        echo -e "Exibindo logs do Mistral API..."
        docker-compose logs -f
        ;;
    *)
        echo "Uso: $0 {start|stop|status|logs}"
        exit 1
        ;;
esac

exit 0
EOL

chmod +x mistral-control.sh

echo -e "${GREEN}===== Instalação Concluída =====${NC}"
echo ""
echo "Para gerenciar o Mistral, use os seguintes comandos:"
echo "  cd $MISTRAL_DIR"
echo "  ./mistral-control.sh start   # Inicia o serviço"
echo "  ./mistral-control.sh stop    # Para o serviço"
echo "  ./mistral-control.sh status  # Verifica o status"
echo "  ./mistral-control.sh logs    # Exibe os logs"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} Na primeira execução, o modelo será baixado (~4GB)"
echo "Isso pode levar algum tempo dependendo da sua conexão."
echo ""
echo -e "${GREEN}Quando estiver rodando, configure o CarlosDev com:${NC}"
echo "URL do Mistral Local: http://localhost:8000"
echo ""

read -p "Deseja iniciar o Mistral agora? (s/n): " START_NOW
if [[ "$START_NOW" =~ ^[Ss]$ ]]; then
    echo "Iniciando Mistral..."
    ./mistral-control.sh start
    echo ""
    echo -e "${GREEN}Concluído!${NC}"
fi