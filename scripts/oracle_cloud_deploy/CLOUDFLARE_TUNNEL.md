# Configuração do Cloudflare Tunnel - CarlosDev

Este guia detalha como configurar o Cloudflare Tunnel para permitir acesso seguro e persistente à sua instância Oracle Cloud ou servidor local.

## O que é Cloudflare Tunnel?

Cloudflare Tunnel é um serviço que cria uma conexão segura entre seus servidores e o Cloudflare, sem necessidade de IPs públicos estáticos ou portas abertas no firewall. Isso permite que você:

- Acesse seus serviços hospedados localmente ou na nuvem pela internet
- Mantenha seus servidores protegidos contra ataques diretos
- Utilize subdomínios personalizados para acessar suas aplicações
- Tenha conexões criptografadas e seguras

## Pré-requisitos

1. Uma conta no [Cloudflare](https://dash.cloudflare.com/sign-up)
2. Um domínio registrado e configurado no Cloudflare
3. Acesso administrativo ao servidor onde o CarlosDev está rodando

## Passo 1: Instalar o Cloudflare Tunnel

### No Linux (Ubuntu/Debian)

```bash
# Baixar o pacote
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Instalar
sudo dpkg -i cloudflared.deb

# Verificar a instalação
cloudflared version
```

### No Oracle Linux/RHEL/Fedora

```bash
# Baixar o pacote
curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm

# Instalar
sudo rpm -i cloudflared.rpm

# Verificar a instalação
cloudflared version
```

### No macOS

```bash
# Usando Homebrew
brew install cloudflare/cloudflare/cloudflared

# Verificar a instalação
cloudflared version
```

### No Windows

1. Baixe o instalador do [GitHub Releases](https://github.com/cloudflare/cloudflared/releases/latest)
2. Execute o instalador `.msi`
3. Abra o Prompt de Comando como administrador e execute `cloudflared.exe version`

## Passo 2: Autenticar com o Cloudflare

```bash
cloudflared tunnel login
```

Este comando abrirá seu navegador para autenticação. Selecione o domínio que você deseja usar com o túnel.

## Passo 3: Criar um Túnel

```bash
cloudflared tunnel create carlosdev-tunnel
```

Anote o ID do túnel que será exibido. Você precisará dele para configurações futuras.

## Passo 4: Configurar o Túnel

Crie um arquivo de configuração:

```bash
mkdir -p ~/.cloudflared
touch ~/.cloudflared/config.yml
```

Edite o arquivo `config.yml` com seu editor preferido:

```bash
nano ~/.cloudflared/config.yml
```

Adicione a seguinte configuração (substituindo YOUR_TUNNEL_ID pelo ID gerado):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/seu-usuario/.cloudflared/YOUR_TUNNEL_ID.json

# Configuração de log
logfile: /var/log/cloudflared.log

# Configuração de roteamento
ingress:
  # Rota para o CarlosDev API/Backend
  - hostname: api.carlosdev.app.br
    service: http://localhost:5000
  
  # Rota para o frontend Vite (desenvolvimento)
  - hostname: dev.carlosdev.app.br
    service: http://localhost:3000
  
  # Rota para o Mistral (se estiver utilizando localmente)
  - hostname: mistral.carlosdev.app.br
    service: http://localhost:8000
  
  # Rota padrão - sempre deve ser a última
  - service: http_status:404
```

## Passo 5: Configurar Registros DNS

Acesse o [Dashboard do Cloudflare](https://dash.cloudflare.com/), selecione seu domínio e vá para a seção Tunnels:

1. Vá para a aba "Zero Trust" > "Access" > "Tunnels"
2. Selecione o túnel que você criou
3. Clique em "Configure"
4. Adicione os registros de Hostname para:
   - api.carlosdev.app.br -> localhost:5000
   - dev.carlosdev.app.br -> localhost:3000
   - mistral.carlosdev.app.br -> localhost:8000 (se aplicável)

## Passo 6: Iniciar o Túnel

Para teste rápido em terminal:

```bash
cloudflared tunnel run carlosdev-tunnel
```

## Passo 7: Configurar como Serviço (recomendado)

```bash
sudo cloudflared service install
```

Este comando configura o cloudflared como um serviço que inicia automaticamente.

## Passo 8: Verificar Status e Gerenciar

```bash
# Verificar status
sudo systemctl status cloudflared

# Iniciar o serviço
sudo systemctl start cloudflared

# Parar o serviço
sudo systemctl stop cloudflared

# Reiniciar o serviço
sudo systemctl restart cloudflared

# Verificar logs
sudo journalctl -u cloudflared
```

## Passo 9: Configurar o CarlosDev para Usar o Túnel

1. Acesse a página de Configurações do CarlosDev
2. Navegue até a aba "Cloudflare Tunnel"
3. Preencha:
   - ID do Túnel: Seu ID de túnel
   - Domínio Base: carlosdev.app.br (ou seu domínio personalizado)
   - Ative a opção "Usar Cloudflare Tunnel"
4. Salve as configurações

## Solução de Problemas

### O túnel não conecta

```bash
# Verifique os logs
sudo journalctl -u cloudflared -f

# Teste a execução em modo de depuração
cloudflared tunnel --loglevel debug run carlosdev-tunnel
```

### Erro de autenticação

```bash
# Refaça o login
cloudflared tunnel login
```

### Verificar status do túnel

```bash
# Liste os túneis ativos
cloudflared tunnel list

# Verifique detalhes do túnel
cloudflared tunnel info carlosdev-tunnel
```

## Removendo um Túnel

```bash
# Desinstalar o serviço (se instalado)
sudo cloudflared service uninstall

# Deletar o túnel
cloudflared tunnel delete carlosdev-tunnel
```

## Recursos Adicionais

- [Documentação oficial do Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps)
- [Repositório GitHub do cloudflared](https://github.com/cloudflare/cloudflared)
- [Tutorial em vídeo sobre Cloudflare Tunnel](https://www.youtube.com/watch?v=d0ySB0ASRFw)

---

Em caso de dúvidas ou problemas com a configuração do Cloudflare Tunnel, entre em contato pelo email suporte@carlosdev.app.br.