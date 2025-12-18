import React from 'react';
import { Plus, MessageSquare, Search, LogOut, Settings, User as UserIcon, PanelLeftClose } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  user: User;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  user,
  onSelectSession,
  onNewChat,
  onLogout,
  onOpenSettings,
  isOpen,
  onToggle
}) => {
  if (!isOpen) {
    return (
      <div className="fixed left-0 top-0 h-full p-2 z-20 hidden md:flex flex-col gap-2">
         <button onClick={onToggle} className="p-2 bg-gray-950 text-gray-400 hover:text-white rounded-lg border border-gray-800 shadow-lg">
            <PanelLeftClose className="rotate-180" size={20} />
         </button>
      </div>
    );
  }

  return (
    <div className="h-full w-64 bg-gray-950 border-r border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300 relative z-20">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <button 
          onClick={onNewChat}
          className="flex-1 flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-200 px-3 py-2 rounded-lg border border-gray-800 transition-all text-sm font-medium group"
        >
          <Plus size={16} className="group-hover:scale-110 transition-transform"/> New Chat
        </button>
        <button onClick={onToggle} className="ml-2 p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
           <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Search (Mock) */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input 
            type="text" 
            placeholder="Search chats..." 
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-300 focus:border-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1 mt-2">History</div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
              currentSessionId === session.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
            }`}
          >
            <div className="flex-1 truncate relative">
              {session.title || 'Untitled Chat'}
              {/* Blur fade effect for long titles */}
              <div className={`absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-950 to-transparent ${currentSessionId === session.id ? 'from-gray-800' : 'from-gray-950'} `}></div>
            </div>
          </button>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-950">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-brand-500/20">
            {user.username.substring(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.username}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Settings size={14} /> Settings
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};
