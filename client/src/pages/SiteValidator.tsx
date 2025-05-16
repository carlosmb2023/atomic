import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
  
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [progress, setProgress] = useState(0);

  // Usando o mock de efeitos sonoros para evitar problemas com áudio
  const { playSuccess, playError, playClick } = mockSoundEffect;

  const updateTestResult = (index: number, updatedResult: Partial<TestResult>) => {
    setTestResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...updatedResult };
      return newResults;
    });
  };
  
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
        return <Badge className="bg-slate-500 hover:bg-slate-600"><HelpCircleIcon className="mr-1 h-3 w-3" /> Pendente</Badge>;
    }
  };

  const getCompletedCount = () => {
    return testResults.filter(test => ['success', 'error', 'warning'].includes(test.status)).length;
  };

  const getSuccessCount = () => {
    return testResults.filter(test => test.status === 'success').length;
  };

  const getWarningCount = () => {
    return testResults.filter(test => test.status === 'warning').length;
  };

  const getErrorCount = () => {
    return testResults.filter(test => test.status === 'error').length;
  };

  // Test Functions
  async function testDatabaseConnection() {
    try {
      updateTestResult(0, { status: 'loading' });
      const response = await axios.get('/api/system/test-database');
      
      if (response.data.success) {
        updateTestResult(0, { 
          status: 'success', 
          message: 'Conexão com o banco de dados estabelecida com sucesso!',
          details: [
            { name: 'Teste de Conexão', status: 'success', message: 'Conectado ao banco de dados PostgreSQL' },
            { name: 'Versão', status: 'success', message: `PostgreSQL ${response.data.version || 'versão não detectada'}` },
            { name: 'Tempo de Resposta', status: 'success', message: `${response.data.responseTime || '?'}ms` }
          ]
        });
        playSuccess();
      } else {
        updateTestResult(0, { 
          status: 'error', 
          message: response.data.message || 'Falha ao conectar com o banco de dados',
          details: [
            { name: 'Erro de Conexão', status: 'error', message: response.data.error || 'Erro desconhecido' }
          ]
        });
        playError();
      }
    } catch (error: any) {
      updateTestResult(0, { 
        status: 'error', 
        message: 'Erro ao testar conexão com banco de dados',
        details: [
          { name: 'Erro de Conexão', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testMistralService() {
    try {
      updateTestResult(1, { status: 'loading' });
      const response = await axios.get('/api/system/test-mistral');
      
      if (response.data.success) {
        updateTestResult(1, { 
          status: 'success', 
          message: 'Serviço Mistral AI está funcionando corretamente!',
          details: [
            { name: 'API Key', status: 'success' as const, message: 'API Key válida encontrada' },
            { name: 'Status do Serviço', status: 'success' as const, message: 'Serviço online e respondendo' },
            { name: 'Modelos Disponíveis', status: 'success' as const, message: `${response.data.modelsCount || '?'} modelos disponíveis` }
          ]
        });
        playSuccess();
      } else {
        // Check if it's just a warning or a complete error
        const status = response.data.partial ? 'warning' : 'error';
        const details = [
          { name: 'Status do Serviço', status: status as 'warning' | 'error', message: response.data.message || 'Serviço não está respondendo corretamente' }
        ];
        
        if (response.data.apiKeyStatus === false) {
          details.push({ name: 'API Key', status: 'error' as const, message: 'API Key inválida ou não encontrada' });
        } else if (response.data.apiKeyStatus === true) {
          details.push({ name: 'API Key', status: 'success' as const, message: 'API Key válida encontrada' });
        }
        
        updateTestResult(1, { 
          status, 
          message: response.data.message || 'Serviço Mistral não está funcionando corretamente',
          details
        });
        status === 'error' ? playError() : playClick();
      }
    } catch (error: any) {
      updateTestResult(1, { 
        status: 'error', 
        message: 'Erro ao testar serviço Mistral',
        details: [
          { name: 'Erro de Conexão', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testUploadFunctionality() {
    try {
      updateTestResult(2, { status: 'loading' });
      const response = await axios.get('/api/system/test-upload');
      
      if (response.data.success) {
        updateTestResult(2, { 
          status: 'success', 
          message: 'Sistema de upload está funcionando corretamente!',
          details: [
            { name: 'Diretório de Upload', status: 'success', message: 'Diretório existe e tem permissões corretas' },
            { name: 'Limite de Tamanho', status: 'success', message: `Limite configurado: ${response.data.sizeLimit || '?'}` },
            { name: 'Formatos Aceitos', status: 'success', message: response.data.acceptedFormats || 'Todos os formatos' }
          ]
        });
        playSuccess();
      } else {
        updateTestResult(2, { 
          status: 'error', 
          message: response.data.message || 'Sistema de upload não está funcionando corretamente',
          details: [
            { name: 'Erro', status: 'error', message: response.data.error || 'Erro desconhecido' }
          ]
        });
        playError();
      }
    } catch (error: any) {
      updateTestResult(2, { 
        status: 'error', 
        message: 'Erro ao testar sistema de upload',
        details: [
          { name: 'Erro', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testAuthentication() {
    try {
      updateTestResult(3, { status: 'loading' });
      const response = await axios.get('/api/system/test-auth');
      
      if (response.data.success) {
        updateTestResult(3, { 
          status: 'success', 
          message: 'Sistema de autenticação está funcionando corretamente!',
          details: [
            { name: 'Login', status: 'success', message: 'Sistema de login operacional' },
            { name: 'Usuários', status: 'success', message: `${response.data.usersCount || '?'} usuários cadastrados` },
            { name: 'Segurança', status: 'success', message: response.data.securityLevel || 'Nível adequado' }
          ]
        });
        playSuccess();
      } else {
        updateTestResult(3, { 
          status: 'error', 
          message: response.data.message || 'Sistema de autenticação não está funcionando corretamente',
          details: [
            { name: 'Erro', status: 'error', message: response.data.error || 'Erro desconhecido' }
          ]
        });
        playError();
      }
    } catch (error: any) {
      updateTestResult(3, { 
        status: 'error', 
        message: 'Erro ao testar sistema de autenticação',
        details: [
          { name: 'Erro', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testMistralIntegration() {
    try {
      updateTestResult(4, { status: 'loading' });
      const response = await axios.get('/api/system/test-mistral-integration');
      
      if (response.data.success) {
        updateTestResult(4, { 
          status: 'success', 
          message: 'Integração com o Mistral está funcionando corretamente!',
          details: [
            { name: 'Agente Específico', status: 'success', message: response.data.agentAvailable ? 'Agente ID encontrado e disponível' : 'Agente genérico disponível' },
            { name: 'Integração', status: 'success', message: 'Integração completa e funcional' },
            { name: 'Histórico', status: 'success', message: `${response.data.historyAvailable ? 'Histórico de conversas disponível' : 'Sem histórico disponível'}` }
          ]
        });
        playSuccess();
      } else {
        // Check if it's a warning or error
        const status = response.data.partial ? 'warning' : 'error';
        const details = [
          { name: 'Integração', status: status as 'warning' | 'error', message: response.data.message || 'Integração não está funcionando corretamente' }
        ];
        
        if (response.data.agentAvailable === false) {
          details.push({ name: 'Agente Específico', status: 'error' as const, message: 'Agente ID não encontrado' });
        } else if (response.data.agentAvailable === true) {
          details.push({ name: 'Agente Específico', status: 'success' as const, message: 'Agente ID encontrado' });
        }
        
        updateTestResult(4, { 
          status, 
          message: response.data.message || 'Integração com o Mistral não está funcionando corretamente',
          details
        });
        status === 'error' ? playError() : playClick();
      }
    } catch (error: any) {
      updateTestResult(4, { 
        status: 'error', 
        message: 'Erro ao testar integração com o Mistral',
        details: [
          { name: 'Erro', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testSystemConfiguration() {
    try {
      updateTestResult(5, { status: 'loading' });
      const response = await axios.get('/api/system/test-config');
      
      if (response.data.success) {
        updateTestResult(5, { 
          status: 'success', 
          message: 'Configurações do sistema estão corretas!',
          details: [
            { name: 'Configurações', status: 'success', message: 'Todas as configurações necessárias encontradas' },
            { name: 'Ambiente', status: 'success', message: `Ambiente: ${response.data.environment || 'Produção'}` },
            { name: 'Persistência', status: 'success', message: 'Sistema de persistência funcionando' }
          ]
        });
        playSuccess();
      } else {
        // Check if it's just a warning or a complete error
        const status = response.data.partial ? 'warning' : 'error';
        const details = [];
        
        if (response.data.configStatus === false) {
          details.push({ name: 'Configurações', status: 'error', message: 'Configurações incompletas ou incorretas' });
        } else {
          details.push({ name: 'Configurações', status: 'success', message: 'Configurações encontradas' });
        }
        
        if (response.data.persistenceStatus === false) {
          details.push({ name: 'Persistência', status: 'error', message: 'Sistema de persistência não está funcionando' });
        } else {
          details.push({ name: 'Persistência', status: 'success', message: 'Sistema de persistência funcionando' });
        }
        
        updateTestResult(5, { 
          status, 
          message: response.data.message || 'Algumas configurações do sistema não estão corretas',
          details
        });
        status === 'error' ? playError() : playClick();
      }
    } catch (error: any) {
      updateTestResult(5, { 
        status: 'error', 
        message: 'Erro ao testar configurações do sistema',
        details: [
          { name: 'Erro', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }

  async function testAdvancedAIFeatures() {
    try {
      updateTestResult(6, { status: 'loading' });
      const response = await axios.get('/api/system/test-advanced-ai');
      
      if (response.data.success) {
        updateTestResult(6, { 
          status: 'success', 
          message: 'Recursos avançados de IA estão funcionando corretamente!',
          details: [
            { name: 'Processamento Híbrido', status: 'success', message: response.data.hybridProcessing ? 'Disponível e configurado' : 'Não configurado' },
            { name: 'Fine-tuning', status: 'success', message: response.data.finetuning ? 'Disponível e configurado' : 'Não configurado' },
            { name: 'Cache Contextual', status: 'success', message: response.data.contextCache ? 'Disponível e configurado' : 'Não configurado' }
          ]
        });
        playSuccess();
      } else {
        // Check if it's a warning or error
        const status = response.data.partial ? 'warning' : 'error';
        const details = [];
        
        // Add feature details based on response
        ["hybridProcessing", "finetuning", "contextCache"].forEach((feature, index) => {
          const featureName = ["Processamento Híbrido", "Fine-tuning", "Cache Contextual"][index];
          if (response.data[feature] === true) {
            details.push({ name: featureName, status: 'success' as const, message: 'Disponível e configurado' });
          } else if (response.data[feature] === false) {
            details.push({ name: featureName, status: 'warning' as const, message: 'Não configurado' });
          } else {
            details.push({ name: featureName, status: 'error' as const, message: 'Indisponível ou com erro' });
          }
        });
        
        updateTestResult(6, { 
          status, 
          message: response.data.message || 'Alguns recursos avançados de IA não estão disponíveis',
          details
        });
        status === 'error' ? playError() : playClick();
      }
    } catch (error: any) {
      updateTestResult(6, { 
        status: 'error', 
        message: 'Erro ao testar recursos avançados de IA',
        details: [
          { name: 'Erro', status: 'error', message: error.message || 'Erro desconhecido' }
        ]
      });
      playError();
    }
  }
  
  // Function to run all tests sequentially
  function runAllTests() {
    playClick();
    setRunningAll(true);
    setProgress(0);
    
    const tests = [
      testDatabaseConnection,
      testMistralService,
      testUploadFunctionality,
      testAuthentication,
      testMistralIntegration,
      testSystemConfiguration,
      testAdvancedAIFeatures
    ];
    
    // Versão simplificada para evitar problemas de bloqueio
    let counter = 0;
    
    // Executa o primeiro teste e configura uma cadeia de promessas
    const runNextTest = () => {
      if (counter < tests.length) {
        const currentIndex = counter;
        counter++;
        
        // Usa setTimeout para evitar bloqueio do thread principal
        setTimeout(() => {
          tests[currentIndex]()
            .then(() => {
              setProgress(Math.round((counter / tests.length) * 100));
              runNextTest();
            })
            .catch(err => {
              console.error("Erro ao executar teste:", err);
              runNextTest();
            });
        }, 100);
      } else {
        setAllTestsCompleted(true);
        setRunningAll(false);
      }
    };
    
    // Inicia a execução dos testes
    runNextTest();
  }
  
  // Update progress bar when individual test completes
  useEffect(() => {
    if (!runningAll) {
      const completed = getCompletedCount();
      const total = testResults.length;
      setProgress(Math.round((completed / total) * 100));
      
      if (completed === total) {
        setAllTestsCompleted(true);
      }
    }
  }, [testResults, runningAll]);

  return (
    <div className="container mx-auto px-4 py-20 sm:py-28 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron mb-4 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-600 text-transparent bg-clip-text">
          Validador de Sistema
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Esta ferramenta valida todos os componentes e funcionalidades do sistema,
          garantindo que tudo esteja funcionando corretamente.
        </p>
        
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{progress}% completo</span>
            <span>{getCompletedCount()} de {testResults.length} testes</span>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Button 
            size="lg" 
            variant="default" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={runAllTests}
            disabled={runningAll}
          >
            {runningAll ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Executando testes...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Executar todos os testes
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.reload()}
          >
            Reiniciar validação
          </Button>
        </div>
        
        {allTestsCompleted && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Resumo dos testes</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="rounded-lg p-4 bg-green-900/20 border border-green-500/30 min-w-[150px]">
                <div className="text-4xl font-bold text-green-500 mb-2">{getSuccessCount()}</div>
                <div className="text-sm text-green-400">Sucesso</div>
              </div>
              <div className="rounded-lg p-4 bg-amber-900/20 border border-amber-500/30 min-w-[150px]">
                <div className="text-4xl font-bold text-amber-500 mb-2">{getWarningCount()}</div>
                <div className="text-sm text-amber-400">Alertas</div>
              </div>
              <div className="rounded-lg p-4 bg-red-900/20 border border-red-500/30 min-w-[150px]">
                <div className="text-4xl font-bold text-red-500 mb-2">{getErrorCount()}</div>
                <div className="text-sm text-red-400">Erros</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-2xl mx-auto mb-8">
          <TabsTrigger value="all">Todos os Testes</TabsTrigger>
          <TabsTrigger value="core">Testes Core</TabsTrigger>
          <TabsTrigger value="ai">Testes de IA</TabsTrigger>
          <TabsTrigger value="system">Testes de Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testResults.map((test, index) => (
              <Card key={index} className="overflow-hidden border border-muted/30 bg-black/30 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-orbitron">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {test.status === 'loading' ? (
                    <div className="py-4 flex justify-center">
                      <LoadingFallback message="Executando teste..." />
                    </div>
                  ) : test.status === 'pending' ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Teste não executado
                    </div>
                  ) : test.status === 'error' ? (
                    <Alert variant="destructive" className="bg-red-950/40 text-red-300 border-red-900">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        {test.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="py-2 text-sm">
                      {test.message}
                      
                      {test.details && (
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details" className="border-muted/50">
                            <AccordionTrigger className="text-xs py-2">
                              Detalhes do teste
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2">
                                {test.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-2 text-xs">
                                    {detail.status === 'success' ? (
                                      <CheckIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                    ) : detail.status === 'warning' ? (
                                      <AlertTriangleIcon className="h-3 w-3 text-amber-500 mt-0.5" />
                                    ) : (
                                      <XCircleIcon className="h-3 w-3 text-red-500 mt-0.5" />
                                    )}
                                    <div>
                                      <span className="font-medium">{detail.name}: </span>
                                      <span className={
                                        detail.status === 'success' ? 'text-green-400' : 
                                        detail.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                      }>{detail.message}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    disabled={test.status === 'loading' || runningAll}
                    onClick={() => {
                      playClick();
                      switch (index) {
                        case 0: testDatabaseConnection(); break;
                        case 1: testMistralService(); break;
                        case 2: testUploadFunctionality(); break;
                        case 3: testAuthentication(); break;
                        case 4: testMistralIntegration(); break;
                        case 5: testSystemConfiguration(); break;
                        case 6: testAdvancedAIFeatures(); break;
                      }
                    }}
                  >
                    {test.status === 'loading' ? 'Executando...' : 'Executar Teste'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="core">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testResults.slice(0, 3).map((test, index) => (
              <Card key={index} className="overflow-hidden border border-muted/30 bg-black/30 backdrop-blur-sm">
                {/* Card content same as above */}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-orbitron">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {test.status === 'loading' ? (
                    <div className="py-4 flex justify-center">
                      <LoadingFallback message="Executando teste..." />
                    </div>
                  ) : test.status === 'pending' ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Teste não executado
                    </div>
                  ) : test.status === 'error' ? (
                    <Alert variant="destructive" className="bg-red-950/40 text-red-300 border-red-900">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        {test.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="py-2 text-sm">
                      {test.message}
                      
                      {test.details && (
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details" className="border-muted/50">
                            <AccordionTrigger className="text-xs py-2">
                              Detalhes do teste
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2">
                                {test.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-2 text-xs">
                                    {detail.status === 'success' ? (
                                      <CheckIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                    ) : detail.status === 'warning' ? (
                                      <AlertTriangleIcon className="h-3 w-3 text-amber-500 mt-0.5" />
                                    ) : (
                                      <XCircleIcon className="h-3 w-3 text-red-500 mt-0.5" />
                                    )}
                                    <div>
                                      <span className="font-medium">{detail.name}: </span>
                                      <span className={
                                        detail.status === 'success' ? 'text-green-400' : 
                                        detail.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                      }>{detail.message}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    disabled={test.status === 'loading' || runningAll}
                    onClick={() => {
                      playClick();
                      switch (index) {
                        case 0: testDatabaseConnection(); break;
                        case 1: testMistralService(); break;
                        case 2: testUploadFunctionality(); break;
                      }
                    }}
                  >
                    {test.status === 'loading' ? 'Executando...' : 'Executar Teste'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ai">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[testResults[1], testResults[4], testResults[6]].map((test, index) => (
              <Card key={index} className="overflow-hidden border border-muted/30 bg-black/30 backdrop-blur-sm">
                {/* Card content same as above */}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-orbitron">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {test.status === 'loading' ? (
                    <div className="py-4 flex justify-center">
                      <LoadingFallback message="Executando teste..." />
                    </div>
                  ) : test.status === 'pending' ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Teste não executado
                    </div>
                  ) : test.status === 'error' ? (
                    <Alert variant="destructive" className="bg-red-950/40 text-red-300 border-red-900">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        {test.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="py-2 text-sm">
                      {test.message}
                      
                      {test.details && (
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details" className="border-muted/50">
                            <AccordionTrigger className="text-xs py-2">
                              Detalhes do teste
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2">
                                {test.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-2 text-xs">
                                    {detail.status === 'success' ? (
                                      <CheckIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                    ) : detail.status === 'warning' ? (
                                      <AlertTriangleIcon className="h-3 w-3 text-amber-500 mt-0.5" />
                                    ) : (
                                      <XCircleIcon className="h-3 w-3 text-red-500 mt-0.5" />
                                    )}
                                    <div>
                                      <span className="font-medium">{detail.name}: </span>
                                      <span className={
                                        detail.status === 'success' ? 'text-green-400' : 
                                        detail.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                      }>{detail.message}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    disabled={test.status === 'loading' || runningAll}
                    onClick={() => {
                      playClick();
                      const actualIndex = index === 0 ? 1 : index === 1 ? 4 : 6;
                      switch (actualIndex) {
                        case 1: testMistralService(); break;
                        case 4: testMistralIntegration(); break;
                        case 6: testAdvancedAIFeatures(); break;
                      }
                    }}
                  >
                    {test.status === 'loading' ? 'Executando...' : 'Executar Teste'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="system">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[testResults[0], testResults[3], testResults[5]].map((test, index) => (
              <Card key={index} className="overflow-hidden border border-muted/30 bg-black/30 backdrop-blur-sm">
                {/* Card content same as above */}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-orbitron">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {test.status === 'loading' ? (
                    <div className="py-4 flex justify-center">
                      <LoadingFallback message="Executando teste..." />
                    </div>
                  ) : test.status === 'pending' ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Teste não executado
                    </div>
                  ) : test.status === 'error' ? (
                    <Alert variant="destructive" className="bg-red-950/40 text-red-300 border-red-900">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        {test.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="py-2 text-sm">
                      {test.message}
                      
                      {test.details && (
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details" className="border-muted/50">
                            <AccordionTrigger className="text-xs py-2">
                              Detalhes do teste
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2">
                                {test.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-2 text-xs">
                                    {detail.status === 'success' ? (
                                      <CheckIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                    ) : detail.status === 'warning' ? (
                                      <AlertTriangleIcon className="h-3 w-3 text-amber-500 mt-0.5" />
                                    ) : (
                                      <XCircleIcon className="h-3 w-3 text-red-500 mt-0.5" />
                                    )}
                                    <div>
                                      <span className="font-medium">{detail.name}: </span>
                                      <span className={
                                        detail.status === 'success' ? 'text-green-400' : 
                                        detail.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                      }>{detail.message}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    disabled={test.status === 'loading' || runningAll}
                    onClick={() => {
                      playClick();
                      const actualIndex = index === 0 ? 0 : index === 1 ? 3 : 5;
                      switch (actualIndex) {
                        case 0: testDatabaseConnection(); break;
                        case 3: testAuthentication(); break;
                        case 5: testSystemConfiguration(); break;
                      }
                    }}
                  >
                    {test.status === 'loading' ? 'Executando...' : 'Executar Teste'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Help Section */}
      <div className="mt-12 mb-16">
        <Separator className="mb-8" />
        <h2 className="text-2xl font-bold mb-6 text-center font-orbitron">Precisa de ajuda?</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-muted/30 bg-black/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-primary" />
                Entendendo os resultados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Os testes são classificados em três categorias: <span className="text-green-400">Sucesso</span>, 
                <span className="text-amber-400"> Alerta</span> e <span className="text-red-400">Erro</span>. 
                Alertas indicam funcionalidades parciais que podem ser usadas, mas com limitações. 
                Erros indicam problemas que precisam ser corrigidos.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-muted/30 bg-black/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-primary" />
                Problemas comuns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li><span className="font-medium">- Erro de conexão com banco de dados:</span> Verifique se o PostgreSQL está rodando e se as credenciais estão corretas.</li>
                <li><span className="font-medium">- API Key inválida:</span> Verifique se a chave da API Mistral está definida corretamente no sistema.</li>
                <li><span className="font-medium">- Erro de upload:</span> Verifique as permissões do diretório uploads.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border border-muted/30 bg-black/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-primary" />
                Próximos passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Se todos os testes passarem, o sistema está pronto para uso. Se houver erros, corrija cada um deles e execute novamente os testes. Se precisar de ajuda, consulte a documentação técnica ou entre em contato com o suporte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}