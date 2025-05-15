# Configuração do Cloudflare Tunnel para Deploy Mistral Agent

Este documento descreve como configurar um túnel Cloudflare para expor com segurança o serviço Mistral Agent (ID: `ag:48009b45:20250515:programador-agente:d9bb1918`) em produção.

## Requisitos

- Conta Cloudflare (gratuita)
- Cloudflare CLI (`cloudflared`) instalado
- Domínio registrado na Cloudflare (opcional, mas recomendado)

## Passos para Configuração

### 1. Instalar Cloudflare CLI

**Linux/Ubuntu:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows:**
Baixar o instalador de: https://github.com/cloudflare/cloudflared/releases

### 2. Autenticar Cloudflared

```bash
cloudflared tunnel login
```

Siga as instruções no navegador para autenticar sua conta Cloudflare.

### 3. Criar um Túnel

```bash
cloudflared tunnel create mistral-agent
```

Anote o ID do túnel gerado, será necessário para as próximas etapas.

### 4. Configurar o Túnel

Crie um arquivo chamado `config.yml` com o seguinte conteúdo:

```yaml
tunnel: <ID_DO_TUNEL>
credentials-file: /path/to/credentials/file.json

ingress:
  - hostname: mistral-agent.seudominio.com
    service: http://localhost:5000
  - service: http_status:404
```

Substitua:
- `<ID_DO_TUNEL>` pelo ID gerado no passo anterior
- `mistral-agent.seudominio.com` pelo seu domínio
- `/path/to/credentials/file.json` pelo caminho para o arquivo de credenciais gerado

### 5. Configurar DNS

```bash
cloudflared tunnel route dns mistral-agent mistral-agent.seudominio.com
```

### 6. Iniciar o Túnel

```bash
cloudflared tunnel run mistral-agent
```

### 7. Configurar para Execução como Serviço

**Linux/Ubuntu:**
```bash
sudo cloudflared service install
```

**macOS:**
```bash
sudo cloudflared service install
```

**Windows:**
```bash
cloudflared.exe service install
```

## Integração com o Agente Mistral

Para configurar o agente Mistral ID: `ag:48009b45:20250515:programador-agente:d9bb1918` para usar o domínio exposto:

1. No arquivo de configuração do ambiente, adicione:
```
MISTRAL_AGENT_ID=ag:48009b45:20250515:programador-agente:d9bb1918
MISTRAL_PUBLIC_URL=https://mistral-agent.seudominio.com
```

2. Reinicie o servidor para aplicar as configurações.

3. Verifique a conectividade através da página de status em:
```
https://mistral-agent.seudominio.com/api/mistral/status
```

## Segurança Adicional

É recomendado adicionar uma camada extra de autenticação para o endpoint público:

1. Configure o Cloudflare Access para controlar quem pode acessar o serviço
2. Utilize a autenticação por token para todas as solicitações à API
3. Configure regras de Firewall no painel da Cloudflare para limitar o acesso

## Monitoramento

Para monitorar o status do túnel:

```bash
cloudflared tunnel info mistral-agent
```

## Logs e Troubleshooting

Para ver os logs do túnel:

```bash
cloudflared tunnel run mistral-agent --loglevel debug
```

## Detalhes de Compatibilidade do Agente

O agente Mistral ID: `ag:48009b45:20250515:programador-agente:d9bb1918` requer acesso de rede bidirecional. O túnel Cloudflare permite que o agente seja acessado através da internet de forma segura sem necessidade de configuração complexa de rede ou VPN.