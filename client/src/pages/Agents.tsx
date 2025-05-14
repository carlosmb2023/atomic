import React, { useState } from 'react';
import AgentList from '@/components/AgentManagement/AgentList';
import AgentIntegration from '@/components/AgentManagement/AgentIntegration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="container p-6 mx-auto">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">Agentes Autônomos</h1>
          <p className="text-slate-400">
            Configure e execute agentes inteligentes baseados em OpenAI e Mistral.
          </p>
        </div>
        
        <Tabs 
          defaultValue="list" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">Lista de Agentes</TabsTrigger>
            <TabsTrigger value="create">Criar Novo Agente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-6">
            <AgentList />
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <AgentIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}