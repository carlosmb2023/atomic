import { useState } from "react";
import { useLocation } from "wouter";
import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GlassMorphism from "@/components/GlassMorphism";
import AnimatedContent from "@/components/AnimatedContent";
import { useSoundEffect } from "@/hooks/use-sound-effect";
import AiBackgroundImage from "@/components/AiBackgroundImage";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playHover, playClick, playSuccess, playError } = useSoundEffect();

  const togglePassword = () => {
    playClick();
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
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
        playSuccess();
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
        playSuccess();
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
        playError();
        const txt = await res.text();
        setLoginStatus(txt || "Usuário ou senha inválidos.");
        toast({
          title: "Erro de autenticação",
          description: txt || "Usuário ou senha inválidos.",
          variant: "destructive"
        });
      }
    } catch (err) {
      playError();
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
    <main className="flex items-center justify-center min-h-screen px-4 pt-16 pb-10 relative overflow-hidden">
      <AiBackgroundImage />
      <GlassMorphism 
        className="p-8 max-w-md w-full" 
        glowAccent={true}
        borderGradient={true}
        neonEffect={true}
        elevation="floating"
      >
        <AnimatedContent animation="slideUp" duration={0.7}>
          <Logo size="medium" animate={true} className="mx-auto mb-6" />
        </AnimatedContent>
        
        <AnimatedContent animation="fadeIn" delay={0.3} duration={0.6}>
          <h2 className="text-xl font-orbitron mb-8 text-center cyber-text">Bem-vindo ao Atomic AI</h2>
        </AnimatedContent>
        
        {loginStatus && (
          <AnimatedContent animation="fadeIn" duration={0.5}>
            <div className={`text-center mb-4 font-jetbrains text-sm`} style={{ 
                color: loginStatus.includes('Redirecionando') || loginStatus.includes('realizado') 
                  ? 'var(--cyber-green)' 
                  : 'hsl(var(--destructive))'
              }}>
              {loginStatus}
            </div>
          </AnimatedContent>
        )}
        
        <AnimatedContent animation="fadeIn" delay={0.5} duration={0.7}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-70 group-hover:animate-pulse">
                  📧
                </div>
                <Input
                  type="email"
                  placeholder="Seu e‑mail"
                  required
                  className="form-input pl-10 font-jetbrains bg-black/30 border-white/20 focus:border-primary/50 focus:ring-primary/30 transition-all duration-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={playHover}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-70 group-hover:animate-pulse">
                  🔒
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  required
                  className="form-input pl-10 font-jetbrains bg-black/30 border-white/20 focus:border-primary/50 focus:ring-primary/30 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={playHover}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={togglePassword}
                  onMouseEnter={playHover}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  playClick();
                  toast({ title: "Em breve", description: "Recuperação de senha em desenvolvimento." });
                }} 
                className="text-secondary hover:text-primary transition-colors"
                onMouseEnter={playHover}
              >
                Esqueceu a senha?
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  playClick();
                  toast({ title: "Em breve", description: "Criação de conta em desenvolvimento." });
                }} 
                className="text-secondary hover:text-primary transition-colors"
                onMouseEnter={playHover}
              >
                Criar conta
              </a>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-6 bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-1"
              onMouseEnter={playHover}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? "Entrando..." : "Entrar"}
                {!isSubmitting && <span className="ml-2">→</span>}
              </span>
            </Button>
          </form>
        </AnimatedContent>
      </GlassMorphism>
    </main>
  );
}
