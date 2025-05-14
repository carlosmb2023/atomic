#!/bin/bash

# Script para instalar o Cloudflare Tunnel como serviço

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

echo "===== Instalando Cloudflare Tunnel como Serviço ====="

# Verifica se o cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "Cloudflared não encontrado. Instalando..."
    
    # Determina a arquitetura
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        CLOUDFLARED_ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        CLOUDFLARED_ARCH="arm64"
    else
        echo "Arquitetura não suportada: $ARCH"
        exit 1
    fi
    
    # Baixa e instala cloudflared
    cd /tmp
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$CLOUDFLARED_ARCH.deb
    dpkg -i cloudflared.deb
    rm cloudflared.deb
fi

# Verifica se o túnel já existe
if [ ! -f /etc/cloudflared/config.yml ]; then
    echo "Arquivo de configuração não encontrado em /etc/cloudflared/config.yml"
    echo "Certifique-se de criar um túnel e configurar antes de instalar o serviço."
    exit 1
fi

# Instala como serviço
echo "Instalando Cloudflare Tunnel como serviço..."
cloudflared service install

# Inicia o serviço
systemctl enable cloudflared
systemctl start cloudflared

# Verifica o status
echo "Status do serviço Cloudflared:"
systemctl status cloudflared

echo "===== Instalação Concluída ====="
echo "Cloudflare Tunnel agora está rodando como um serviço."
echo "Verifique o status com: systemctl status cloudflared"