#!/bin/bash

# Script de configuração para VM Oracle Cloud - CarlosDev Mistral
# Uso: bash oracle_setup.sh

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

echo "===== CarlosDev Oracle Cloud Setup ====="
echo "Configurando servidor para hospedar Mistral AI"
echo "=========================================="

# Atualiza os pacotes
echo "Atualizando pacotes do sistema..."
apt update && apt upgrade -y

# Instala ferramentas essenciais
echo "Instalando ferramentas essenciais..."
apt install -y curl wget git vim htop build-essential python3-pip nginx certbot python3-certbot-nginx ufw

# Configura firewall
echo "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Para API Mistral
echo "y" | ufw enable

# Instala Docker e Docker Compose
echo "Instalando Docker e Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

pip3 install docker-compose

# Habilita e inicia o serviço Docker
systemctl enable docker
systemctl start docker

# Adiciona o usuário ao grupo docker para evitar usar sudo
USER=$(logname)
usermod -aG docker $USER

# Cria diretório para o projeto
echo "Criando diretório para o projeto..."
mkdir -p /opt/carlosdev-mistral
cd /opt/carlosdev-mistral

# Baixa o docker-compose.yml
echo "Baixando configurações do Docker Compose..."
wget https://raw.githubusercontent.com/yourusername/carlosdev/main/docker-compose.yml -O docker-compose.yml 2>/dev/null || \
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/carlosdev/main/docker-compose.yml 2>/dev/null || \
echo "AVISO: Não foi possível baixar docker-compose.yml automático. Por favor, use o arquivo incluído no projeto."

# Cria arquivo de variáveis de ambiente
echo "Configurando variáveis de ambiente..."
cat > .env << EOL
# Configurações do Mistral
MISTRAL_MODEL=mistralai/Mistral-7B-Instruct-v0.2
MISTRAL_PORT=8000
MISTRAL_HOST=0.0.0.0

# Configurações do banco de dados PostgreSQL
POSTGRES_DB=carlosdev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_PORT=5432
EOL

# Configura o Nginx como proxy reverso
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/mistral << EOL
server {
    listen 80;
    server_name mistral.carlosdev.app.br;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Ativa a configuração do Nginx
ln -sf /etc/nginx/sites-available/mistral /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Instala o Cloudflared
echo "Instalando Cloudflare Tunnel (cloudflared)..."
mkdir -p /etc/cloudflared

# Determina arquitetura
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

echo "===== CONFIGURAÇÃO CONCLUÍDA ====="
echo ""
echo "Seu servidor Oracle Cloud está configurado e pronto!"
echo ""
echo "Próximos Passos:"
echo "1. Configure o Cloudflare Tunnel: cloudflared tunnel login"
echo "2. Crie um túnel: cloudflared tunnel create mistral-carlosdev"
echo "3. Configure o túnel no arquivo: /etc/cloudflared/config.yml"
echo "4. Inicie o Mistral: cd /opt/carlosdev-mistral && docker-compose up -d"
echo ""
echo "Para mais informações, consulte a documentação do projeto."
echo "=========================================="