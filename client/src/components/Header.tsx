import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import Logo from "./Logo";

export default function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Logo size="small" />
          <h1 className="text-xl md:text-2xl font-bold font-orbitron logo-text-gradient">
            Atomic AI
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/">
            <a className={`font-jetbrains text-sm transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              Home
            </a>
          </Link>
          <Link href="/dashboard">
            <a className={`font-jetbrains text-sm transition-colors ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              Dashboard
            </a>
          </Link>
          <Link href="/landing#features">
            <a className={`font-jetbrains text-sm transition-colors ${location.includes('#features') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              Features
            </a>
          </Link>
          <Link href="/landing#about">
            <a className={`font-jetbrains text-sm transition-colors ${location.includes('#about') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              About
            </a>
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? '☀️' : '🌓'}
          </button>
          
          <Link href="/login">
            <a className="hidden md:block px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-md font-medium hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-1">
              Login
            </a>
          </Link>
          
          <button 
            className="block md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-black/80 border-t border-white/10 animate-slide-up">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col gap-4">
              <Link href="/">
                <a className="font-jetbrains py-2 border-b border-white/10">Home</a>
              </Link>
              <Link href="/dashboard">
                <a className="font-jetbrains py-2 border-b border-white/10">Dashboard</a>
              </Link>
              <Link href="/landing#features">
                <a className="font-jetbrains py-2 border-b border-white/10">Features</a>
              </Link>
              <Link href="/landing#about">
                <a className="font-jetbrains py-2 border-b border-white/10">About</a>
              </Link>
              <Link href="/login">
                <a className="font-jetbrains py-2">Login</a>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
