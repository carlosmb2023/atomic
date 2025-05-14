import { useState, useEffect } from "react";
import { Link } from "wouter";
import Logo from "@/components/Logo";

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

  return (
    <section className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-4">
      <div className="glass-panel p-8 md:p-12 max-w-3xl mx-auto animate-slide-up">
        <Logo size="medium" animate={true} className="mx-auto mb-6" />
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron mb-6 animate-glow-pulse bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Atomic AI
        </h1>
        
        <div className="h-16 flex items-center justify-center">
          <p className="font-jetbrains text-lg md:text-xl text-muted-foreground">
            {typedText}
          </p>
        </div>
        
        <div className="font-jetbrains mb-8 h-8" style={{ color: 'var(--cyber-green)' }}>
          {statusMessage}
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/login">
            <a className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl">
              Entrar
            </a>
          </Link>
          <Link href="/dashboard">
            <a className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl">
              Painel
            </a>
          </Link>
          <Link href="/landing">
            <a className="btn-primary text-lg font-orbitron px-8 py-4 rounded-xl">
              Ver Mais
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
