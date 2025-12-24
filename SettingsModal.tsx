import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Save, Server, Monitor, Shield, Box } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'foundry' | 'ollama' | 'gemini'>('general');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-850 w-full max-w-2xl rounded-xl border border-gray-750 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-750 bg-gray-950">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-950 border-r border-gray-750 p-2 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'general' ? 'bg-gray-800 text-brand-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Monitor size={16} /> General
            </button>
            <button
              onClick={() => setActiveTab('foundry')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'foundry' ? 'bg-gray-800 text-brand-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Server size={16} /> FoundryLocal
            </button>
            <button
              onClick={() => setActiveTab('ollama')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'ollama' ? 'bg-gray-800 text-brand-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Box size={16} /> Ollama
            </button>
            <button
              onClick={() => setActiveTab('gemini')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'gemini' ? 'bg-gray-800 text-brand-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Shield size={16} /> Google Gemini
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-850">
            
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
                  <textarea 
                    className="w-full bg-gray-950 border border-gray-750 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    rows={4}
                    value={localSettings.systemPrompt}
                    onChange={(e) => setLocalSettings({...localSettings, systemPrompt: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Default instructions given to the model at the start of every chat.</p>
                </div>

                <div className="space-y-3">
                  <span className="block text-sm font-medium text-gray-300">Active AI Provider</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['foundry', 'ollama', 'gemini'].map(p => (
                      <button
                        key={p}
                        onClick={() => setLocalSettings({...localSettings, activeProvider: p as any, useGeminiDirect: p === 'gemini'})}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                          localSettings.activeProvider === p 
                            ? 'bg-brand-600 border-brand-500 text-white' 
                            : 'bg-gray-950 border-gray-750 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'foundry' && (
              <div className="space-y-6">
                 <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Foundry Backend URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-950 border border-gray-750 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={localSettings.foundryUrl}
                    onChange={(e) => setLocalSettings({...localSettings, foundryUrl: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">The address of your local Foundry backend server.</p>
                </div>
              </div>
            )}

            {activeTab === 'ollama' && (
              <div className="space-y-6">
                 <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ollama Endpoint</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={localSettings.ollamaUrl}
                    onChange={(e) => setLocalSettings({...localSettings, ollamaUrl: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Typically http://127.0.0.1:11434</p>
                </div>
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-400">
                  Ensure Ollama is running and has models downloaded (e.g. <code>ollama run llama3</code>).
                </div>
              </div>
            )}

            {activeTab === 'gemini' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-1">Direct Integration</h4>
                  <p className="text-xs text-blue-300">
                    Communicates directly with Google's Gemini API via GenAI SDK. 
                    Uses environment variable API key.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-750 flex justify-end gap-3 bg-gray-950">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-colors flex items-center gap-2">
            <Save size={16} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};