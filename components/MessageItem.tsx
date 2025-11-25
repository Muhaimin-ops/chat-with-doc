
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender, FeedbackType } from '../types';
import { ExternalLink, CheckSquare, Plus, Trash2, ArrowRight, Copy, ThumbsUp, ThumbsDown, Check, RotateCcw } from 'lucide-react';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-', 
  gfm: true,
  breaks: true,
} as any);

interface MessageItemProps {
  message: ChatMessage;
  onConfirmSources?: (messageId: string, selectedUrls: string[], originalQuery: string) => void;
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let avatarChar = '';
  let bgColorClass = '';
  let textColorClass = '';

  if (sender === MessageSender.USER) {
    avatarChar = 'U';
    bgColorClass = 'bg-[var(--accent)]';
    textColorClass = 'text-[var(--app-bg)]';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'AI';
    bgColorClass = 'bg-[var(--element-hover)]'; 
    textColorClass = 'text-[var(--text-primary)]';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-[var(--element-bg)]';
    textColorClass = 'text-[var(--text-secondary)]';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} ${textColorClass} flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-sm`}>
      {avatarChar}
    </div>
  );
};

const SourceSelectionUI: React.FC<{
  messageId: string;
  originalQuery: string;
  initialUrls: string[];
  onConfirm: (messageId: string, urls: string[], query: string) => void;
}> = ({ messageId, originalQuery, initialUrls, onConfirm }) => {
  const [selectedUrls, setSelectedUrls] = useState<string[]>(initialUrls);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      const url = newUrl.trim();
      if (!selectedUrls.includes(url)) {
          setSelectedUrls(prev => [...prev, url]);
      }
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const removeUrl = (url: string) => {
    setSelectedUrls(prev => prev.filter(u => u !== url));
  };

  return (
    <div className="mt-2 p-3 bg-[var(--app-bg)] rounded-lg border border-[var(--border)] w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Select Context Sources</h4>
        <span className="text-xs text-[var(--text-secondary)]">{selectedUrls.length} selected</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">
        I found these sources relevant to your query. Please review, add, or remove sources before I generate an answer.
      </p>
      
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {selectedUrls.map((url, idx) => (
          <div key={`${url}-${idx}`} className="flex items-center gap-2 p-2 bg-[var(--element-bg)] rounded-md group border border-transparent hover:border-[var(--border)]">
            <button 
              onClick={() => toggleUrl(url)}
              className={`transition-colors ${selectedUrls.includes(url) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
            >
              <CheckSquare size={16} />
            </button>
            <div className="flex-grow min-w-0">
               <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-primary)] hover:underline truncate block flex items-center gap-1">
                 <span className="truncate">{url}</span>
                 <ExternalLink size={10} className="opacity-50" />
               </a>
            </div>
            <button 
              onClick={() => removeUrl(url)}
              className="text-[var(--text-secondary)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        
        {isAdding ? (
          <div className="flex items-center gap-2 p-1">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="flex-grow text-xs bg-[var(--element-bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
              autoFocus
              onKeyDown={(e) => {
                 if (e.key === 'Enter') handleAddUrl();
                 if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <button onClick={handleAddUrl} className="text-[var(--accent-text)] text-xs hover:underline">Add</button>
            <button onClick={() => setIsAdding(false)} className="text-[var(--text-secondary)] text-xs hover:underline">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
             <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)] py-1 px-2 rounded hover:bg-[var(--element-hover)] transition-colors"
              >
                <Plus size={12} /> Add another URL
              </button>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-[var(--border)]">
        <button
          onClick={() => onConfirm(messageId, selectedUrls, originalQuery)}
          disabled={selectedUrls.length === 0}
          className="flex items-center gap-2 bg-[var(--accent-dim)] hover:opacity-80 text-[var(--accent-text)] px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Answer <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const ActionBar: React.FC<{
  message: ChatMessage;
  onFeedback?: (id: string, fb: FeedbackType) => void;
  onRegenerate?: (id: string, urls: string[], query: string) => void;
}> = ({ message, onFeedback, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate && message.sourceSelection) {
      onRegenerate(message.id, message.sourceSelection.urls, message.sourceSelection.originalQuery);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 border-t border-[var(--border)] pt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--element-hover)] transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {onRegenerate && message.sourceSelection && (
        <button 
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--element-hover)] transition-colors"
          title="Regenerate response"
        >
          <RotateCcw size={14} />
          Regenerate
        </button>
      )}

      {onFeedback && (
        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => onFeedback(message.id, message.feedback === 'positive' ? null : 'positive')}
            className={`p-1.5 rounded hover:bg-[var(--element-hover)] transition-colors ${message.feedback === 'positive' ? 'text-[var(--success)]' : 'text-[var(--text-secondary)] hover:text-[var(--success)]'}`}
            title="Good response"
          >
            <ThumbsUp size={14} />
          </button>
          <button 
            onClick={() => onFeedback(message.id, message.feedback === 'negative' ? null : 'negative')}
            className={`p-1.5 rounded hover:bg-[var(--element-hover)] transition-colors ${message.feedback === 'negative' ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)] hover:text-[var(--danger)]'}`}
            title="Bad response"
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, onConfirmSources, onFeedback }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const renderMessageContent = () => {
    // If we are in source selection mode, show the interactive UI
    if (message.isSourceConfirmationPending && message.sourceSelection && onConfirmSources) {
       return (
         <SourceSelectionUI 
            messageId={message.id}
            originalQuery={message.sourceSelection.originalQuery}
            initialUrls={message.sourceSelection.urls}
            onConfirm={onConfirmSources}
         />
       );
    }

    if (isModel) {
       // Even if loading (streaming), we might have text
       if (message.text) {
          const rawMarkup = marked.parse(message.text) as string;
          return (
             <div className="prose prose-sm w-full min-w-0 max-w-none">
                <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
                {message.isLoading && (
                  <span className="cursor-blink"></span>
                )}
             </div>
          );
       }
       // If loading and no text yet
       if (message.isLoading && !message.text) {
          return (
             <div className="flex flex-col gap-2">
              <span className="text-xs text-[var(--text-secondary)] animate-pulse">Thinking...</span>
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] bg-[var(--text-secondary)]`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] bg-[var(--text-secondary)]`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-[var(--text-secondary)]`}></div>
              </div>
            </div>
          );
       }
    }
    
    // User or System
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-[var(--text-primary)]'; // User bubble handles background, text is white usually or adaptive
    } else if (isSystem) {
        textColorClass = 'text-[var(--text-secondary)]';
    } else { 
        textColorClass = 'text-[var(--text-primary)]';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow-sm w-full group relative transition-colors duration-200 "; 

  if (isUser) {
    // User bubbles often look best with the Accent color or a distinct surface
    // Using accent dim or a specific user-bubble color
    bubbleClasses += "bg-[var(--element-hover)] text-[var(--text-primary)] rounded-br-none border border-[var(--border)]";
  } else if (isModel) {
    bubbleClasses += `bg-[var(--panel-bg)] border border-[var(--border)] rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-[var(--element-bg)] text-[var(--text-secondary)] rounded-bl-none border border-[var(--border)]";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[95%] md:max-w-[85%] w-full`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {renderMessageContent()}
          
          {/* Metadata: Context URLs */}
          {isModel && message.urlContext && message.urlContext.length > 0 && !message.isLoading && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Context URLs Retrieved:</h4>
              <ul className="space-y-0.5">
                {message.urlContext.map((meta, index) => {
                  const statusText = typeof meta.urlRetrievalStatus === 'string' 
                    ? meta.urlRetrievalStatus.replace('URL_RETRIEVAL_STATUS_', '') 
                    : 'UNKNOWN';
                  const isSuccess = meta.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS';

                  return (
                    <li key={index} className="text-[11px] text-[var(--text-secondary)]">
                      <a href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all text-[var(--accent-text)]">
                        {meta.retrievedUrl}
                      </a>
                      <span className={`ml-1.5 px-1 py-0.5 rounded-sm text-[9px] ${
                        isSuccess
                          ? 'bg-[var(--element-hover)] text-[var(--text-primary)]'
                          : 'bg-[var(--danger)]/20 text-[var(--danger)]'
                      }`}>
                        {statusText}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Action Bar (Copy, Feedback, Regenerate) */}
          {isModel && !message.isLoading && message.text && (
             <ActionBar 
                message={message}
                onFeedback={onFeedback}
                onRegenerate={onConfirmSources}
             />
          )}

        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;
