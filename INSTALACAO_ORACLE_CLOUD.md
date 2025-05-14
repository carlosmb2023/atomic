# Instalação no Oracle Cloud - CarlosDev

Este guia irá ajudá-lo a configurar o sistema CarlosDev em uma instância Oracle Cloud, permitindo o uso do modelo Mistral para Inteligência Artificial.

## Requisitos da VM Oracle Cloud

### Requisitos mínimos
- **CPU**: 4 OCPUs (equivalente a 4 vCPUs)
- **RAM**: 16GB (mínimo) ou 24GB (recomendado)
- **Armazenamento**: 100GB
- **Sistema Operacional**: Oracle Linux 8 ou Ubuntu 22.04

### Recomendações para melhor desempenho
- **CPU**: 8 OCPUs 
- **RAM**: 32GB
- **GPU**: NVIDIA A10 (opcional, melhora muito o desempenho)
- **Armazenamento**: 150GB+

## Passo 1: Criar a instância no Oracle Cloud

1. Acesse o [console do Oracle Cloud](https://cloud.oracle.com/)
2. Navegue até "Compute" > "Instances"
3. Clique em "Create Instance"
4. Configure as seguintes opções:
   - **Nome**: CarlosDev-Mistral
   - **Compartimento**: Escolha seu compartimento
   - **Zona de disponibilidade**: Escolha a mais próxima
   - **Tipo de Instância**: VM.Standard.E4.Flex (ou VM.GPU se disponível)
   - **Configuração de CPU/RAM**: 4 OCPUs, 24GB RAM
   - **Sistema Operacional**: Oracle Linux 8 ou Ubuntu 22.04
   - **Rede**: 
     - Crie uma VCN se ainda não tiver uma
     - Abra as portas 22 (SSH), 80/443 (HTTP/HTTPS) e 8000 (API Mistral)
   - **Chave SSH**: Faça upload da sua chave SSH ou gere um novo par de chaves

5. Clique em "Create" e aguarde a instância ser provisionada

## Passo 2: Conectar à instância

```bash
ssh -i /caminho/para/sua/chave.key opc@IP_DA_INSTANCIA
```

Para Ubuntu, use o usuário "ubuntu" em vez de "opc".

## Passo 3: Configuração inicial

1. Atualize os pacotes do sistema:

```bash
# No Oracle Linux
sudo dnf update -y

# No Ubuntu
sudo apt update && sudo apt upgrade -y
```

2. Clone o repositório ou baixe o script de instalação:

```bash
mkdir -p ~/carlosdev
cd ~/carlosdev
# Você pode baixar o script diretamente do seu GitHub, se disponível
curl -O https://raw.githubusercontent.com/seu-usuario/carlosdev/main/scripts/oracle_setup.sh
chmod +x oracle_setup.sh
```

## Passo 4: Execute o script de instalação

```bash
sudo ./oracle_setup.sh
```

Este script irá:
- Instalar dependências necessárias
- Configurar o Docker e Docker Compose
- Instalar o Cloudflare Tunnel
- Preparar o ambiente para o Mistral

## Passo 5: Configurar o Cloudflare Tunnel

1. Faça login no Cloudflare:

```bash
cloudflared tunnel login
```

2. Crie um novo túnel:

```bash
cloudflared tunnel create mistral-carlosdev
```

3. Copie o ID do túnel gerado e atualize o arquivo de configuração:

```bash
sudo nano /etc/cloudflared/config.yml
```

Substitua "YOUR_TUNNEL_ID" pelo ID gerado.

4. Configure o DNS no dashboard do Cloudflare:
   - Acesse o dashboard do Cloudflare
   - Vá até "Zero Trust" > "Access" > "Tunnels"
   - Selecione seu túnel
   - Adicione os seguintes registros DNS:
     - mistral.carlosdev.app.br -> localhost:8000
     - api-mistral.carlosdev.app.br -> localhost:3000

5. Inicie o serviço Cloudflare:

```bash
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Passo 6: Configurar o Mistral

1. Navegue até o diretório do projeto:

```bash
cd /opt/carlosdev-mistral
```

2. Edite o arquivo .env se necessário:

```bash
nano .env
```

3. Inicie os serviços:

```bash
docker-compose up -d
```

4. Verifique se está funcionando:

```bash
curl http://localhost:8000/health
```

## Passo 7: Testar a integração

1. Na interface do CarlosDev, acesse Configurações > Mistral
2. Configure:
   - URL do Mistral Cloud: https://mistral.carlosdev.app.br
   - Tipo de instância: Oracle Cloud
   - Ative a opção "Usar endpoint Mistral Cloud"

3. Salve as configurações e teste enviando uma mensagem no chat.

## Solução de problemas

### Logs do Docker
```bash
docker-compose logs -f
```

### Logs do Cloudflare Tunnel
```bash
journalctl -u cloudflared
```

### Verificação do status do Cloudflare
```bash
cloudflared tunnel info
```

### Verificação do Docker
```bash
docker ps
```

## Requisitos de hardware para modelos específicos

### Mistral-7B (básico)
- **RAM**: 16GB
- **VRAM**: 8GB (se GPU disponível)
- **Espaço em disco**: 20GB

### Mistral-7B-Instruct-v0.2 (recomendado)
- **RAM**: 24GB
- **VRAM**: 12GB (se GPU disponível)
- **Espaço em disco**: 30GB

### Mistral-Mixture-of-Experts (avançado)
- **RAM**: 32GB+
- **VRAM**: 24GB+ (GPU fortemente recomendado)
- **Espaço em disco**: 50GB+

## Links úteis

- [Documentação do Mistral AI](https://docs.mistral.ai/)
- [Documentação do Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps)
- [Documentação do Oracle Cloud](https://docs.oracle.com/en-us/iaas/Content/Compute/References/computeshapes.htm)

## Suporte

Se encontrar problemas durante a instalação, entre em contato através do email suporte@carlosdev.app.br.