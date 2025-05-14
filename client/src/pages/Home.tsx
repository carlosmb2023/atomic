import { useState, useEffect } from "react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import AnimatedContent from "@/components/AnimatedContent";
import { useSoundEffect } from "@/hooks/use-sound-effect";
import GlassMorphism from "@/components/GlassMorphism";
import AiBackgroundImage from "@/components/AiBackgroundImage";

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Phrases to type
  const phrases = [
    "Automatize com IA em segundos...",
    "WebSocket. Terminal. Cloud. 🔥",
    "Agentes OpenAI + Apify combinados.",
    "Sua plataforma de automação definitiva.",
    "Segurança, performance e inovação."
  ];

  // Typing effect
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    
    const typeTimer = setTimeout(() => {
      if (isDeleting) {
        // Deleting text
        setTypedText(currentPhrase.substring(0, charIndex - 1) + "▌");
        setCharIndex(charIndex - 1);
        
        if (charIndex === 0) {
          setIsDeleting(false);
          setPhraseIndex((phraseIndex + 1) % phrases.length);
        }
      } else {
        // Typing text
        setTypedText(currentPhrase.substring(0, charIndex + 1) + "▌");
        setCharIndex(charIndex + 1);
        
        if (charIndex === currentPhrase.length) {
          // Pause at the end of typing
          setIsDeleting(true);
          return;
        }
      }
    }, isDeleting ? 30 : charIndex === currentPhrase.length ? 1500 : 100);
    
    return () => clearTimeout(typeTimer);
  }, [typedText, charIndex, phraseIndex, isDeleting, phrases]);

  // Fetch API status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api');
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setStatusMessage(data.status + " 🚀");
          } else {
            setStatusMessage("Sistema online e operacional 🚀");
          }
        } else {
          throw new Error("API Error");
        }
      } catch {
        setStatusMessage("⚠️ Servidor offline ou instável");
      }
    }
    
    fetchStatus();
  }, []);

  const { playHover, playClick } = useSoundEffect();

  return (
    <section className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      <AiBackgroundImage />
      <GlassMorphism 
        className="p-8 md:p-12 max-w-3xl mx-auto relative z-10"
        glowAccent={true}
        borderGradient={true}
        neonEffect={true}
        elevation="floating"
      >
        <Logo size="medium" animate={true} className="mx-auto mb-6" />
        
        <AnimatedContent animation="fadeIn" delay={0.3} duration={0.8}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron mb-6 animate-glow-pulse bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Atomic AI
          </h1>
        </AnimatedContent>
        
        <AnimatedContent animation="fadeIn" delay={0.6} duration={0.7}>
          <div className="h-16 flex items-center justify-center">
            <p className="font-jetbrains text-lg md:text-xl text-muted-foreground">
              {typedText}
            </p>
          </div>
        </AnimatedContent>
        
        <AnimatedContent animation="fadeIn" delay={0.9} duration={0.7}>
          <div className="font-jetbrains mb-8 h-8" style={{ color: 'var(--cyber-green)' }}>
            {statusMessage}
          </div>
        </AnimatedContent>
        
        <AnimatedContent animation="slideUp" delay={1.2} duration={0.7}>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <div 
                className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(22,119,255,0.5)] hover:-translate-y-1"
                onMouseEnter={playHover}
                onClick={playClick}
              >
                Entrar
              </div>
            </Link>
            <Link href="/dashboard">
              <div 
                className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(22,119,255,0.5)] hover:-translate-y-1"
                onMouseEnter={playHover}
                onClick={playClick}
              >
                Painel
              </div>
            </Link>
            <Link href="/landing">
              <div 
                className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(22,119,255,0.5)] hover:-translate-y-1"
                onMouseEnter={playHover}
                onClick={playClick}
              >
                Ver Mais
              </div>
            </Link>
          </div>
        </AnimatedContent>
      </GlassMorphism>
    </section>
  );
}
