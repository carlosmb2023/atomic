import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import GlassMorphism from '@/components/GlassMorphism';
import AnimatedContent from '@/components/AnimatedContent';
import AiBackgroundImage from '@/components/AiBackgroundImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Loader, Save, CloudOff, CloudCog, Server, Search, Terminal } from 'lucide-react';

interface ConfigState {
  execution_mode: 'local' | 'cloud';
  local_llm_url: string;
  cloud_llm_url: string;
  apify_actor_url: string;
  apify_api_key: string;
  base_prompt: string;
  logs_enabled: boolean;
  oracle_instance_ip: string | null;
  active_llm_url: string;
}

interface DeployStatus {
  status: string;
  action: string;
  inProgress: boolean;
  instanceIp: string | null;
  lastUpdate: string | null;
}

export default function Settings() {
  // States
  const [config, setConfig] = useState<ConfigState>({
    execution_mode: 'local',
    local_llm_url: 'http://127.0.0.1:11434',
    cloud_llm_url: '',
    apify_actor_url: '',
    apify_api_key: '',
    base_prompt: 'Você é um assistente útil e profissional.',
    logs_enabled: true,
    oracle_instance_ip: null,
    active_llm_url: 'http://127.0.0.1:11434'
  });

  // Sound effects
  const { playClickSound, playSuccessSound, playErrorSound } = useSoundEffect();
  const { toast } = useToast();

  // Fetch config from server
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['/api/system/config'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get Oracle deploy status
  const { data: deployStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/oracle/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<ConfigState>) => {
      const response = await fetch('/api/system/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (!response.ok) throw new Error('Failed to update config');
      return response.json();
    },
    onSuccess: () => {
      playSuccessSound();
      toast({
        title: "Configuration updated",
        description: "Settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
    },
    onError: (error) => {
      playErrorSound();
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Switch mode (local/cloud)
  const switchModeMutation = useMutation({
    mutationFn: async (mode: 'local' | 'cloud') => {
      const response = await fetch('/api/system/mode/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, userId: 1 }) // Using admin user ID
      });
      if (!response.ok) throw new Error('Failed to switch mode');
      return response.json();
    },
    onSuccess: (data) => {
      playSuccessSound();
      toast({
        title: "Mode switched",
        description: `Now using ${data.mode} LLM server at ${data.active_url}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
    },
    onError: (error) => {
      playErrorSound();
      toast({
        title: "Error",
        description: `Failed to switch mode: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Deploy Oracle instance
  const deployOracleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/oracle/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 }) // Using admin user ID
      });
      if (!response.ok) throw new Error('Failed to start deployment');
      return response.json();
    },
    onSuccess: () => {
      playSuccessSound();
      toast({
        title: "Deployment started",
        description: "Oracle Cloud instance deployment started. This may take a few minutes.",
      });
      refetchStatus();
    },
    onError: (error) => {
      playErrorSound();
      toast({
        title: "Error",
        description: `Failed to start deployment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Stop Oracle instance
  const stopOracleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/oracle/instance/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 }) // Using admin user ID
      });
      if (!response.ok) throw new Error('Failed to stop instance');
      return response.json();
    },
    onSuccess: () => {
      playSuccessSound();
      toast({
        title: "Instance stopping",
        description: "Oracle Cloud instance is being stopped. This may take a few minutes.",
      });
      refetchStatus();
    },
    onError: (error) => {
      playErrorSound();
      toast({
        title: "Error",
        description: `Failed to stop instance: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Test Apify connection
  const testApifyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/apify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test query', 
          userId: 1, // Using admin user ID
          maxResults: 1 
        })
      });
      if (!response.ok) throw new Error('Failed to test Apify connection');
      return response.json();
    },
    onSuccess: () => {
      playSuccessSound();
      toast({
        title: "Apify connection successful",
        description: "Test search query was processed successfully.",
      });
    },
    onError: (error) => {
      playErrorSound();
      toast({
        title: "Error",
        description: `Failed to connect to Apify: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update config when data is fetched
  useEffect(() => {
    if (configData) {
      setConfig({
        execution_mode: configData.execution_mode || 'local',
        local_llm_url: configData.local_llm_url || 'http://127.0.0.1:11434',
        cloud_llm_url: configData.cloud_llm_url || '',
        apify_actor_url: configData.apify_actor_url || '',
        apify_api_key: configData.apify_api_key ? '**********' : '', // Mask for security
        base_prompt: configData.base_prompt || 'Você é um assistente útil e profissional.',
        logs_enabled: configData.logs_enabled !== undefined ? configData.logs_enabled : true,
        oracle_instance_ip: configData.oracle_instance_ip || null,
        active_llm_url: configData.active_llm_url || 'http://127.0.0.1:11434'
      });
    }
  }, [configData]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setConfig(prev => ({ ...prev, [name]: checked }));
  };

  // Save configuration
  const saveConfig = () => {
    playClickSound();
    
    // Only send changed fields to avoid overwriting sensitive data
    const updates: Partial<ConfigState> = {};
    
    // Compare with original data and only include changed fields
    if (configData) {
      if (config.local_llm_url !== configData.local_llm_url) updates.local_llm_url = config.local_llm_url;
      if (config.cloud_llm_url !== configData.cloud_llm_url) updates.cloud_llm_url = config.cloud_llm_url;
      if (config.apify_actor_url !== configData.apify_actor_url) updates.apify_actor_url = config.apify_actor_url;
      if (config.base_prompt !== configData.base_prompt) updates.base_prompt = config.base_prompt;
      if (config.logs_enabled !== configData.logs_enabled) updates.logs_enabled = config.logs_enabled;
      
      // Only include API key if it's been changed from masked value
      if (config.apify_api_key && config.apify_api_key !== '**********') {
        updates.apify_api_key = config.apify_api_key;
      }
      
      // Add user ID for logging
      updates.updated_by = 1; // Admin user ID
    } else {
      // If no original data, send everything except masked values
      Object.assign(updates, config);
      if (updates.apify_api_key === '**********') delete updates.apify_api_key;
      updates.updated_by = 1; // Admin user ID
    }
    
    // Only proceed if there are actual changes
    if (Object.keys(updates).length > 0) {
      updateConfigMutation.mutate(updates);
    } else {
      toast({
        title: "No changes",
        description: "No changes were detected.",
      });
    }
  };

  // Switch mode
  const switchMode = (mode: 'local' | 'cloud') => {
    playClickSound();
    switchModeMutation.mutate(mode);
  };

  // Start Oracle deployment
  const startDeploy = () => {
    playClickSound();
    deployOracleMutation.mutate();
  };

  // Stop Oracle instance
  const stopInstance = () => {
    playClickSound();
    stopOracleMutation.mutate();
  };

  // Test Apify connection
  const testApify = () => {
    playClickSound();
    testApifyMutation.mutate();
  };

  // Format deploy status message
  const getStatusMessage = (status: DeployStatus | undefined) => {
    if (!status) return "Status: Unknown";
    
    let message = `Status: ${status.status || 'Unknown'}`;
    if (status.action) message += ` | Action: ${status.action}`;
    if (status.instanceIp) message += ` | IP: ${status.instanceIp}`;
    if (status.inProgress) message += " | 🔄 In Progress";
    
    return message;
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AiBackgroundImage opacity={0.3} pulseIntensity={0.05} />
      
      <div className="container mx-auto py-8 px-4">
        <AnimatedContent animation="fadeIn" duration={1000}>
          <h1 className="text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            System Configuration
          </h1>
        </AnimatedContent>
        
        <GlassMorphism borderGradient glowAccent className="p-6 rounded-lg mt-4">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="general" onClick={playClickSound}>General Settings</TabsTrigger>
              <TabsTrigger value="llm" onClick={playClickSound}>LLM Configuration</TabsTrigger>
              <TabsTrigger value="oracle" onClick={playClickSound}>Oracle Cloud</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <AnimatedContent animation="fadeIn" duration={800}>
                <h2 className="text-2xl font-semibold mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="base_prompt">Base System Prompt</Label>
                    <Textarea
                      id="base_prompt"
                      name="base_prompt"
                      value={config.base_prompt}
                      onChange={handleInputChange}
                      placeholder="Enter the base system prompt for LLM interactions"
                      className="resize-y min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="logs_enabled"
                      checked={config.logs_enabled}
                      onCheckedChange={(checked) => handleSwitchChange('logs_enabled', checked)}
                    />
                    <Label htmlFor="logs_enabled">Enable LLM and API Logs</Label>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={saveConfig} 
                    disabled={updateConfigMutation.isPending}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {updateConfigMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </AnimatedContent>
            </TabsContent>
            
            <TabsContent value="llm" className="space-y-6">
              <AnimatedContent animation="fadeIn" duration={800}>
                <h2 className="text-2xl font-semibold mb-4">LLM Configuration</h2>
                
                <div className="bg-black/20 p-4 rounded-md mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`h-3 w-3 rounded-full ${config.execution_mode === 'local' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <p>Current Mode: <span className="font-semibold">{config.execution_mode === 'local' ? 'Local' : 'Cloud'}</span></p>
                  </div>
                  <p className="text-sm text-slate-300">Active URL: {config.active_llm_url}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium mb-2 flex items-center">
                      <Server className="mr-2 h-5 w-5" />
                      Local LLM Configuration
                    </h3>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="local_llm_url">Local LLM URL</Label>
                      <Input
                        id="local_llm_url"
                        name="local_llm_url"
                        value={config.local_llm_url}
                        onChange={handleInputChange}
                        placeholder="http://127.0.0.1:11434"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => switchMode('local')} 
                      disabled={switchModeMutation.isPending || config.execution_mode === 'local'}
                      variant={config.execution_mode === 'local' ? "secondary" : "default"}
                      className="w-full mt-4"
                    >
                      {switchModeMutation.isPending && config.execution_mode !== 'local' ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Server className="mr-2 h-4 w-4" />
                      )}
                      {config.execution_mode === 'local' ? 'Currently Using Local' : 'Switch to Local'}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium mb-2 flex items-center">
                      <CloudCog className="mr-2 h-5 w-5" />
                      Cloud LLM Configuration
                    </h3>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="cloud_llm_url">Cloud LLM URL</Label>
                      <Input
                        id="cloud_llm_url"
                        name="cloud_llm_url"
                        value={config.cloud_llm_url}
                        onChange={handleInputChange}
                        placeholder="https://your-cloud-llm-url.com"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => switchMode('cloud')} 
                      disabled={switchModeMutation.isPending || config.execution_mode === 'cloud' || !config.oracle_instance_ip}
                      variant={config.execution_mode === 'cloud' ? "secondary" : "default"}
                      className="w-full mt-4"
                    >
                      {switchModeMutation.isPending && config.execution_mode !== 'cloud' ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CloudCog className="mr-2 h-4 w-4" />
                      )}
                      {config.execution_mode === 'cloud' ? 'Currently Using Cloud' : 'Switch to Cloud'}
                    </Button>
                    
                    {!config.oracle_instance_ip && (
                      <p className="text-sm text-yellow-400 mt-1">
                        No Oracle instance available. Deploy an instance first.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-medium mb-2 flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Apify Search Integration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="apify_actor_url">Apify Actor URL</Label>
                      <Input
                        id="apify_actor_url"
                        name="apify_actor_url"
                        value={config.apify_actor_url}
                        onChange={handleInputChange}
                        placeholder="https://api.apify.com/v2/acts/..."
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="apify_api_key">Apify API Key</Label>
                      <Input
                        id="apify_api_key"
                        name="apify_api_key"
                        type="password"
                        value={config.apify_api_key}
                        onChange={handleInputChange}
                        placeholder="Enter your Apify API key"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      onClick={testApify} 
                      disabled={testApifyMutation.isPending || !config.apify_actor_url || !config.apify_api_key}
                      variant="outline"
                    >
                      {testApifyMutation.isPending ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Test Apify Connection
                    </Button>
                    
                    <Button 
                      onClick={saveConfig} 
                      disabled={updateConfigMutation.isPending}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      {updateConfigMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </AnimatedContent>
            </TabsContent>
            
            <TabsContent value="oracle" className="space-y-6">
              <AnimatedContent animation="fadeIn" duration={800}>
                <h2 className="text-2xl font-semibold mb-4">Oracle Cloud Integration</h2>
                
                <div className="bg-black/20 p-4 rounded-md mb-6">
                  <p className="text-sm font-medium mb-2">Deploy Status:</p>
                  <div className="flex items-center space-x-2">
                    {statusLoading ? (
                      <Loader className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <div className={`h-3 w-3 rounded-full ${deployStatus?.inProgress ? 'bg-yellow-500' : (deployStatus?.status === 'success' ? 'bg-green-500' : 'bg-red-500')}`}></div>
                    )}
                    <p className="text-sm">{getStatusMessage(deployStatus)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium mb-2 flex items-center">
                    <Terminal className="mr-2 h-5 w-5" />
                    Instance Management
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-sm">
                        Deploy a new Oracle Cloud instance with our Mistral LLM pre-installed.
                        This process may take several minutes to complete.
                      </p>
                      
                      <Button 
                        onClick={startDeploy} 
                        disabled={deployOracleMutation.isPending || deployStatus?.inProgress || (deployStatus?.instanceIp && deployStatus?.status === 'success')}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {deployOracleMutation.isPending || deployStatus?.inProgress ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            <span>Deploying...</span>
                          </>
                        ) : (
                          <>
                            <CloudCog className="mr-2 h-4 w-4" />
                            <span>Deploy Oracle Instance</span>
                          </>
                        )}
                      </Button>
                      
                      {deployStatus?.instanceIp && deployStatus?.status === 'success' && (
                        <p className="text-sm text-green-400 mt-1">
                          Instance is already running at {deployStatus.instanceIp}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm">
                        Stop your running Oracle Cloud instance to save on compute costs.
                        You can always restart it later.
                      </p>
                      
                      <Button 
                        onClick={stopInstance} 
                        disabled={stopOracleMutation.isPending || deployStatus?.inProgress || !deployStatus?.instanceIp || deployStatus?.status !== 'success'}
                        variant="destructive"
                        className="w-full mt-4"
                      >
                        {stopOracleMutation.isPending ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            <span>Stopping...</span>
                          </>
                        ) : (
                          <>
                            <CloudOff className="mr-2 h-4 w-4" />
                            <span>Stop Oracle Instance</span>
                          </>
                        )}
                      </Button>
                      
                      {!deployStatus?.instanceIp && (
                        <p className="text-sm text-yellow-400 mt-1">
                          No active Oracle instance to stop
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-md my-6">
                  <p className="text-sm">
                    <span className="font-semibold">Note:</span> When you deploy an Oracle instance, your configuration will automatically be updated with the instance's URL. You can then switch to cloud mode to use the Oracle instance for LLM processing.
                  </p>
                </div>
              </AnimatedContent>
            </TabsContent>
          </Tabs>
        </GlassMorphism>
      </div>
    </div>
  );
}