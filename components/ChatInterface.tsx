import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role, Model, AppSettings } from '../types';
import { Send, Paperclip, Globe, StopCircle, Bot, User, BrainCircuit, X } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  models: Model[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onSendMessage: (content: string, attachments?: File[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  settings: AppSettings;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  models,
  selectedModelId,
  onModelChange,
  onSendMessage,
  isStreaming,
  onStop,
  settings
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(settings.enableWebSearch);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 relative">
      
      {/* Top Bar / Model Selector */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950/80 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2">
           <div className="relative">
             <select 
               value={selectedModelId}
               onChange={(e) => onModelChange(e.target.value)}
               className="appearance-none bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none font-medium cursor-pointer hover:bg-gray-800 transition-colors"
             >
               {models.length > 0 ? (
                 models.map(m => (
                   <option key={m.id} value={m.id}>{m.name}</option>
                 ))
               ) : (
                 <option value="" disabled>No models detected</option>
               )}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
           
           {settings.useGeminiDirect && (
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/50 text-blue-300 border border-blue-800 uppercase tracking-wider">
               Gemini Native
             </span>
           )}
           {!settings.useGeminiDirect && (
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/50 text-green-300 border border-green-800 uppercase tracking-wider">
               Local
             </span>
           )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 select-none">
            <BrainCircuit size={48} className="mb-4 text-gray-700" />
            <p className="text-lg font-medium">FoundryLocal</p>
            <p className="text-sm">Ready to assist. Select a model to begin.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
            
            {msg.role !== Role.USER && (
               <div className="w-8 h-8 rounded-full bg-brand-600 flex-shrink-0 flex items-center justify-center mt-1">
                 <Bot size={16} className="text-white" />
               </div>
            )}

            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                 <span className="text-xs font-semibold text-gray-400">
                    {msg.role === Role.USER ? 'You' : models.find(m => m.id === selectedModelId)?.name || 'AI'}
                 </span>
              </div>
              
              <div className={`px-4 py-3 rounded-2xl ${
                msg.role === Role.USER 
                  ? 'bg-gray-800 text-white rounded-tr-sm' 
                  : 'bg-transparent text-gray-100 px-0' 
              }`}>
                 {msg.role === Role.USER ? (
                   <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                 ) : (
                   <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                     >
                       {msg.content}
                     </ReactMarkdown>
                   </div>
                 )}
              </div>
            </div>

            {msg.role === Role.USER && (
               <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center mt-1">
                 <User size={16} className="text-gray-300" />
               </div>
            )}
          </div>
        ))}
        
        {isStreaming && (
           <div className="flex gap-4 max-w-4xl mx-auto">
             <div className="w-8 h-8 rounded-full bg-brand-600 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                 <Bot size={16} className="text-white" />
             </div>
             <div className="flex items-center gap-1 mt-3">
               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950">
        <div className="max-w-4xl mx-auto relative">
            
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-200">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Controls */}
            <div className="absolute left-3 bottom-3 flex items-center gap-2 z-10">
               <input 
                 type="file" 
                 multiple 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleFileSelect}
               />
               <button 
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Attach file (RAG)"
                onClick={() => fileInputRef.current?.click()}
               >
                 <Paperclip size={18} />
               </button>
               <button 
                className={`p-1.5 rounded-lg transition-colors ${isWebSearchEnabled ? 'text-brand-400 bg-brand-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                title="Toggle Web Search"
               >
                 <Globe size={18} />
               </button>
            </div>

            <textarea 
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "Thinking..." : "Send a message..."}
              disabled={isStreaming}
              className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-xl pl-24 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none max-h-48 overflow-y-auto"
            />

            <div className="absolute right-2 bottom-2">
              {isStreaming ? (
                 <button onClick={onStop} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                    <StopCircle size={18} />
                 </button>
              ) : (
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-2 rounded-lg transition-all ${input.trim() || attachments.length > 0 ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                  <Send size={18} />
                </button>
              )}
            </div>
        </div>
        <div className="max-w-4xl mx-auto text-center mt-2">
          <p className="text-[10px] text-gray-600">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
};
