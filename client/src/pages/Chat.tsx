import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import GlassMorphism from '@/components/GlassMorphism';
import AnimatedContent from '@/components/AnimatedContent';
import AiBackgroundImage from '@/components/AiBackgroundImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { format } from 'date-fns';
import { 
  Send, 
  Loader, 
  MessageSquare, 
  Trash, 
  Plus, 
  Search,
  User,
  Bot,
  RefreshCcw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ChatSession {
  id: string;
  userId: number;
  title?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface SearchResult {
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  source: string;
  date?: string;
}

export default function Chat() {
  // Mock user ID for demo purposes
  const userId = 1;
  
  // States
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSearchQuery, setIsSearchQuery] = useState(false);
  
  // Sound effects
  const { playClick, playSuccess, playError } = useSoundEffect();
  const { toast } = useToast();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get chat sessions
  const { 
    data: sessions, 
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['/api/chat/sessions', { userId }],
    queryFn: async () => {
      const response = await fetch(`/api/chat/sessions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });
  
  // Get current session
  const { 
    data: currentSession, 
    isLoading: sessionLoading,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['/api/chat/sessions', activeSession],
    queryFn: async () => {
      if (!activeSession) return null;
      const response = await fetch(`/api/chat/sessions/${activeSession}?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!activeSession
  });
  
  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (data) => {
      playSuccess();
      setActiveSession(data.id);
      refetchSessions();
    },
    onError: (error) => {
      playError();
      toast({
        title: "Error",
        description: `Failed to create session: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string, message: string }) => {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      refetchSession();
    },
    onError: (error) => {
      playError();
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);
  
  // Create a new chat session
  const createSession = () => {
    playClick();
    createSessionMutation.mutate();
  };
  
  // Send a message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession) return;
    
    playClick();
    
    // Check if it's a search command
    if (newMessage.startsWith('#buscar') || newMessage.startsWith('#scrape')) {
      setIsSearchQuery(true);
    } else {
      setIsSearchQuery(false);
    }
    
    sendMessageMutation.mutate({ 
      sessionId: activeSession, 
      message: newMessage 
    });
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd/MM/yyyy');
  };
  
  // Render search results
  const renderSearchResults = (message: ChatMessage) => {
    if (!message.metadata?.apifyResults) return null;
    
    const results = message.metadata.apifyResults as SearchResult[];
    
    return (
      <div className="mt-4 space-y-3">
        {results.map((result, index) => (
          <GlassMorphism 
            key={index} 
            className="p-3 rounded"
            intensity="light"
          >
            <h4 className="text-lg font-medium">{result.title}</h4>
            {result.description && (
              <p className="text-sm text-gray-300 mt-1">{result.description}</p>
            )}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>{result.source}</span>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View Source
              </a>
            </div>
          </GlassMorphism>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col">
      <AiBackgroundImage opacity={0.3} pulseIntensity={0.05} />
      
      <div className="container mx-auto py-6 px-4 flex-1 flex flex-col">
        <AnimatedContent animation="fadeIn" duration={1000}>
          <h1 className="text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            AI Assistant Chat
          </h1>
        </AnimatedContent>
        
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          {/* Sidebar */}
          <GlassMorphism borderGradient className="w-full md:w-72 p-4 rounded-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Conversations</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={createSession}
                disabled={createSessionMutation.isPending}
                className="h-8 w-8"
              >
                {createSessionMutation.isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <ScrollArea className="flex-1 pr-3">
              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session: ChatSession) => (
                    <button
                      key={session.id}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        activeSession === session.id
                          ? 'bg-indigo-600/30 border border-indigo-400/50'
                          : 'hover:bg-indigo-600/20 border border-transparent'
                      }`}
                      onClick={() => {
                        playClick();
                        setActiveSession(session.id);
                      }}
                    >
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <p className="truncate text-sm">
                          {session.title || `Chat ${format(new Date(session.createdAt), 'dd/MM HH:mm')}`}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(session.updatedAt)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={createSession}
                    className="mt-4"
                  >
                    Start a new chat
                  </Button>
                </div>
              )}
            </ScrollArea>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mt-2">
                <p>
                  <span className="font-semibold">#buscar</span> - Search the web
                </p>
                <p className="mt-1">
                  <span className="font-semibold">@update</span> - Access system actions
                </p>
              </div>
            </div>
          </GlassMorphism>
          
          {/* Chat Area */}
          <GlassMorphism borderGradient glowAccent className="flex-1 p-4 rounded-lg flex flex-col">
            {activeSession && currentSession ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 pr-3">
                  {currentSession.messages.length <= 1 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium mb-2">How can I help you today?</h3>
                      <p className="text-sm max-w-md mx-auto">
                        Ask me anything, request information, or use special commands like #buscar to search the web.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      {currentSession.messages.filter(msg => msg.role !== 'system').map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-indigo-600/70 to-purple-600/70 rounded-tl-lg rounded-tr-sm rounded-bl-lg rounded-br-lg border border-indigo-400/30'
                                : 'bg-black/30 rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg border border-gray-700/80'
                            } p-3`}
                          >
                            <div className="flex items-center mb-2">
                              {message.role === 'user' ? (
                                <User className="h-4 w-4 mr-1" />
                              ) : (
                                <Bot className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-xs font-medium mr-2">
                                {message.role === 'user' ? 'You' : 'Assistant'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(message.timestamp)}
                              </span>
                              
                              {message.role === 'assistant' && message.metadata?.source && (
                                <span className="text-xs ml-2 bg-indigo-900/50 px-2 py-0.5 rounded">
                                  {message.metadata.source}
                                </span>
                              )}
                            </div>
                            
                            <div className="chat-message whitespace-pre-wrap">
                              {message.content}
                            </div>
                            
                            {message.role === 'assistant' && message.metadata?.apifyResults && (
                              renderSearchResults(message)
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {/* Input Form */}
                <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="resize-none min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e);
                        }
                      }}
                    />
                    <div className="flex justify-between mt-1">
                      {newMessage.startsWith('#buscar') || newMessage.startsWith('#scrape') ? (
                        <div className="text-xs text-blue-400 flex items-center">
                          <Search className="h-3 w-3 mr-1" />
                          Web search mode
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <div className="text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-[60px]"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                {sessionLoading ? (
                  <Loader className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Bot className="h-20 w-20 mb-4 opacity-50" />
                    <h2 className="text-2xl font-semibold mb-2">No Conversation Selected</h2>
                    <p className="text-gray-400 text-center max-w-md mb-6">
                      Select an existing conversation from the sidebar or create a new one to start chatting.
                    </p>
                    <Button 
                      onClick={createSession}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Start New Conversation
                    </Button>
                  </>
                )}
              </div>
            )}
          </GlassMorphism>
        </div>
      </div>
    </div>
  );
}