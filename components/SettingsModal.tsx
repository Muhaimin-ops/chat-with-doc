
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { X, Key, Save, CheckCircle, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load from local storage
      const storedKey = localStorage.getItem('DOCUMIND_API_KEY') || '';
      const storedProvider = localStorage.getItem('DOCUMIND_PROVIDER') || 'gemini';
      setApiKey(storedKey);
      setProvider(storedProvider);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('DOCUMIND_API_KEY', apiKey.trim());
    localStorage.setItem('DOCUMIND_PROVIDER', provider);
    
    // Visual feedback
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--panel-bg)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Server size={18} className="text-[var(--accent)]" /> 
            Model Settings
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--element-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
               <button 
                 onClick={() => setProvider('gemini')}
                 className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${provider === 'gemini' ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'}`}
               >
                 Google Gemini
               </button>
               <button 
                 onClick={() => setProvider('openai')}
                 className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${provider === 'openai' ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'}`}
                 disabled // Disabled for demo consistency
                 title="Coming Soon"
               >
                 OpenAI
               </button>
               <button 
                 onClick={() => setProvider('custom')}
                 className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${provider === 'custom' ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'}`}
                 disabled // Disabled for demo consistency
                 title="Coming Soon"
               >
                 Custom
               </button>
            </div>
            {provider !== 'gemini' && (
                <p className="text-xs text-[var(--text-muted)]">Support for other providers is coming soon. Currently using Gemini Flash/Pro.</p>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                <span>API Key</span>
                <span className="text-[10px] font-normal normal-case text-[var(--accent-text)] cursor-pointer hover:underline" onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>Get Key</span>
            </label>
            <div className="relative">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? "AIzaSy..." : "sk-..."}
                className="w-full pl-10 pr-3 py-2.5 bg-[var(--element-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--text-primary)] text-sm font-mono"
              />
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Your key is stored locally in your browser and used directly to communicate with the API.
            </p>
          </div>

        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end bg-[var(--panel-bg)] rounded-b-xl">
           <button 
             onClick={handleSave}
             className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isSaved ? 'bg-green-500/20 text-green-500' : 'bg-[var(--element-hover)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white'}`}
           >
             {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
             {isSaved ? 'Saved!' : 'Save Settings'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
