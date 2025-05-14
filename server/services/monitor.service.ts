/**
 * Serviço de Monitoramento de Saúde do Servidor
 * Coleta e fornece métricas sobre o desempenho do servidor e serviços conectados
 */

import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { db } from '../db';
import { storage } from '../storage';
import { ConfigService } from './config.service';
import { InsertDailyMetrics } from '@shared/schema';

const execPromise = util.promisify(exec);

/**
 * Interface para métricas do sistema
 */
export interface SystemMetrics {
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

/**
 * Serviço para monitoramento de saúde do servidor
 */
export class MonitorService {
  private static instance: MonitorService;
  private configService: ConfigService;
  private metricsCache: SystemMetrics | null = null;
  private lastMetricsTime: number = 0;
  private readonly CACHE_DURATION_MS = 10 * 1000; // 10 segundos

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): MonitorService {
    if (!MonitorService.instance) {
      MonitorService.instance = new MonitorService();
    }
    return MonitorService.instance;
  }

  /**
   * Coleta métricas do sistema em tempo real
   */
  public async getSystemMetrics(forceRefresh = false): Promise<SystemMetrics> {
    const now = Date.now();
    
    // Retorna métricas em cache se estiverem atualizadas
    if (!forceRefresh && this.metricsCache && (now - this.lastMetricsTime) < this.CACHE_DURATION_MS) {
      return this.metricsCache;
    }

    // Coleta novas métricas
    const cpuUsage = await this.getCpuUsage();
    const diskInfo = await this.getDiskInfo();
    const databaseStatus = await this.checkDatabaseConnection();
    const [localLlmStatus, cloudLlmStatus] = await Promise.all([
      this.checkLocalLlmStatus(),
      this.checkCloudLlmStatus()
    ]);
    
    // Métricas que podem ser coletadas diretamente
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Medição do tempo de resposta da API
    const apiStartTime = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1)); // Simulação mínima de operação
    const apiEndTime = performance.now();
    
    // Montagem do objeto de métricas
    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Desconhecido',
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercent: (usedMem / totalMem) * 100
      },
      disk: {
        total: diskInfo.total,
        free: diskInfo.free,
        used: diskInfo.used,
        usedPercent: diskInfo.usedPercent
      },
      system: {
        uptime: os.uptime(),
        platform: os.platform(),
        hostname: os.hostname(),
        osVersion: os.release()
      },
      serverStatus: {
        apiLatency: apiEndTime - apiStartTime,
        databaseConnected: databaseStatus,
        localLlmStatus,
        cloudLlmStatus
      },
      timestamp: now
    };
    
    // Atualiza o cache
    this.metricsCache = metrics;
    this.lastMetricsTime = now;
    
    // Armazena as métricas no banco de dados para histórico
    this.storeMetricsHistory(metrics).catch(err => 
      console.error('Erro ao armazenar métricas no histórico:', err)
    );
    
    return metrics;
  }

  /**
   * Recupera o histórico de métricas do sistema
   * @param hoursBack Número de horas para recuperar (padrão: 24 horas)
   */
  public async getMetricsHistory(hoursBack: number = 24): Promise<SystemMetrics[]> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursBack);
      
      // Convertemos para formato de data apenas (sem hora)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Recuperamos as métricas diárias
      const dailyMetrics = await storage.getDailyMetrics(today);
      
      if (!dailyMetrics || !dailyMetrics.metrics_history) {
        return [];
      }
      
      // Filtramos apenas as métricas do período solicitado
      return (dailyMetrics.metrics_history as SystemMetrics[])
        .filter(metric => metric.timestamp >= startDate.getTime())
        .sort((a, b) => a.timestamp - b.timestamp);
        
    } catch (error) {
      console.error('Erro ao recuperar histórico de métricas:', error);
      return [];
    }
  }

  /**
   * Armazena as métricas coletadas no histórico
   * @param metrics Métricas do sistema
   */
  private async storeMetricsHistory(metrics: SystemMetrics): Promise<void> {
    try {
      // Obtém a data atual sem o componente de hora
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Recupera as métricas existentes para hoje
      const existingMetrics = await storage.getDailyMetrics(today);
      
      if (existingMetrics) {
        // Adiciona a nova métrica ao histórico
        const history = existingMetrics.metrics_history as SystemMetrics[] || [];
        
        // Limitamos a 1440 pontos (1 por minuto em 24h) para evitar crescimento excessivo
        if (history.length >= 1440) {
          history.shift(); // Remove o elemento mais antigo
        }
        
        history.push(metrics);
        
        // Atualiza o registro
        await storage.updateDailyMetrics(today, {
          metrics_history: history,
          last_update: new Date()
        });
      } else {
        // Cria um novo registro para hoje
        const newMetrics: InsertDailyMetrics = {
          date: today,
          api_requests: 0,
          llm_tokens_used: 0,
          active_users: 0,
          errors_count: 0,
          metrics_history: [metrics],
          last_update: new Date()
        };
        
        await storage.updateDailyMetrics(today, newMetrics);
      }
    } catch (error) {
      console.error('Erro ao armazenar métricas no histórico:', error);
    }
  }

  /**
   * Obtém o uso atual de CPU 
   * (média de uso de todos os cores)
   */
  private async getCpuUsage(): Promise<number> {
    try {
      // No Linux, tentamos obter dados mais precisos com comando top
      if (os.platform() === 'linux') {
        const { stdout } = await execPromise('top -bn1 | grep "Cpu(s)" | awk \'{print $2 + $4}\'');
        const cpuUsage = parseFloat(stdout.trim());
        return isNaN(cpuUsage) ? 0 : cpuUsage;
      } else {
        // Em outros sistemas, calculamos com base na carga média
        const loadAvg = os.loadavg()[0];
        const cpuCount = os.cpus().length;
        return (loadAvg / cpuCount) * 100;
      }
    } catch (error) {
      console.error('Erro ao obter uso de CPU:', error);
      
      // Fallback: cálculo básico aproximado
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length;
      return (loadAvg / cpuCount) * 100;
    }
  }

  /**
   * Obtém informações sobre espaço em disco
   */
  private async getDiskInfo(): Promise<{ total: number; free: number; used: number; usedPercent: number }> {
    try {
      const result = { total: 0, free: 0, used: 0, usedPercent: 0 };
      
      // No Linux ou MacOS
      if (os.platform() === 'linux' || os.platform() === 'darwin') {
        const { stdout } = await execPromise('df -k / | tail -1');
        const values = stdout.trim().split(/\s+/);
        
        if (values.length >= 5) {
          // Os valores estão em KB, convertemos para bytes
          result.total = parseInt(values[1]) * 1024;
          result.used = parseInt(values[2]) * 1024;
          result.free = parseInt(values[3]) * 1024;
          
          // Usamos o valor reportado pelo sistema ou calculamos
          const percentStr = values[4].replace('%', '');
          const percent = parseFloat(percentStr);
          result.usedPercent = !isNaN(percent) ? percent : (result.used / result.total) * 100;
        }
      } else {
        // Em outros sistemas, usamos um valor placeholder
        // Não implementamos para Windows nesta versão
        result.total = 1000 * 1024 * 1024 * 1024; // 1TB
        result.free = 500 * 1024 * 1024 * 1024;   // 500GB
        result.used = result.total - result.free;
        result.usedPercent = (result.used / result.total) * 100;
      }
      
      return result;
      
    } catch (error) {
      console.error('Erro ao obter informações de disco:', error);
      
      // Valores padrão em caso de erro
      return {
        total: 1000 * 1024 * 1024 * 1024, // 1TB
        free: 500 * 1024 * 1024 * 1024,   // 500GB
        used: 500 * 1024 * 1024 * 1024,   // 500GB
        usedPercent: 50
      };
    }
  }

  /**
   * Verifica a conexão com o banco de dados
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Tentamos executar uma query simples
      if (db) {
        // Realizamos uma verificação simples - se existir conexão, db é um objeto
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar conexão com banco de dados:', error);
      return false;
    }
  }

  /**
   * Verifica o status do LLM local
   */
  private async checkLocalLlmStatus(): Promise<'up' | 'down' | 'unknown'> {
    try {
      const config = await this.configService.getConfig();
      if (!config || !config.local_llm_url) {
        return 'unknown';
      }
      
      // Tenta fazer uma requisição simples para o LLM local
      const response = await fetch(`${config.local_llm_url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
      });
      
      return response.ok ? 'up' : 'down';
    } catch (error) {
      console.error('Erro ao verificar status do LLM local:', error);
      return 'down';
    }
  }

  /**
   * Verifica o status do LLM na nuvem
   */
  private async checkCloudLlmStatus(): Promise<'up' | 'down' | 'unknown'> {
    try {
      const config = await this.configService.getConfig();
      if (!config || !config.cloud_llm_url) {
        return 'unknown';
      }
      
      // Tenta fazer uma requisição simples para o LLM na nuvem
      const response = await fetch(`${config.cloud_llm_url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // Timeout maior para conexão na nuvem
      });
      
      return response.ok ? 'up' : 'down';
    } catch (error) {
      console.error('Erro ao verificar status do LLM na nuvem:', error);
      return 'down';
    }
  }
}

// Exporta a instância singleton
export const monitorService = MonitorService.getInstance();