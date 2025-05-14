# Configuração do Cloudflare Tunnel

Este documento explica como configurar e utilizar o Cloudflare Tunnel para expor seu aplicativo CarlosDev na internet de forma segura, sem necessidade de IPs públicos ou configuração de firewall.

## Pré-requisitos

1. Uma conta no Cloudflare
2. Seu domínio configurado no Cloudflare (DNS gerenciado pelo Cloudflare)
3. Acesso à linha de comando no servidor onde a aplicação está hospedada

## Passo 1: Configurar o Cloudflare Tunnel

Execute o script de configuração incluído no projeto:

```bash
bash scripts/setup-cloudflare-tunnel.sh
```

Este script:
- Verifica se o cloudflared está instalado e o instala se necessário
- Mostra a versão atual do cloudflared
- Fornece instruções para os próximos passos

## Passo 2: Autenticar com o Cloudflare

Execute o comando:

```bash
cloudflared tunnel login
```

Este comando abrirá seu navegador e solicitará que você autorize o acesso da aplicação cloudflared à sua conta do Cloudflare. Você precisará selecionar o domínio que deseja usar com este túnel.

## Passo 3: Criar um novo túnel

Execute o comando:

```bash
cloudflared tunnel create carlosdev-app
```

Este comando criará um novo túnel chamado "carlosdev-app" e gerará um arquivo de credenciais no diretório `~/.cloudflared/`. Guarde o ID do túnel que aparece na saída do comando, você precisará dele no próximo passo.

## Passo 4: Configurar o roteamento do túnel

O script inicial já criou um arquivo de configuração modelo em `.cloudflared/config.yml`. Você precisa editá-lo:

1. Substitua `YOUR_TUNNEL_ID` pelo ID do túnel que você obteve no passo anterior
2. Ajuste os hostnames e serviços conforme necessário

Exemplo de configuração:

```yaml
tunnel: 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
credentials-file: ~/.cloudflared/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p.json

logfile: .cloudflared/tunnel.log

ingress:
  # Rota para o frontend da aplicação
  - hostname: carlosdev.app.br
    service: http://localhost:5000
  
  # Rota para a API
  - hostname: api.carlosdev.app.br
    service: http://localhost:5000/api
  
  # Rota padrão
  - service: http_status:404
```

## Passo 5: Configurar os registros DNS no Cloudflare

Você precisa adicionar registros CNAME no painel do Cloudflare para apontar para o seu túnel:

1. Faça login no painel do Cloudflare
2. Selecione seu domínio
3. Vá para a seção DNS
4. Adicione registros CNAME para cada hostname que você configurou:
   - `carlosdev.app.br` -> `<seu-tunnel-id>.cfargotunnel.com`
   - `api.carlosdev.app.br` -> `<seu-tunnel-id>.cfargotunnel.com`

Alternativamente, você pode configurar os registros DNS via linha de comando:

```bash
cloudflared tunnel route dns <tunnel-id> carlosdev.app.br
cloudflared tunnel route dns <tunnel-id> api.carlosdev.app.br
```

## Passo 6: Iniciar o túnel

Execute o script para iniciar o túnel:

```bash
bash scripts/start-cloudflare-tunnel.sh
```

O túnel será iniciado e sua aplicação estará acessível pelos hostnames configurados.

## Configuração para execução como serviço (opcional)

Para configurar o túnel como um serviço que inicia automaticamente:

```bash
cloudflared service install
```

Este comando configura o cloudflared como um serviço do sistema que será executado automaticamente na inicialização.

## Verificação e Solução de Problemas

Para verificar os túneis existentes:
```bash
cloudflared tunnel list
```

Para verificar o status de um túnel específico:
```bash
cloudflared tunnel info <nome-ou-id-do-tunnel>
```

Para ver os logs em tempo real:
```bash
tail -f .cloudflared/tunnel.log
```

## Segurança e Boas Práticas

1. Não compartilhe o arquivo de credenciais do túnel
2. Considere usar o Cloudflare Access para adicionar uma camada extra de autenticação
3. Revise regularmente os logs do túnel para detectar problemas ou atividades suspeitas
4. Mantenha o cloudflared atualizado com `cloudflared update`

## Integração com Oracle Cloud e Mistral

Se você estiver usando a Oracle Cloud para hospedar o Mistral, você também pode configurar um túnel separado para esse servidor, permitindo comunicação segura entre seu aplicativo principal e o servidor Mistral.

Neste caso, você configuraria:

```yaml
ingress:
  - hostname: mistral.carlosdev.app.br
    service: http://<oracle-instance-ip>:8000
```

E então adicionaria o registro DNS correspondente.