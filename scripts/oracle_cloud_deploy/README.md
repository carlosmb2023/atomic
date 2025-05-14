# CarlosDev - Automação Oracle Cloud para Mistral AI

Este pacote contém todos os scripts e arquivos necessários para configurar automaticamente uma VM no Oracle Cloud para hospedar o Mistral AI para o CarlosDev.

## Conteúdo do Pacote

- **criar_vm_oracle.sh** - Script principal para criar a VM no Oracle Cloud
- **oracle_setup.sh** - Script de configuração da VM (instalação de dependências)
- **docker-compose.yml** - Configuração do Docker para o Mistral AI
- **cloudflared-config.yml** - Modelo de configuração para Cloudflare Tunnel
- **setup_completo.sh** - Script para automação completa da configuração

## Requisitos

1. Uma conta no Oracle Cloud com créditos disponíveis
2. Chaves API configuradas no Oracle Cloud 
3. Oracle Cloud CLI instalada na máquina local
4. Ambiente Linux/Mac ou WSL no Windows

## Guia Rápido

### 1. Preparação

- Clone este repositório ou extraia todos os arquivos
- Abra um terminal na pasta extraída

### 2. Executar o script principal

```bash
# Torne o script executável
chmod +x criar_vm_oracle.sh

# Execute o script
./criar_vm_oracle.sh
```

### 3. Siga as instruções interativas

- O script solicitará informações sobre sua configuração do Oracle Cloud
- Insira sua chave privada quando solicitado
- Selecione o compartimento, VCN e outras configurações

### 4. Configuração Automática

Quando perguntado se deseja configurar automaticamente a VM, escolha "sim" para:

- Transferir automaticamente todos os scripts para a VM
- Executar a instalação do Docker, Mistral AI e outras dependências
- Configurar o Cloudflare Tunnel (opcional, mas recomendado)
- Iniciar os serviços automaticamente

### 5. Configuração no CarlosDev

Após a configuração bem-sucedida:

1. Acesse o painel de administração do CarlosDev
2. Vá em Configurações > Mistral AI
3. Configure a URL para apontar para seu túnel Cloudflare: `https://mistral.seu-dominio.com`
4. Selecione "Oracle Cloud" como tipo de instância
5. Salve as configurações

## Solução de Problemas

Se encontrar problemas durante a execução:

1. **Erro de autenticação na OCI CLI**:
   - Verifique se suas credenciais estão corretas
   - Confirme que a chave privada corresponde à chave pública registrada no Oracle

2. **Problemas de conectividade SSH**:
   - Verifique se as regras de firewall estão configuradas corretamente
   - Confirme que a chave SSH gerada tem as permissões corretas

3. **Falha na configuração do Cloudflare Tunnel**:
   - Verifique se você tem uma conta Cloudflare ativa
   - Confirme que o domínio está registrado no Cloudflare
   - Tente configurar manualmente seguindo as instruções em CLOUDFLARE_TUNNEL.md

Para mais informações, consulte a documentação completa no manual do usuário.