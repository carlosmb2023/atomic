import { useState, useEffect } from "react";
import { Terminal, Code, FileText, Upload, History, Home } from "lucide-react";
import Logo from "@/components/Logo";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('uploadSection');
  const [filesList, setFilesList] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Fetch files list
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/files');
        if (response.ok) {
          const files = await response.json();
          setFilesList(files);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
    
    fetchFiles();
  }, []);
  
  // Handle file upload
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          setUploadStatus('Upload complete!');
          form.reset();
          // Refresh file list
          fetch('/files')
            .then(res => res.json())
            .then(files => setFilesList(files))
            .catch(err => console.error('Error fetching updated files:', err));
        } else {
          setUploadStatus('Upload failed: ' + xhr.statusText);
        }
        setIsUploading(false);
      };
      
      xhr.onerror = () => {
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
    <div className="pt-16 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-orbitron mb-8 logo-text-gradient">Dashboard</h1>
        
        <div className="glass-panel p-4 md:p-6 max-w-5xl mx-auto border border-white/10 shadow-xl">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar */}
            <aside className="md:w-64 bg-black/30 p-4 rounded-l-lg border-r border-white/5">
              <Logo size="small" className="mx-auto mb-8" />
              
              <nav className="space-y-2">
                <button 
                  className={`w-full nav-item ${activeSection === 'uploadSection' ? 'active' : ''}`} 
                  onClick={() => setActiveSection('uploadSection')}
                >
                  <Upload size={18} />
                  <span>Uploads</span>
                </button>
                
                <button 
                  className={`w-full nav-item ${activeSection === 'fileManagerSection' ? 'active' : ''}`} 
                  onClick={() => setActiveSection('fileManagerSection')}
                >
                  <FileText size={18} />
                  <span>Gerenciador</span>
                </button>
                
                <button 
                  className={`w-full nav-item ${activeSection === 'terminalSection' ? 'active' : ''}`} 
                  onClick={() => setActiveSection('terminalSection')}
                >
                  <Terminal size={18} />
                  <span>Terminal</span>
                </button>
                
                <button 
                  className={`w-full nav-item ${activeSection === 'editorSection' ? 'active' : ''}`} 
                  onClick={() => setActiveSection('editorSection')}
                >
                  <Code size={18} />
                  <span>Editor</span>
                </button>
                
                <button 
                  className={`w-full nav-item ${activeSection === 'historySection' ? 'active' : ''}`} 
                  onClick={() => setActiveSection('historySection')}
                >
                  <History size={18} />
                  <span>Histórico</span>
                </button>
                
                <button 
                  className="w-full nav-item mt-8"
                  onClick={() => window.location.href = '/'}
                >
                  <Home size={18} />
                  <span>Home</span>
                </button>
              </nav>
            </aside>
            
            {/* Main content */}
            <main className="flex-1 p-6 bg-black/10 rounded-r-lg">
              {/* Upload Section */}
              {activeSection === 'uploadSection' && (
                <section>
                  <h2 className="text-2xl font-orbitron text-primary flex items-center gap-2 mb-6">
                    <Upload size={22} />
                    Uploads
                  </h2>
                  
                  <div className="glass-panel p-6 mt-6">
                    <form onSubmit={handleUpload} className="mb-6" encType="multipart/form-data">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-grow">
                          <input 
                            type="file" 
                            name="files" 
                            multiple 
                            required 
                            className="block w-full text-sm text-muted-foreground
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-md file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary file:text-white
                                      hover:file:bg-primary/90"
                          />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isUploading}>
                          {isUploading ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                      
                      {isUploading && (
                        <div className="mt-4">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            {uploadProgress}% - {uploadStatus}
                          </p>
                        </div>
                      )}
                      
                      {!isUploading && uploadStatus && (
                        <p className={`text-sm mt-2 ${uploadStatus.includes('complete') ? 'text-cyber-green' : 'text-destructive'}`}>
                          {uploadStatus}
                        </p>
                      )}
                    </form>
                    
                    <h3 className="text-xl font-orbitron mb-4 text-accent">Arquivos no Servidor:</h3>
                    <ul className="list-disc pl-5 mb-6 font-jetbrains">
                      {filesList.length > 0 ? (
                        filesList.map((file, index) => (
                          <li key={index}>{file}</li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">Nenhum arquivo encontrado</li>
                      )}
                    </ul>
                    
                    <div className="mt-6">
                      <div className="progress-bar mb-2">
                        <div className="progress-bar-fill" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Espaço utilizado: 65%</p>
                    </div>
                  </div>
                </section>
              )}
              
              {/* Terminal Section */}
              {activeSection === 'terminalSection' && (
                <section>
                  <h2 className="text-2xl font-orbitron text-primary flex items-center gap-2 mb-6">
                    <Terminal size={22} />
                    Terminal
                  </h2>
                  
                  <div className="terminal h-80 overflow-auto font-jetbrains text-sm md:text-base p-4">
                    <div className="terminal-line">&gt; connect --server atomic-ai</div>
                    <div className="terminal-line">[INFO] Connecting to Atomic AI server...</div>
                    <div className="terminal-line">[SUCCESS] Connected to Atomic AI server</div>
                    <div className="terminal-line">&gt; ls -la</div>
                    <div className="terminal-line">total 36</div>
                    <div className="terminal-line">drwxr-xr-x 4 user user 4096 May 15 10:22 .</div>
                    <div className="terminal-line">drwxr-xr-x 3 user user 4096 May 15 10:21 ..</div>
                    {filesList.map((file, index) => (
                      <div key={index} className="terminal-line">-rw-r--r-- 1 user user 1024 May 15 10:22 {file}</div>
                    ))}
                    <div className="terminal-line">&gt; _</div>
                  </div>
                </section>
              )}
              
              {/* File Manager Section */}
              {activeSection === 'fileManagerSection' && (
                <section>
                  <h2 className="text-2xl font-orbitron text-primary flex items-center gap-2 mb-6">
                    <FileText size={22} />
                    Gerenciador de Arquivos
                  </h2>
                  
                  <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-orbitron text-accent">Arquivos</h3>
                      <button className="btn-secondary text-sm py-1 px-4">Novo Arquivo</button>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-4 min-h-[400px]">
                      {filesList.length > 0 ? (
                        <ul className="divide-y divide-white/5">
                          {filesList.map((file, index) => (
                            <li key={index} className="py-3 px-2 flex justify-between items-center hover:bg-white/5 rounded">
                              <div className="flex items-center">
                                <FileText size={16} className="mr-2 text-muted-foreground" />
                                <span className="font-jetbrains text-sm">{file}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button className="p-1 text-primary hover:text-primary/80">👁️</button>
                                <button className="p-1 text-secondary hover:text-secondary/80">✏️</button>
                                <button className="p-1 text-destructive hover:text-destructive/80">🗑️</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <FileText size={48} className="mb-4 opacity-30" />
                          <p>Nenhum arquivo encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
              
              {/* Other sections with placeholder content */}
              {activeSection === 'editorSection' && (
                <section>
                  <h2 className="text-2xl font-orbitron text-primary flex items-center gap-2 mb-6">
                    <Code size={22} />
                    Editor de Código
                  </h2>
                  
                  <div className="glass-panel p-6">
                    <div className="bg-black/40 font-jetbrains text-sm rounded-lg p-4 h-[400px] flex items-center justify-center">
                      <p className="text-muted-foreground">Selecione um arquivo para editar</p>
                    </div>
                  </div>
                </section>
              )}
              
              {activeSection === 'historySection' && (
                <section>
                  <h2 className="text-2xl font-orbitron text-primary flex items-center gap-2 mb-6">
                    <History size={22} />
                    Histórico
                  </h2>
                  
                  <div className="glass-panel p-6">
                    <div className="bg-black/20 rounded-lg p-4 min-h-[400px]">
                      <ul className="space-y-3 font-jetbrains text-sm">
                        <li className="flex items-center gap-3 p-2 border-b border-white/5">
                          <span className="text-muted-foreground">15/05/2023 14:30</span>
                          <span className="text-accent">Upload</span>
                          <span>document.pdf</span>
                        </li>
                        <li className="flex items-center gap-3 p-2 border-b border-white/5">
                          <span className="text-muted-foreground">15/05/2023 14:25</span>
                          <span className="text-secondary">Execução</span>
                          <span>python script.py</span>
                        </li>
                        <li className="flex items-center gap-3 p-2 border-b border-white/5">
                          <span className="text-muted-foreground">15/05/2023 14:20</span>
                          <span className="text-primary">Edição</span>
                          <span>data.json</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
