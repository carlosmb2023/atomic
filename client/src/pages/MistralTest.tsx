import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MistralTester from '@/components/MistralTest/MistralTester';

export default function MistralTestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6 w-full">
        <Card className="border border-gray-800 bg-black/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Teste de Conexão com Mistral AI</CardTitle>
            <CardDescription>
              Teste a integração com a API Mistral. Você pode verificar o status da conexão e enviar prompts para o modelo.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <MistralTester />
      </div>
    </div>
  );
}