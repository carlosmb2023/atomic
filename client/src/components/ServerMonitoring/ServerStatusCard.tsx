import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDotIcon, ServerCrashIcon, ServerIcon, DatabaseIcon, HardDriveIcon, Cpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ServerStatusCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  value: number;
  description?: string;
  icon?: React.ReactNode;
  timestamp?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusProperties = () => {
    switch (status) {
      case 'healthy':
        return { label: 'Operacional', color: 'bg-green-500 hover:bg-green-600 text-white' };
      case 'warning':
        return { label: 'Atenção', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' };
      case 'critical':
        return { label: 'Crítico', color: 'bg-red-500 hover:bg-red-600 text-white' };
      default:
        return { label: 'Desconhecido', color: 'bg-slate-500 hover:bg-slate-600 text-white' };
    }
  };

  const { label, color } = getStatusProperties();
  
  return (
    <Badge className={`${color} font-medium px-3 py-1`}>
      {status === 'healthy' ? <CircleDotIcon className="mr-1 h-3 w-3 animate-pulse" /> : null}
      {label}
    </Badge>
  );
};

export const ServerStatusCard: React.FC<ServerStatusCardProps> = ({
  title,
  status,
  value,
  description,
  icon,
  timestamp
}) => {
  const getProgressColor = () => {
    if (status === 'healthy') return 'bg-green-500';
    if (status === 'warning') return 'bg-yellow-500';
    if (status === 'critical') return 'bg-red-500';
    return 'bg-slate-500';
  };

  // Valor formatado (com unidade se necessário)
  const formattedValue = `${value.toFixed(1)}%`;

  // Ícone padrão caso não seja fornecido
  const displayIcon = icon || <ServerIcon className="h-6 w-6" />;

  return (
    <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md hover:bg-black/70 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {displayIcon}
            <CardTitle className="text-base font-medium text-white">{title}</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
        {description && <CardDescription className="text-sm text-neutral-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-neutral-400">Utilização</span>
            <span className="text-sm font-bold text-white">{formattedValue}</span>
          </div>
          <Progress 
            value={value} 
            max={100} 
            className={`h-2 ${value > 90 ? 'animate-pulse' : ''}`}
          />
          {/* Aplicando cor personalizada usando CSS inline */}
          <style jsx>{`
            :global(.h-2 > div) {
              background-color: ${getProgressColor()};
            }
          `}</style>
        </div>
      </CardContent>
      {timestamp && (
        <CardFooter className="pt-0">
          <p className="text-xs text-neutral-500">Atualizado: {new Date(timestamp).toLocaleTimeString()}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export const DatabaseStatusCard: React.FC<{
  status: 'connected' | 'disconnected' | 'unknown';
  latency?: number;
  timestamp?: string;
}> = ({ status, latency, timestamp }) => {
  const isConnected = status === 'connected';
  
  return (
    <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md hover:bg-black/70 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DatabaseIcon className={`h-6 w-6 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <CardTitle className="text-base font-medium text-white">Banco de Dados</CardTitle>
          </div>
          <StatusBadge status={isConnected ? 'healthy' : 'critical'} />
        </div>
        <CardDescription className="text-sm text-neutral-400">
          {isConnected 
            ? 'Conexão estabelecida com o banco de dados' 
            : 'Sem conexão com o banco de dados (usando armazenamento em memória)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Status:</span>
            <span className={`text-sm font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {latency && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Latência:</span>
              <span className="text-sm font-semibold text-white">{latency.toFixed(2)}ms</span>
            </div>
          )}
        </div>
      </CardContent>
      {timestamp && (
        <CardFooter className="pt-0">
          <p className="text-xs text-neutral-500">Atualizado: {new Date(timestamp).toLocaleTimeString()}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export const SystemStatusCard: React.FC<{
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  uptime: number;
  timestamp?: string;
}> = ({ status, uptime, timestamp }) => {
  // Converter uptime de segundos para formato legível
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  return (
    <Card className="shadow-md border-neutral-800 bg-black/60 backdrop-blur-md hover:bg-black/70 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ServerIcon className="h-6 w-6" />
            <CardTitle className="text-base font-medium text-white">Status do Sistema</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="text-sm text-neutral-400">
          {status === 'healthy' 
            ? 'Todos os serviços operacionais' 
            : status === 'warning'
              ? 'Alguns serviços precisam de atenção'
              : 'Serviços críticos indisponíveis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Tempo Ativo:</span>
            <span className="text-sm font-semibold text-white">{formatUptime(uptime)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Plataforma:</span>
            <span className="text-sm font-semibold text-white">Node.js</span>
          </div>
        </div>
      </CardContent>
      {timestamp && (
        <CardFooter className="pt-0">
          <p className="text-xs text-neutral-500">Atualizado: {new Date(timestamp).toLocaleTimeString()}</p>
        </CardFooter>
      )}
    </Card>
  );
};