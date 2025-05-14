# Manual do Usuário - CarlosDev

Bem-vindo ao Sistema CarlosDev, uma plataforma moderna para gerenciamento inteligente de servidores e infraestrutura, potencializada por IA.

## Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos do Sistema](#requisitos-do-sistema)
3. [Primeiros Passos](#primeiros-passos)
4. [Painel de Controle](#painel-de-controle)
5. [Monitoramento de Servidores](#monitoramento-de-servidores)
6. [Configurações do Sistema](#configurações-do-sistema)
7. [Integração com Mistral AI](#integração-com-mistral-ai)
8. [Configuração do Cloudflare Tunnel](#configuração-do-cloudflare-tunnel)
9. [Deployment na Oracle Cloud](#deployment-na-oracle-cloud)
10. [Agentes de IA](#agentes-de-ia)
11. [Solução de Problemas](#solução-de-problemas)
12. [Suporte Técnico](#suporte-técnico)

## Visão Geral

O CarlosDev é uma plataforma completa de gerenciamento de servidores e infraestrutura que combina:

- **Dashboard Intuitivo**: Monitoramento em tempo real de métricas de servidor
- **Inteligência Artificial**: Integração com modelos de linguagem para automação
- **Agentes Autônomos**: Agentes baseados em IA para tarefas específicas
- **Deployment Flexível**: Opções para hospedagem local, na nuvem ou híbrida
- **Segurança Avançada**: Proteção de acesso via Cloudflare Tunnel

## Requisitos do Sistema

### Para Acesso Web
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexão estável com a internet

### Para Hospedagem
- **Opção 1 - Replit**: Sem requisitos adicionais
- **Opção 2 - Oracle Cloud**: 
  - Instância VM.Standard.E4.Flex (4 OCPUs, 24GB RAM mínimo)
  - 100GB de armazenamento
- **Opção 3 - Servidor Local**:
  - CPU: 4 núcleos
  - RAM: 16GB
  - Armazenamento: 50GB
  - Sistema Operacional: Ubuntu 20.04+ ou similar

## Primeiros Passos

### Login no Sistema

1. Acesse o sistema pela URL fornecida (exemplo: https://carlosdev.app.br)
2. Na tela de login, insira suas credenciais
3. Para primeiro acesso, use as credenciais padrão:
   - Usuário: `admin`
   - Senha: `admin123`
   - **IMPORTANTE**: Altere a senha padrão imediatamente após o primeiro login

### Navegação Básica

Após o login, você verá o Dashboard principal com os seguintes elementos:

- **Barra Lateral**: Acesso às principais funcionalidades
- **Painel Superior**: Notificações e menu do usuário
- **Área Central**: Visualização da página atual
- **Rodapé**: Versão do sistema e links úteis

## Painel de Controle

O Dashboard principal fornece uma visão geral de todos os servidores monitorados e sistemas ativos:

- **Métricas em Tempo Real**: CPU, memória, armazenamento e tráfego de rede
- **Status dos Serviços**: Verde (ativo), amarelo (atenção), vermelho (crítico)
- **Gráficos de Desempenho**: Histórico de desempenho nas últimas 24 horas
- **Alertas Recentes**: Últimos alertas e notificações do sistema

### Personalizando o Dashboard

1. Clique no botão "Personalizar" no canto superior direito
2. Arraste e solte os widgets para reorganizar
3. Use o menu de cada widget para configurar as métricas exibidas
4. Clique em "Salvar Layout" para manter suas configurações

## Monitoramento de Servidores

### Adicionando um Novo Servidor

1. Navegue até "Monitoramento" > "Servidores"
2. Clique em "Adicionar Servidor"
3. Forneça as informações necessárias:
   - Nome amigável
   - Endereço IP ou hostname
   - Credenciais de acesso (opcional)
   - Tipo de servidor
4. Selecione as métricas a serem monitoradas
5. Clique em "Salvar"

### Configurando Alertas

1. Acesse o servidor desejado na lista
2. Vá para a aba "Alertas"
3. Clique em "Novo Alerta"
4. Defina as condições:
   - Métrica a ser monitorada
   - Limite (threshold)
   - Duração do evento
   - Ações a serem tomadas
5. Escolha os canais de notificação (email, SMS, webhook)
6. Salve a configuração

## Configurações do Sistema

Acesse as configurações através do menu "Configurações" na barra lateral:

### Configurações Gerais

- **Aparência**: Tema claro/escuro, densidade de informações
- **Idioma**: Português, Inglês, Espanhol
- **Fuso Horário**: Ajuste conforme sua localização
- **Notificações**: Configure os canais de notificação

### Configurações de Usuários

- **Gerenciamento de Usuários**: Adicionar, editar, remover usuários
- **Perfis de Acesso**: Definir permissões por grupo
- **Autenticação**: Configurar MFA, integração com LDAP/AD

### Configurações de Rede

- **Proxy**: Configurar proxy para acesso externo
- **Firewall**: Regras básicas de acesso
- **API Keys**: Gerar e gerenciar chaves de API

## Integração com Mistral AI

O sistema oferece integração com o Mistral AI, um modelo de linguagem avançado que pode ser executado localmente ou na nuvem.

### Configurando o Mistral

1. Acesse "Configurações" > "Mistral AI"
2. Escolha o modo de execução:
   - **Local**: Para instância local (requer recursos significativos)
   - **Cloud**: Para utilizar serviço hospedado na Oracle Cloud
   - **Híbrido**: Combina recursos locais e na nuvem

### Opções do Mistral

- **URL do Mistral Local**: Geralmente http://localhost:8000
- **URL do Mistral Cloud**: O endereço da sua instância Oracle Cloud ou serviço Mistral
- **Tipo de Instância**: Local, Oracle Cloud, ou outro provedor
- **Modelo**: Mistral-7B-Instruct-v0.2 (padrão), ou outros disponíveis
- **Parâmetros**: Configurações avançadas como temperatura, tokens máximos, etc.

### Mistral Local

Para configurar o Mistral localmente:

1. Execute o script de instalação: `scripts/setup-local-mistral.sh`
2. Siga as instruções na tela
3. Configure a URL do Mistral Local como http://localhost:8000

## Configuração do Cloudflare Tunnel

O Cloudflare Tunnel permite acesso seguro ao seu sistema sem expor portas diretamente à internet.

### Ativando o Cloudflare Tunnel

1. Acesse "Configurações" > "Cloudflare Tunnel"
2. Ative a opção "Usar Cloudflare Tunnel"
3. Insira o ID do Túnel (obtido após a configuração no servidor)
4. Configure o domínio base (exemplo: carlosdev.app.br)
5. Salve as configurações

### Verificando o Status

- **Status do Túnel**: Exibe se o túnel está ativo ou inativo
- **Estatísticas**: Mostra o tráfego e conexões ativas
- **Logs**: Registro de eventos do túnel

Para instruções detalhadas sobre a configuração do servidor Cloudflare Tunnel, consulte o arquivo [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md).

## Deployment na Oracle Cloud

O sistema pode ser hospedado na Oracle Cloud para maior desempenho e disponibilidade.

### Configurando a VM Oracle Cloud

1. Acesse "Configurações" > "Deployment"
2. Na seção "Oracle Cloud", clique em "Configurar"
3. Insira os detalhes da instância:
   - IP da instância
   - Usuário SSH
   - Caminho da chave SSH (ou senha)
4. Teste a conexão
5. Salve as configurações

### Opções de Deployment

- **Deploy Automatizado**: O sistema pode ser implantado automaticamente
- **Implantação do Mistral**: Opção para implantar o modelo Mistral na VM
- **Sincronização**: Manter os sistemas sincronizados

Para instruções detalhadas sobre a configuração da VM Oracle Cloud, consulte o arquivo [INSTALACAO_ORACLE_CLOUD.md](INSTALACAO_ORACLE_CLOUD.md).

## Agentes de IA

O sistema possui agentes de IA que podem realizar tarefas automatizadas.

### Tipos de Agentes

- **Monitor**: Monitoramento automatizado com detecção de anomalias
- **Assistente**: Respostas a perguntas sobre servidores e status
- **Automação**: Execução de tarefas programadas ou por condição
- **Diagnóstico**: Análise de problemas e sugestão de soluções

### Gerenciando Agentes

1. Acesse "Agentes" no menu lateral
2. Veja a lista de agentes disponíveis
3. Para criar um novo agente:
   - Clique em "Novo Agente"
   - Selecione o tipo
   - Configure o nome e descrição
   - Selecione o modelo (OpenAI ou Mistral)
   - Configure as ferramentas disponíveis
   - Defina o prompt do sistema
   - Ative memória persistente se necessário
   - Insira a chave de API (se usando OpenAI)
   - Salve o agente

### Interagindo com Agentes

1. Clique no agente desejado na lista
2. Use a janela de chat para interação direta
3. Veja o histórico de interações
4. Para execuções automáticas, configure gatilhos:
   - Por tempo (cron)
   - Por evento
   - Por condição de alerta

## Solução de Problemas

### Problemas de Conexão

- **Erro "Não foi possível conectar ao servidor"**: Verifique se o servidor está online e acessível na rede
- **Erro de autenticação**: Confirme suas credenciais e verifique se sua conta não está bloqueada
- **Timeout de conexão**: Verifique sua conexão com a internet ou a rede local

### Problemas com o Mistral

- **Erro "Modelo não disponível"**: Verifique se o serviço Mistral está rodando
- **Lentidão nas respostas**: O modelo pode estar em execução com recursos limitados
- **Erro de conexão**: Verifique as configurações de URL e conectividade

### Problemas com Cloudflare Tunnel

- **Túnel inativo**: Verifique se o serviço cloudflared está rodando
- **Erro de DNS**: Confirme as configurações de DNS no Cloudflare
- **Erro de conexão**: Veja os logs do cloudflared para mais detalhes

## Suporte Técnico

Em caso de problemas ou dúvidas, entre em contato com o suporte:

- **Email**: suporte@carlosdev.app.br
- **Chat**: Disponível em horário comercial através do sistema
- **Documentação**: Acesse a documentação completa em docs.carlosdev.app.br

---

© 2025 CarlosDev. Todos os direitos reservados.