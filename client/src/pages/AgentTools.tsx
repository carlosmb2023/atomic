import React, { useEffect } from "react";
import { motion } from "framer-motion";
import ExternalToolsIntegration from "@/components/AgentTools/ExternalToolsIntegration";
import { useToast } from "@/hooks/use-toast";

export default function AgentTools() {
  useEffect(() => {
    document.title = "Ferramentas de Agentes | CarlosDev IA";
  }, []);

  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-orbitron font-bold text-white mb-4 text-center">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Ferramentas para Agentes
        </span>
      </h1>
      
      <div className="max-w-4xl mx-auto mt-10">
        <div className="mb-10 text-center">
          <p className="text-gray-300 mb-6">
            Configure integrações e ferramentas externas para ampliar as capacidades dos seus agentes de IA.
            Conecte APIs, serviços de nuvem e ferramentas de desenvolvimento para criar fluxos de trabalho automatizados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <ExternalToolsIntegration />
        </div>
      </div>
    </motion.div>
  );
}