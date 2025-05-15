# Guia de Instalação no Oracle Cloud

Este guia fornece instruções detalhadas para configurar o WebAiDashboard com o agente Mistral ID: `ag:48009b45:20250515:programador-agente:d9bb1918` no Oracle Cloud Infrastructure (OCI).

## Requisitos de Infraestrutura

Para garantir compatibilidade adequada com o agente Mistral, recomendamos a seguinte configuração no Oracle Cloud:

| Componente | Especificação Recomendada |
|------------|---------------------------|
| Shape      | VM.Standard.E4.Flex       |
| OCPUs      | 4+                        |
| Memória    | 16+ GB                    |
| Boot Volume| 100+ GB                   |
| OS         | Oracle Linux 8 ou Ubuntu 22.04 |

## 1. Preparação da Instância

Após criar uma instância com as especificações acima:

### 1.1 Conecte-se via SSH

```bash
ssh -i /caminho/para/sua_chave.key opc@seu_ip_publico
```

### 1.2 Instale as dependências básicas

Para **Oracle Linux**:
```bash
sudo dnf update -y
sudo dnf install -y git nodejs npm postgresql-server postgresql-contrib
```

Para **Ubuntu**:
```bash
sudo apt update
sudo apt install -y git nodejs npm postgresql postgresql-contrib
```

### 1.3 Configure o Node.js e NPM

```bash
# Instalar nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts
nvm use --lts

# Atualizar npm
npm install -g npm@latest
```

## 2. Configuração do Banco de Dados PostgreSQL

### 2.1 Inicializar o banco de dados

Para **Oracle Linux**:
```bash
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Para **Ubuntu**:
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2.2 Configurar o banco de dados

```bash
# Acessar como usuário postgres
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE webaidashboard;
CREATE USER webaiuser WITH ENCRYPTED PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE webaidashboard TO webaiuser;
\q

# Ajustar configuração para aceitar conexões
sudo nano /var/lib/pgsql/data/pg_hba.conf  # Oracle Linux
# OU
sudo nano /etc/postgresql/14/main/pg_hba.conf  # Ubuntu
```

Altere a linha `local all all peer` para `local all all md5` e salve.

```bash
sudo systemctl restart postgresql
```

## 3. Instalação do Aplicativo

### 3.1 Clonar o repositório

```bash
mkdir -p /opt/webaidashboard
cd /opt/webaidashboard
git clone https://github.com/seu-usuario/seu-repositorio.git .
```

### 3.2 Instalar dependências

```bash
npm install
```

### 3.3 Configurar variáveis de ambiente

```bash
cp .env.deploy .env
nano .env
```

Edite o arquivo para incluir:

```
NODE_ENV=production
PORT=5000

# Configurações do Mistral
MISTRAL_AGENT_ID=ag:48009b45:20250515:programador-agente:d9bb1918
MISTRAL_API_KEY=sua_chave_api_mistral

# Configurações de Banco de Dados
DATABASE_URL=postgresql://webaiuser:senha_segura@localhost:5432/webaidashboard

# Configurações de Segurança
SESSION_SECRET=gere_uma_string_aleatoria_segura
```

## 4. Configuração do Firewall e Rede

### 4.1 Configurar Regras de Firewall no Oracle Cloud

1. Acesse o console OCI
2. Navegue até Rede -> Virtual Cloud Networks
3. Selecione sua VCN
4. Clique em "Security Lists"
5. Adicione uma regra de entrada para a porta 5000 (TCP)

### 4.2 Configurar Firewall no Sistema Operacional

Para **Oracle Linux**:
```bash
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

Para **Ubuntu**:
```bash
sudo ufw allow 5000/tcp
sudo ufw reload
```

## 5. Instalação como Serviço Systemd

### 5.1 Criar arquivo de serviço

```bash
sudo nano /etc/systemd/system/webaidashboard.service
```

Adicione o seguinte conteúdo:

```
[Unit]
Description=WebAiDashboard Service
After=network.target postgresql.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/webaidashboard
ExecStart=/bin/bash -c 'source ~/.nvm/nvm.sh && /opt/webaidashboard/deploy.sh'
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webaidashboard
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 5.2 Ativar e iniciar o serviço

```bash
sudo chmod +x /opt/webaidashboard/deploy.sh
sudo systemctl enable webaidashboard
sudo systemctl start webaidashboard
```

### 5.3 Verificar status do serviço

```bash
sudo systemctl status webaidashboard
sudo journalctl -u webaidashboard -f
```

## 6. Configuração do Agente Mistral

### 6.1 Verificar compatibilidade

```bash
cd /opt/webaidashboard
chmod +x scripts/deploy/check_hardware.sh
./scripts/deploy/check_hardware.sh
```

### 6.2 Executar verificador de compatibilidade do agente

```bash
cd /opt/webaidashboard
node scripts/deploy/mistral_compatibility.js
```

## 7. Configuração de Backup e Manutenção

### 7.1 Configurar backup do banco de dados

Crie um script para backup:

```bash
sudo nano /opt/webaidashboard/scripts/backup.sh
```

Adicione:

```bash
#!/bin/bash
BACKUP_DIR="/opt/webaidashboard/backups"
DATE=$(date +%Y%m%d-%H%M%S)
FILENAME="webaidashboard-$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -U webaiuser webaidashboard > $BACKUP_DIR/$FILENAME
```

Configure como tarefa cron:

```bash
chmod +x /opt/webaidashboard/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/webaidashboard/scripts/backup.sh") | crontab -
```

## 8. Verificação

Após a instalação, verifique:

1. Acesse http://seu_ip_publico:5000 em seu navegador
2. Verifique o status do agente Mistral em http://seu_ip_publico:5000/api/mistral/status
3. Verifique os logs com `sudo journalctl -u webaidashboard -f`

---

## Resolução de Problemas

### Verificação de Logs

```bash
sudo systemctl status webaidashboard
sudo journalctl -u webaidashboard -f
```

### Reiniciar Serviços

```bash
sudo systemctl restart postgresql
sudo systemctl restart webaidashboard
```

### Verificar Conectividade com API Mistral

```bash
curl -H "Authorization: Bearer $MISTRAL_API_KEY" https://api.mistral.ai/v1/models
```

### Verificar Agente Mistral

```bash
# Verificar ID configurado
grep MISTRAL_AGENT_ID /opt/webaidashboard/.env
```

---

## Notas Importantes

- Mantenha o ID do agente Mistral (`ag:48009b45:20250515:programador-agente:d9bb1918`) consistente em todas as configurações
- Ajuste os requisitos de hardware com base no volume de uso esperado
- Configure backups regulares do banco de dados para evitar perda de dados