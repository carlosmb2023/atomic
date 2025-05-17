import requests
import json
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("mistral-utils")

class MistralLocalClient:
    """
    Cliente para interagir com o servidor local do Mistral
    """
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        logger.info(f"Inicializando cliente Mistral para: {base_url}")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Verifica se o servidor está funcionando
        """
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro no health check: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def list_models(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Lista os modelos disponíveis no servidor
        """
        try:
            response = requests.get(f"{self.base_url}/models", timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao listar modelos: {str(e)}")
            return {"data": [], "error": str(e)}
    
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "mistral-local",
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Realiza uma solicitação de chat completion
        
        Args:
            messages: Lista de mensagens no formato [{"role": "user", "content": "texto"}]
            model: Nome do modelo a ser usado
            temperature: Temperatura para geração (0.0 a 1.0)
            max_tokens: Número máximo de tokens a serem gerados
            
        Returns:
            Resposta da API formatada como dicionário
        """
        try:
            payload = {
                "messages": messages,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            headers = {
                "Content-Type": "application/json"
            }
            
            logger.info(f"Enviando solicitação para {self.base_url}/chat/completions")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(f"Erro na chat completion: {str(e)}")
            return {
                "error": str(e),
                "id": "error",
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": f"Erro ao comunicar com o servidor: {str(e)}"
                        }
                    }
                ]
            }
            
    def test_connection(self) -> Dict[str, Any]:
        """
        Testa a conexão com o servidor
        """
        try:
            response = requests.get(f"{self.base_url}/test", timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao testar conexão: {str(e)}")
            return {"success": False, "message": f"Erro: {str(e)}"}


# Função de utilidade para testar o servidor
def test_local_server(base_url: str = "http://localhost:8000") -> bool:
    """
    Testa se o servidor local está funcionando
    
    Returns:
        True se o servidor estiver funcionando, False caso contrário
    """
    client = MistralLocalClient(base_url)
    try:
        result = client.test_connection()
        return result.get("success", False)
    except:
        return False