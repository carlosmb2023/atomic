import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function UltraSimpleConfig() {
  const [loading, setLoading] = useState(false);

  const setLocalServer = async () => {
    setLoading(true);
    try {
      await axios.patch('/api/system/config', {
        execution_mode: 'local'
      });
      toast.success('Configurado para usar o Servidor Local (porta 8000)');
    } catch (error) {
      console.error('Erro ao configurar servidor local:', error);
      toast.error('Erro ao configurar servidor');
    } finally {
      setLoading(false);
    }
  };

  const setCloudServer = async () => {
    setLoading(true);
    try {
      await axios.patch('/api/system/config', {
        execution_mode: 'cloud'
      });
      toast.success('Configurado para usar o Servidor Nuvem (Azure VM na porta 3000)');
    } catch (error) {
      console.error('Erro ao configurar servidor na nuvem:', error);
      toast.error('Erro ao configurar servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text font-orbitron">
          Configurações do Sistema
        </h1>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Selecione o Servidor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha entre o servidor Mistral local ou o servidor na nuvem (Azure VM):
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={setLocalServer}
                disabled={loading}
                className="w-full justify-start"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <span className="flex-1 text-left">Servidor Local (porta 8000)</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={setCloudServer}
                disabled={loading}
                className="w-full justify-start"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <span className="flex-1 text-left">Servidor Nuvem / Azure VM (porta 3000)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}