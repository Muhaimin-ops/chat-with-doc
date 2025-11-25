
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, X, Edit2, Check, History, Book, MessageSquare, Globe, User, LogOut, Settings } from 'lucide-react';
import { URLGroup, ChatSession } from '../types';
import { fetchRelevantUrlsFromSearch } from '../services/geminiService';
import UrlSuggestionModal from './UrlSuggestionModal';
import ThemeSwitcher, { ThemeMode, ColorScheme } from './ThemeSwitcher';

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
  onOpenSettings: () => void;
  userEmail?: string;
  themeProps?: {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    color: ColorScheme;
    setColor: (color: ColorScheme) => void;
  };
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
  onSignOut,
  onOpenSettings,
  userEmail,
  themeProps
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

  // User Profile Dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    selectedUrls.forEach(url => {
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
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--panel-bg)] shadow-md rounded-xl border border-[var(--border)] overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Documind</h2>
            {onCloseSidebar && (
              <button
                onClick={onCloseSidebar}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--element-hover)] transition-colors md:hidden"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            )}
          </div>
          
          <div className="flex p-1 bg-[var(--element-bg)] rounded-lg">
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'knowledge' 
                  ? 'bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Book size={14} /> Knowledge
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'history' 
                  ? 'bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  {isCreating ? "New Group Name" : (isRenaming ? "Rename Group" : "Active Group")}
                </label>
                {!isCreating && !isRenaming && (
                  <div className="flex gap-1">
                    <button 
                      onClick={startCreating}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--element-hover)] rounded transition-colors"
                      title="Create New Group"
                    >
                      <Plus size={14} />
                    </button>
                    {hasGroups && (
                      <>
                        <button 
                          onClick={startRenaming}
                          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--element-hover)] rounded transition-colors"
                          title="Rename Current Group"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={handleDeleteActiveGroup}
                          className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--element-hover)] rounded transition-colors"
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
                    className="flex-grow h-9 px-2.5 border border-[var(--border)] bg-[var(--element-bg)] text-[var(--text-primary)] rounded-md focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-sm outline-none"
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    onClick={saveGroupAction}
                    className="p-2 bg-[var(--accent-dim)] text-[var(--accent-text)] rounded-md hover:opacity-80 transition-colors"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelGroupAction}
                    className="p-2 bg-[var(--element-bg)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--element-hover)] transition-colors"
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
                        className="w-full py-2 pl-3 pr-8 appearance-none border border-[var(--border)] bg-[var(--element-bg)] text-[var(--text-primary)] rounded-md focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-sm truncate outline-none"
                      >
                        {urlGroups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)] pointer-events-none"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    <div 
                      className="text-sm text-[var(--text-secondary)] italic py-2 px-3 border border-[var(--border)] bg-[var(--element-bg)] rounded-md cursor-pointer hover:bg-[var(--element-hover)] transition-colors flex items-center gap-2"
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
                className="flex-grow h-8 py-1 px-2.5 border border-[var(--border)] bg-[var(--element-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-shadow text-sm disabled:opacity-50 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
              />
              {/* Manual Fetch Button */}
              <button
                onClick={handleManualFetchClick}
                disabled={!hasGroups}
                className="h-8 w-8 p-1.5 bg-[var(--accent-dim)] hover:opacity-80 text-[var(--accent-text)] rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                title={`Find ${activeGroupName ? activeGroupName : 'URLs'} on the web`}
              >
                <Globe size={16} />
              </button>
              
              <button
                onClick={handleAddUrl}
                disabled={!hasGroups || urls.length >= maxUrls}
                className="h-8 w-8 p-1.5 bg-[var(--element-bg)] hover:bg-[var(--element-hover)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center border border-[var(--border)]"
                aria-label="Add URL"
              >
                <Plus size={16} />
              </button>
            </div>
            {error && <p className="text-xs text-[var(--danger)] mb-2">{error}</p>}
            {hasGroups && urls.length >= maxUrls && <p className="text-xs text-yellow-500 mb-2">Maximum {maxUrls} URLs reached for this group.</p>}
            
            <div className="flex-grow overflow-y-auto space-y-2 chat-container">
              {hasGroups && urls.length === 0 && (
                <p className="text-[var(--text-muted)] text-center py-3 text-sm">Add documentation URLs to "{activeGroupName}" to start querying.</p>
              )}
              {!hasGroups && (
                <p className="text-[var(--text-muted)] text-center py-3 text-sm">Create a group to start adding URLs.</p>
              )}
              {urls.map((url) => (
                <div key={url} className="flex items-center justify-between p-2.5 bg-[var(--element-bg)] border border-[var(--border)] rounded-lg hover:shadow-sm transition-shadow">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-text)] hover:underline truncate" title={url}>
                    {url}
                  </a>
                  <button 
                    onClick={() => onRemoveUrl(url)}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-md hover:bg-[var(--app-bg)] transition-colors flex-shrink-0 ml-2"
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
              className="w-full flex items-center justify-center gap-2 py-2 mb-4 bg-[var(--accent-dim)] text-[var(--accent-text)] hover:opacity-80 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} /> New Chat
            </button>
            
            <div className="flex-grow overflow-y-auto space-y-2 chat-container">
              {chatSessions.length === 0 ? (
                 <p className="text-[var(--text-muted)] text-center py-3 text-sm">No chat history yet.</p>
              ) : (
                chatSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentSessionId === session.id
                        ? 'bg-[var(--element-hover)] border-[var(--border)] text-[var(--text-primary)]'
                        : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'
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

        <div className="p-4 border-t border-[var(--border)] mt-auto relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--element-hover)] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--app-bg)] flex items-center justify-center font-bold">
              {userInitial}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userEmail || 'User'}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">Free Plan</p>
            </div>
            <ChevronDown size={14} className={`text-[var(--text-secondary)] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--element-bg)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              {themeProps && (
                 <ThemeSwitcher {...themeProps} />
              )}
              <div className="h-px bg-[var(--border)]"></div>
              <div className="p-1">
                 <button 
                   onClick={() => {
                     setIsProfileOpen(false);
                     onOpenSettings();
                   }}
                   className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--element-hover)] rounded-md transition-colors"
                 >
                   <Settings size={14} /> Settings
                 </button>
                 <button 
                  onClick={onSignOut}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-colors"
                >
                   <LogOut size={14} /> Sign Out
                 </button>
              </div>
            </div>
          )}
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
