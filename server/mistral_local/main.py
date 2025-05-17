from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import json
import time
import uuid
import os
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("mistral-local-server")

app = FastAPI(title="Servidor Local Mistral")

# Configurar CORS para permitir solicitações da aplicação
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja isso
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "mistral-local"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    stream: Optional[bool] = False

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class Choice(BaseModel):
    index: int
    message: Dict[str, str]
    finish_reason: str

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Choice]
    usage: Usage

# Banco de dados de respostas para o agente programador
AGENT_RESPONSES = {
    "programacao": "Para esse problema de programação, sugiro usar uma abordagem modular. Primeiro, divida o problema em partes menores e gerencie cada uma separadamente. Use boas práticas como nomes de variáveis significativos e comentários apropriados.",
    
    "erro": "O erro que você está encontrando parece ser relacionado a um problema de escopo de variáveis. Verifique se todas as variáveis estão definidas antes de serem usadas e se os tipos de dados são compatíveis com as operações realizadas.",
    
    "api": "Para integrar essa API, você precisa primeiro obter uma chave de API válida. Depois, use bibliotecas como axios (JavaScript) ou requests (Python) para fazer chamadas HTTP. Lembre-se de tratar erros e timeouts adequadamente.",
    
    "database": "Para otimizar essa consulta de banco de dados, considere adicionar índices nas colunas frequentemente pesquisadas. Também é importante limitar os resultados retornados usando paginação e selecionar apenas as colunas necessárias.",
    
    "arquitetura": "Ao projetar a arquitetura desse sistema, considere usar um padrão MVC para separar as responsabilidades. Para escalabilidade, pense em implementar microsserviços que possam ser escalados independentemente.",
    
    "default": "Como programador especializado, posso ajudar com desenvolvimento de software, resolução de problemas de código, arquitetura de sistemas, otimização de desempenho e integração de APIs. Por favor, forneça mais detalhes sobre o que você precisa para que eu possa ajudar melhor."
}

# Função para gerar resposta baseada no conteúdo da mensagem
def generate_agent_response(message: str) -> str:
    message = message.lower()
    
    if "programa" in message or "código" in message or "desenvolv" in message:
        return AGENT_RESPONSES["programacao"]
    elif "erro" in message or "bug" in message or "problema" in message:
        return AGENT_RESPONSES["erro"]
    elif "api" in message or "integra" in message:
        return AGENT_RESPONSES["api"]
    elif "banco de dados" in message or "database" in message or "sql" in message:
        return AGENT_RESPONSES["database"]
    elif "arquitetura" in message or "design" in message or "estrutura" in message:
        return AGENT_RESPONSES["arquitetura"]
    else:
        return AGENT_RESPONSES["default"]

# Endpoint de status
@app.get("/health")
async def health_check():
    logger.info("Health check request received")
    return {"status": "ok", "timestamp": time.time()}

# Endpoint para listar modelos disponíveis
@app.get("/models")
async def list_models():
    logger.info("Models list request received")
    return {
        "data": [
            {
                "id": "mistral-local",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "local",
                "capabilities": {
                    "coding": "excellent",
                    "reasoning": "good"
                }
            }
        ]
    }

# Endpoint para completar chat
@app.post("/chat/completions", response_model=ChatResponse)
async def chat_completions(request: ChatRequest):
    try:
        logger.info(f"Chat completion request received for model: {request.model}")
        
        # Calcular tokens (simulado)
        prompt_tokens = sum(len(msg.content.split()) for msg in request.messages)
        
        # Obter a última mensagem
        last_message = request.messages[-1].content if request.messages else "Sem mensagem"
        
        # Gerar resposta baseada no conteúdo
        response_content = generate_agent_response(last_message)
        completion_tokens = len(response_content.split())
        
        # Criar ID único para a resposta
        response_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        
        # Registrar a interação
        logger.info(f"Generating response for message: {last_message[:50]}...")
        
        # Montar resposta
        response = ChatResponse(
            id=response_id,
            created=int(time.time()),
            model=request.model,
            choices=[
                Choice(
                    index=0,
                    message={
                        "role": "assistant",
                        "content": response_content
                    },
                    finish_reason="stop"
                )
            ],
            usage=Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens
            )
        )
        
        logger.info(f"Response generated with id: {response_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing chat completion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Rota para teste de conexão
@app.get("/test")
async def test_connection():
    logger.info("Test connection request received")
    return {
        "success": True, 
        "message": "Servidor local Mistral funcionando corretamente",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Mistral local server on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)