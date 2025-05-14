#!/bin/bash

# Script para configurar o Cloudflare Tunnel
echo "Configurando Cloudflare Tunnel para o projeto"

# Verifica se o cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "O cliente cloudflared não está instalado. Instalando..."
    
    # Determina a arquitetura do sistema
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        CLOUDFLARED_ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        CLOUDFLARED_ARCH="arm64"
    else
        echo "Arquitetura não suportada: $ARCH"
        exit 1
    fi
    
    # Baixa a versão mais recente do cloudflared
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$CLOUDFLARED_ARCH.deb
    sudo dpkg -i cloudflared.deb
    rm cloudflared.deb
    
    echo "Cloudflared instalado com sucesso!"
fi

# Verifica a instalação do cloudflared
cloudflared version

echo "Agora você pode executar a autenticação com o comando:"
echo "cloudflared tunnel login"
echo ""
echo "E criar um novo túnel com:"
echo "cloudflared tunnel create carlosdev-app"
echo ""
echo "Configure o roteamento do túnel no arquivo config.yml conforme as instruções no projeto"
echo "Para iniciar o túnel, execute: bash scripts/start-cloudflare-tunnel.sh"