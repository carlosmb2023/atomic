import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SystemConfig {
  id?: number;
  execution_mode: string;
}

export default function BasicSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({
    execution_mode: 'local'
  });

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
      console.log("Configuração carregada:", configData);
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
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error}`);
    }
  });

  // Salvar configurações
  const handleSave = () => {
    saveMutation.mutate(config);
  };

  // Mudar o modo de execução
  const handleModeChange = (value: string) => {
    setConfig({ ...config, execution_mode: value });
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
          Escolha entre o Servidor Local (porta 8000) ou o Servidor na Nuvem (Azure VM na porta 3000).
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Modo de Execução</CardTitle>
          <CardDescription>
            Selecione onde o sistema deverá buscar os dados e executar os modelos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={config.execution_mode}
            value={config.execution_mode}
            onValueChange={handleModeChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="flex-1 cursor-pointer">
                <div className="font-medium">Servidor Local</div>
                <div className="text-sm text-muted-foreground">
                  Endereço: http://127.0.0.1:8000
                </div>
              </Label>
              {config.execution_mode === 'local' && (
                <Badge className="ml-auto">Ativo</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="cloud" id="cloud" />
              <Label htmlFor="cloud" className="flex-1 cursor-pointer">
                <div className="font-medium">Servidor Azure VM</div>
                <div className="text-sm text-muted-foreground">
                  Endereço: https://[azure-ip]:3000
                </div>
              </Label>
              {config.execution_mode === 'cloud' && (
                <Badge className="ml-auto">Ativo</Badge>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
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