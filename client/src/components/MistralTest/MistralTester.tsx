import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import axios from 'axios';

export default function MistralTester() {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { playClick, playSuccess, playError } = useSoundEffect();

  // Função para verificar o status da API Mistral
  const checkStatus = async () => {
    try {
      setStatusLoading(true);
      playClick();
      
      const result = await axios.get('/api/mistral/status');
      setStatus(result.data);
      
      if (result.data.available) {
        playSuccess();
      } else {
        playError();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus({
        available: false,
        message: 'Erro ao conectar com o serviço Mistral'
      });
      playError();
      
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o status do serviço Mistral',
        variant: 'destructive'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Função para enviar prompt ao Mistral
  const sendPrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite um prompt para enviar',
        variant: 'default'
      });
      return;
    }
    
    try {
      setLoading(true);
      playClick();
      
      const result = await axios.post('/api/mistral/chat/completions', {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // Extrair a resposta
      const content = result.data.choices[0]?.message?.content || 'Não foi possível obter uma resposta.';
      setResponse(content);
      playSuccess();
    } catch (error: any) {
      console.error('Erro ao enviar prompt:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao conectar com a API Mistral';
      setResponse(`Erro: ${errorMessage}`);
      playError();
      
      toast({
        title: 'Erro na API Mistral',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderização do componente
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Card de Status */}
      <Card className="border border-gray-800 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Status do Serviço Mistral
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkStatus}
              disabled={statusLoading}
            >
              {statusLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Verificar
            </Button>
          </CardTitle>
          <CardDescription>
            Confira se o serviço Mistral está conectado e respondendo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {status.available ? (
                  <Badge className="bg-green-600 hover:bg-green-700" variant="outline">
                    Disponível
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Indisponível
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Modo:</span>
                <Badge variant="outline">
                  {status.mode === 'local' 
                    ? '🖥️ Local' 
                    : status.mode === 'api' 
                      ? '🌐 API oficial' 
                      : '⚡ Replit'}
                </Badge>
              </div>
              <Alert className="mt-2">
                <AlertTitle>Mensagem do sistema</AlertTitle>
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-2">
              Clique em "Verificar" para conferir o status do serviço
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de teste */}
      <Card className="border border-gray-800 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Teste da API Mistral</CardTitle>
          <CardDescription>
            Envie um prompt e receba a resposta do modelo Mistral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Digite seu prompt aqui..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {response && (
            <div className="mt-4 p-4 bg-black/30 rounded-md border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Resposta:</h3>
              <div className="whitespace-pre-wrap">{response}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={sendPrompt} 
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar para o Mistral
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}