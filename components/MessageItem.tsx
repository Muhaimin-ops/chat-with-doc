
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
    bgColorClass = 'bg-white/[.12]';
    textColorClass = 'text-white';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'AI';
    bgColorClass = 'bg-[#777777]'; 
    textColorClass = 'text-[#E2E2E2]';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-[#4A4A4A]';
    textColorClass = 'text-[#E2E2E2]';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} ${textColorClass} flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
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
      setSelectedUrls(prev => [...prev, newUrl.trim()]);
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const removeUrl = (url: string) => {
    setSelectedUrls(prev => prev.filter(u => u !== url));
  };

  return (
    <div className="mt-2 p-3 bg-black/20 rounded-lg border border-white/10 w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-white">Select Context Sources</h4>
        <span className="text-xs text-[#A8ABB4]">{selectedUrls.length} selected</span>
      </div>
      <p className="text-xs text-[#A8ABB4] mb-3">
        I found these sources relevant to your query. Please review, add, or remove sources before I generate an answer.
      </p>
      
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {selectedUrls.map((url, idx) => (
          <div key={`${url}-${idx}`} className="flex items-center gap-2 p-2 bg-white/5 rounded-md group">
            <button 
              onClick={() => toggleUrl(url)}
              className="text-[#79B8FF] hover:text-[#79B8FF]/80 transition-colors"
            >
              <CheckSquare size={16} />
            </button>
            <div className="flex-grow min-w-0">
               <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#E2E2E2] hover:text-white truncate block flex items-center gap-1">
                 <span className="truncate">{url}</span>
                 <ExternalLink size={10} className="opacity-50" />
               </a>
            </div>
            <button 
              onClick={() => removeUrl(url)}
              className="text-[#A8ABB4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="flex-grow text-xs bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:border-[#79B8FF]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            <button onClick={handleAddUrl} className="text-[#79B8FF] text-xs hover:underline">Add</button>
            <button onClick={() => setIsAdding(false)} className="text-[#A8ABB4] text-xs hover:underline">Cancel</button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-[#A8ABB4] hover:text-[#79B8FF] py-1 px-2"
          >
            <Plus size={12} /> Add another URL
          </button>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-white/10">
        <button
          onClick={() => onConfirm(messageId, selectedUrls, originalQuery)}
          disabled={selectedUrls.length === 0}
          className="flex items-center gap-2 bg-[#79B8FF]/20 hover:bg-[#79B8FF]/30 text-[#79B8FF] px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="flex items-center gap-2 mt-3 border-t border-[rgba(255,255,255,0.08)] pt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#A8ABB4] hover:text-white rounded hover:bg-white/10 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {onRegenerate && message.sourceSelection && (
        <button 
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#A8ABB4] hover:text-white rounded hover:bg-white/10 transition-colors"
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
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${message.feedback === 'positive' ? 'text-green-400' : 'text-[#A8ABB4] hover:text-green-400'}`}
            title="Good response"
          >
            <ThumbsUp size={14} />
          </button>
          <button 
            onClick={() => onFeedback(message.id, message.feedback === 'negative' ? null : 'negative')}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${message.feedback === 'negative' ? 'text-red-400' : 'text-[#A8ABB4] hover:text-red-400'}`}
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
             <div className="prose prose-sm prose-invert w-full min-w-0 max-w-none">
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
              <span className="text-xs text-[#A8ABB4] animate-pulse">Thinking...</span>
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] bg-[#A8ABB4]`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] bg-[#A8ABB4]`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce bg-[#A8ABB4]`}></div>
              </div>
            </div>
          );
       }
    }
    
    // User or System
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-white';
    } else if (isSystem) {
        textColorClass = 'text-[#A8ABB4]';
    } else { 
        textColorClass = 'text-[#E2E2E2]';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow w-full group relative "; 

  if (isUser) {
    bubbleClasses += "bg-white/[.12] text-white rounded-br-none";
  } else if (isModel) {
    bubbleClasses += `bg-[rgba(119,119,119,0.10)] border-t border-[rgba(255,255,255,0.04)] backdrop-blur-lg rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-[#2C2C2C] text-[#A8ABB4] rounded-bl-none";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[95%] md:max-w-[85%] w-full`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {renderMessageContent()}
          
          {/* Metadata: Context URLs */}
          {isModel && message.urlContext && message.urlContext.length > 0 && !message.isLoading && (
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
              <h4 className="text-xs font-semibold text-[#A8ABB4] mb-1">Context URLs Retrieved:</h4>
              <ul className="space-y-0.5">
                {message.urlContext.map((meta, index) => {
                  const statusText = typeof meta.urlRetrievalStatus === 'string' 
                    ? meta.urlRetrievalStatus.replace('URL_RETRIEVAL_STATUS_', '') 
                    : 'UNKNOWN';
                  const isSuccess = meta.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS';

                  return (
                    <li key={index} className="text-[11px] text-[#A8ABB4]">
                      <a href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all text-[#79B8FF]">
                        {meta.retrievedUrl}
                      </a>
                      <span className={`ml-1.5 px-1 py-0.5 rounded-sm text-[9px] ${
                        isSuccess
                          ? 'bg-white/[.12] text-white'
                          : 'bg-slate-600/30 text-slate-400'
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
