
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, X, Edit2, Check, History, Book, MessageSquare, Globe, Loader2 } from 'lucide-react';
import { URLGroup, ChatSession } from '../types';
import { fetchRelevantUrlsFromSearch } from '../services/geminiService';
import UrlSuggestionModal from './UrlSuggestionModal';

interface KnowledgeBaseManagerProps {
  urls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
  maxUrls?: number;
  urlGroups: URLGroup[];
  activeUrlGroupId: string;
  onSetGroupId: (id: string) => void;
  onAddGroup: (name: string) => void;
  onRenameGroup: (id: string, newName: string) => void;
  onDeleteGroup: (id: string) => void;
  onCloseSidebar?: () => void;
  chatSessions: ChatSession[];
  onSelectSession: (id: string) => void;
  currentSessionId: string | null;
  onNewChat: () => void;
  onSignOut: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  urls, 
  onAddUrl, 
  onRemoveUrl, 
  maxUrls = 20,
  urlGroups,
  activeUrlGroupId,
  onSetGroupId,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onCloseSidebar,
  chatSessions,
  onSelectSession,
  currentSessionId,
  onNewChat,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'history'>('knowledge');
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Group management state
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');

  // Fetching / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingUrls, setIsFetchingUrls] = useState(false);
  const [suggestedUrls, setSuggestedUrls] = useState<string[]>([]);
  const [fetchTopic, setFetchTopic] = useState('');

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!activeUrlGroupId) {
      setError('Please create or select a group first.');
      return;
    }
    if (!currentUrlInput.trim()) {
      setError('URL cannot be empty.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }
    if (urls.length >= maxUrls) {
      setError(`You can add a maximum of ${maxUrls} URLs to the current group.`);
      return;
    }
    if (urls.includes(currentUrlInput)) {
      setError('This URL has already been added to the current group.');
      return;
    }
    onAddUrl(currentUrlInput);
    setCurrentUrlInput('');
    setError(null);
  };

  const startCreating = () => {
    setIsCreating(true);
    setIsRenaming(false);
    setTempGroupName('');
    setError(null);
  };

  const startRenaming = () => {
    const currentGroup = urlGroups.find(g => g.id === activeUrlGroupId);
    if (currentGroup) {
      setIsRenaming(true);
      setIsCreating(false);
      setTempGroupName(currentGroup.name);
      setError(null);
    }
  };

  const cancelGroupAction = () => {
    setIsCreating(false);
    setIsRenaming(false);
    setTempGroupName('');
    setError(null);
  };

  const triggerUrlFetch = async (topic: string) => {
    setFetchTopic(topic);
    setIsModalOpen(true);
    setIsFetchingUrls(true);
    setSuggestedUrls([]);
    
    try {
      const results = await fetchRelevantUrlsFromSearch(topic);
      setSuggestedUrls(results);
    } catch (e) {
      console.error("Failed to fetch URLs", e);
      // Keep modal open but maybe show error inside? 
      // For now, empty list handles it.
    } finally {
      setIsFetchingUrls(false);
    }
  };

  const saveGroupAction = async () => {
    const name = tempGroupName.trim();
    if (!name) {
      setError("Group name cannot be empty");
      return;
    }

    if (isCreating) {
      onAddGroup(name);
      cancelGroupAction();
      // Auto-trigger fetch for the new group
      triggerUrlFetch(name);
    } else if (isRenaming) {
      onRenameGroup(activeUrlGroupId, name);
      cancelGroupAction();
    }
  };

  const handleDeleteActiveGroup = () => {
    if (window.confirm("Are you sure you want to delete this group and all its URLs?")) {
      onDeleteGroup(activeUrlGroupId);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveGroupAction();
    } else if (e.key === 'Escape') {
      cancelGroupAction();
    }
  };

  const handleModalConfirm = (selectedUrls: string[]) => {
    // Loop to add all confirmed URLs.
    // Note: In a real app, we'd want a bulk insert endpoint.
    // Here we rely on the prop which likely does optimistic updates or fast inserts.
    selectedUrls.forEach(url => {
       // Basic de-dupe check against current list (though parent handles duplicate logic usually)
       if (!urls.includes(url)) {
         onAddUrl(url);
       }
    });
    setIsModalOpen(false);
    setSuggestedUrls([]);
  };

  const handleManualFetchClick = () => {
    if (activeGroupName) {
      triggerUrlFetch(activeGroupName);
    }
  };

  const activeGroupName = urlGroups.find(g => g.id === activeUrlGroupId)?.name;
  const hasGroups = urlGroups.length > 0;

  return (
    <>
      <div className="flex flex-col h-full bg-[#1E1E1E] shadow-md rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#E2E2E2]">Library</h2>
            {onCloseSidebar && (
              <button
                onClick={onCloseSidebar}
                className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            )}
          </div>
          
          <div className="flex p-1 bg-[#2C2C2C] rounded-lg">
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'knowledge' 
                  ? 'bg-[#4A4A4A] text-white shadow-sm' 
                  : 'text-[#A8ABB4] hover:text-white'
              }`}
            >
              <Book size={14} /> Knowledge
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'history' 
                  ? 'bg-[#4A4A4A] text-white shadow-sm' 
                  : 'text-[#A8ABB4] hover:text-white'
              }`}
            >
              <History size={14} /> History
            </button>
          </div>
        </div>

        {activeTab === 'knowledge' && (
          <div className="flex flex-col flex-grow p-4 overflow-hidden">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#A8ABB4]">
                  {isCreating ? "New Group Name" : (isRenaming ? "Rename Group" : "Active Group")}
                </label>
                {!isCreating && !isRenaming && (
                  <div className="flex gap-1">
                    <button 
                      onClick={startCreating}
                      className="p-1 text-[#A8ABB4] hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Create New Group"
                    >
                      <Plus size={14} />
                    </button>
                    {hasGroups && (
                      <>
                        <button 
                          onClick={startRenaming}
                          className="p-1 text-[#A8ABB4] hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Rename Current Group"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={handleDeleteActiveGroup}
                          className="p-1 text-[#A8ABB4] hover:text-[#f87171] hover:bg-white/10 rounded transition-colors"
                          title="Delete Current Group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isCreating || isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempGroupName}
                    onChange={(e) => setTempGroupName(e.target.value)}
                    placeholder="Group Name"
                    autoFocus
                    className="flex-grow h-9 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm"
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    onClick={saveGroupAction}
                    className="p-2 bg-[#79B8FF]/20 text-[#79B8FF] rounded-md hover:bg-[#79B8FF]/30 transition-colors"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelGroupAction}
                    className="p-2 bg-white/[.05] text-[#A8ABB4] rounded-md hover:bg-white/[.1] transition-colors"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative w-full">
                  {hasGroups ? (
                    <>
                      <select
                        value={activeUrlGroupId}
                        onChange={(e) => onSetGroupId(e.target.value)}
                        className="w-full py-2 pl-3 pr-8 appearance-none border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm truncate"
                      >
                        {urlGroups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ABB4] pointer-events-none"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    <div 
                      className="text-sm text-[#A8ABB4] italic py-2 px-3 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] rounded-md cursor-pointer hover:bg-[#363636] transition-colors flex items-center gap-2"
                      onClick={startCreating}
                    >
                      <Plus size={14} />
                      <span>No groups available. Create one</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="url"
                value={currentUrlInput}
                onChange={(e) => setCurrentUrlInput(e.target.value)}
                placeholder="Add URL..."
                disabled={!hasGroups}
                className="flex-grow h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm disabled:opacity-50"
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
              />
              {/* Manual Fetch Button */}
              <button
                onClick={handleManualFetchClick}
                disabled={!hasGroups}
                className="h-8 w-8 p-1.5 bg-[#79B8FF]/10 hover:bg-[#79B8FF]/20 text-[#79B8FF] rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center disabled:opacity-50"
                title={`Find ${activeGroupName ? activeGroupName : 'URLs'} on the web`}
              >
                <Globe size={16} />
              </button>
              
              <button
                onClick={handleAddUrl}
                disabled={!hasGroups || urls.length >= maxUrls}
                className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center disabled:opacity-50"
                aria-label="Add URL"
              >
                <Plus size={16} />
              </button>
            </div>
            {error && <p className="text-xs text-[#f87171] mb-2">{error}</p>}
            {hasGroups && urls.length >= maxUrls && <p className="text-xs text-[#fbbf24] mb-2">Maximum {maxUrls} URLs reached for this group.</p>}
            
            <div className="flex-grow overflow-y-auto space-y-2 chat-container">
              {hasGroups && urls.length === 0 && (
                <p className="text-[#777777] text-center py-3 text-sm">Add documentation URLs to "{activeGroupName}" to start querying.</p>
              )}
              {!hasGroups && (
                <p className="text-[#777777] text-center py-3 text-sm">Create a group to start adding URLs.</p>
              )}
              {urls.map((url) => (
                <div key={url} className="flex items-center justify-between p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#79B8FF] hover:underline truncate" title={url}>
                    {url}
                  </a>
                  <button 
                    onClick={() => onRemoveUrl(url)}
                    className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2"
                    aria-label={`Remove ${url}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col flex-grow p-4 overflow-hidden">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 mb-4 bg-[#79B8FF]/20 text-[#79B8FF] hover:bg-[#79B8FF]/30 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} /> New Chat
            </button>
            
            <div className="flex-grow overflow-y-auto space-y-2 chat-container">
              {chatSessions.length === 0 ? (
                 <p className="text-[#777777] text-center py-3 text-sm">No chat history yet.</p>
              ) : (
                chatSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentSessionId === session.id
                        ? 'bg-[#4A4A4A] border-white/10 text-white'
                        : 'bg-[#2C2C2C] border-transparent text-[#A8ABB4] hover:bg-[#363636] hover:text-[#E2E2E2]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={14} className="flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{session.title || 'Untitled Chat'}</span>
                    </div>
                    <span className="text-[10px] opacity-60 block ml-6">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-[rgba(255,255,255,0.05)] mt-auto">
          <button
            onClick={onSignOut}
            className="w-full py-2 px-4 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <UrlSuggestionModal
        isOpen={isModalOpen}
        isLoading={isFetchingUrls}
        topic={fetchTopic}
        suggestedUrls={suggestedUrls}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
};

export default KnowledgeBaseManager;
