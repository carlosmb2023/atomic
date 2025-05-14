import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, MessageSquare, Trash2, Settings, PlayCircle, StopCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import axios from 'axios';

interface Agent {
  id: number;
  name: string;
  description: string;
  provider: 'mistral' | 'openai';
  model: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  memory_enabled: boolean;
  tools_enabled: boolean;
}

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { toast } = useToast();
  const { playClick, playSuccess, playError } = useSoundEffect();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de agentes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (id: number, currentStatus: string) => {
    try {
      setActionLoading(id);
      playClick();
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(`/api/agents/${id}/status`, { status: newStatus });
      
      // Atualizar a lista
      setAgents(prev => 
        prev.map(agent => 
          agent.id === id ? { ...agent, status: newStatus as 'active' | 'inactive' | 'error' } : agent
        )
      );
      
      playSuccess();
      toast({
        title: 'Status atualizado',
        description: `Agente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      playError();
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do agente',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAgent = async (id: number) => {
    try {
      setActionLoading(id);
      playClick();
      
      await axios.delete(`/api/agents/${id}`);
      
      // Remover da lista
      setAgents(prev => prev.filter(agent => agent.id !== id));
      
      playSuccess();
      toast({
        title: 'Agente removido',
        description: 'O agente foi removido permanentemente',
      });
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      playError();
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o agente',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Helper para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper para obter a cor do badge do modelo
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'mistral':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'openai':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <Card className="w-full border border-gray-800 bg-black/40 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agentes Disponíveis</CardTitle>
        <Button 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          onClick={fetchAgents}
        >
          Atualizar Lista
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhum agente encontrado. Crie seu primeiro agente!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Provedor/Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.id} className="hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{agent.name}</span>
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {agent.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getProviderColor(agent.provider)} mb-1`}
                      >
                        {agent.provider === 'mistral' ? 'Mistral AI' : 'OpenAI'}
                      </Badge>
                      <div className="text-xs mt-1">{agent.model}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={agent.status === 'active' ? 'default' : agent.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {agent.status === 'active' ? 'Ativo' : agent.status === 'inactive' ? 'Inativo' : 'Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(agent.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={agent.memory_enabled ? 'bg-green-800/30' : 'bg-gray-800/30'}>
                          {agent.memory_enabled ? 'Memória' : 'Sem Memória'}
                        </Badge>
                        <Badge variant="outline" className={agent.tools_enabled ? 'bg-indigo-800/30' : 'bg-gray-800/30'}>
                          {agent.tools_enabled ? 'Ferramentas' : 'Sem Ferramentas'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => toggleAgentStatus(agent.id, agent.status)}
                          disabled={actionLoading === agent.id}
                        >
                          {actionLoading === agent.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : agent.status === 'active' ? (
                            <StopCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => toast({
                            title: 'Em desenvolvimento',
                            description: 'A função de configuração de agentes estará disponível em breve',
                          })}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => toast({
                            title: 'Em desenvolvimento',
                            description: 'A função de chat com agentes estará disponível em breve',
                          })}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={playClick}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background border border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o agente "{agent.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={playClick}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAgent(agent.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {actionLoading === agent.id ? (
                                  <Loader className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}