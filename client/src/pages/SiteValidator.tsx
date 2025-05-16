import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckIcon, AlertTriangleIcon, XCircleIcon, 
  RefreshCwIcon, InfoIcon, ServerIcon, KeyIcon,
  UploadIcon, LockIcon, BrainIcon, SettingsIcon, SparklesIcon
} from 'lucide-react';

// Tipo de teste
interface TestResult {
  name: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'loading' | 'pending';
  message?: string;
}

export default function SiteValidator() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { 
      name: 'Database Connection', 
      description: 'Testa a conexão com o banco de dados PostgreSQL', 
      status: 'pending' 
    },
    { 
      name: 'Mistral Service', 
      description: 'Verifica o serviço Mistral AI e API Keys', 
      status: 'pending' 
    },
    { 
      name: 'Upload Functionality', 
      description: 'Valida o funcionamento do sistema de upload', 
      status: 'pending' 
    },
    { 
      name: 'Authentication', 
      description: 'Testa o sistema de autenticação', 
      status: 'pending' 
    },
    { 
      name: 'Mistral Integration', 
      description: 'Verifica a integração completa com o Mistral', 
      status: 'pending' 
    },
    { 
      name: 'System Configuration', 
      description: 'Valida as configurações do sistema', 
      status: 'pending' 
    },
    { 
      name: 'Advanced AI Features', 
      description: 'Testa recursos avançados de IA', 
      status: 'pending' 
    }
  ]);
  
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckIcon className="mr-1 h-3 w-3" /> Sucesso</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600"><AlertTriangleIcon className="mr-1 h-3 w-3" /> Alerta</Badge>;
      case 'error':
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircleIcon className="mr-1 h-3 w-3" /> Erro</Badge>;
      case 'loading':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" /> Testando</Badge>;
      default:
        return <Badge className="bg-slate-500 hover:bg-slate-600">Pendente</Badge>;
    }
  };

  const getIconForTest = (index: number) => {
    const icons = [
      <ServerIcon className="h-6 w-6 text-blue-400" />,
      <KeyIcon className="h-6 w-6 text-purple-400" />,
      <UploadIcon className="h-6 w-6 text-green-400" />,
      <LockIcon className="h-6 w-6 text-amber-400" />,
      <BrainIcon className="h-6 w-6 text-pink-400" />,
      <SettingsIcon className="h-6 w-6 text-cyan-400" />,
      <SparklesIcon className="h-6 w-6 text-indigo-400" />
    ];
    return icons[index] || <InfoIcon className="h-6 w-6 text-gray-400" />;
  };

  // Função simplificada para testar sistema
  async function runTest(index: number) {
    if (running) return;
    
    try {
      const endpoints = [
        '/api/system/test-database',
        '/api/system/test-mistral',
        '/api/system/test-upload',
        '/api/system/test-auth',
        '/api/system/test-mistral-integration',
        '/api/system/test-config',
        '/api/system/test-advanced-ai'
      ];
      
      // Atualiza o teste para mostrar que está carregando
      updateTestResult(index, { status: 'loading' });
      
      // Tenta fazer a requisição para o endpoint correspondente
      try {
        const response = await axios.get(endpoints[index]);
        
        if (response.data.success) {
          updateTestResult(index, { 
            status: 'success', 
            message: response.data.message || 'Teste concluído com sucesso!' 
          });
        } else if (response.data.partial) {
          updateTestResult(index, { 
            status: 'warning', 
            message: response.data.message || 'Teste concluído com alertas.' 
          });
        } else {
          updateTestResult(index, { 
            status: 'error', 
            message: response.data.message || 'Teste falhou.' 
          });
        }
      } catch (error: any) {
        updateTestResult(index, { 
          status: 'error', 
          message: error.message || 'Erro ao executar teste' 
        });
      }
    } catch (error) {
      console.error("Erro ao executar teste:", error);
    }
  }
  
  // Run all tests in sequence
  async function runAllTests() {
    if (running) return;
    
    setRunning(true);
    setProgress(0);
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined })));
    
    // Run tests sequentially with small delay
    for (let i = 0; i < testResults.length; i++) {
      await runTest(i);
      setProgress(Math.round(((i + 1) / testResults.length) * 100));
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setRunning(false);
  }

  // Helper
  const updateTestResult = (index: number, updatedResult: Partial<TestResult>) => {
    setTestResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...updatedResult };
      return newResults;
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron mb-4 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-600 text-transparent bg-clip-text">
          Validador de Sistema
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Esta ferramenta valida todos os componentes e funcionalidades do sistema,
          garantindo que tudo esteja funcionando corretamente.
        </p>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-center space-x-4 mb-6">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={runAllTests}
            disabled={running}
          >
            {running ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Executando Testes...
              </>
            ) : (
              'Executar Todos os Testes'
            )}
          </Button>
        </div>
        
        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex justify-center text-sm text-muted-foreground">
          <span>{progress}% completo</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {testResults.map((test, index) => (
          <Card key={index} className="border hover:border-primary/50 transition-all">
            <CardHeader className="pb-2 flex items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center">
                  <div className="mr-2">{getIconForTest(index)}</div>
                  <div>{test.name}</div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{test.description}</p>
              </div>
              <div>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              {test.message && (
                <p className="text-sm mb-4">{test.message}</p>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => runTest(index)}
                disabled={running || test.status === 'loading'}
                className="mt-2"
              >
                {test.status === 'loading' ? (
                  <>
                    <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Alert className="max-w-3xl mx-auto">
        <InfoIcon className="h-5 w-5" />
        <AlertTitle>Recursos de validação avançada</AlertTitle>
        <AlertDescription>
          Para detalhes mais completos sobre cada teste, acesse a página de diagnóstico do sistema 
          ou execute os testes individuais para análise detalhada dos resultados.
        </AlertDescription>
      </Alert>
    </div>
  );
}