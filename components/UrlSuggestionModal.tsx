
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface UrlSuggestionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  topic: string;
  suggestedUrls: string[];
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
}

const UrlSuggestionModal: React.FC<UrlSuggestionModalProps> = ({
  isOpen,
  isLoading,
  topic,
  suggestedUrls,
  onClose,
  onConfirm
}) => {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');

  // Reset state when opening with new suggestions
  useEffect(() => {
    if (isOpen && suggestedUrls.length > 0) {
      setUrls(suggestedUrls);
      setSelectedUrls(new Set(suggestedUrls));
    }
  }, [isOpen, suggestedUrls]);

  if (!isOpen) return null;

  const handleToggle = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const handleAddUrl = () => {
    const trimmed = newUrl.trim();
    if (trimmed) {
      setUrls(prev => [...prev, trimmed]);
      setSelectedUrls(prev => new Set(prev).add(trimmed));
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(prev => prev.filter(u => u !== urlToRemove));
    const newSelected = new Set(selectedUrls);
    newSelected.delete(urlToRemove);
    setSelectedUrls(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedUrls));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.1)] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)]">
          <div>
            <h3 className="text-lg font-semibold text-[#E2E2E2]">
              {isLoading ? 'Searching...' : 'Suggested Sources'}
            </h3>
            <p className="text-xs text-[#A8ABB4]">
              {isLoading ? `Finding relevant documentation for "${topic}"` : `Found relevant sources for "${topic}"`}
            </p>
          </div>
          {!isLoading && (
            <button 
              onClick={onClose}
              className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 size={32} className="text-[#79B8FF] animate-spin" />
              <p className="text-sm text-[#A8ABB4]">Scanning the web for official docs...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#E2E2E2] mb-3">
                Review the list below. Uncheck any URLs you don't want to include, or add your own.
              </p>
              
              {urls.length === 0 && (
                <div className="text-center py-6 text-[#777777] text-sm border border-dashed border-[rgba(255,255,255,0.1)] rounded-lg">
                  No URLs found. Try adding one manually.
                </div>
              )}

              {urls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="flex items-start gap-3 p-2 bg-[#2C2C2C] rounded-lg border border-[rgba(255,255,255,0.05)] group">
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      checked={selectedUrls.has(url)}
                      onChange={() => handleToggle(url)}
                      className="w-4 h-4 rounded border-gray-600 text-[#79B8FF] focus:ring-[#79B8FF] bg-[#1E1E1E]"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm text-[#E2E2E2] truncate break-all">{url}</div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#79B8FF] flex items-center gap-1 hover:underline mt-0.5">
                      Visit Link <ExternalLink size={10} />
                    </a>
                  </div>
                  <button 
                    onClick={() => handleRemoveUrl(url)}
                    className="p-1.5 text-[#A8ABB4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from list"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Add custom URL..."
                  className="flex-grow h-9 px-3 bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-md text-sm text-[#E2E2E2] focus:border-[#79B8FF] focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                />
                <button
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim()}
                  className="h-9 px-3 bg-[#2C2C2C] hover:bg-[#363636] text-[#E2E2E2] rounded-md border border-[rgba(255,255,255,0.1)] disabled:opacity-50 text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex justify-end gap-2 bg-[#1E1E1E] rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#A8ABB4] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-[#79B8FF]/20 hover:bg-[#79B8FF]/30 text-[#79B8FF] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Add Selected ({selectedUrls.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlSuggestionModal;
