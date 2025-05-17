import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Server, 
  Cloud,
  Check,
  X
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import { useSoundEffect } from '@/hooks/use-sound-effect';

interface SystemConfig {
  id?: number;
  execution_mode: string;
}

export default function SimpleSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({
    execution_mode: 'local'
  });
  
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({
    local: { tested: false, success: false, message: '' },
    cloud: { tested: false, success: false, message: '' }
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
        execution_mode: configData.execution_mode || 'local'
      });
      
      // Para UI, precisamos mostrar o modo correto (local ou azure)
      const uiMode = configData.execution_mode === 'cloud' ? 'azure' : 'local';
      console.log(`Carregando configuração: modo=${configData.execution_mode}, UI mode=${uiMode}`);
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
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error}`);
      playError();
    }
  });

  // Testar conexão com um serviço
  const testConnection = async (mode: 'local' | 'azure') => {
    try {
      setTesting(true);
      playClick();
      
      toast.info(`Testando conexão com o servidor ${mode === 'local' ? 'local' : 'Azure'}...`);
      
      const endpoint = '/api/mistral/test-connection';
      const payload = { mode };
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.success) {
        setTestResults(prev => ({
          ...prev,
          [mode === 'local' ? 'local' : 'cloud']: {
            tested: true,
            success: true,
            message: response.data.message || 'Conexão estabelecida com sucesso!'
          }
        }));
        toast.success(`Conexão com ${mode === 'local' ? 'servidor local' : 'Azure VM'} estabelecida com sucesso!`);
        playSuccess();
      } else {
        setTestResults(prev => ({
          ...prev,
          [mode === 'local' ? 'local' : 'cloud']: {
            tested: true,
            success: false,
            message: response.data.message || 'Falha ao estabelecer conexão'
          }
        }));
        toast.error(`Falha ao conectar com ${mode === 'local' ? 'servidor local' : 'Azure VM'}: ${response.data.message}`);
        playError();
      }
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [mode === 'local' ? 'local' : 'cloud']: {
          tested: true,
          success: false,
          message: error.message || 'Erro ao testar conexão'
        }
      }));
      toast.error(`Erro ao testar ${mode === 'local' ? 'servidor local' : 'Azure VM'}: ${error.message}`);
      playError();
    } finally {
      setTesting(false);
    }
  };

  // Mudar o modo de execução
  const changeMode = (mode: string) => {
    // Aqui mapeamos 'local' e 'azure' para 'local' e 'cloud' que são os valores aceitos pelo backend
    const backendMode = mode === 'azure' ? 'cloud' : 'local';
    setConfig({ ...config, execution_mode: backendMode });
    console.log(`Modo alterado para: ${mode}, valor backend: ${backendMode}`);
  };

  // Salvar configurações
  const handleSave = () => {
    playClick();
    saveMutation.mutate(config);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Servidor Local */}
        <Card className={`cursor-pointer transition-all ${
          config.execution_mode === 'local' 
            ? 'border-2 border-primary ring-2 ring-primary/20' 
            : 'hover:border-primary/50'
        }`} onClick={() => changeMode('local')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5 text-blue-500" />
                Servidor Local
              </CardTitle>
              {config.execution_mode === 'local' && (
                <Badge className="bg-green-500">Ativo</Badge>
              )}
            </div>
            <CardDescription>
              Conectar ao servidor Mistral executando localmente na porta 8000
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ideal para desenvolvimento e teste</li>
                  <li>Endereço padrão: http://127.0.0.1:8000</li>
                  <li>Implementação FastAPI</li>
                  <li>Não requer conexão com internet</li>
                </ul>
              </div>

              {testResults.local.tested && (
                <Alert className={`mt-2 ${testResults.local.success ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                  <div className="flex items-center">
                    {testResults.local.success ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <AlertTitle>
                      {testResults.local.success ? 'Conexão estabelecida!' : 'Falha na conexão'}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="ml-6">
                    {testResults.local.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => testConnection('local')}
                disabled={testing}
                className="w-full"
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
          </CardContent>
        </Card>

        {/* Servidor Nuvem (Azure VM) */}
        <Card className={`cursor-pointer transition-all ${
          config.execution_mode === 'cloud' 
            ? 'border-2 border-primary ring-2 ring-primary/20' 
            : 'hover:border-primary/50'
        }`} onClick={() => changeMode('azure')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Cloud className="mr-2 h-5 w-5 text-indigo-500" />
                Servidor Nuvem (Azure VM)
              </CardTitle>
              {config.execution_mode === 'cloud' && (
                <Badge className="bg-green-500">Ativo</Badge>
              )}
            </div>
            <CardDescription>
              Conectar ao servidor Mistral executando na Azure VM na porta 3000
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Recomendado para produção</li>
                  <li>Máquina virtual dedicada na Azure</li>
                  <li>Melhor desempenho e disponibilidade</li>
                  <li>Suporte a Cloudflare Tunnel para acesso seguro</li>
                </ul>
              </div>

              {testResults.cloud.tested && (
                <Alert className={`mt-2 ${testResults.cloud.success ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                  <div className="flex items-center">
                    {testResults.cloud.success ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <AlertTitle>
                      {testResults.cloud.success ? 'Conexão estabelecida!' : 'Falha na conexão'}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="ml-6">
                    {testResults.cloud.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => testConnection('azure')}
                disabled={testing}
                className="w-full"
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
          </CardContent>
        </Card>
      </div>

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
                <p className="text-sm text-muted-foreground">https://servidor-azure-vm.com:3000</p>
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