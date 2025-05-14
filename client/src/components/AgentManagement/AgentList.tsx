import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Brain, TerminalSquare, Settings, Trash2, PlayCircle } from 'lucide-react';
import GlassMorphism from '../GlassMorphism';

interface Agent {
  id: number;
  name: string;
  type: string;
  description: string | null;
  status: string | null;
  configuration: any;
  last_execution: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Componente para exibir a lista de agentes
export function AgentList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [objective, setObjective] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os agentes
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    retry: 1
  });

  // Criar um novo agente
  const createAgentMutation = useMutation({
    mutationFn: (newAgent: {
      name: string;
      type: string;
      description: string;
      configuration: any;
    }) => {
      return apiRequest('/api/agents', {
        method: 'POST',
        data: newAgent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setCreateDialogOpen(false);
      toast({
        title: 'Agente criado',
        description: 'O agente foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar agente',
        description: error.message || 'Ocorreu um erro ao criar o agente.',
        variant: 'destructive',
      });
    }
  });

  // Excluir um agente
  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: number) => {
      return apiRequest(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: 'Agente excluído',
        description: 'O agente foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir agente',
        description: error.message || 'Ocorreu um erro ao excluir o agente.',
        variant: 'destructive',
      });
    }
  });

  // Executar uma tarefa com o agente
  const executeAgentMutation = useMutation({
    mutationFn: (data: { agentId: number; objective: string }) => {
      return apiRequest(`/api/agents/${data.agentId}/execute`, {
        method: 'POST',
        data: { objective: data.objective }
      });
    },
    onSuccess: (data) => {
      setExecuteDialogOpen(false);
      setObjective('');
      toast({
        title: 'Tarefa iniciada',
        description: `O agente está processando sua solicitação. ID da execução: ${data.execution_id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao executar tarefa',
        description: error.message || 'Ocorreu um erro ao executar a tarefa.',
        variant: 'destructive',
      });
    }
  });

  // Função para lidar com o envio do formulário de criação de agente
  const handleCreateAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const systemPrompt = formData.get('systemPrompt') as string;
    const model = formData.get('model') as string;
    
    if (!name || !type) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e tipo são campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    
    const configuration: any = {
      system_prompt: systemPrompt || 'Você é um assistente útil e eficiente.',
      tools_enabled: true,
      memory_enabled: true
    };
    
    if (model) {
      configuration.model = model;
    }
    
    if (type === 'openai') {
      configuration.model = model || 'gpt-3.5-turbo';
    } else if (type === 'mistral') {
      configuration.model = model || 'mistral-medium';
    }
    
    createAgentMutation.mutate({
      name,
      type,
      description,
      configuration
    });
  };

  // Função para lidar com a execução de uma tarefa
  const handleExecuteTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      toast({
        title: 'Erro',
        description: 'Nenhum agente selecionado.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!objective) {
      toast({
        title: 'Objetivo obrigatório',
        description: 'Por favor, insira um objetivo para a tarefa.',
        variant: 'destructive',
      });
      return;
    }
    
    executeAgentMutation.mutate({
      agentId: selectedAgent.id,
      objective
    });
  };

  const getAgentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openai':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'mistral':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  const getAgentStatusColor = (status: string | null) => {
    if (!status) return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'inactive':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Agentes</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-700 hover:bg-purple-800">
              <Brain className="mr-2 h-4 w-4" />
              Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Agente</DialogTitle>
              <DialogDescription>
                Configure os detalhes do seu agente inteligente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAgent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Assistente de Pesquisa"
                    className="col-span-3 bg-slate-800 border-slate-700"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select name="type" defaultValue="openai">
                    <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Modelo
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="gpt-3.5-turbo"
                    className="col-span-3 bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descreva o propósito deste agente"
                    className="col-span-3 bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="systemPrompt" className="text-right">
                    Prompt Base
                  </Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    placeholder="Você é um assistente útil e eficiente."
                    className="col-span-3 bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending ? 'Criando...' : 'Criar Agente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : !agents || agents.length === 0 ? (
        <GlassMorphism className="p-12 text-center">
          <p className="text-xl text-slate-400">Nenhum agente encontrado</p>
          <p className="text-slate-500 mt-2">Crie seu primeiro agente clicando no botão acima.</p>
        </GlassMorphism>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <GlassMorphism key={agent.id} className="h-full">
              <Card className="h-full border-0 bg-transparent text-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge className={`${getAgentTypeColor(agent.type)} font-normal`}>
                        {agent.type}
                      </Badge>
                      <Badge className={`${getAgentStatusColor(agent.status)} font-normal`}>
                        {agent.status || 'inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-slate-400">
                    {agent.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-400">
                    <div className="flex items-center mb-1">
                      <TerminalSquare className="h-4 w-4 mr-2 text-slate-500" />
                      <span>Modelo: {agent.configuration?.model || 'Padrão'}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Última execução: {agent.last_execution ? new Date(agent.last_execution).toLocaleString() : 'Nunca executado'}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir o agente "${agent.name}"?`)) {
                        deleteAgentMutation.mutate(agent.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setExecuteDialogOpen(true);
                      }}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Executar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </GlassMorphism>
          ))}
        </div>
      )}

      {/* Diálogo para executar um agente */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Executar {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              Informe o objetivo para o agente processar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExecuteTask}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="objective" className="text-right">
                  Objetivo
                </Label>
                <Textarea
                  id="objective"
                  name="objective"
                  placeholder="O que você gostaria que o agente fizesse?"
                  className="col-span-3 bg-slate-800 border-slate-700"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={executeAgentMutation.isPending}>
                {executeAgentMutation.isPending ? 'Processando...' : 'Executar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}