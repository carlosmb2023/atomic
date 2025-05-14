#!/bin/bash

# Script para iniciar o Cloudflare Tunnel

# Verifica se existe um arquivo de configuração
CONFIG_DIR=".cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"

if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
fi

# Se o arquivo de configuração não existir, cria um modelo
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Criando arquivo de configuração modelo..."
    cat > "$CONFIG_FILE" << EOL
# Configuração do Cloudflare Tunnel
# Substitua YOUR_TUNNEL_ID pelo ID do seu túnel

tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

# Configuração de log
logfile: .cloudflared/tunnel.log

# Configuração de roteamento
ingress:
  # Rota para o frontend da aplicação
  - hostname: carlosdev.app.br
    service: http://localhost:5000
  
  # Rota para a API
  - hostname: api.carlosdev.app.br
    service: http://localhost:5000/api
  
  # Rota padrão - sempre deve ser a última
  - service: http_status:404
EOL

    echo "Arquivo de configuração modelo criado em $CONFIG_FILE"
    echo "Por favor, edite este arquivo com seu ID de túnel e configurações específicas antes de continuar."
    echo "Execute 'cloudflared tunnel list' para ver seus túneis disponíveis."
    exit 1
fi

# Verifica se o ID do túnel no arquivo de configuração é válido
TUNNEL_ID=$(grep "tunnel:" "$CONFIG_FILE" | cut -d ":" -f2 | tr -d ' ')
if [ "$TUNNEL_ID" == "YOUR_TUNNEL_ID" ]; then
    echo "⚠️ Por favor, edite o arquivo $CONFIG_FILE e substitua YOUR_TUNNEL_ID pelo ID do seu túnel."
    echo "Execute 'cloudflared tunnel list' para ver seus túneis disponíveis."
    exit 1
fi

echo "Iniciando Cloudflare Tunnel com configuração em $CONFIG_FILE"
echo "Isso exporá sua aplicação na internet através do Cloudflare."
echo "Para interromper o túnel, pressione Ctrl+C"
echo ""

# Inicia o túnel
cloudflared tunnel --config "$CONFIG_FILE" run