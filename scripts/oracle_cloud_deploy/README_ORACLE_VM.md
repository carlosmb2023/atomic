# Criação e Configuração Automatizada de VM no Oracle Cloud

Este guia explica como usar o script `criar_vm_oracle.sh` para criar e configurar automaticamente uma VM no Oracle Cloud otimizada para o Mistral AI, com opção de automação completa.

## Pré-requisitos

1. Uma conta no Oracle Cloud com créditos disponíveis
2. Chaves de API configuradas no Oracle Cloud
3. Acesso a terminal Linux/Mac ou WSL no Windows

## Como usar o script

### 1. Preparação

Antes de executar o script, certifique-se de que tem:

- As credenciais Oracle Cloud (incluídas no script)
- A chave privada correspondente à sua configuração
- Permissões para criar recursos no compartimento desejado

### 2. Executar o script

```bash
# Tornar o script executável (se ainda não estiver)
chmod +x scripts/criar_vm_oracle.sh

# Executar o script
./scripts/criar_vm_oracle.sh
```

### 3. Configurar a chave privada

Durante a execução, o script solicitará que você configure sua chave privada. Você precisa:

1. Criar o arquivo `~/.oci/oci_api_key.pem`
2. Inserir sua chave privada neste arquivo
3. Confirmar pressionando Enter

### 4. Selecionar recursos

O script irá guiá-lo para escolher:

- O compartimento onde criar a VM
- A imagem (recomendado: Ubuntu 22.04)
- A VCN (Virtual Cloud Network) e subnet
- Detalhes de configuração da VM (ou usar os valores recomendados)

### 5. Configuração Automatizada (Novo!)

Após a criação da VM, o script oferece uma opção de **configuração automatizada completa** que:

1. Transfere automaticamente todos os scripts e arquivos necessários para a VM
2. Executa o script de instalação principal (`oracle_setup.sh`)
3. Configura o ambiente para o Mistral AI
4. Oferece a opção de configurar o Cloudflare Tunnel com GUI interativa
5. Inicia os serviços Docker automaticamente

Para usar esta funcionalidade, basta responder "sim" quando perguntado se deseja configurar automaticamente a VM.

### 6. Acesso à VM criada

Após a criação e configuração bem-sucedidas:

- O script fornece o IP público da VM
- Fornece o comando para acessar a VM via SSH
- Se usando configuração automatizada, fornece o ID do túnel Cloudflare

## Configuração recomendada

A configuração padrão recomendada para Mistral AI é:

- **Nome**: CarlosDev-Mistral
- **Shape**: VM.Standard.E4.Flex (AMD)
- **OCPUs**: 4
- **Memória**: 24 GB
- **Armazenamento**: 100 GB
- **Sistema Operacional**: Ubuntu 22.04

Esta configuração é otimizada para executar o modelo Mistral-7B-Instruct-v0.2 com bom desempenho.

## Configuração Manual (se escolher "não" para configuração automática)

Se preferir configurar manualmente, siga estes passos após criar a VM:

1. Copiar o script `oracle_setup.sh` para a VM:
   ```bash
   scp -i ~/.ssh/id_rsa_oracle scripts/oracle_setup.sh ubuntu@SEU_IP_PUBLICO:~/
   ```

2. Conectar-se à VM via SSH:
   ```bash
   ssh -i ~/.ssh/id_rsa_oracle ubuntu@SEU_IP_PUBLICO
   ```

3. Executar o script de configuração:
   ```bash
   sudo bash oracle_setup.sh
   ```

4. Configurar o Cloudflare Tunnel seguindo as instruções em `CLOUDFLARE_TUNNEL.md`

5. Configurar o CarlosDev para usar a nova VM como servidor Mistral

## Resumo do Processo Automatizado

Com a opção de configuração automatizada, o fluxo completo é:

1. O script cria a VM no Oracle Cloud
2. Configura regras de firewall para as portas necessárias
3. Transfere todos os arquivos necessários para a VM
4. Instala Docker, Cloudflare Tunnel e outras dependências
5. Configura e inicia o servidor Mistral AI
6. Obtém o ID do túnel Cloudflare para uso no CarlosDev
7. Fornece instruções para configurar o domínio no dashboard do Cloudflare
8. Integra com o CarlosDev através da URL do Cloudflare Tunnel

Todo este processo ocorre com interação mínima do usuário, tornando a configuração rápida e descomplicada.

## Solução de problemas

**Erro de autenticação com OCI CLI:**
- Verifique se o arquivo da chave privada está correto e tem as permissões adequadas
- Confirme que o fingerprint corresponde à chave configurada

**Erro ao criar a VM:**
- Verifique os limites de serviço na sua conta Oracle Cloud
- Confirme se tem cota disponível para o shape selecionado
- Verifique permissões no compartimento

**Não consegue conectar via SSH:**
- Aguarde alguns minutos após a criação da VM
- Verifique se as regras de firewall foram configuradas corretamente
- Confirme se está usando a chave SSH correta