import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Server, 
  Cloud
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Tipo simplificado para a configuração do sistema
interface SystemConfig {
  id?: number;
  execution_mode: string;
}

// Componente principal
export default function SystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({
    execution_mode: 'local'
  });
  
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState({
    message: '',
    type: 'info' // 'info', 'success', 'error'
  });

  const { playClick, playSuccess, playError } = useSoundEffect();

  // Carregar configuração atual
  const { data: configData, isLoading, refetch } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => {
      const response = await axios.get('/api/system/config');
      return response.data;
    }
  });

  // Efeito para atualizar o estado quando os dados são carregados
  useEffect(() => {
    if (configData) {
      setConfig({
        ...config,
        ...configData
      });
    }
  }, [configData]);

  // Mutation para salvar configuração
  const saveMutation = useMutation({
    mutationFn: async (updatedConfig: SystemConfig) => {
      const response = await axios.patch('/api/system/config', updatedConfig);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!');
      playSuccess();
      setStatus({
        message: 'Configurações salvas com sucesso!',
        type: 'success'
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error}`);
      playError();
      setStatus({
        message: `Erro ao salvar configurações: ${error}`,
        type: 'error'
      });
    }
  });

  // Salvar configurações
  const handleSave = () => {
    playClick();
    saveMutation.mutate(config);
  };

  // Testar conexão com um serviço
  const testConnection = async (mode: 'local' | 'azure') => {
    try {
      setTesting(true);
      playClick();
      
      setStatus({
        message: 'Testando conexão...',
        type: 'info'
      });
      
      const endpoint = '/api/mistral/test-connection';
      const payload = { mode };
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.success) {
        setStatus({
          message: response.data.message || 'Conexão estabelecida com sucesso!',
          type: 'success'
        });
        playSuccess();
      } else {
        setStatus({
          message: response.data.message || 'Falha ao estabelecer conexão',
          type: 'error'
        });
        playError();
      }
    } catch (error: any) {
      setStatus({
        message: error.message || 'Erro ao testar conexão',
        type: 'error'
      });
      playError();
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xl">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text font-orbitron">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Escolha o modo de operação do sistema entre Servidor Local e Servidor Nuvem.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Modo de Execução</CardTitle>
          <CardDescription>
            Selecione onde o sistema irá executar o processamento de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.execution_mode}
            onValueChange={(value) => setConfig({...config, execution_mode: value})}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
              config.execution_mode === 'local' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800'
            }`}>
              <RadioGroupItem value="local" id="local" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="local" className="text-lg font-medium flex items-center">
                  <Server className="mr-2 h-5 w-5 text-blue-500" />
                  Servidor Local
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Conectar ao servidor Mistral executando localmente na porta 8000
                </p>
                <div className="text-xs text-muted-foreground">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Ideal para desenvolvimento e teste</li>
                    <li>Endereço padrão: http://127.0.0.1:8000</li>
                    <li>Implementação FastAPI</li>
                    <li>Não requer conexão com internet</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testConnection('local')}
                  disabled={testing}
                  className="mt-4 w-full sm:w-auto"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Conexão Local'
                  )}
                </Button>
              </div>
            </div>

            <div className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
              config.execution_mode === 'azure' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800'
            }`}>
              <RadioGroupItem value="azure" id="azure" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="azure" className="text-lg font-medium flex items-center">
                  <Cloud className="mr-2 h-5 w-5 text-indigo-500" />
                  Servidor Nuvem (Azure VM)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Conectar ao servidor Mistral executando na Azure VM na porta 3000
                </p>
                <div className="text-xs text-muted-foreground">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Recomendado para produção</li>
                    <li>Máquina virtual dedicada na Azure</li>
                    <li>Melhor desempenho e disponibilidade</li>
                    <li>Suporte a Cloudflare Tunnel para acesso seguro</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testConnection('azure')}
                  disabled={testing}
                  className="mt-4 w-full sm:w-auto"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Servidor Azure'
                  )}
                </Button>
              </div>
            </div>
          </RadioGroup>

          {status.message && (
            <Alert className={`mt-6 ${
              status.type === 'success' 
                ? 'bg-green-500/20 border-green-500' 
                : status.type === 'error'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-blue-500/20 border-blue-500'
            }`}>
              <AlertTitle>
                {status.type === 'success' 
                  ? 'Conexão estabelecida!' 
                  : status.type === 'error'
                    ? 'Erro na conexão'
                    : 'Testando...'}
              </AlertTitle>
              <AlertDescription>
                {status.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Detalhes sobre a configuração atual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Servidor Local (Porta 8000)</h3>
                <p className="text-sm text-muted-foreground">http://127.0.0.1:8000</p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Servidor Azure VM (Porta 3000)</h3>
                <p className="text-sm text-muted-foreground">https://seu-servidor-azure.com:3000</p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">ID do Agente Mistral</h3>
                <p className="text-sm text-muted-foreground">ag:48009b45:20250515:programador-agente:d9bb1918</p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Chave API Mistral</h3>
                <p className="text-sm text-muted-foreground">Configurada via .env (MISTRAL_API_KEY)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full sm:w-auto"
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}