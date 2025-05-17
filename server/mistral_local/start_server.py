import uvicorn
import os
import logging
import sys

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("mistral_server.log")
    ]
)

logger = logging.getLogger("mistral-server-starter")

def start_server():
    """
    Inicia o servidor Mistral local na porta 8000
    """
    try:
        logger.info("Iniciando servidor Mistral local na porta 8000...")
        
        # Definir porta
        port = int(os.environ.get("MISTRAL_SERVER_PORT", 8000))
        
        # Iniciar servidor
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()