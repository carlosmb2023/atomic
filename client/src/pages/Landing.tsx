import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import { Terminal, FileText, Upload, BarChart } from "lucide-react";
import GlassMorphism from "@/components/GlassMorphism";
import AnimatedContent from "@/components/AnimatedContent";
import ParticleBackground from "@/components/ParticleBackground";
import { useSoundEffect } from "@/hooks/use-sound-effect";

export default function Landing() {
  const [filesList, setFilesList] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const featuresRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const { playHover, playClick, playSuccess, playError } = useSoundEffect();
  
  // Check for hash in URL to scroll to section
  useEffect(() => {
    if (window.location.hash === '#features' && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (window.location.hash === '#about' && aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Fetch files list
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/files');
        if (response.ok) {
          const files = await response.json();
          setFilesList(files.slice(-5).reverse()); // Only show last 5 files
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
    
    fetchFiles();
  }, []);
  
  // Handle landing page upload
  const handleLandingUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    playClick();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading...');
    
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload', true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          playSuccess();
          setUploadStatus('Upload complete!');
          form.reset();
          // Refresh file list
          fetch('/files')
            .then(res => res.json())
            .then(files => setFilesList(files.slice(-5).reverse()))
            .catch(err => console.error('Error fetching updated files:', err));
        } else {
          playError();
          setUploadStatus('Upload failed: ' + xhr.statusText);
        }
        setIsUploading(false);
      };
      
      xhr.onerror = () => {
        playError();
        setUploadStatus('Upload failed: Network error');
        setIsUploading(false);
      };
      
      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading:', error);
      setUploadStatus('Upload failed: ' + String(error));
      setIsUploading(false);
    }
  };
  
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        <ParticleBackground />
        
        <AnimatedContent animation="scale" duration={0.8}>
          <Logo size="large" className="mx-auto mb-6 animate-float" />
        </AnimatedContent>
        
        <AnimatedContent animation="fadeIn" delay={0.4} duration={0.7}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-orbitron mb-6 animate-glow-pulse cyber-text bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Atomic AI
          </h1>
        </AnimatedContent>
        
        <AnimatedContent animation="fadeIn" delay={0.7} duration={0.6}>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            A combinação perfeita entre IA, terminal remoto, edição de arquivos e automação com Apify.
          </p>
        </AnimatedContent>
        
        <AnimatedContent animation="slideUp" delay={1.0} duration={0.7}>
          <Link href="/dashboard">
            <div 
              className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl inline-block transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 cursor-pointer"
              onMouseEnter={playHover}
              onClick={playClick}
            >
              Acessar Plataforma
            </div>
          </Link>
        </AnimatedContent>
      </section>
      
      {/* Preview Card Section */}
      <section className="py-12 px-4">
        <AnimatedContent animation="fadeIn" duration={0.8}>
          <GlassMorphism 
            className="max-w-lg mx-auto p-6" 
            glowAccent={true}
            borderGradient={true}
            intensity="medium"
          >
            <h3 className="text-xl font-orbitron mb-4 text-primary cyber-text">Arquivos Recentes</h3>
            <ul className="mb-4 font-jetbrains">
              {filesList.length > 0 ? (
                filesList.map((file, index) => (
                  <li key={index} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">• {file}</li>
                ))
              ) : (
                <li>Carregando...</li>
              )}
            </ul>
            
            <form onSubmit={handleLandingUpload} className="mt-4" encType="multipart/form-data">
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-sm font-jetbrains">Upload rápido:</label>
                <input 
                  type="file" 
                  name="files" 
                  multiple 
                  required
                  className="text-xs text-muted-foreground
                          file:mr-2 file:py-1 file:px-2
                          file:rounded-md file:border-0
                          file:text-xs file:font-medium
                          file:bg-primary file:text-white
                          hover:file:bg-primary/90"
                  onFocus={playHover}
                />
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
                  disabled={isUploading}
                  onMouseEnter={playHover}
                >
                  Enviar
                </button>
              </div>
            </form>
          
          {isUploading && (
            <div className="mt-4">
              <div className="progress-bar mb-1.5">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadProgress}% - {uploadStatus}
              </p>
            </div>
          )}
          
          {!isUploading && uploadStatus && (
            <p className="text-xs mt-2" style={{ 
              color: uploadStatus.includes('complete') ? 'var(--cyber-green)' : 'hsl(var(--destructive))' 
            }}>
              {uploadStatus}
            </p>
          )}
          </GlassMorphism>
        </AnimatedContent>
      </section>
      
      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-orbitron text-center mb-16 animate-glow-pulse logo-text-gradient">
            Funcionalidades Poderosas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="glass-panel p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 border border-white/5">
              <div className="text-4xl mb-4 text-primary">🤖</div>
              <h3 className="text-xl font-orbitron mb-3 text-primary">Agente Inteligente</h3>
              <p className="text-muted-foreground">
                Integre com Assistants da OpenAI para gerar, executar e automatizar tarefas com linguagem natural.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-panel p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 border border-white/5">
              <div className="text-4xl mb-4 text-accent">🧠</div>
              <h3 className="text-xl font-orbitron mb-3 text-accent">Terminal Web</h3>
              <p className="text-muted-foreground">
                Acesse o shell remoto em tempo real, diretamente do navegador, via WebSocket e container seguro.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-panel p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 border border-white/5">
              <div className="text-4xl mb-4 text-secondary">📁</div>
              <h3 className="text-xl font-orbitron mb-3 text-secondary">Upload & GitHub</h3>
              <p className="text-muted-foreground">
                Gerencie arquivos localmente ou via proxy para repositórios GitHub, com suporte a múltiplas fontes.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="glass-panel p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 border border-white/5">
              <div className="text-4xl mb-4" style={{ color: 'var(--cyber-green)' }}>🕷️</div>
              <h3 className="text-xl font-orbitron mb-3" style={{ color: 'var(--cyber-green)' }}>Automação via Apify</h3>
              <p className="text-muted-foreground">
                Use scrapers e atores do Apify para extrair dados e interagir com sites automaticamente via interface visual.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dashboard Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-orbitron text-center mb-12 animate-glow-pulse logo-text-gradient">
            Interface Futurista
          </h2>
          
          <div className="glass-panel p-4 md:p-6 max-w-4xl mx-auto">
            <div className="border border-white/10 rounded-lg overflow-hidden">
              {/* Mock dashboard */}
              <div className="flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="md:w-20 bg-black/30 p-4 flex flex-col items-center">
                  <Logo size="small" className="mb-8" />
                  <div className="space-y-6">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Upload size={18} />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-muted-foreground hover:text-white hover:bg-black/50 transition-colors">
                      <FileText size={18} />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-muted-foreground hover:text-white hover:bg-black/50 transition-colors">
                      <Terminal size={18} />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-muted-foreground hover:text-white hover:bg-black/50 transition-colors">
                      <BarChart size={18} />
                    </button>
                  </div>
                </aside>
                
                {/* Main area */}
                <main className="flex-1 p-6 bg-black/20">
                  <h2 className="text-xl font-orbitron text-primary flex items-center gap-2 mb-4">
                    <Upload size={18} />
                    Uploads
                  </h2>
                  
                  <div className="glass-panel p-4 mb-6">
                    <form className="mb-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input 
                          type="file" 
                          className="text-xs text-muted-foreground
                                  file:mr-2 file:py-1 file:px-2
                                  file:rounded-md file:border-0
                                  file:text-xs file:font-medium
                                  file:bg-primary file:text-white
                                  hover:file:bg-primary/90"
                        />
                        <button type="button" className="btn-primary text-sm px-4 py-1.5">Enviar</button>
                      </div>
                    </form>
                    
                    <h3 className="text-sm font-orbitron mb-2 text-accent">Arquivos:</h3>
                    <ul className="text-xs font-jetbrains space-y-1 text-muted-foreground">
                      <li>document.pdf</li>
                      <li>data.json</li>
                      <li>script.py</li>
                    </ul>
                    
                    <div className="mt-4">
                      <div className="progress-bar h-1.5 mb-1">
                        <div className="progress-bar-fill" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Espaço: 65%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-panel p-4">
                      <h3 className="text-sm font-orbitron mb-4 text-primary">Tipos de Arquivos</h3>
                      <div className="h-32 flex items-center justify-center">
                        <div className="text-muted-foreground opacity-70 text-xs font-jetbrains">Gráfico de distribuição</div>
                      </div>
                    </div>
                    <div className="glass-panel p-4">
                      <h3 className="text-sm font-orbitron mb-4 text-primary">Uploads Recentes</h3>
                      <div className="h-32 flex items-center justify-center">
                        <div className="text-muted-foreground opacity-70 text-xs font-jetbrains">Gráfico de timeline</div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Terminal Preview Section */}
      <section className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-orbitron text-center mb-12 animate-glow-pulse logo-text-gradient">
            Terminal Remoto
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="terminal h-60 overflow-auto font-jetbrains text-sm md:text-base">
              <div className="terminal-line">&gt; connect --server atomic-ai</div>
              <div className="terminal-line">[INFO] Connecting to Atomic AI server...</div>
              <div className="terminal-line">[SUCCESS] Connected to Atomic AI server</div>
              <div className="terminal-line">&gt; ls -la</div>
              <div className="terminal-line">total 36</div>
              <div className="terminal-line">drwxr-xr-x 4 user user 4096 May 15 10:22 .</div>
              <div className="terminal-line">drwxr-xr-x 3 user user 4096 May 15 10:21 ..</div>
              <div className="terminal-line">-rw-r--r-- 1 user user 2048 May 15 10:22 data.json</div>
              <div className="terminal-line">-rw-r--r-- 1 user user 8192 May 15 10:22 document.pdf</div>
              <div className="terminal-line">-rwxr-xr-x 1 user user 4096 May 15 10:22 script.py</div>
              <div className="terminal-line">&gt; python script.py</div>
              <div className="terminal-line">[INFO] Running AI analysis...</div>
              <div className="terminal-line">[INFO] Processing data from data.json</div>
              <div className="terminal-line">[SUCCESS] Analysis complete</div>
              <div className="terminal-line">&gt; _</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Authentication Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-orbitron mb-6 animate-glow-pulse logo-text-gradient">
              Acesso Seguro
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Nossa plataforma oferece acesso seguro com autenticação de múltiplos fatores. 
              Seus dados e projetos permanecem protegidos com criptografia de ponta a ponta.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span className="text-muted-foreground">Autenticação segura multi-fator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span className="text-muted-foreground">Criptografia avançada para todos os dados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span className="text-muted-foreground">Controle de acesso baseado em funções</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span className="text-muted-foreground">Monitoramento constante de atividades</span>
              </li>
            </ul>
            
            <Link href="/login">
              <a className="btn-primary inline-block">
                Acessar Plataforma
              </a>
            </Link>
          </div>
          
          <div className="md:w-1/2 mt-10 md:mt-0">
            <div className="glass-panel p-8 max-w-md mx-auto">
              <Logo size="small" className="mx-auto mb-6" />
              <h3 className="text-xl font-orbitron mb-6 text-center text-primary">Bem-vindo ao Atomic AI</h3>
              
              <form className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">📧</div>
                    <input
                      type="email"
                      placeholder="Seu e‑mail"
                      className="form-input w-full pl-10 py-3 rounded-lg bg-black/30 border border-white/10 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">🔒</div>
                    <input
                      type="password"
                      placeholder="Senha"
                      className="form-input w-full pl-10 py-3 rounded-lg bg-black/30 border border-white/10 focus:border-primary"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                      👁️
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <a href="#" className="text-secondary hover:text-primary transition-colors">Esqueceu a senha?</a>
                  <a href="#" className="text-secondary hover:text-primary transition-colors">Criar conta</a>
                </div>
                
                <Link href="/login">
                  <a className="btn-primary w-full py-3 text-center block">
                    Entrar
                  </a>
                </Link>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-orbitron mb-8 animate-glow-pulse logo-text-gradient">
            Sobre a Plataforma
          </h2>
          
          <div className="max-w-3xl mx-auto glass-panel p-8">
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Atomic AI é uma plataforma aberta e pronta para desenvolvedores, makers e empresas que buscam automação inteligente, 
              integração com IA, execução remota de comandos, edição de arquivos, scraping e gerenciamento de dados.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Unimos tecnologia de ponta com facilidade de uso para acelerar sua produtividade — 
              tudo em um ambiente seguro, visual e na nuvem.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
