# Guia de Instalação: Web AI Dashboard no Oracle Cloud

Este guia detalhado explica como configurar uma instância Oracle Cloud para hospedar o Web AI Dashboard com disponibilidade 24/7, incluindo tanto a aplicação web quanto os modelos LLM para processamento de IA.

## Sumário
- [Pré-requisitos](#pré-requisitos)
- [Criação da Instância Oracle Cloud](#criação-da-instância-oracle-cloud)
- [Configuração Inicial do Servidor](#configuração-inicial-do-servidor)
- [Instalação do Ambiente de Execução](#instalação-do-ambiente-de-execução)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Implantação da Aplicação](#implantação-da-aplicação)
- [Instalação do LLM (Ollama)](#instalação-do-llm-ollama)
- [Configuração de Serviço Persistente](#configuração-de-serviço-persistente)
- [Configuração do Nginx](#configuração-do-nginx)
- [Configuração de HTTPS](#configuração-de-https)
- [Monitoramento e Manutenção](#monitoramento-e-manutenção)
- [Solução de Problemas](#solução-de-problemas)

## Pré-requisitos

Antes de começar, você precisará:

1. Uma conta Oracle Cloud (nível gratuito é suficiente para começar)
2. Acesso ao Console Oracle Cloud
3. Um cliente SSH (como Terminal no macOS/Linux ou PuTTY no Windows)
4. Conhecimentos básicos de linha de comando Linux

## Criação da Instância Oracle Cloud

1. **Faça login no Console Oracle Cloud**:
   - Acesse [https://cloud.oracle.com](https://cloud.oracle.com)
   - Entre com suas credenciais

2. **Navegue até Computação -> Instâncias**:
   - Clique no botão "Criar instância"

3. **Configure a instância**:
   - **Nome**: WebAIDashboard (ou nome de sua preferência)
   - **Compartimento**: Escolha seu compartimento ou use o padrão
   - **Disponibilidade**: Mantenha as configurações padrão
   - **Imagem do sistema operacional**: Oracle Linux 8 ou 9
   - **Shape da instância**: 
     - Para o plano gratuito: VM.Standard.E2.1.Micro (1 OCPU, 1 GB RAM)
     - Recomendado: VM.Standard.E4.Flex com 4 OCPUs e 24 GB RAM

4. **Configuração de rede**:
   - **Virtual cloud network**: Crie uma nova VCN ou use uma existente
   - **Subnet**: Selecione ou crie uma subnet
   - **Atribuir IP público**: Sim

5. **Configuração de SSH**:
   - **Gerar um par de chaves SSH**: Escolha "Gerar um par de chaves para mim"
   - **Baixe as chaves privada e pública**: Guarde-as em local seguro
   - Alternativa: Carregue sua própria chave pública se preferir

6. **Revisão e criação**:
   - Verifique todas as configurações
   - Clique em "Criar"

7. **Anote o IP público** da instância após sua criação. Ele será usado para acessar seu servidor.

## Configuração Inicial do Servidor

1. **Conecte-se via SSH à sua instância**:

   ```bash
   # No Linux/macOS
   chmod 400 caminho/para/sua/chave_privada.key
   ssh -i caminho/para/sua/chave_privada.key opc@SEU_IP_PUBLICO
   
   # No Windows com PuTTY
   # Configure a chave privada em Connection > SSH > Auth
   # No campo Host Name, digite: opc@SEU_IP_PUBLICO
   ```

2. **Atualize o sistema**:

   ```bash
   sudo dnf update -y
   ```

3. **Configure o firewall**:

   ```bash
   # Verifique o status do firewall
   sudo firewall-cmd --state
   
   # Configure as portas necessárias
   sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
   sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
   sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
   sudo firewall-cmd --permanent --add-port=5000/tcp  # Aplicação
   sudo firewall-cmd --permanent --add-port=11434/tcp # API LLM
   
   # Recarregue o firewall
   sudo firewall-cmd --reload
   ```

4. **Configure o fuso horário**:

   ```bash
   # Liste os fusos horários disponíveis
   timedatectl list-timezones | grep America
   
   # Configure o fuso horário (exemplo para São Paulo)
   sudo timedatectl set-timezone America/Sao_Paulo
   ```

## Instalação do Ambiente de Execução

1. **Instale NodeJS e NPM**:

   ```bash
   # Adicione o repositório NodeSource para Node.js 20
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   
   # Instale Node.js
   sudo dnf install -y nodejs
   
   # Verifique a instalação
   node --version  # Deve mostrar v20.x.x
   npm --version   # Deve mostrar 10.x.x
   ```

2. **Instale ferramentas de desenvolvimento**:

   ```bash
   sudo dnf groupinstall "Development Tools" -y
   sudo dnf install -y git
   ```

3. **Instale o Docker** (necessário para Ollama):

   ```bash
   # Instale os pacotes necessários
   sudo dnf install -y dnf-utils zip unzip
   
   # Configure o repositório Docker
   sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
   
   # Instale Docker
   sudo dnf install -y docker-ce docker-ce-cli containerd.io
   
   # Inicie e habilite o Docker
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Adicione seu usuário ao grupo docker para executar sem sudo
   sudo usermod -aG docker opc
   
   # Aplique as mudanças de grupo
   newgrp docker
   
   # Verifique a instalação
   docker --version
   ```

## Configuração do Banco de Dados

1. **Instale o PostgreSQL**:

   ```bash
   # Instale o repositório PostgreSQL
   sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
   
   # Desative o módulo PostgreSQL integrado
   sudo dnf -qy module disable postgresql
   
   # Instale PostgreSQL 15
   sudo dnf install -y postgresql15-server postgresql15-contrib
   
   # Inicialize o banco de dados
   sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
   
   # Inicie e habilite o serviço
   sudo systemctl start postgresql-15
   sudo systemctl enable postgresql-15
   ```

2. **Configure o PostgreSQL**:

   ```bash
   # Acesse o console PostgreSQL como usuário postgres
   sudo -u postgres psql
   ```

   No console psql, execute:

   ```sql
   -- Crie um usuário para a aplicação
   CREATE USER webai WITH PASSWORD 'escolha_uma_senha_forte';
   
   -- Crie um banco de dados
   CREATE DATABASE webaidashboard OWNER webai;
   
   -- Conceda privilégios
   ALTER USER webai WITH SUPERUSER;
   
   -- Saia do console
   \q
   ```

3. **Configure a autenticação**:

   ```bash
   # Edite o arquivo pg_hba.conf
   sudo nano /var/lib/pgsql/15/data/pg_hba.conf
   ```

   Modifique as linhas para usar autenticação md5:

   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            md5
   # IPv6 local connections:
   host    all             all             ::1/128                 md5
   ```

   Salve e saia (Ctrl+O, Enter, Ctrl+X).

   ```bash
   # Reinicie o PostgreSQL
   sudo systemctl restart postgresql-15
   ```

## Implantação da Aplicação

1. **Crie o diretório da aplicação**:

   ```bash
   mkdir -p /home/opc/webai
   cd /home/opc/webai
   ```

2. **Clone o repositório**:

   ```bash
   git clone https://github.com/seuusuario/webaidashboard .
   # Ou use o comando adequado para seu repositório
   ```

3. **Instale as dependências**:

   ```bash
   npm install
   ```

4. **Configure as variáveis de ambiente**:

   ```bash
   nano .env
   ```

   Adicione o seguinte conteúdo:

   ```
   DATABASE_URL=postgres://webai:escolha_uma_senha_forte@localhost:5432/webaidashboard
   PGUSER=webai
   PGPASSWORD=escolha_uma_senha_forte
   PGDATABASE=webaidashboard
   PGHOST=localhost
   PGPORT=5432
   ```

5. **Inicialize o banco de dados**:

   ```bash
   npm run db:push
   ```

## Instalação do LLM (Ollama)

1. **Instale o Ollama via Docker**:

   ```bash
   docker pull ollama/ollama
   
   # Execute o container Ollama, expondo a porta 11434
   docker run -d --name ollama \
     -v ollama-data:/root/.ollama \
     -p 11434:11434 \
     --restart always \
     ollama/ollama
   ```

2. **Baixe um modelo de IA**:

   ```bash
   # Baixe o modelo Mistral (ou outro de sua escolha)
   docker exec -it ollama ollama pull mistral
   
   # Para modelos maiores como Llama 3 70B (se tiver RAM suficiente)
   # docker exec -it ollama ollama pull llama3:70b
   ```

3. **Teste a API Ollama**:

   ```bash
   curl -X POST http://localhost:11434/api/generate -d '{
     "model": "mistral",
     "prompt": "Hello, how are you?"
   }'
   ```

## Configuração de Serviço Persistente

Para manter a aplicação em execução 24/7, usaremos o PM2:

1. **Instale o PM2 globalmente**:

   ```bash
   sudo npm install -g pm2
   ```

2. **Crie um arquivo de configuração PM2**:

   ```bash
   nano ecosystem.config.js
   ```

   Adicione o seguinte conteúdo:

   ```javascript
   module.exports = {
     apps: [
       {
         name: "WebAIDashboard",
         script: "npm",
         args: "run dev",
         cwd: "/home/opc/webai",
         env: {
           NODE_ENV: "production",
           PORT: 5000
         },
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: "1G"
       }
     ]
   };
   ```

3. **Inicie a aplicação com PM2**:

   ```bash
   pm2 start ecosystem.config.js
   ```

4. **Configure o PM2 para iniciar automaticamente na inicialização**:

   ```bash
   pm2 startup
   # Execute o comando sugerido pelo PM2
   
   # Salve a configuração atual
   pm2 save
   ```

5. **Verifique o status**:

   ```bash
   pm2 status
   pm2 logs WebAIDashboard
   ```

## Configuração do Nginx

O Nginx será usado como proxy reverso para sua aplicação:

1. **Instale o Nginx**:

   ```bash
   sudo dnf install -y nginx
   ```

2. **Configure o Nginx**:

   ```bash
   sudo nano /etc/nginx/conf.d/webai.conf
   ```

   Adicione o seguinte conteúdo:

   ```nginx
   server {
       listen 80;
       server_name SEU_IP_PUBLICO;  # Substitua pelo seu IP ou domínio
   
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   
       location /api/v1/ollama/ {
           proxy_pass http://localhost:11434/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Verifique a configuração e inicie o Nginx**:

   ```bash
   sudo nginx -t
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

## Configuração de HTTPS

Para segurança adicional, configure HTTPS com Let's Encrypt:

1. **Instale o Certbot**:

   ```bash
   sudo dnf install -y epel-release
   sudo dnf install -y certbot python3-certbot-nginx
   ```

2. **Obtenha um certificado** (requer um nome de domínio apontando para seu IP):

   ```bash
   sudo certbot --nginx -d seu-dominio.com
   ```

3. **Configure a renovação automática**:

   ```bash
   sudo certbot renew --dry-run
   ```

## Monitoramento e Manutenção

### Monitoramento

1. **Monitore os logs da aplicação**:

   ```bash
   pm2 logs WebAIDashboard
   ```

2. **Monitore os recursos do sistema**:

   ```bash
   sudo dnf install -y htop
   htop
   ```

3. **Monitore o espaço em disco**:

   ```bash
   df -h
   ```

### Manutenção

1. **Atualização do sistema**:

   ```bash
   sudo dnf update -y
   ```

2. **Atualização da aplicação**:

   ```bash
   cd /home/opc/webai
   git pull
   npm install
   pm2 restart WebAIDashboard
   ```

3. **Backup do banco de dados**:

   ```bash
   # Crie um script de backup
   nano /home/opc/backup_db.sh
   ```

   Adicione o seguinte conteúdo:

   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/opc/backups"
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_FILE="$BACKUP_DIR/webaidashboard_$TIMESTAMP.sql"
   
   # Crie o diretório de backup se não existir
   mkdir -p $BACKUP_DIR
   
   # Execute o backup
   PGPASSWORD=escolha_uma_senha_forte pg_dump -h localhost -U webai webaidashboard > $BACKUP_FILE
   
   # Compacte o arquivo
   gzip $BACKUP_FILE
   
   # Mantenha apenas os últimos 7 backups
   find $BACKUP_DIR -name "webaidashboard_*.sql.gz" -type f -mtime +7 -delete
   ```

   Torne o script executável e agende-o:

   ```bash
   chmod +x /home/opc/backup_db.sh
   
   # Adicione ao crontab para execução diária às 2h da manhã
   (crontab -l 2>/dev/null; echo "0 2 * * * /home/opc/backup_db.sh") | crontab -
   ```

## Solução de Problemas

### Problema de Conexão com o Banco de Dados

Se a aplicação não conseguir conectar ao banco de dados:

1. **Verifique se o PostgreSQL está em execução**:

   ```bash
   sudo systemctl status postgresql-15
   ```

2. **Verifique as credenciais no arquivo .env**

3. **Teste a conexão manualmente**:

   ```bash
   PGPASSWORD=escolha_uma_senha_forte psql -U webai -d webaidashboard -h localhost
   ```

### Problemas com o Ollama

Se os modelos LLM não estiverem funcionando:

1. **Verifique se o container Docker está rodando**:

   ```bash
   docker ps | grep ollama
   ```

2. **Verifique os logs do container**:

   ```bash
   docker logs ollama
   ```

3. **Reinicie o container**:

   ```bash
   docker restart ollama
   ```

### Problemas com a Aplicação

Se a aplicação não estiver respondendo:

1. **Verifique o status do PM2**:

   ```bash
   pm2 status
   ```

2. **Verifique os logs da aplicação**:

   ```bash
   pm2 logs WebAIDashboard
   ```

3. **Reinicie a aplicação**:

   ```bash
   pm2 restart WebAIDashboard
   ```

4. **Verifique se as portas estão abertas**:

   ```bash
   sudo lsof -i:5000
   sudo lsof -i:11434
   ```

---

Após seguir este guia completo, você terá uma instalação robusta do Web AI Dashboard em execução 24/7 no Oracle Cloud, pronta para fornecer serviços de IA e gerenciamento de projetos. A configuração inclui tanto a aplicação web quanto os modelos LLM necessários para processamento de IA local.