import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  RefreshCw, 
  Server, 
  Cloud, 
  Key, 
  Globe, 
  Tool,
  Database, 
  Shield, 
  Settings2,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipo para a configuração do sistema
interface SystemConfig {
  id?: number;
  execution_mode: string;
  local_llm_url: string;
  cloud_llm_url: string;
  apify_actor_url: string;
  apify_api_key: string;
  base_prompt: string;
  logs_enabled: boolean;
  oracle_instance_ip: string;
  active_llm_url: string;
  mistral_local_url: string;
  mistral_cloud_url: string;
  mistral_instance_type: string;
  mistral_api_key: string;
  azure_vm_enabled: boolean;
  azure_vm_url: string;
  azure_vm_api_key: string;
  azure_vm_instance_id: string;
  azure_vm_region: string;
  cloudflare_tunnel_enabled: boolean;
  cloudflare_tunnel_id: string;
}

// Tipo para os status de conexão
interface ConnectionStatus {
  mistralApi: { status: string; message: string };
  mistralLocal: { status: string; message: string };
  mistralAzure: { status: string; message: string };
  cloudflare: { status: string; message: string };
  apify: { status: string; message: string };
}

// Componente principal
export default function SystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({
    execution_mode: 'api',
    local_llm_url: 'http://127.0.0.1:8000',
    cloud_llm_url: 'https://api.mistral.ai/v1',
    apify_actor_url: '',
    apify_api_key: '',
    base_prompt: '',
    logs_enabled: true,
    oracle_instance_ip: '',
    active_llm_url: '',
    mistral_local_url: 'http://127.0.0.1:8000',
    mistral_cloud_url: 'https://api.mistral.ai/v1',
    mistral_instance_type: 'api',
    mistral_api_key: '',
    azure_vm_enabled: false,
    azure_vm_url: 'https://seu-servidor-azure.com:3000',
    azure_vm_api_key: '',
    azure_vm_instance_id: '',
    azure_vm_region: 'eastus',
    cloudflare_tunnel_enabled: false,
    cloudflare_tunnel_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    mistralApi: { status: 'unknown', message: 'Não testado' },
    mistralLocal: { status: 'unknown', message: 'Não testado' },
    mistralAzure: { status: 'unknown', message: 'Não testado' },
    cloudflare: { status: 'unknown', message: 'Não testado' },
    apify: { status: 'unknown', message: 'Não testado' }
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
        ...configData,
        // Mascarar senhas/tokens
        mistral_api_key: configData.mistral_api_key ? '••••••••••••••••' : '',
        apify_api_key: configData.apify_api_key ? '••••••••••••••••' : '',
        azure_vm_api_key: configData.azure_vm_api_key ? '••••••••••••••••' : ''
      });
    }
  }, [configData]);

  // Mutation para salvar configuração
  const saveMutation = useMutation({
    mutationFn: async (updatedConfig: SystemConfig) => {
      // Não enviar senhas mascaradas
      const configToSave = {
        ...updatedConfig,
        mistral_api_key: updatedConfig.mistral_api_key === '••••••••••••••••' ? undefined : updatedConfig.mistral_api_key,
        apify_api_key: updatedConfig.apify_api_key === '••••••••••••••••' ? undefined : updatedConfig.apify_api_key,
        azure_vm_api_key: updatedConfig.azure_vm_api_key === '••••••••••••••••' ? undefined : updatedConfig.azure_vm_api_key,
      };
      
      const response = await axios.patch('/api/system/config', configToSave);
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

  // Salvar configurações
  const handleSave = () => {
    playClick();
    saveMutation.mutate(config);
  };

  // Testar conexão com um serviço
  const testConnection = async (service: 'mistralApi' | 'mistralLocal' | 'mistralAzure' | 'cloudflare' | 'apify') => {
    try {
      setTesting(true);
      playClick();
      
      // Atualizar status para 'testando'
      setConnectionStatus(prev => ({
        ...prev,
        [service]: { status: 'testing', message: 'Testando conexão...' }
      }));
      
      let endpoint = '';
      let payload = {};
      
      // Configurar endpoint e payload baseados no serviço
      switch (service) {
        case 'mistralApi':
          endpoint = '/api/mistral/test-connection';
          payload = { mode: 'api' };
          break;
        case 'mistralLocal':
          endpoint = '/api/mistral/test-connection';
          payload = { mode: 'local' };
          break;
        case 'mistralAzure':
          endpoint = '/api/mistral/test-connection';
          payload = { mode: 'azure' };
          break;
        case 'cloudflare':
          endpoint = '/api/system/test-cloudflare';
          payload = { tunnelId: config.cloudflare_tunnel_id };
          break;
        case 'apify':
          endpoint = '/api/system/test-apify';
          payload = { actorUrl: config.apify_actor_url, apiKey: config.apify_api_key };
          break;
      }
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [service]: { status: 'success', message: response.data.message || 'Conexão estabelecida com sucesso!' }
        }));
        playSuccess();
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          [service]: { status: 'error', message: response.data.message || 'Falha ao estabelecer conexão' }
        }));
        playError();
      }
    } catch (error: any) {
      setConnectionStatus(prev => ({
        ...prev,
        [service]: { status: 'error', message: error.message || 'Erro ao testar conexão' }
      }));
      playError();
    } finally {
      setTesting(false);
    }
  };

  // Renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">Conectado</Badge>;
      case 'error':
        return <Badge className="bg-red-500 hover:bg-red-600">Erro</Badge>;
      case 'testing':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Testando</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Alerta</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Não testado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />
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
          Gerencie todas as configurações do sistema em um único lugar - servidores, APIs, conexões e muito mais.
        </p>
      </div>

      <Tabs defaultValue="mistral" className="mb-8">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="mistral">
            <Key className="mr-2 h-4 w-4" />
            Mistral AI
          </TabsTrigger>
          <TabsTrigger value="servers">
            <Server className="mr-2 h-4 w-4" />
            Servidores
          </TabsTrigger>
          <TabsTrigger value="cloudflare">
            <Globe className="mr-2 h-4 w-4" />
            Cloudflare
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="mr-2 h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings2 className="mr-2 h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Configuração da Mistral AI */}
        <TabsContent value="mistral">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Mistral */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Agente IA Mistral</CardTitle>
                  {renderStatusBadge(connectionStatus.mistralApi.status)}
                </div>
                <CardDescription>
                  Configure a API Key do Mistral necessária para ativar o Agente IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mistral-api-key">API Key do Mistral</Label>
                  <Input 
                    id="mistral-api-key" 
                    type="password"
                    value={config.mistral_api_key}
                    onChange={(e) => setConfig({...config, mistral_api_key: e.target.value})}
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
                    onChange={(e) => setConfig({...config, mistral_cloud_url: e.target.value})}
                    placeholder="https://api.mistral.ai/v1" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-id">ID do Agente Mistral</Label>
                  <Input 
                    id="agent-id" 
                    value="ag:48009b45:20250515:programador-agente:d9bb1918"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    ID do agente programador específico
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('mistralApi')}
                  disabled={testing}
                  className="mt-4"
                >
                  {testing && connectionStatus.mistralApi.status === 'testing' ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Conexão'
                  )}
                </Button>
                
                {connectionStatus.mistralApi.status !== 'unknown' && (
                  <Alert className={`mt-4 ${
                    connectionStatus.mistralApi.status === 'success' 
                      ? 'bg-green-500/20 border-green-500' 
                      : connectionStatus.mistralApi.status === 'error'
                      ? 'bg-red-500/20 border-red-500'
                      : 'bg-blue-500/20 border-blue-500'
                  }`}>
                    <AlertTitle>
                      {connectionStatus.mistralApi.status === 'success' 
                        ? 'Conexão estabelecida!' 
                        : connectionStatus.mistralApi.status === 'error'
                        ? 'Erro na conexão'
                        : 'Testando...'}
                    </AlertTitle>
                    <AlertDescription>
                      {connectionStatus.mistralApi.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Servidor Local */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Servidor Local</CardTitle>
                  {renderStatusBadge(connectionStatus.mistralLocal.status)}
                </div>
                <CardDescription>
                  Configure o servidor Mistral rodando localmente na porta 8000
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mistral-local-url">URL do Servidor Local (Porta 8000)</Label>
                  <Input 
                    id="mistral-local-url" 
                    value={config.mistral_local_url}
                    onChange={(e) => setConfig({...config, mistral_local_url: e.target.value})}
                    placeholder="http://127.0.0.1:8000" 
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="use-local-server"
                    checked={config.execution_mode === 'local'}
                    onCheckedChange={(checked) => 
                      setConfig({...config, execution_mode: checked ? 'local' : 'api'})
                    }
                  />
                  <Label htmlFor="use-local-server">Usar servidor local</Label>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('mistralLocal')}
                  disabled={testing}
                  className="mt-4"
                >
                  {testing && connectionStatus.mistralLocal.status === 'testing' ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Conexão'
                  )}
                </Button>
                
                {connectionStatus.mistralLocal.status !== 'unknown' && (
                  <Alert className={`mt-4 ${
                    connectionStatus.mistralLocal.status === 'success' 
                      ? 'bg-green-500/20 border-green-500' 
                      : connectionStatus.mistralLocal.status === 'error'
                      ? 'bg-red-500/20 border-red-500'
                      : 'bg-blue-500/20 border-blue-500'
                  }`}>
                    <AlertTitle>
                      {connectionStatus.mistralLocal.status === 'success' 
                        ? 'Conexão estabelecida!' 
                        : connectionStatus.mistralLocal.status === 'error'
                        ? 'Erro na conexão'
                        : 'Testando...'}
                    </AlertTitle>
                    <AlertDescription>
                      {connectionStatus.mistralLocal.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* VM Azure */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>VM Azure</CardTitle>
                  {renderStatusBadge(connectionStatus.mistralAzure.status)}
                </div>
                <CardDescription>
                  Configure a conexão com a VM Azure na porta 3000
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="azure-vm-enabled" className="font-medium">Ativar VM Azure</Label>
                  <Switch 
                    id="azure-vm-enabled"
                    checked={config.azure_vm_enabled}
                    onCheckedChange={(checked) => setConfig({...config, azure_vm_enabled: checked})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="azure-vm-url">URL da VM Azure (Porta 3000)</Label>
                  <Input 
                    id="azure-vm-url" 
                    value={config.azure_vm_url}
                    onChange={(e) => setConfig({...config, azure_vm_url: e.target.value})}
                    placeholder="https://seu-servidor-azure.com:3000" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="azure-vm-api-key">API Key da VM Azure (opcional)</Label>
                  <Input 
                    id="azure-vm-api-key" 
                    type="password"
                    value={config.azure_vm_api_key}
                    onChange={(e) => setConfig({...config, azure_vm_api_key: e.target.value})}
                    placeholder="Digite a API key da VM" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="azure-vm-region">Região da VM</Label>
                  <Select 
                    value={config.azure_vm_region} 
                    onValueChange={(value) => setConfig({...config, azure_vm_region: value})}
                  >
                    <SelectTrigger id="azure-vm-region">
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eastus">East US</SelectItem>
                      <SelectItem value="eastus2">East US 2</SelectItem>
                      <SelectItem value="westus">West US</SelectItem>
                      <SelectItem value="brazilsouth">Brazil South</SelectItem>
                      <SelectItem value="northeurope">North Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('mistralAzure')}
                  disabled={testing || !config.azure_vm_enabled}
                  className="mt-4"
                >
                  {testing && connectionStatus.mistralAzure.status === 'testing' ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Conexão'
                  )}
                </Button>
                
                {connectionStatus.mistralAzure.status !== 'unknown' && (
                  <Alert className={`mt-4 ${
                    connectionStatus.mistralAzure.status === 'success' 
                      ? 'bg-green-500/20 border-green-500' 
                      : connectionStatus.mistralAzure.status === 'error'
                      ? 'bg-red-500/20 border-red-500'
                      : 'bg-blue-500/20 border-blue-500'
                  }`}>
                    <AlertTitle>
                      {connectionStatus.mistralAzure.status === 'success' 
                        ? 'Conexão estabelecida!' 
                        : connectionStatus.mistralAzure.status === 'error'
                        ? 'Erro na conexão'
                        : 'Testando...'}
                    </AlertTitle>
                    <AlertDescription>
                      {connectionStatus.mistralAzure.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuração de Servidores */}
        <TabsContent value="servers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Servidores de IA</CardTitle>
                <CardDescription>
                  Configure opções avançadas dos servidores de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="active-llm-url">URL do LLM Ativo</Label>
                  <Input 
                    id="active-llm-url" 
                    value={config.active_llm_url}
                    onChange={(e) => setConfig({...config, active_llm_url: e.target.value})}
                    placeholder="URL do servidor LLM ativo" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="local-llm-url">URL do LLM Local</Label>
                  <Input 
                    id="local-llm-url" 
                    value={config.local_llm_url}
                    onChange={(e) => setConfig({...config, local_llm_url: e.target.value})}
                    placeholder="http://127.0.0.1:11434" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cloud-llm-url">URL do LLM na Nuvem</Label>
                  <Input 
                    id="cloud-llm-url" 
                    value={config.cloud_llm_url}
                    onChange={(e) => setConfig({...config, cloud_llm_url: e.target.value})}
                    placeholder="URL do LLM na nuvem" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="oracle-instance-ip">IP da Instância Oracle</Label>
                  <Input 
                    id="oracle-instance-ip" 
                    value={config.oracle_instance_ip}
                    onChange={(e) => setConfig({...config, oracle_instance_ip: e.target.value})}
                    placeholder="IP da instância Oracle" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento e Logs</CardTitle>
                <CardDescription>
                  Configure as opções de logging e monitoramento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="logs-enabled"
                    checked={config.logs_enabled}
                    onCheckedChange={(checked) => 
                      setConfig({...config, logs_enabled: checked})
                    }
                  />
                  <Label htmlFor="logs-enabled">Ativar Logs</Label>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Label htmlFor="base-prompt">Prompt Base para Interações</Label>
                  <Textarea 
                    id="base-prompt" 
                    value={config.base_prompt}
                    onChange={(e) => setConfig({...config, base_prompt: e.target.value})}
                    placeholder="Prompt base para todas as interações com IA" 
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuração do Cloudflare */}
        <TabsContent value="cloudflare">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Configuração do Cloudflare Tunnel</CardTitle>
                {renderStatusBadge(connectionStatus.cloudflare.status)}
              </div>
              <CardDescription>
                Configure as opções do Cloudflare Tunnel para acesso externo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="cloudflare-tunnel-enabled" className="font-medium">Ativar Cloudflare Tunnel</Label>
                <Switch 
                  id="cloudflare-tunnel-enabled"
                  checked={config.cloudflare_tunnel_enabled}
                  onCheckedChange={(checked) => setConfig({...config, cloudflare_tunnel_enabled: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cloudflare-tunnel-id">ID do Tunnel Cloudflare</Label>
                <Input 
                  id="cloudflare-tunnel-id" 
                  value={config.cloudflare_tunnel_id}
                  onChange={(e) => setConfig({...config, cloudflare_tunnel_id: e.target.value})}
                  placeholder="ID do seu tunnel Cloudflare" 
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha o ID do tunnel no painel do Cloudflare Zero Trust
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => testConnection('cloudflare')}
                disabled={testing || !config.cloudflare_tunnel_enabled}
                className="mt-4"
              >
                {testing && connectionStatus.cloudflare.status === 'testing' ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              {connectionStatus.cloudflare.status !== 'unknown' && (
                <Alert className={`mt-4 ${
                  connectionStatus.cloudflare.status === 'success' 
                    ? 'bg-green-500/20 border-green-500' 
                    : connectionStatus.cloudflare.status === 'error'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-blue-500/20 border-blue-500'
                }`}>
                  <AlertTitle>
                    {connectionStatus.cloudflare.status === 'success' 
                      ? 'Conexão estabelecida!' 
                      : connectionStatus.cloudflare.status === 'error'
                      ? 'Erro na conexão'
                      : 'Testando...'}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus.cloudflare.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="pt-4 space-y-2">
                <h3 className="text-lg font-medium">Como configurar o Cloudflare Tunnel</h3>
                <ol className="list-decimal ml-5 space-y-1 text-sm">
                  <li>Acesse o painel do Cloudflare Zero Trust</li>
                  <li>Crie um novo tunnel na seção "Access > Tunnels"</li>
                  <li>Copie o ID do tunnel e cole no campo acima</li>
                  <li>Configure um domínio público para acessar seu aplicativo</li>
                  <li>Instale e execute o cloudflared no seu servidor</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrações */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Integração com Apify</CardTitle>
                {renderStatusBadge(connectionStatus.apify.status)}
              </div>
              <CardDescription>
                Configure a integração com Apify para automação e scraping avançados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apify-api-key">API Key do Apify</Label>
                <Input 
                  id="apify-api-key" 
                  type="password"
                  value={config.apify_api_key}
                  onChange={(e) => setConfig({...config, apify_api_key: e.target.value})}
                  placeholder="Digite sua API key do Apify" 
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua API key no painel do Apify
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apify-actor-url">URL do Actor</Label>
                <Input 
                  id="apify-actor-url" 
                  value={config.apify_actor_url}
                  onChange={(e) => setConfig({...config, apify_actor_url: e.target.value})}
                  placeholder="URL do actor Apify" 
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => testConnection('apify')}
                disabled={testing || !config.apify_api_key}
                className="mt-4"
              >
                {testing && connectionStatus.apify.status === 'testing' ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              
              {connectionStatus.apify.status !== 'unknown' && (
                <Alert className={`mt-4 ${
                  connectionStatus.apify.status === 'success' 
                    ? 'bg-green-500/20 border-green-500' 
                    : connectionStatus.apify.status === 'error'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-blue-500/20 border-blue-500'
                }`}>
                  <AlertTitle>
                    {connectionStatus.apify.status === 'success' 
                      ? 'Conexão estabelecida!' 
                      : connectionStatus.apify.status === 'error'
                      ? 'Erro na conexão'
                      : 'Testando...'}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus.apify.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Avançadas */}
        <TabsContent value="advanced">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Opções avançadas para usuários experientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="execution-mode">Modo de Execução</Label>
                  <Select 
                    value={config.execution_mode} 
                    onValueChange={(value) => setConfig({...config, execution_mode: value})}
                  >
                    <SelectTrigger id="execution-mode">
                      <SelectValue placeholder="Selecione o modo de execução" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API (Remoto)</SelectItem>
                      <SelectItem value="local">Servidor Local</SelectItem>
                      <SelectItem value="azure">VM Azure</SelectItem>
                      <SelectItem value="replit">Replit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mistral-instance-type">Tipo de Instância Mistral</Label>
                  <Select 
                    value={config.mistral_instance_type} 
                    onValueChange={(value) => setConfig({...config, mistral_instance_type: value})}
                  >
                    <SelectTrigger id="mistral-instance-type">
                      <SelectValue placeholder="Selecione o tipo de instância" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API (Padrão)</SelectItem>
                      <SelectItem value="oracle_arm">Oracle ARM</SelectItem>
                      <SelectItem value="azure_vm">Azure VM</SelectItem>
                      <SelectItem value="local">Servidor Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Alert className="mt-6 bg-amber-500/10 border-amber-500">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Alterações nestas configurações avançadas podem afetar o funcionamento do sistema.
                    Modifique apenas se souber o que está fazendo.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Exportar / Importar Configurações</CardTitle>
                <CardDescription>
                  Faça backup ou restaure todas as configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Exportar configurações para JSON
                      const configToExport = {...config};
                      
                      // Remover senhas/chaves
                      if (configToExport.mistral_api_key === '••••••••••••••••') {
                        configToExport.mistral_api_key = '';
                      }
                      if (configToExport.apify_api_key === '••••••••••••••••') {
                        configToExport.apify_api_key = '';
                      }
                      if (configToExport.azure_vm_api_key === '••••••••••••••••') {
                        configToExport.azure_vm_api_key = '';
                      }
                      
                      // Criar blob e link de download
                      const jsonStr = JSON.stringify(configToExport, null, 2);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'system_config.json';
                      document.body.appendChild(a);
                      a.click();
                      
                      // Limpar
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast.success('Configurações exportadas com sucesso!');
                      playSuccess();
                    }}
                  >
                    Exportar Configurações
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Abrir input de arquivo
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'application/json';
                      
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const importedConfig = JSON.parse(event.target.result);
                            
                            // Manter senhas/chaves existentes se estiverem vazias no arquivo importado
                            if (!importedConfig.mistral_api_key && config.mistral_api_key) {
                              importedConfig.mistral_api_key = config.mistral_api_key;
                            }
                            if (!importedConfig.apify_api_key && config.apify_api_key) {
                              importedConfig.apify_api_key = config.apify_api_key;
                            }
                            if (!importedConfig.azure_vm_api_key && config.azure_vm_api_key) {
                              importedConfig.azure_vm_api_key = config.azure_vm_api_key;
                            }
                            
                            setConfig(importedConfig);
                            toast.success('Configurações importadas com sucesso!');
                            playSuccess();
                          } catch (error) {
                            toast.error('Erro ao importar configurações: Formato inválido');
                            playError();
                          }
                        };
                        reader.readAsText(file);
                      };
                      
                      input.click();
                    }}
                  >
                    Importar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            // Reset para valores iniciais
            refetch();
            toast.info('Alterações descartadas');
          }}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleSave}
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