import React from 'react';
import { AgentList } from '@/components/AgentManagement/AgentList';

export default function AgentsPage() {
  return (
    <div className="container p-6 mx-auto">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">Agentes Autônomos</h1>
          <p className="text-slate-400">
            Configure e execute agentes inteligentes baseados em OpenAI e Mistral.
          </p>
        </div>
        
        <div className="mt-8">
          <AgentList />
        </div>
      </div>
    </div>
  );
}