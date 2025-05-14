#!/bin/bash

# Script para configurar o Cloudflare Tunnel como serviço
# Uso: sudo bash install-cloudflared-service.sh

# Verifica se está sendo executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

echo "===== Configurando Cloudflare Tunnel como Serviço ====="

# Verifica se o cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "Erro: cloudflared não está instalado. Execute primeiro o script oracle_setup.sh"
    exit 1
fi

# Verifica se o arquivo de configuração existe
if [ ! -f "/etc/cloudflared/config.yml" ]; then
    echo "Arquivo de configuração não encontrado em /etc/cloudflared/config.yml"
    echo "Copiando o modelo de configuração..."
    
    mkdir -p /etc/cloudflared
    cp scripts/cloudflared-config.yml /etc/cloudflared/config.yml
    
    echo "Arquivo de configuração copiado. Por favor, edite-o com seu ID de túnel."
    echo "Execute: nano /etc/cloudflared/config.yml"
    exit 1
fi

# Configura o serviço
echo "Configurando o serviço cloudflared..."
cloudflared service install

# Habilita e inicia o serviço
systemctl enable cloudflared
systemctl start cloudflared

echo "===== Configuração Concluída ====="
echo "Status do serviço cloudflared:"
systemctl status cloudflared

echo "Para verificar os logs:"
echo "journalctl -u cloudflared"

echo "Para verificar o túnel:"
echo "cloudflared tunnel info"