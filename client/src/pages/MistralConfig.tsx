import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, CloudIcon, ServerIcon, CheckIcon, AlertTriangleIcon, XIcon, RefreshCwIcon } from "lucide-react";
import { useSoundEffect } from "@/hooks/use-sound-effect";
import { toast } from "sonner";
import axios from 'axios';

export default function MistralConfig() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    execution_mode: 'api',
    mistral_local_url: 'http://127.0.0.1:8000',
    mistral_cloud_url: 'https://api.mistral.ai/v1',
    mistral_api_key: '',
    azure_vm_enabled: false,
    azure_vm_url: 'https://seu-servidor-azure.com',
    azure_vm_api_key: '',
    azure_vm_instance_id: '',
    azure_vm_region: 'eastus'
  });
  
  const [connectionStatus, setConnectionStatus] = useState({
    api: { status: 'unknown', message: 'Não testado' },
    local: { status: 'unknown', message: 'Não testado' },
    azure: { status: 'unknown', message: 'Não testado' }
  });
  
  const { playClick, playSuccess, playError } = useSoundEffect();

  // Carregar configuração atual
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const response = await axios.get('/api/system/config');
        if (response.data) {
          setConfig({
            execution_mode: response.data.execution_mode || 'api',
            mistral_local_url: response.data.mistral_local_url || 'http://127.0.0.1:8000',
            mistral_cloud_url: response.data.mistral_cloud_url || 'https://api.mistral.ai/v1',
            mistral_api_key: response.data.mistral_api_key ? '••••••••••••••••' : '',
            azure_vm_enabled: response.data.azure_vm_enabled || false,
            azure_vm_url: response.data.azure_vm_url || 'https://seu-servidor-azure.com',
            azure_vm_api_key: response.data.azure_vm_api_key ? '••••••••••••••••' : '',
            azure_vm_instance_id: response.data.azure_vm_instance_id || '',
            azure_vm_region: response.data.azure_vm_region || 'eastus'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        toast.error('Erro ao carregar configuração');
      } finally {
        setLoading(false);
      }
    }
    
    loadConfig();
  }, []);

  // Testar conexão com Mistral
  const testConnection = async (mode: 'api' | 'local' | 'azure') => {
    try {
      setTesting(true);
      playClick();
      
      // Atualizar status para 'testando'
      setConnectionStatus(prev => ({
        ...prev,
        [mode]: { status: 'testing', message: 'Testando conexão...' }
      }));
      
      // Chamar API para testar a conexão
      const response = await axios.post('/api/mistral/test-connection', { mode });
      
      if (response.data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [mode]: { status: 'success', message: response.data.message || 'Conexão bem sucedida!' }
        }));
        playSuccess();
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          [mode]: { status: 'error', message: response.data.message || 'Falha na conexão' }
        }));
        playError();
      }
    } catch (error) {
      console.error(`Erro ao testar conexão ${mode}:`, error);
      setConnectionStatus(prev => ({
        ...prev,
        [mode]: { status: 'error', message: error.message || 'Erro ao testar conexão' }
      }));
      playError();
    } finally {
      setTesting(false);
    }
  };

  // Salvar configuração
  const saveConfig = async () => {
    try {
      setLoading(true);
      playClick();
      
      // Preparar dados para envio
      const configToSave = {
        ...config,
        // Não enviar API keys se estiverem mascaradas
        mistral_api_key: config.mistral_api_key === '••••••••••••••••' ? undefined : config.mistral_api_key,
        azure_vm_api_key: config.azure_vm_api_key === '••••••••••••••••' ? undefined : config.azure_vm_api_key
      };
      
      // Enviar configuração para o servidor
      const response = await axios.patch('/api/system/config', configToSave);
      
      if (response.data) {
        toast.success('Configuração salva com sucesso!');
        playSuccess();
      } else {
        toast.error('Erro ao salvar configuração');
        playError();
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error(`Erro: ${error.message || 'Falha ao salvar configuração'}`);
      playError();
    } finally {
      setLoading(false);
    }
  };

  // Alternar entre modos de execução
  const handleModeChange = (mode) => {
    setConfig(prev => ({ ...prev, execution_mode: mode }));
  };

  // Renderizar badge de status
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckIcon className="mr-1 h-3 w-3" /> Conectado</Badge>;
      case 'error':
        return <Badge className="bg-red-500 hover:bg-red-600"><XIcon className="mr-1 h-3 w-3" /> Erro</Badge>;
      case 'testing':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" /> Testando</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600"><AlertTriangleIcon className="mr-1 h-3 w-3" /> Alerta</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600"><InfoIcon className="mr-1 h-3 w-3" /> Não testado</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text mb-8 font-orbitron">
        Configuração do Mistral AI
      </h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuração do Servidor</h2>
        <Card>
          <CardContent className="pt-6">
            <RadioGroup 
              value={config.execution_mode} 
              onValueChange={handleModeChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-secondary/20 transition-colors">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="flex items-center cursor-pointer">
                  <ServerIcon className="mr-2 h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="font-medium">Servidor Local</h3>
                    <p className="text-sm text-muted-foreground">Usar servidor Mistral rodando localmente na porta 8000</p>
                  </div>
                </Label>
                <div className="ml-auto">
                  {renderStatusBadge(connectionStatus.local.status)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-secondary/20 transition-colors">
                <RadioGroupItem value="azure" id="azure" />
                <Label htmlFor="azure" className="flex items-center cursor-pointer">
                  <CloudIcon className="mr-2 h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="font-medium">VM Azure</h3>
                    <p className="text-sm text-muted-foreground">Conectar ao Mistral hospedado em VM na Azure (porta 3000)</p>
                    <div className="flex items-center mt-1">
                      <Switch 
                        checked={config.azure_vm_enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({...prev, azure_vm_enabled: checked}))}
                        id="azure-enabled"
                      />
                      <Label htmlFor="azure-enabled" className="ml-2 text-xs">
                        {config.azure_vm_enabled ? 'Ativado' : 'Desativado'}
                      </Label>
                    </div>
                  </div>
                </Label>
                <div className="ml-auto">
                  {renderStatusBadge(connectionStatus.azure.status)}
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="mistral-api" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mistral-api">Configuração do Agente IA</TabsTrigger>
          <TabsTrigger value="local-server">Servidor Local (Porta 8000)</TabsTrigger>
          <TabsTrigger value="azure-vm">VM Azure (Porta 3000)</TabsTrigger>
        </TabsList>
        
        {/* Configuração da API Mistral */}
        <TabsContent value="mistral-api">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Agente IA Mistral</CardTitle>
              <CardDescription>
                Configure a API key do Mistral necessária para ativar o agente IA - esta configuração é independente do servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mistral-api-key">API Key do Mistral</Label>
                <Input 
                  id="mistral-api-key" 
                  type="password" 
                  value={config.mistral_api_key}
                  onChange={(e) => setConfig(prev => ({...prev, mistral_api_key: e.target.value}))}
                  placeholder="Digite sua API key do Mistral" 
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua API key em <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.mistral.ai</a>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mistral-cloud-url">URL da API</Label>
                <Input 
                  id="mistral-cloud-url" 
                  value={config.mistral_cloud_url}
                  onChange={(e) => setConfig(prev => ({...prev, mistral_cloud_url: e.target.value}))}
                  placeholder="https://api.mistral.ai/v1" 
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => testConnection('api')}
                disabled={testing}
                className="mt-2"
              >
                {testing ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              {connectionStatus.api.status !== 'unknown' && (
                <Alert className={`mt-4 ${
                  connectionStatus.api.status === 'success' 
                    ? 'bg-green-500/20 border-green-500' 
                    : connectionStatus.api.status === 'error'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-blue-500/20 border-blue-500'
                }`}>
                  <AlertTitle>
                    {connectionStatus.api.status === 'success' 
                      ? 'Conexão estabelecida!' 
                      : connectionStatus.api.status === 'error'
                      ? 'Erro na conexão'
                      : 'Testando...'}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus.api.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuração do Servidor Local */}
        <TabsContent value="local-server">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Servidor Local</CardTitle>
              <CardDescription>
                Configure as opções para conectar a um servidor Mistral rodando localmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mistral-local-url">URL do Servidor Local (Porta 8000)</Label>
                <Input 
                  id="mistral-local-url" 
                  value={config.mistral_local_url || "http://127.0.0.1:8000"}
                  onChange={(e) => setConfig(prev => ({...prev, mistral_local_url: e.target.value}))}
                  placeholder="http://127.0.0.1:8000" 
                />
                <p className="text-xs text-muted-foreground">
                  URL do servidor Mistral rodando localmente na porta 8000
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => testConnection('local')}
                disabled={testing}
                className="mt-2"
              >
                {testing ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              {connectionStatus.local.status !== 'unknown' && (
                <Alert className={`mt-4 ${
                  connectionStatus.local.status === 'success' 
                    ? 'bg-green-500/20 border-green-500' 
                    : connectionStatus.local.status === 'error'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-blue-500/20 border-blue-500'
                }`}>
                  <AlertTitle>
                    {connectionStatus.local.status === 'success' 
                      ? 'Conexão estabelecida!' 
                      : connectionStatus.local.status === 'error'
                      ? 'Erro na conexão'
                      : 'Testando...'}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus.local.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuração da VM Azure */}
        <TabsContent value="azure-vm">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da VM Azure</CardTitle>
              <CardDescription>
                Configure a conexão com a instância do Mistral rodando em VM na Azure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="azure-vm-enabled" className="font-medium">Ativar VM Azure</Label>
                <Switch 
                  id="azure-vm-enabled"
                  checked={config.azure_vm_enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({...prev, azure_vm_enabled: checked}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="azure-vm-url">URL da VM Azure (Porta 3000)</Label>
                <Input 
                  id="azure-vm-url" 
                  value={config.azure_vm_url || "https://seu-servidor-azure.com:3000"}
                  onChange={(e) => setConfig(prev => ({...prev, azure_vm_url: e.target.value}))}
                  placeholder="https://seu-servidor-azure.com:3000" 
                />
                <p className="text-xs text-muted-foreground">
                  URL completa da VM Azure onde está rodando o Mistral na porta 3000
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="azure-vm-api-key">API Key da VM Azure</Label>
                <Input 
                  id="azure-vm-api-key" 
                  type="password"
                  value={config.azure_vm_api_key}
                  onChange={(e) => setConfig(prev => ({...prev, azure_vm_api_key: e.target.value}))}
                  placeholder="Digite a API key da VM" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="azure-vm-instance-id">ID da Instância (opcional)</Label>
                <Input 
                  id="azure-vm-instance-id" 
                  value={config.azure_vm_instance_id}
                  onChange={(e) => setConfig(prev => ({...prev, azure_vm_instance_id: e.target.value}))}
                  placeholder="ID da instância na Azure" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="azure-vm-region">Região (opcional)</Label>
                <Select 
                  value={config.azure_vm_region} 
                  onValueChange={(value) => setConfig(prev => ({...prev, azure_vm_region: value}))}
                >
                  <SelectTrigger id="azure-vm-region">
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eastus">East US</SelectItem>
                    <SelectItem value="eastus2">East US 2</SelectItem>
                    <SelectItem value="westus">West US</SelectItem>
                    <SelectItem value="westus2">West US 2</SelectItem>
                    <SelectItem value="centralus">Central US</SelectItem>
                    <SelectItem value="brazilsouth">Brazil South</SelectItem>
                    <SelectItem value="northeurope">North Europe</SelectItem>
                    <SelectItem value="westeurope">West Europe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => testConnection('azure')}
                disabled={testing}
                className="mt-2"
              >
                {testing ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              {connectionStatus.azure.status !== 'unknown' && (
                <Alert className={`mt-4 ${
                  connectionStatus.azure.status === 'success' 
                    ? 'bg-green-500/20 border-green-500' 
                    : connectionStatus.azure.status === 'error'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-blue-500/20 border-blue-500'
                }`}>
                  <AlertTitle>
                    {connectionStatus.azure.status === 'success' 
                      ? 'Conexão estabelecida!' 
                      : connectionStatus.azure.status === 'error'
                      ? 'Erro na conexão'
                      : 'Testando...'}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus.azure.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Alert className="mb-8 bg-blue-500/10 border-blue-500">
        <InfoIcon className="h-5 w-5 text-blue-500" />
        <AlertTitle>Informação importante</AlertTitle>
        <AlertDescription>
          Ao alterar o modo de execução, você está definindo como o sistema se comunicará com o Mistral.
          Certifique-se de que as configurações estão corretas e teste a conexão antes de salvar.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={saveConfig} 
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {loading ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
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