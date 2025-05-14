#!/bin/bash

# Script de configuração completa para VM Oracle Cloud - CarlosDev
# Este script executa automaticamente todos os passos necessários

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Configuração Automatizada CarlosDev =====${NC}"

# 1. Executar script principal de configuração
echo -e "${GREEN}Executando configuração principal...${NC}"
sudo bash oracle_setup.sh

# 2. Criar diretório e transferir arquivos
echo -e "${GREEN}Configurando diretórios...${NC}"
sudo mkdir -p /opt/carlosdev-mistral
sudo mkdir -p /opt/carlosdev-mistral/api
sudo cp docker-compose.yml /opt/carlosdev-mistral/
sudo cp -r api/* /opt/carlosdev-mistral/api/

# 3. Configurar Cloudflare Tunnel
echo -e "${YELLOW}Deseja configurar o Cloudflare Tunnel agora? (sim/não)${NC}"
read -r CONFIG_TUNNEL

if [[ "$CONFIG_TUNNEL" == "sim" ]]; then
    echo -e "${GREEN}Iniciando login no Cloudflare...${NC}"
    echo -e "${YELLOW}Siga as instruções no navegador que será aberto...${NC}"
    cloudflared tunnel login
    
    # Criar o túnel
    echo -e "${GREEN}Criando túnel Cloudflare...${NC}"
    TUNNEL_ID=$(cloudflared tunnel create mistral-carlosdev | grep -oP 'ID: \K[a-z0-9-]+')
    
    if [ -n "$TUNNEL_ID" ]; then
        echo -e "${GREEN}Túnel criado com sucesso. ID: $TUNNEL_ID${NC}"
        
        # Configurar arquivo de configuração do túnel
        sudo mkdir -p /etc/cloudflared
        sudo cp cloudflared-config.yml /etc/cloudflared/config.yml
        
        # Substituir o ID do túnel no arquivo
        sudo sed -i "s/YOUR_TUNNEL_ID/$TUNNEL_ID/g" /etc/cloudflared/config.yml
        
        # Mover o arquivo de credenciais
        sudo cp ~/.cloudflared/$TUNNEL_ID.json /etc/cloudflared/
        
        # Instalar como serviço
        echo -e "${GREEN}Instalando Cloudflare Tunnel como serviço...${NC}"
        sudo cloudflared service install
        
        # Iniciar o serviço
        sudo systemctl enable cloudflared
        sudo systemctl start cloudflared
        
        echo -e "${GREEN}Cloudflare Tunnel configurado com sucesso!${NC}"
        echo "Seu túnel ID é: $TUNNEL_ID"
        echo "Acesse o dashboard do Cloudflare para configurar os domínios"
    else
        echo -e "${RED}Falha ao criar túnel. Por favor, configure manualmente.${NC}"
    fi
else
    echo "Você pode configurar o Cloudflare Tunnel posteriormente."
fi

# 4. Iniciar os serviços Docker
echo -e "${GREEN}Iniciando serviços Docker...${NC}"
cd /opt/carlosdev-mistral
sudo docker-compose up -d

echo -e "${GREEN}===== Configuração Completa! =====${NC}"
echo ""
echo "Mistral API está rodando em: http://localhost:8000"
echo "API Bridge está rodando em: http://localhost:8001"
echo "Verifique o status com: sudo docker-compose ps"
echo ""
if [[ "$CONFIG_TUNNEL" == "sim" && -n "$TUNNEL_ID" ]]; then
    echo "Acesse o Cloudflare Zero Trust Dashboard para configurar:"
    echo "- mistral.SEU-DOMINIO.com -> http://localhost:8000"
    echo "- api.SEU-DOMINIO.com -> http://localhost:8001"
    echo ""
    echo "Após configurar, use este endereço nas configurações do CarlosDev"
fi