import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import axios from 'axios';

// Agente ID específico que será treinado
const MISTRAL_AGENT_ID = "ag:48009b45:20250515:programador-agente:d9bb1918";

export default function MistralAgentConfig() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    agent_id: MISTRAL_AGENT_ID,
    base_prompt: '',
    memory_enabled: true,
    use_tools: true,
    max_tokens: 2000,
    temperature: 0.7,
    save_responses: true
  });
  
  const { toast } = useToast();
  const { playClick, playSuccess, playError } = useSoundEffect();

  // Carregar configuração existente, se houver
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/mistral/agent-config');
      if (response.data) {
        // Manter o ID do agente fixo, mesmo se alguma configuração for carregada
        setConfig({
          ...response.data,
          agent_id: MISTRAL_AGENT_ID
        });
      }
    } catch (error) {
      console.log('Nenhuma configuração prévia encontrada ou erro:', error);
      // Deixa a configuração padrão
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setConfig(prev => ({ ...prev, [name]: checked }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playClick();
    
    try {
      await axios.post('/api/mistral/agent-config', config);
      
      setSaved(true);
      playSuccess();
      toast({
        title: 'Configuração salva',
        description: 'As configurações do agente Mistral foram atualizadas com sucesso',
      });
      
      // Reset saved status after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      playError();
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível salvar a configuração',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-gray-800 bg-black/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Configuração do Agente Mistral
          <Badge variant="outline" className="bg-blue-600 hover:bg-blue-700 ml-2">
            ID: {MISTRAL_AGENT_ID}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure o comportamento do agente Mistral que será treinado para suas necessidades específicas
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_prompt">Prompt Base (Personalidade)</Label>
            <Textarea
              id="base_prompt"
              name="base_prompt"
              placeholder="Você é um assistente especializado que ajuda com programação e desenvolvimento..."
              className="min-h-[120px]"
              value={config.base_prompt}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500">
              Instruções iniciais para definir como o agente deve se comportar e qual seu papel.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="memory_enabled" className="block">Memória Persistente</Label>
              <p className="text-xs text-gray-500">
                Permite que o agente se lembre de conversas anteriores
              </p>
            </div>
            <Switch 
              id="memory_enabled"
              checked={config.memory_enabled}
              onCheckedChange={(checked) => handleSwitchChange('memory_enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use_tools" className="block">Usar Ferramentas</Label>
              <p className="text-xs text-gray-500">
                Permite que o agente use ferramentas como busca na web, análise de código, etc.
              </p>
            </div>
            <Switch 
              id="use_tools"
              checked={config.use_tools}
              onCheckedChange={(checked) => handleSwitchChange('use_tools', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura: {config.temperature}</Label>
            <Input
              id="temperature"
              name="temperature"
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.temperature}
              onChange={handleChange}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mais preciso e determinístico</span>
              <span>Mais criativo e variado</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_tokens">Limite de Tokens: {config.max_tokens}</Label>
            <Input
              id="max_tokens"
              name="max_tokens"
              type="number"
              min="100"
              max="4000"
              step="100"
              value={config.max_tokens}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500">
              Controla o tamanho máximo das respostas geradas pelo agente
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="save_responses" className="block">Salvar Respostas para Treinamento</Label>
              <p className="text-xs text-gray-500">
                Salva interações para melhorar o modelo com o tempo
              </p>
            </div>
            <Switch 
              id="save_responses"
              checked={config.save_responses}
              onCheckedChange={(checked) => handleSwitchChange('save_responses', checked)}
            />
          </div>
          
          {saved && (
            <Alert className="bg-green-900/20 border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>
                Configurações salvas com sucesso.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar Configuração
        </Button>
      </CardFooter>
    </Card>
  );
}