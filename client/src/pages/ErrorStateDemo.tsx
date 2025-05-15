import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ErrorStateAnimation, 
  FormErrorAnimation, 
  NetworkErrorAnimation, 
  LoadingFallback,
  ErrorType
} from '@/components/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ErrorStateDemo() {
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]> | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('network');
  
  // Simular erro de rede
  const simulateNetworkError = (statusCode?: number) => {
    setNetworkError(`Erro na requisição ${statusCode ? `(${statusCode})` : ''}`);
    
    // Auto-limpar após 5 segundos
    setTimeout(() => setNetworkError(null), 5000);
  };
  
  // Simular carregamento
  const simulateLoading = () => {
    setLoading(true);
    
    // Finalizar após 3 segundos
    setTimeout(() => setLoading(false), 3000);
  };
  
  // Simular erro de formulário
  const simulateFormError = () => {
    setFormErrors({
      'nome': ['O nome é obrigatório'],
      'email': ['Email inválido', 'Email já cadastrado'],
      'senha': ['Senha deve ter pelo menos 8 caracteres']
    });
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Demonstração de Micro-Interações de Erro</h1>
      
      <Tabs defaultValue="error-animations">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="error-animations">Animações de Erro</TabsTrigger>
          <TabsTrigger value="network-errors">Erros de Rede</TabsTrigger>
          <TabsTrigger value="form-errors">Erros de Formulário</TabsTrigger>
          <TabsTrigger value="loading-states">Estados de Carregamento</TabsTrigger>
        </TabsList>
        
        {/* Animações básicas de erro */}
        <TabsContent value="error-animations">
          <Card>
            <CardHeader>
              <CardTitle>Animações de Estado de Erro</CardTitle>
              <CardDescription>
                Diferentes tipos de animações baseadas na categoria do erro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Tipo de Erro</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={errorType === 'network' ? 'default' : 'outline'}
                      onClick={() => setErrorType('network')}
                      size="sm"
                    >
                      Rede
                    </Button>
                    <Button
                      variant={errorType === 'validation' ? 'default' : 'outline'}
                      onClick={() => setErrorType('validation')}
                      size="sm"
                    >
                      Validação
                    </Button>
                    <Button
                      variant={errorType === 'auth' ? 'default' : 'outline'}
                      onClick={() => setErrorType('auth')}
                      size="sm"
                    >
                      Autenticação
                    </Button>
                    <Button
                      variant={errorType === 'server' ? 'default' : 'outline'}
                      onClick={() => setErrorType('server')}
                      size="sm"
                    >
                      Servidor
                    </Button>
                    <Button
                      variant={errorType === 'unknown' ? 'default' : 'outline'}
                      onClick={() => setErrorType('unknown')}
                      size="sm"
                    >
                      Desconhecido
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Button onClick={() => {
                    // Criar elemento de áudio e reproduzir
                    const audio = new Audio('/audio/error-sound.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(e => console.error('Erro ao reproduzir som:', e));
                  }}>
                    Testar Som de Erro
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 flex justify-center">
                <ErrorStateAnimation
                  type={errorType}
                  message={`Erro de ${errorType === 'network' ? 'rede' : 
                    errorType === 'validation' ? 'validação' : 
                    errorType === 'auth' ? 'autenticação' : 
                    errorType === 'server' ? 'servidor' : 
                    'tipo desconhecido'}`}
                  details="Detalhes adicionais sobre o erro que podem ajudar o usuário a resolver o problema."
                  onRetry={() => alert('Botão de retry clicado')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Erros de rede */}
        <TabsContent value="network-errors">
          <Card>
            <CardHeader>
              <CardTitle>Erros de Rede</CardTitle>
              <CardDescription>
                Simulação de erros de conexão com o servidor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button onClick={() => simulateNetworkError()}>
                  Erro de Rede Genérico
                </Button>
                <Button onClick={() => simulateNetworkError(401)}>
                  Erro 401 (Não autorizado)
                </Button>
                <Button onClick={() => simulateNetworkError(500)}>
                  Erro 500 (Servidor)
                </Button>
              </div>
              
              {/* O componente será renderizado quando houver erro */}
              <NetworkErrorAnimation 
                error={networkError} 
                onRetry={() => alert('Tentando novamente...')}
                onDismiss={() => setNetworkError(null)}
              />
              
              {!networkError && (
                <div className="text-center text-muted-foreground">
                  Clique em um dos botões acima para simular um erro de rede
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Erros de formulário */}
        <TabsContent value="form-errors">
          <Card>
            <CardHeader>
              <CardTitle>Erros de Formulário</CardTitle>
              <CardDescription>
                Visualização de erros de validação em formulários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Button onClick={simulateFormError}>
                  Simular Erros de Formulário
                </Button>
                {formErrors && (
                  <Button 
                    variant="outline" 
                    className="ml-2" 
                    onClick={() => setFormErrors(null)}
                  >
                    Limpar Erros
                  </Button>
                )}
              </div>
              
              <FormErrorAnimation 
                errors={formErrors} 
                onDismiss={() => setFormErrors(null)}
              />
              
              {!formErrors && (
                <div className="text-center text-muted-foreground">
                  Clique no botão acima para simular erros de validação de formulário
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Estados de carregamento */}
        <TabsContent value="loading-states">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Carregamento</CardTitle>
              <CardDescription>
                Feedback visual durante operações assíncronas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Button 
                  onClick={simulateLoading}
                  disabled={loading}
                >
                  {loading ? 'Carregando...' : 'Simular Carregamento'}
                </Button>
              </div>
              
              {loading ? (
                <div className="border rounded-lg p-6">
                  <LoadingFallback 
                    message="Carregando dados..."
                    delayMs={0}
                    timeout={2000}
                    errorMessage="Esta operação está demorando mais que o normal."
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Clique no botão acima para simular um estado de carregamento
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}