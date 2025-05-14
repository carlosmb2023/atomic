import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerStatusCard, DatabaseStatusCard, SystemStatusCard } from './ServerStatusCard';
import { AlertCircleIcon, ServerIcon, RefreshCcwIcon, CpuIcon, HardDriveIcon, ActivityIcon } from 'lucide-react';
import { AreaChart } from '@/components/ui/charts';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    loadAvg: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  system: {
    uptime: number;
    platform: string;
    hostname: string;
    osVersion: string;
  };
  serverStatus: {
    apiLatency: number;
    databaseConnected: boolean;
    localLlmStatus: 'up' | 'down' | 'unknown';
    cloudLlmStatus: 'up' | 'down' | 'unknown';
  };
  timestamp: number;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'error';
  database: 'connected' | 'disconnected';
  disk: 'ok' | 'critical';
  memory: 'ok' | 'critical';
  timestamp: string;
}

// Função auxiliar para formatar bytes em unidades legíveis
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Definição do componente principal
const ServerMonitoringDashboard: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(30); // Intervalo em segundos
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Consulta para obter métricas em tempo real
  const metricsQuery = useQuery({
    queryKey: ['/api/monitor/metrics'],
    queryFn: async () => {
      const response = await apiRequest<SystemMetrics>('/api/monitor/metrics?refresh=true', { method: 'GET' });
      return response.data;
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  // Consulta para obter status de saúde
  const healthQuery = useQuery({
    queryKey: ['/api/monitor/health'],
    queryFn: async () => {
      const response = await apiRequest<HealthStatus>('/api/monitor/health', { method: 'GET' });
      return response.data;
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  // Consulta para obter histórico de métricas
  const historyQuery = useQuery({
    queryKey: ['/api/monitor/history'],
    queryFn: async () => {
      const response = await apiRequest<SystemMetrics[]>('/api/monitor/history?hours=6', { method: 'GET' });
      return response.data;
    },
    refetchInterval: autoRefresh ? refreshInterval * 60 * 1000 : false, // Atualiza menos frequentemente
  });
  
  // Função para refrescar dados manualmente
  const refreshData = () => {
    metricsQuery.refetch();
    healthQuery.refetch();
    historyQuery.refetch();
  };
  
  // Status geral do sistema
  const getSystemStatus = (): 'healthy' | 'warning' | 'critical' | 'unknown' => {
    if (healthQuery.isLoading || !healthQuery.data) return 'unknown';
    
    if (healthQuery.data.status === 'healthy') return 'healthy';
    if (healthQuery.data.memory === 'critical' || healthQuery.data.disk === 'critical') return 'critical';
    return 'warning';
  };
  
  // Preparar dados para gráficos
  const prepareChartData = () => {
    if (!historyQuery.data || historyQuery.data.length === 0) {
      return {
        cpu: [],
        memory: [],
        labels: []
      };
    }
    
    return {
      cpu: historyQuery.data.map(metric => metric.cpu.usage),
      memory: historyQuery.data.map(metric => metric.memory.usedPercent),
      disk: historyQuery.data.map(metric => metric.disk.usedPercent),
      labels: historyQuery.data.map(metric => 
        new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      )
    };
  };
  
  const chartData = prepareChartData();
  
  // Status do banco de dados
  const getDatabaseStatus = (): 'connected' | 'disconnected' | 'unknown' => {
    if (healthQuery.isLoading || !healthQuery.data) return 'unknown';
    return healthQuery.data.database;
  };

  // Renderizando placeholders durante o carregamento
  if (metricsQuery.isLoading || healthQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Monitoramento do Servidor</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled
          >
            <RefreshCcwIcon className="h-4 w-4 mr-2" />
            Atualizando...
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Caso ocorra erro
  if (metricsQuery.isError || healthQuery.isError) {
    return (
      <Alert variant="destructive" className="bg-red-950 border-red-800">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Erro ao carregar métricas</AlertTitle>
        <AlertDescription>
          Não foi possível obter dados de monitoramento do servidor.
          <Button variant="outline" size="sm" className="ml-2 mt-2" onClick={refreshData}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Dados carregados com sucesso
  const metrics = metricsQuery.data!;
  const timestamp = new Date(metrics.timestamp).toISOString();
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoramento do Servidor</h2>
          <p className="text-neutral-400 text-sm">Visão geral da saúde e desempenho do sistema</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-green-600 text-green-500" : ""}
          >
            {autoRefresh ? "Auto-atualização Ativada" : "Auto-atualização Desativada"}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCcwIcon className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
      
      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SystemStatusCard 
          status={getSystemStatus()}
          uptime={metrics.system.uptime}
          timestamp={timestamp}
        />
        
        <ServerStatusCard
          title="CPU"
          status={metrics.cpu.usage > 90 ? 'critical' : metrics.cpu.usage > 70 ? 'warning' : 'healthy'}
          value={metrics.cpu.usage}
          description={`${metrics.cpu.cores} Cores - ${metrics.cpu.model}`}
          icon={<CpuIcon className="h-6 w-6" />}
          timestamp={timestamp}
        />
        
        <ServerStatusCard
          title="Memória"
          status={metrics.memory.usedPercent > 90 ? 'critical' : metrics.memory.usedPercent > 70 ? 'warning' : 'healthy'}
          value={metrics.memory.usedPercent}
          description={`${formatBytes(metrics.memory.used)} de ${formatBytes(metrics.memory.total)}`}
          icon={<ActivityIcon className="h-6 w-6" />}
          timestamp={timestamp}
        />
        
        <ServerStatusCard
          title="Disco"
          status={metrics.disk.usedPercent > 90 ? 'critical' : metrics.disk.usedPercent > 70 ? 'warning' : 'healthy'}
          value={metrics.disk.usedPercent}
          description={`${formatBytes(metrics.disk.used)} de ${formatBytes(metrics.disk.total)}`}
          icon={<HardDriveIcon className="h-6 w-6" />}
          timestamp={timestamp}
        />
        
        <DatabaseStatusCard
          status={getDatabaseStatus()}
          latency={metrics.serverStatus.apiLatency}
          timestamp={timestamp}
        />
        
        <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md hover:bg-black/70 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Hostname:</span>
                <span className="text-sm font-semibold text-white">{metrics.system.hostname}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Plataforma:</span>
                <span className="text-sm font-semibold text-white">{metrics.system.platform}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">OS Version:</span>
                <span className="text-sm font-semibold text-white">{metrics.system.osVersion}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos */}
      <Tabs defaultValue="cpu" className="mt-8">
        <TabsList className="bg-neutral-800">
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memória</TabsTrigger>
          <TabsTrigger value="disk">Disco</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cpu" className="mt-4">
          <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Uso de CPU ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.cpu.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-neutral-500">Dados históricos insuficientes</p>
                </div>
              ) : (
                <div className="h-80">
                  <AreaChart
                    data={chartData.cpu}
                    index={chartData.labels}
                    categories={['CPU']}
                    colors={['#3b82f6']}
                    valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
                    showLegend={false}
                    showGridLines={false}
                    startEndOnly={false}
                    className="h-80"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="memory" className="mt-4">
          <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Uso de Memória ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.memory.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-neutral-500">Dados históricos insuficientes</p>
                </div>
              ) : (
                <div className="h-80">
                  <AreaChart
                    data={chartData.memory}
                    index={chartData.labels}
                    categories={['Memória']}
                    colors={['#10b981']}
                    valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
                    showLegend={false}
                    showGridLines={false}
                    startEndOnly={false}
                    className="h-80"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="disk" className="mt-4">
          <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Uso de Disco ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.disk?.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-neutral-500">Dados históricos insuficientes</p>
                </div>
              ) : (
                <div className="h-80">
                  <AreaChart
                    data={chartData.disk || []}
                    index={chartData.labels}
                    categories={['Disco']}
                    colors={['#f59e0b']}
                    valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
                    showLegend={false}
                    showGridLines={false}
                    startEndOnly={false}
                    className="h-80"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServerMonitoringDashboard;