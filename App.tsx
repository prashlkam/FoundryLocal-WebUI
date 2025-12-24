import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { checkConnection, streamChat, getModels, initializeFoundry } from './services/foundryService';
import { checkOllamaConnection, getOllamaModels, streamOllamaChat } from './services/ollamaService';
import { streamGeminiResponse, getGeminiModels } from './services/geminiService';
import { ChatSession, User, Message, Role, Model, AppSettings } from './types';
import { BrainCircuit, Loader2, Wifi, WifiOff, Zap, AlertTriangle, Download, Terminal, Copy, CheckCircle2, Box } from 'lucide-react';

// --- Connection Component ---
const ConnectPage = ({ 
  onConnect, 
  settings, 
  onUpdateSettings 
}: { 
  onConnect: (u: User) => void, 
  settings: AppSettings,
  onUpdateSettings: (s: AppSettings) => void
}) => {
  const [modelAlias, setModelAlias] = useState('qwen2.5-coder-0.5b');
  const [customUrl, setCustomUrl] = useState('http://127.0.0.1:8000/v1');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'foundry' | 'ollama' | 'manual'>('foundry');
  const [localServerStatus, setLocalServerStatus] = useState<'checking' | 'found' | 'not-found'>('checking');

  // Proactively check for local server on mount
  useEffect(() => {
    const checkLocal = async () => {
      const isFoundryUp = await checkConnection('http://127.0.0.1:8000/v1', 1000);
      const isOllamaUp = await checkOllamaConnection('http://127.0.0.1:11434');
      setLocalServerStatus(isFoundryUp || isOllamaUp ? 'found' : 'not-found');
      if (isOllamaUp && !isFoundryUp) setMode('ollama');
    };
    checkLocal();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'foundry') {
        setStatusMsg('Initializing Foundry...');
        const { endpoint, modelInfo } = await initializeFoundry(modelAlias);
        onUpdateSettings({ 
          ...settings, 
          foundryUrl: endpoint,
          defaultModel: modelInfo.id,
          activeProvider: 'foundry'
        });
      } else if (mode === 'ollama') {
        setStatusMsg('Checking Ollama...');
        const isUp = await checkOllamaConnection(ollamaUrl);
        if (!isUp) throw new Error(`Ollama at ${ollamaUrl} is unreachable.`);
        onUpdateSettings({ 
          ...settings, 
          ollamaUrl: ollamaUrl,
          activeProvider: 'ollama'
        });
      } else {
        setStatusMsg('Checking Manual Connection...');
        const validUrl = await checkConnection(customUrl);
        if (!validUrl) throw new Error(`Server at ${customUrl} is unreachable.`);
        onUpdateSettings({ 
          ...settings, 
          foundryUrl: validUrl,
          activeProvider: 'foundry'
        });
      }
      
      onConnect({ id: 'local-admin', username: 'User', role: 'admin' });
    } catch (e: any) {
      setError(e.message || "Connection failed.");
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
             <div className={`h-full transition-all duration-1000 ${
               localServerStatus === 'found' ? 'w-full bg-green-500' : 
               localServerStatus === 'checking' ? 'w-1/2 bg-brand-500 animate-pulse' : 'w-0'
             }`} />
          </div>

          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/20">
               <BrainCircuit size={32} className="text-white" />
             </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-1">FoundryLocal</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            {localServerStatus === 'checking' && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Checking local status...</span>}
            {localServerStatus === 'found' && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Local Engine Detected</span>}
            {localServerStatus === 'not-found' && <span className="text-[10px] text-gray-600 flex items-center gap-1"><WifiOff size={10} /> No local engine found</span>}
          </div>
          
          {error && (
            <div className="mb-6 bg-red-900/10 border border-red-800/50 rounded-xl overflow-hidden p-3 text-red-300 text-xs flex gap-3 items-start">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" /> 
              <p>{error}</p>
            </div>
          )}

          <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-gray-800">
             <button onClick={() => setMode('foundry')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === 'foundry' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Foundry</button>
             <button onClick={() => setMode('ollama')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === 'ollama' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Ollama</button>
             <button onClick={() => setMode('manual')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === 'manual' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Custom</button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
             {mode === 'foundry' && (
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Preferred Model</label>
                  <div className="relative">
                    <input type="text" value={modelAlias} onChange={e => setModelAlias(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-brand-500/50 outline-none font-mono text-sm transition-all" />
                    <Terminal size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />
                  </div>
               </div>
             )}

             {mode === 'ollama' && (
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ollama URL</label>
                  <div className="relative">
                    <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-brand-500/50 outline-none font-mono text-sm" />
                    <Box size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />
                  </div>
               </div>
             )}

             {mode === 'manual' && (
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Custom Endpoint</label>
                  <div className="relative">
                    <input type="text" value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-brand-500/50 outline-none font-mono text-sm" />
                    <Wifi size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />
                  </div>
               </div>
             )}

             <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-lg shadow-brand-600/20">
               {loading ? <Loader2 className="animate-spin" size={20} /> : mode === 'foundry' ? <Download size={18} /> : <Wifi size={18} />} 
               {loading ? 'Connecting...' : mode === 'foundry' ? 'Launch & Connect' : 'Connect Engine'}
             </button>
          </form>

          {loading && statusMsg && (
             <p className="mt-4 text-center text-[10px] text-brand-400 font-bold uppercase tracking-widest animate-pulse">{statusMsg}</p>
          )}

          <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-gray-800/50"></div>
              <span className="flex-shrink-0 mx-4 text-gray-700 text-[10px] font-bold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-gray-800/50"></div>
          </div>

          <button type="button" onClick={() => { onUpdateSettings({ ...settings, useGeminiDirect: true, activeProvider: 'gemini' }); onConnect({ id: 'demo-user', username: 'Cloud User', role: 'user' }); }} className="w-full group text-gray-500 hover:text-brand-400 font-bold py-2 text-xs transition-all flex justify-center items-center gap-2">
              <Zap size={14} className="group-hover:fill-brand-400 transition-all" /> Continue with Cloud AI (Gemini)
          </button>
       </div>
       <p className="mt-8 text-[10px] text-gray-600 font-medium text-center">FoundryLocal & Ollama Ecosystem</p>
    </div>
  );
};

// --- Main Layout Component ---
const Layout = ({ user, onLogout, settings, setSettings }: { 
  user: User, 
  onLogout: () => void, 
  settings: AppSettings, 
  setSettings: (s: AppSettings) => void 
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.defaultModel || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopGeneration, setStopGeneration] = useState<(() => void) | null>(null);

  useEffect(() => {
    const loadModels = async () => {
       try {
         let fetchedModels: Model[] = [];
         if (settings.activeProvider === 'gemini') {
           fetchedModels = getGeminiModels();
         } else if (settings.activeProvider === 'ollama') {
           fetchedModels = await getOllamaModels(settings.ollamaUrl);
         } else {
           fetchedModels = await getModels(settings.foundryUrl);
         }
         setModels(fetchedModels);
         if (fetchedModels.length > 0 && !selectedModelId) {
            setSelectedModelId(fetchedModels[0].id);
         }
       } catch (e) {
         console.error("Model load failed", e);
       }
    };
    loadModels();
  }, [settings.activeProvider, settings.foundryUrl, settings.ollamaUrl]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      modelId: selectedModelId
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  useEffect(() => {
    if (sessions.length === 0) handleNewChat();
  }, []);

  const handleSendMessage = async (content: string, attachments: File[] = []) => {
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now(),
      attachments: attachments.map(f => ({ name: f.name, type: 'file' }))
    };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { 
      ...s, 
      messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? content.substring(0, 30) : s.title 
    } : s));
    
    setIsStreaming(true);
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
      isThinking: true
    };
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, initialAiMsg] } : s));

    try {
      const history = sessions.find(s => s.id === currentSessionId)?.messages || [];
      const fullHistory = [...history, userMsg];

      if (settings.activeProvider === 'gemini') {
        const streamResult = await streamGeminiResponse(selectedModelId, fullHistory, settings.systemPrompt);
        for await (const chunk of streamResult) {
          const text = chunk.text;
          if (text) {
            setSessions(curr => curr.map(s => s.id === currentSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: m.content + text, isThinking: false } : m)
            } : s));
          }
        }
        setIsStreaming(false);
      } else if (settings.activeProvider === 'ollama') {
        const stopFn = await streamOllamaChat(
          settings.ollamaUrl,
          fullHistory,
          selectedModelId,
          settings.systemPrompt,
          (chunk) => {
            setSessions(curr => curr.map(s => s.id === currentSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk, isThinking: false } : m)
            } : s));
          },
          () => setIsStreaming(false)
        );
        setStopGeneration(() => stopFn);
      } else {
        const stopFn = await streamChat(
          settings.foundryUrl,
          fullHistory,
          selectedModelId,
          attachments,
          settings.systemPrompt,
          (chunk) => {
            setSessions(curr => curr.map(s => s.id === currentSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk, isThinking: false } : m)
            } : s));
          },
          () => setIsStreaming(false)
        );
        setStopGeneration(() => stopFn);
      }
    } catch (e: any) {
      setSessions(curr => curr.map(s => s.id === currentSessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: `Error: ${e.message}`, isThinking: false } : m)
      } : s));
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    if (stopGeneration) stopGeneration();
    setIsStreaming(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
       <Sidebar 
         sessions={sessions}
         currentSessionId={currentSessionId}
         user={user}
         onSelectSession={setCurrentSessionId}
         onNewChat={handleNewChat}
         onLogout={onLogout}
         onOpenSettings={() => setSettingsOpen(true)}
         isOpen={sidebarOpen}
         onToggle={() => setSidebarOpen(!sidebarOpen)}
       />
       
       <div className="flex-1 flex flex-col h-full relative">
         {currentSession && (
           <ChatInterface 
             messages={currentSession.messages}
             models={models}
             selectedModelId={selectedModelId}
             onModelChange={setSelectedModelId}
             onSendMessage={handleSendMessage}
             isStreaming={isStreaming}
             onStop={handleStop}
             settings={settings}
           />
         )}
       </div>

       <SettingsModal 
         isOpen={settingsOpen}
         onClose={() => setSettingsOpen(false)}
         settings={settings}
         onSave={setSettings}
       />
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    foundryUrl: 'http://127.0.0.1:8000/v1',
    ollamaUrl: 'http://127.0.0.1:11434',
    systemPrompt: 'You are a helpful AI assistant.',
    defaultModel: '',
    enableWebSearch: false,
    useGeminiDirect: false,
    activeProvider: 'foundry'
  });

  return (
    <div className="h-screen w-full">
      {!user ? (
        <ConnectPage onConnect={setUser} settings={settings} onUpdateSettings={setSettings} />
      ) : (
        <Layout user={user} onLogout={() => setUser(null)} settings={settings} setSettings={setSettings} />
      )}
    </div>
  );
};

export default App;