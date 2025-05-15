# Manual do Usuário - Projeto WebAiDashboard

## 1. Introdução

Bem-vindo ao WebAiDashboard, uma plataforma avançada para gerenciamento e integração de agentes de IA. Este manual fornece instruções sobre como configurar e utilizar todas as funcionalidades do sistema, com foco especial no Agente Mistral integrado (ID: `ag:48009b45:20250515:programador-agente:d9bb1918`).

## 2. Acesso ao Sistema

O acesso ao WebAiDashboard pode ser feito de duas formas:

- **Deploy na nuvem**: Acesse o sistema através do URL fornecido após o deploy
- **Execução local**: Acesse o sistema em `http://localhost:5000`

### 2.1 Primeiros passos

1. Faça login com suas credenciais
2. Na primeira execução, você será direcionado para a página de configuração
3. Configure sua chave de API Mistral e outras configurações necessárias

## 3. Interface do Usuário

A interface do WebAiDashboard é dividida nas seguintes seções:

### 3.1 Dashboard Principal

O dashboard apresenta uma visão geral do sistema, incluindo:

- Status do agente Mistral
- Estatísticas de uso
- Gráficos de desempenho
- Alertas e notificações

### 3.2 Página de Teste do Mistral

Nesta página, você pode:

- Testar a conexão com a API Mistral
- Enviar prompts de teste para o modelo
- Verificar o ID do agente Mistral
- Ajustar configurações específicas

### 3.3 Configurações do Sistema

Acesse as configurações para:

- Configurar chaves de API
- Definir modo de execução (API, Local, Replit)
- Configurar conexão com banco de dados
- Ajustar parâmetros de desempenho

## 4. Configuração do Agente Mistral

### 4.1 Opções de Conexão

O sistema oferece três modos de conexão com o Mistral:

1. **Modo API** - Utiliza a API oficial do Mistral
   - Requer uma chave de API Mistral válida
   - Oferece modelos de última geração
   - Conexão estável e gerenciada

2. **Modo Local** - Conecta-se a uma instância local do Mistral
   - Requer instalação do modelo em servidor local
   - Menor latência e maior privacidade
   - Necessita de hardware específico

3. **Modo Replit** - Versão otimizada para o ambiente Replit
   - Funcionalidade básica sem necessidade de hardware dedicado
   - Ideal para testes e desenvolvimento

### 4.2 Configuração do ID do Agente

O sistema está pré-configurado para usar o agente ID: `ag:48009b45:20250515:programador-agente:d9bb1918`.

Para verificar a configuração:
1. Acesse a página de Configurações
2. Vá para a aba "Mistral"
3. Verifique se o campo "Agent ID" contém o valor correto

### 4.3 Requisitos de Hardware

Para melhor desempenho com o agente Mistral, recomendamos:

- 4+ cores de CPU
- 8+ GB de RAM
- 20+ GB de espaço em disco
- Conexão estável com a internet

## 5. Funcionalidades Principais

### 5.1 Teste de Prompts

Você pode testar o agente Mistral com prompts personalizados:

1. Acesse a página de Teste do Mistral
2. Digite seu prompt na caixa de texto
3. Ajuste os parâmetros de geração (temperatura, tokens)
4. Clique em "Enviar" para receber a resposta

### 5.2 Monitoramento de Uso

Monitore o uso do sistema através do Dashboard:

- Tokens consumidos
- Tempo de resposta
- Taxa de sucesso
- Histórico de interações

### 5.3 Diagnóstico e Troubleshooting

Para resolver problemas:

1. Verifique a página de Status
2. Consulte os logs do sistema
3. Execute o verificador de compatibilidade em `/scripts/deploy/check_hardware.sh`
4. Verifique a conexão com a API Mistral

## 6. Deploy e Configuração Avançada

### 6.1 Deploy no Replit

Para fazer o deploy no Replit:

1. Clique no botão de Deploy
2. Configure as variáveis de ambiente necessárias
3. Aguarde a conclusão do processo

### 6.2 Deploy em Servidor Próprio

Para deploy em servidor próprio:

1. Siga as instruções no arquivo `DEPLOY.md`
2. Execute o script `deploy.sh`
3. Configure o arquivo `.env.deploy` com suas credenciais

### 6.3 Integração com Cloudflare Tunnel

Para expor o serviço de forma segura:

1. Siga as instruções no arquivo `CLOUDFLARE_TUNNEL.md`
2. Configure o túnel para apontar para o endereço do seu serviço

## 7. Suporte e Contato

Para suporte adicional:

- Consulte a documentação online
- Entre em contato via sistema de tickets
- Acesse o repositório do projeto para atualizações

---

Versão do Documento: 1.0  
Data de Atualização: 15/05/2025  
ID do Agente Compatível: `ag:48009b45:20250515:programador-agente:d9bb1918`