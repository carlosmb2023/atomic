import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Settings from "@/pages/Settings";
import Chat from "@/pages/Chat";
import ServerMonitor from "@/pages/ServerMonitor";
import Agents from "@/pages/Agents";
import MistralTest from "@/pages/MistralTest";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AiBackgroundImage from "@/components/AiBackgroundImage";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Global background elements */}
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none z-[-1]"></div>
      <div className="fixed top-0 left-0 w-full h-full bg-[linear-gradient(rgba(22,119,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(22,119,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] z-[-5]"></div>
      
      <Header />
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/landing" component={Landing} />
          <Route path="/settings" component={Settings} />
          <Route path="/chat" component={Chat} />
          <Route path="/monitor" component={ServerMonitor} />
          <Route path="/agents" component={Agents} />
          <Route path="/mistral" component={MistralTest} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Footer />
    </div>
  );
}

function App() {
  const { setTheme, theme } = useTheme();
  
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, [setTheme]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
