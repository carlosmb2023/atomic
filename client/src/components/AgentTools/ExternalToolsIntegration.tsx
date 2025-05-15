import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  FiGithub,
  FiCloud,
  FiDatabase,
  FiCode,
  FiTerminal,
  FiServer
} from "react-icons/fi";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "available" | "coming-soon" | "beta";
  configUrl?: string;
  docsUrl?: string;
};

const tools: Tool[] = [
  {
    id: "github",
    name: "GitHub Integration",
    description: "Permita que seus agentes trabalhem com repositórios, issues e pull requests do GitHub",
    icon: <FiGithub className="h-6 w-6" />,
    status: "available",
    configUrl: "#configure-github",
    docsUrl: "https://docs.github.com/en/rest"
  },
  {
    id: "aws",
    name: "AWS Cloud",
    description: "Integre seus agentes com serviços AWS, como Lambda, S3 e EC2",
    icon: <FiCloud className="h-6 w-6" />,
    status: "beta",
    configUrl: "#configure-aws",
    docsUrl: "https://docs.aws.amazon.com/index.html"
  },
  {
    id: "db-connectors",
    name: "Conectores de Banco de Dados",
    description: "Conecte seus agentes a bancos de dados SQL e NoSQL",
    icon: <FiDatabase className="h-6 w-6" />,
    status: "available",
    configUrl: "#configure-db",
    docsUrl: "#db-docs"
  },
  {
    id: "webhooks",
    name: "Webhooks & APIs",
    description: "Configure webhooks para integrar agentes com serviços externos",
    icon: <FiCode className="h-6 w-6" />,
    status: "available",
    configUrl: "#configure-webhooks",
    docsUrl: "#webhooks-docs"
  },
  {
    id: "cli-tools",
    name: "Ferramentas de CLI",
    description: "Permita que seus agentes executem comandos em ambientes controlados",
    icon: <FiTerminal className="h-6 w-6" />,
    status: "coming-soon"
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Gerencie clusters Kubernetes através de seus agentes inteligentes",
    icon: <FiServer className="h-6 w-6" />,
    status: "coming-soon"
  }
];

export default function ExternalToolsIntegration() {
  const [activeTab, setActiveTab] = useState<string>("available");
  const { toast } = useToast();

  const filteredTools = tools.filter(tool => {
    if (activeTab === "available") return tool.status === "available";
    if (activeTab === "beta") return tool.status === "beta";
    if (activeTab === "coming-soon") return tool.status === "coming-soon";
    return true;
  });

  const handleInstall = (tool: Tool) => {
    // Simulação de instalação
    toast.success(`Iniciando instalação de ${tool.name}. Você receberá um email quando estiver pronto.`);
  };

  const handleConfigure = (tool: Tool) => {
    if (!tool.configUrl) {
      toast.warning("Configuração não disponível para esta ferramenta.");
      return;
    }
    
    // Em um cenário real, redirecionaria para a página de configuração
    toast.info(`Abrindo configurações para ${tool.name}`);
  };

  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
      <h2 className="font-orbitron text-2xl text-blue-400 mb-6">Catálogo de Integrações</h2>
      
      <div className="flex mb-6 border-b border-gray-800">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "available" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
          onClick={() => setActiveTab("available")}
        >
          Disponíveis
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "beta" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
          onClick={() => setActiveTab("beta")}
        >
          Beta
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "coming-soon" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
          onClick={() => setActiveTab("coming-soon")}
        >
          Em Breve
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTools.map((tool) => (
          <div 
            key={tool.id} 
            className="border border-gray-800 bg-black bg-opacity-50 rounded-lg p-4 backdrop-blur-md transition-all duration-200 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <div className="flex items-start mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                {tool.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {tool.name}
                  {tool.status === "beta" && (
                    <span className="text-xs bg-yellow-600/30 text-yellow-400 rounded px-2 py-0.5">BETA</span>
                  )}
                  {tool.status === "coming-soon" && (
                    <span className="text-xs bg-purple-600/30 text-purple-400 rounded px-2 py-0.5">EM BREVE</span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{tool.description}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              {tool.docsUrl && (
                <a 
                  href={tool.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Documentação
                </a>
              )}
              
              {tool.status !== "coming-soon" && (
                <button
                  onClick={() => handleConfigure(tool)}
                  className="text-sm bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 py-1 px-3 rounded transition-colors"
                >
                  Configurar
                </button>
              )}
              
              {tool.status === "available" && (
                <button
                  onClick={() => handleInstall(tool)}
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors"
                >
                  Instalar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">
          <FiCode className="inline-block mr-2" /> Integração via API
        </h3>
        <p className="text-sm text-gray-300 mb-3">
          Todas as integrações podem ser configuradas programaticamente através de nossa API REST.
          Use a documentação para criar suas próprias integrações personalizadas.
        </p>
        <div className="bg-black/50 p-3 rounded font-mono text-xs text-gray-400 overflow-x-auto">
          <pre>
{`curl -X POST https://api.carlosdev.app.br/v1/agents/{agent_id}/tools \\
  -H "Authorization: Bearer ${'{YOUR_API_KEY}'}" \\
  -H "Content-Type: application/json" \\
  -d '{"tool_type": "github", "config": {...}}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}