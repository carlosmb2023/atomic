import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data para exibição no formato local
 */
export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Formata um horário para exibição no formato local
 */
export function formatTime(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Encurta um texto para o tamanho especificado
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Gera um ID aleatório único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Pausa a execução por um tempo determinado
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Agrupa um array por um critério específico
 */
export function groupBy<T>(array: T[], key: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = key(item)
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Formata um valor numérico como uma string de moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Converte um objeto em parâmetros de consulta de URL
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

/**
 * Analisa parâmetros de consulta de URL para um objeto
 */
export function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString || queryString === '') return {}
  
  const query = queryString.startsWith('?') 
    ? queryString.substring(1) 
    : queryString
    
  return query
    .split('&')
    .reduce((params, param) => {
      const [key, value] = param.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
      return params
    }, {} as Record<string, string>)
}

/**
 * Extrai o domínio de uma URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch (e) {
    return url
  }
}

/**
 * Converte um objeto para um FormData
 */
export function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData()
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value, value.name)
      } else if (typeof value === 'object' && !(value instanceof Blob)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value)
      }
    }
  })
  
  return formData
}