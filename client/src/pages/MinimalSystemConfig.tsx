import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function MinimalSystemConfig() {
  const [mode, setMode] = useState('local');

  // Carregar configuração atual
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => {
      const response = await axios.get('/api/system/config');
      return response.data;
    }
  });
  
  // Atualizar o modo quando os dados forem carregados
  useEffect(() => {
    if (data && data.execution_mode) {
      setMode(data.execution_mode);
    }
  }, [data]);

  // Mutation para salvar configuração
  const saveMutation = useMutation({
    mutationFn: async (newMode: string) => {
      const response = await axios.patch('/api/system/config', {
        execution_mode: newMode
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configuração salva com sucesso!');
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração.');
    }
  });

  // Salvar configurações
  const handleSave = () => {
    saveMutation.mutate(mode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text font-orbitron">
          Configurações do Sistema
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Modo de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={mode}
                onValueChange={setMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Servidor Local (porta 8000)</SelectItem>
                  <SelectItem value="cloud">Servidor Nuvem/Azure VM (porta 3000)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-sm mt-2 p-2 border rounded-md bg-muted/50">
                {mode === 'local' ? (
                  <p>Conectando ao servidor Mistral local na porta 8000</p>
                ) : (
                  <p>Conectando à Azure VM na porta 3000</p>
                )}
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Configuração'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}