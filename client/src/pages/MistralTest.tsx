import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MistralTester from '@/components/MistralTest/MistralTester';
import MistralAgentConfig from '@/components/MistralTest/MistralAgentConfig';

export default function MistralTestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6 w-full">
        <Card className="border border-gray-800 bg-black/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Integração Mistral AI</CardTitle>
            <CardDescription>
              Configure e teste a integração com a API Mistral. O agente ID ag:48009b45:20250515:programador-agente:d9bb1918 está integrado
              ao sistema e será treinado com base nas interações e configurações realizadas.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="tester" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tester">Teste da API</TabsTrigger>
            <TabsTrigger value="config">Configuração do Agente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tester" className="mt-6">
            <MistralTester />
          </TabsContent>
          
          <TabsContent value="config" className="mt-6">
            <MistralAgentConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}