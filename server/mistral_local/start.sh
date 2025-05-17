#!/bin/bash

# Script para iniciar o servidor local Mistral

echo "========================================"
echo "Iniciando Servidor Local Mistral - Porta 8000"
echo "========================================"

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "Python3 não encontrado. Por favor, instale o Python 3.8 ou superior."
    exit 1
fi

# Diretório do script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Verificar ambiente virtual
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
echo "Instalando dependências..."
pip install -r requirements.txt

# Iniciar o servidor
echo "Iniciando servidor na porta 8000..."
python start_server.py