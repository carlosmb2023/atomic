import { agentService } from './agent.service';
import { openaiAgentService } from './openai.agent';
import { mistralAgentService } from './mistral.agent';

/**
 * Factory para criar o serviço de agente correto baseado no tipo
 */
export function getAgentServiceByType(type: string) {
  switch (type.toLowerCase()) {
    case 'openai':
      return openaiAgentService;
    case 'mistral':
      return mistralAgentService;
    default:
      return agentService;
  }
}

export {
  agentService,
  openaiAgentService,
  mistralAgentService
};