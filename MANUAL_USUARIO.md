# Manual de Usuário - Web AI Dashboard

## Sumário
- [Introdução](#introdução)
- [Requisitos do Sistema](#requisitos-do-sistema)
- [Instalação](#instalação)
  - [Ambiente de Desenvolvimento Local](#ambiente-de-desenvolvimento-local)
  - [Banco de Dados](#banco-de-dados)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Funcionalidades](#funcionalidades)
  - [Dashboard](#dashboard)
  - [Chat com IA](#chat-com-ia)
  - [Gerenciamento de Arquivos](#gerenciamento-de-arquivos)
  - [Gerenciamento de Projetos](#gerenciamento-de-projetos)
  - [Configurações do Sistema](#configurações-do-sistema)
- [Configuração de Servidores](#configuração-de-servidores)
  - [Servidor Local (Ollama/Mistral)](#servidor-local-ollamamistralllamacpp)
  - [Servidor Oracle Cloud](#servidor-oracle-cloud)
  - [Alternando entre Servidores](#alternando-entre-servidores)
- [Integração com Apify](#integração-com-apify)
- [Monitoramento e Métricas](#monitoramento-e-métricas)
- [Solução de Problemas](#solução-de-problemas)
- [Perguntas Frequentes](#perguntas-frequentes)

## Introdução

O Web AI Dashboard é uma plataforma moderna com interface futurista para gerenciamento de IA. Ele permite o acesso a modelos de linguagem (LLMs) locais ou na nuvem, gerenciamento de arquivos e projetos, integração com Oracle Cloud e uso de serviços Apify para pesquisas avançadas.

A plataforma foi projetada com uma estética sci-fi com tema escuro, efeitos de glass-morphism, animações inspiradas em IA e efeitos sonoros interativos.

## Requisitos do Sistema

### Para uso no ambiente de desenvolvimento:
- NodeJS 18+ (recomendado: NodeJS 20)
- NPM 9+
- PostgreSQL 14+ (opcional, pode usar o armazenamento em memória)
- Git

### Para implantação no Oracle Cloud:
- Conta Oracle Cloud (nível gratuito é suficiente para início)
- Acesso SSH ao servidor
- Conhecimentos básicos de Linux

## Instalação

### Ambiente de Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://seu-repositorio/webaidashboard.git
cd webaidashboard
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo de variáveis de ambiente (`.env`):
```
DATABASE_URL=postgres://usuario:senha@localhost:5432/webaidashboard
PGUSER=usuario
PGPASSWORD=senha
PGDATABASE=webaidashboard
PGHOST=localhost
PGPORT=5432
```

4. Inicialize o banco de dados (opcional):
```bash
npm run db:push
```

5. Inicie a aplicação:
```bash
npm run dev
```

6. Acesse a aplicação em:
```
http://localhost:5000
```

### Banco de Dados

O sistema suporta três opções de armazenamento:

1. **Armazenamento em Memória**: Usado automaticamente quando não há banco de dados configurado. Os dados são perdidos ao reiniciar a aplicação.

2. **PostgreSQL Local**: Configure no arquivo `.env` com as credenciais do seu banco PostgreSQL local.

3. **PostgreSQL Neon (Cloud)**: Use uma string de conexão do Neon (https://neon.tech) no arquivo `.env`.

### Variáveis de Ambiente

| Variável       | Descrição                                  | Obrigatória |
|----------------|-------------------------------------------|------------|
| DATABASE_URL   | String de conexão com o banco PostgreSQL   | Não        |
| PGUSER         | Usuário do PostgreSQL                      | Não        |
| PGPASSWORD     | Senha do PostgreSQL                        | Não        |
| PGDATABASE     | Nome do banco de dados                     | Não        |
| PGHOST         | Host do PostgreSQL                         | Não        |
| PGPORT         | Porta do PostgreSQL (padrão: 5432)         | Não        |

## Funcionalidades

### Dashboard

A página inicial do sistema apresenta:

- **Resumo de Atividades**: Visualização dos últimos acessos e ações
- **Estatísticas de Uso**: Contadores de uso dos modelos LLM, chamadas de API e interações
- **Projetos Recentes**: Lista dos últimos projetos acessados
- **Status do Sistema**: Indicadores de conexão com servidores locais e na nuvem
- **Atividade de IA**: Gráfico de uso dos recursos de IA ao longo do tempo

### Chat com IA

Interface de conversação avançada com modelos de linguagem:

- **Conversa com IA**: Interface de chat estilo ChatGPT
- **Histórico de Conversas**: Armazenamento e acesso a conversas anteriores
- **Customização de Prompts**: Possibilidade de definir o estilo e comportamento da IA
- **Suporte a Ferramentas**: Integração com pesquisa web via Apify
- **Compartilhamento**: Opção para exportar conversas em diversos formatos
- **Efeitos Sonoros**: Feedback sonoro para ações (pode ser desativado nas configurações)

### Gerenciamento de Arquivos

Sistema para upload e organização de arquivos:

- **Upload de Arquivos**: Suporte a diversos formatos (documentos, imagens, etc.)
- **Visualização**: Prévia integrada para arquivos comuns
- **Organização**: Categorização e busca de arquivos
- **Compartilhamento**: Links para compartilhamento externo (opcional)
- **Controle de Acesso**: Definição de arquivos públicos ou privados

### Gerenciamento de Projetos

Organização de projetos relacionados à IA:

- **Criação de Projetos**: Interface para definir novos projetos
- **Acompanhamento**: Status e progresso de cada projeto
- **Associação de Recursos**: Vinculação de arquivos e conversas a projetos
- **Notas e Documentação**: Editor de texto integrado para documentação

### Configurações do Sistema

Painel de controle para ajustes do sistema:

- **Configurações Gerais**: Ajustes de interface e comportamento
- **Configuração de Modelos**: Definição de URLs e parâmetros dos modelos LLM
- **Integração Oracle Cloud**: Configuração da instância na nuvem
- **Integração Apify**: Configuração da API do Apify para buscas na web
- **Sons e Animações**: Controle dos efeitos visuais e sonoros
- **Logs do Sistema**: Visualização de eventos e erros

## Configuração de Servidores

### Servidor Local (Ollama/Mistral/LlamaCpp)

Para configurar um servidor LLM local:

1. **Instale o Ollama**:
   - Windows/Mac: Baixe do site oficial [Ollama](https://ollama.ai/)
   - Linux: Siga as instruções em [Ollama Linux](https://github.com/ollama/ollama#linux)

2. **Baixe um modelo**:
   ```bash
   ollama pull mistral
   # ou outro modelo de sua preferência
   ```

3. **Inicie o servidor**:
   ```bash
   ollama serve
   ```

4. **Configure no Web AI Dashboard**:
   - Acesse: Configurações > Configurações Gerais
   - Defina `Modo de Execução` como `Local`
   - Configure `URL do LLM Local` como `http://127.0.0.1:11434`
   - Clique em `Salvar`

### Servidor Oracle Cloud

Para configurar um servidor na Oracle Cloud:

1. **Crie uma instância na Oracle Cloud**:
   - Acesse o [Console Oracle Cloud](https://cloud.oracle.com/)
   - Vá para Computação > Instâncias > Criar Instância
   - Selecione Oracle Linux 8+
   - Configure com pelo menos 4 OCPUs e 24GB RAM (recomendado)
   - Configure portas: 22 (SSH), 80 (HTTP), 443 (HTTPS) e 11434 (LLM API)
   - Crie e baixe a chave SSH

2. **Configuração da instância**:
   ```bash
   # Acesse via SSH
   ssh -i sua_chave.pem opc@IP_DA_INSTANCIA
   
   # Atualize o sistema
   sudo yum update -y
   
   # Instale Docker
   sudo yum install -y docker-ce docker-ce-cli
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker opc
   
   # Instale Ollama via Docker
   docker run -d --name ollama -p 11434:11434 ollama/ollama
   
   # Baixe o modelo desejado
   docker exec -it ollama ollama pull mistral
   ```

3. **Configure no Web AI Dashboard**:
   - Acesse: Configurações > Configurações Gerais
   - Configure `URL do LLM na Nuvem` como `http://IP_DA_INSTANCIA:11434`
   - Acesse: Configurações > Oracle Cloud
   - Configure `IP da Instância Oracle` com o IP da sua instância
   - Clique em `Salvar`

### Alternando entre Servidores

Para alternar entre os modos de execução:

1. Acesse: Configurações > Configurações Gerais
2. Em `Modo de Execução`, escolha:
   - `Local`: Para usar o servidor em seu computador local
   - `Cloud`: Para usar o servidor na Oracle Cloud
3. Clique em `Salvar`

O sistema automaticamente atualizará o `URL Ativo do LLM` com base na sua escolha.

## Integração com Apify

O sistema pode enriquecer as respostas da IA com informações da web usando o Apify:

1. **Crie uma conta no Apify**:
   - Acesse [Apify](https://apify.com/) e crie uma conta
   - Obtenha sua API Key no painel de controle

2. **Configure no Web AI Dashboard**:
   - Acesse: Configurações > Configurações Gerais
   - Defina `URL do Actor Apify` como `https://api.apify.com/v2/acts/apify~google-search-scraper/runs`
   - Adicione sua `Chave API do Apify`
   - Clique em `Salvar`

3. **Usando o Apify no Chat**:
   - Durante uma conversa com a IA, ela automaticamente usará o Apify para enriquecer respostas quando necessário
   - Perguntas sobre eventos recentes, notícias ou informações atuais se beneficiarão da integração

## Monitoramento e Métricas

O sistema coleta automaticamente métricas sobre o uso:

- **Estatísticas Diárias**: Contagem de requisições, tokens, tempos de resposta
- **Métricas por Tipo**: Divisão entre requisições locais e na nuvem
- **Logs Detalhados**: Histórico de chamadas com tempos e status
- **Visualização de Tendências**: Gráficos de uso ao longo do tempo

As métricas são acessíveis através do Dashboard principal.

## Solução de Problemas

### Problemas de Conexão com o Banco de Dados

**Sintoma**: Erro "Falha ao conectar com o banco de dados, usando armazenamento em memória"

**Soluções**:
1. Verifique se o PostgreSQL está em execução:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verifique as credenciais no arquivo `.env`

3. Teste a conexão manualmente:
   ```bash
   psql -U seu_usuario -d seu_banco -h localhost
   ```

4. Verifique o arquivo `pg_hba.conf` para autenticação:
   ```bash
   sudo nano /var/lib/pgsql/data/pg_hba.conf
   ```
   Certifique-se de que o método de autenticação é `md5` ou `password`

### Problemas com Servidor Local LLM

**Sintoma**: Erro "Falha ao conectar ao servidor LLM"

**Soluções**:
1. Verifique se o Ollama está em execução:
   ```bash
   # Se instalado localmente
   ps aux | grep ollama
   
   # Se usando Docker
   docker ps | grep ollama
   ```

2. Verifique se a URL está correta nas configurações (geralmente `http://127.0.0.1:11434`)

3. Teste a API diretamente:
   ```bash
   curl http://127.0.0.1:11434/api/generate -d '{
     "model": "mistral",
     "prompt": "Hello"
   }'
   ```

### Problemas com Servidor Oracle Cloud

**Sintoma**: Não consegue conectar à instância Oracle Cloud

**Soluções**:
1. Verifique o status da instância no Console Oracle Cloud

2. Confirme se as regras de firewall permitem conexões:
   - Porta 11434 para a API LLM
   - Porta 22 para SSH

3. Teste a conectividade SSH:
   ```bash
   ssh -i sua_chave.pem opc@IP_DA_INSTANCIA
   ```

4. Verifique os logs do Docker na instância:
   ```bash
   docker logs ollama
   ```

## Perguntas Frequentes

**P: Posso usar o sistema sem banco de dados?**  
R: Sim, o sistema automaticamente usa armazenamento em memória quando não consegue conectar a um banco de dados. No entanto, os dados serão perdidos ao reiniciar a aplicação.

**P: Quais modelos de IA são compatíveis?**  
R: O sistema é compatível com qualquer modelo disponível via API Ollama (Mistral, Llama, etc.) ou serviços compatíveis com a mesma interface.

**P: Posso usar o sistema com vários usuários simultaneamente?**  
R: Sim, o sistema suporta múltiplos usuários com controle de acesso.

**P: É possível desativar os efeitos sonoros?**  
R: Sim, acesse Configurações > Configurações Gerais > Sons e Animações para desativar.

**P: Quais são os requisitos mínimos para a instância Oracle Cloud?**  
R: Recomendamos pelo menos 4 OCPUs e 24GB de RAM para uma experiência fluida, especialmente ao usar modelos maiores.

**P: Como faço backup dos meus dados?**  
R: Se estiver usando PostgreSQL, você pode usar as ferramentas padrão como `pg_dump`:
```bash
pg_dump -U seu_usuario webaidashboard > backup.sql
```

**P: O sistema é compatível com modelos comerciais como GPT-4?**  
R: Não diretamente. O sistema foi projetado para modelos de execução local ou em sua própria infraestrutura. Integrações com APIs comerciais podem ser desenvolvidas como extensões.