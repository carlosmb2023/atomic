import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Loader } from 'lucide-react';
import axios from 'axios';

export default function AgentIntegration() {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    model: 'mistral-small',
    provider: 'mistral',
    basePrompt: '',
    toolsEnabled: false,
    memoryEnabled: true,
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { playClick, playSuccess, playError } = useSoundEffect();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playClick();

    try {
      // Validação básica
      if (!formState.name.trim() || !formState.description.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome e descrição são obrigatórios',
          variant: 'destructive'
        });
        playError();
        return;
      }

      // Se o provider for mistral e não houver API Key configurada no sistema
      if (formState.provider === 'mistral' && !formState.apiKey) {
        // Verificar se há configuração global
        const configResponse = await axios.get('/api/config');
        const hasMistralKey = configResponse.data?.mistral_api_key;
        
        if (!hasMistralKey) {
          toast({
            title: 'Configuração necessária',
            description: 'É necessário fornecer uma chave de API para o Mistral ou configurá-la nas configurações globais.',
            variant: 'destructive'
          });
          playError();
          setLoading(false);
          return;
        }
      }

      // Criar o agente
      const response = await axios.post('/api/agents', {
        name: formState.name,
        description: formState.description,
        provider: formState.provider,
        model: formState.model,
        base_prompt: formState.basePrompt,
        tools_enabled: formState.toolsEnabled,
        memory_enabled: formState.memoryEnabled,
        api_key: formState.apiKey || null,
        config: {
          temperature: parseFloat(formState.temperature.toString()),
          max_tokens: parseInt(formState.maxTokens.toString()),
        }
      });

      playSuccess();
      toast({
        title: 'Agente criado',
        description: `O agente ${formState.name} foi criado com sucesso`,
      });

      // Resetar formulário
      setFormState({
        name: '',
        description: '',
        model: 'mistral-small',
        provider: 'mistral',
        basePrompt: '',
        toolsEnabled: false,
        memoryEnabled: true,
        apiKey: '',
        temperature: 0.7,
        maxTokens: 1000,
      });

    } catch (error: any) {
      console.error('Erro ao criar agente:', error);
      playError();
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível criar o agente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border border-gray-800 bg-black/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Criar Novo Agente</CardTitle>
        <CardDescription>
          Configure um novo agente para interagir com usuários e executar tarefas específicas
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="model">Modelo & Provedor</TabsTrigger>
              <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
            </TabsList>

            {/* Aba de Informações Básicas */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Agente</Label>
                <Input 
                  id="name" 
                  name="name"
                  placeholder="Assistente de Vendas" 
                  value={formState.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Descreva o propósito e função deste agente" 
                  value={formState.description}
                  onChange={handleChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrompt">Prompt Base</Label>
                <Textarea 
                  id="basePrompt" 
                  name="basePrompt"
                  placeholder="Instruções iniciais para o agente (opcional)" 
                  value={formState.basePrompt}
                  onChange={handleChange}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-gray-500">
                  O prompt base define a personalidade e comportamento do agente. 
                  Deixe em branco para usar o padrão do sistema.
                </p>
              </div>
            </TabsContent>

            {/* Aba de Modelo e Provedor */}
            <TabsContent value="model" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provedor de IA</Label>
                <Select 
                  value={formState.provider} 
                  onValueChange={(value) => handleSelectChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Provedores</SelectLabel>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Select 
                  value={formState.model} 
                  onValueChange={(value) => handleSelectChange('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {formState.provider === 'mistral' ? (
                      <SelectGroup>
                        <SelectLabel>Modelos Mistral</SelectLabel>
                        <SelectItem value="mistral-tiny">Mistral Tiny</SelectItem>
                        <SelectItem value="mistral-small">Mistral Small</SelectItem>
                        <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                      </SelectGroup>
                    ) : (
                      <SelectGroup>
                        <SelectLabel>Modelos OpenAI</SelectLabel>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave de API (opcional)</Label>
                <Input 
                  id="apiKey" 
                  name="apiKey"
                  type="password"
                  placeholder="Deixe em branco para usar a chave global" 
                  value={formState.apiKey}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500">
                  Se não fornecida, será usada a chave configurada nas Configurações Globais.
                </p>
              </div>
            </TabsContent>

            {/* Aba de Configurações Avançadas */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memoryEnabled" className="block">Memória Persistente</Label>
                  <p className="text-xs text-gray-500">
                    Permite que o agente se lembre de conversas anteriores
                  </p>
                </div>
                <Switch 
                  id="memoryEnabled"
                  checked={formState.memoryEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('memoryEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="toolsEnabled" className="block">Ferramentas Externas</Label>
                  <p className="text-xs text-gray-500">
                    Permite que o agente use ferramentas como busca na web, análise de dados, etc.
                  </p>
                </div>
                <Switch 
                  id="toolsEnabled"
                  checked={formState.toolsEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('toolsEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura: {formState.temperature}</Label>
                <Input 
                  id="temperature" 
                  name="temperature"
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.1" 
                  value={formState.temperature}
                  onChange={handleChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Limite de Tokens: {formState.maxTokens}</Label>
                <Input 
                  id="maxTokens" 
                  name="maxTokens"
                  type="number" 
                  min="100" 
                  max="8000" 
                  step="100" 
                  value={formState.maxTokens}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500">
                  Limita o tamanho máximo da resposta gerada
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={loading || !formState.name.trim() || !formState.description.trim()}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
          Criar Agente
        </Button>
      </CardFooter>
    </Card>
  );
}