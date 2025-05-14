import { useState } from "react";
import { useLocation } from "wouter";
import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginStatus("");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch('/login', {
        method: 'POST',
        body: formData,
      });

      if (res.redirected) {
        setLoginStatus("Login realizado! Redirecionando...");
        toast({
          title: "Login bem-sucedido",
          description: "Você será redirecionado para o dashboard.",
          variant: "default"
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else if (res.status === 200) {
        setLoginStatus("Login realizado!");
        toast({
          title: "Login bem-sucedido",
          description: "Você será redirecionado para o dashboard.",
          variant: "default"
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        const txt = await res.text();
        setLoginStatus(txt || "Usuário ou senha inválidos.");
        toast({
          title: "Erro de autenticação",
          description: txt || "Usuário ou senha inválidos.",
          variant: "destructive"
        });
      }
    } catch (err) {
      setLoginStatus("Falha de conexão.");
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar-se ao servidor. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  return (
    <main className="flex items-center justify-center min-h-screen px-4 pt-16 pb-10">
      <div className="glass-panel p-8 max-w-md w-full animate-slide-up">
        <Logo size="medium" className="mx-auto mb-6" />
        <h2 className="text-xl font-orbitron mb-8 text-center text-primary">Bem-vindo ao Atomic AI</h2>
        
        {loginStatus && (
          <div className={`text-center mb-4 font-jetbrains text-sm`} style={{ 
              color: loginStatus.includes('Redirecionando') || loginStatus.includes('realizado') 
                ? 'var(--cyber-green)' 
                : 'hsl(var(--destructive))'
            }}>
            {loginStatus}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-70">
                📧
              </div>
              <Input
                type="email"
                placeholder="Seu e‑mail"
                required
                className="form-input pl-10 font-jetbrains"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-70">
                🔒
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                className="form-input pl-10 font-jetbrains"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                onClick={togglePassword}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <a href="#" onClick={() => toast({ title: "Em breve", description: "Recuperação de senha em desenvolvimento." })} className="text-secondary hover:text-primary transition-colors">
              Esqueceu a senha?
            </a>
            <a href="#" onClick={() => toast({ title: "Em breve", description: "Criação de conta em desenvolvimento." })} className="text-secondary hover:text-primary transition-colors">
              Criar conta
            </a>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full py-6 btn-primary"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
