require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.API_PORT || 8001;
const mistralUrl = process.env.MISTRAL_URL || 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json());

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    const mistralStatus = await axios.get(`${mistralUrl}/health`);
    res.json({
      status: 'online',
      mistral: mistralStatus.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status do Mistral:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao conectar com o serviço Mistral',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proxy para a API do Mistral
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const response = await axios.post(`${mistralUrl}/v1/chat/completions`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Adiciona metadados para rastreamento
    const responseWithMetadata = {
      ...response.data,
      _metadata: {
        processed_by: 'carlosdev-bridge',
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - new Date(req.headers['x-request-start'] || Date.now()).getTime()
      }
    };
    
    res.json(responseWithMetadata);
  } catch (error) {
    console.error('Erro ao processar requisição do Mistral:', error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error?.message || 'Erro interno na API bridge',
        type: error.response?.data?.error?.type || 'api_error',
        code: error.response?.data?.error?.code || 'internal_error',
        param: error.response?.data?.error?.param,
        _bridge_info: {
          original_error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
});

// Proxy para outros endpoints do Mistral
app.all('/v1/*', async (req, res) => {
  try {
    const method = req.method.toLowerCase();
    const url = `${mistralUrl}${req.url}`;
    
    const response = await axios({
      method,
      url,
      data: ['post', 'put', 'patch'].includes(method) ? req.body : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Erro no proxy para ${req.url}:`, error.message);
    res.status(error.response?.status || 500).json(error.response?.data || {
      error: {
        message: 'Erro no processamento da requisição',
        detail: error.message
      }
    });
  }
});

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`API Bridge rodando em http://0.0.0.0:${port}`);
  console.log(`Conectado ao Mistral em ${mistralUrl}`);
});