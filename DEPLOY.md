# Configuração de Deploy para o Agente Mistral

Este documento descreve o processo de deploy e as especificações de hardware recomendadas para o agente Mistral ID: `ag:48009b45:20250515:programador-agente:d9bb1918`.

## Requisitos de Hardware

Para garantir desempenho adequado ao executar o agente Mistral, recomendamos as seguintes especificações mínimas:

| Componente | Requisito Mínimo | Recomendado |
|------------|------------------|-------------|
| CPU | 4 cores (x86_64) | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Armazenamento | 20 GB SSD | 100+ GB SSD NVMe |
| Rede | 100 Mbps | 1+ Gbps |
| GPU (opcional) | N/A | NVIDIA T4 ou superior |

## Opções de Deploy

### 1. Deploy na Replit

O projeto está configurado para deploy direto na plataforma Replit, que oferece recursos suficientes para a execução da API e comunicação com serviços Mistral. Nesta configuração, o processamento do modelo é realizado na nuvem Mistral.

**Vantagens:**
- Configuração zero
- Alta disponibilidade
- Sem necessidade de gerenciar infraestrutura

**Limitações:**
- Maior latência para processamento de modelos
- Custos baseados em uso da API Mistral

### 2. Deploy com Servidor Local para Mistral

Para ambientes que necessitam de maior controle, menor latência ou uso intensivo do modelo, é recomendada a configuração com servidor local para execução do Mistral.

**Requisitos adicionais:**
- GPU NVIDIA com mínimo de 16GB VRAM
- 32GB+ RAM
- Conexão de rede estável

**Etapas de configuração:**
1. Instalar servidor Mistral conforme documentação oficial
2. Configurar endpoint na aplicação através da página de configurações
3. Verificar conexão através da página de teste

### 3. Deploy em Nuvem com GPU Dedicada

Para máximo desempenho e escalabilidade, recomenda-se deploy em provedores de nuvem com suporte a GPUs:

- **Oracle Cloud** - VM.GPU Standard A10
- **AWS** - Instâncias g4dn ou g5
- **Google Cloud** - Instâncias com GPUs T4 ou A100
- **Azure** - Séries NC ou ND

## Variáveis de Ambiente

As seguintes variáveis de ambiente precisam ser configuradas:

```
# Configuração do Banco de Dados
DATABASE_URL=postgresql://...  # URL completa de conexão com PostgreSQL

# Configuração do Mistral
MISTRAL_API_KEY=SuaChaveApiAqui
MISTRAL_AGENT_ID=ag:48009b45:20250515:programador-agente:d9bb1918

# Configurações de Servidor (Opcional)
PORT=5000
NODE_ENV=production
```

## Processo de Deploy

1. Garantir que todas as variáveis de ambiente estão configuradas
2. Executar build da aplicação: `npm run build`
3. Iniciar o servidor: `npm start`

Para deploy automatizado, utilize o botão de deploy da plataforma Replit.

## Verificação de Saúde

Após o deploy, verifique a saúde da aplicação através dos seguintes endpoints:

- `/api` - Verifica se o servidor está online
- `/api/mistral/status` - Verifica a conexão com Mistral e mostra o ID do agente configurado

## Monitoramento

Recomenda-se configurar monitoramento para os seguintes aspectos:

- Tempo de resposta da API
- Uso de CPU e memória
- Taxas de erro
- Utilização de tokens Mistral (para controle de custos)

## Troubleshooting

Se ocorrerem problemas com a conexão ao agente Mistral:

1. Verifique se a variável `MISTRAL_API_KEY` está definida corretamente
2. Confirme que o ID do agente (`ag:48009b45:20250515:programador-agente:d9bb1918`) está configurado
3. Teste a conexão usando a página de teste do Mistral
4. Verifique os logs do servidor para mensagens de erro específicas