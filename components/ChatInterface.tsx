
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender, FeedbackType } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Menu, Edit2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  initialQuerySuggestions?: string[];
  onSuggestedQueryClick?: (query: string) => void;
  isFetchingSuggestions?: boolean;
  onToggleSidebar?: () => void;
  onConfirmSources?: (messageId: string, selectedUrls: string[], originalQuery: string) => void;
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
  sessionTitle?: string;
  onUpdateSessionTitle?: (newTitle: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  initialQuerySuggestions,
  onSuggestedQueryClick,
  isFetchingSuggestions,
  onToggleSidebar,
  onConfirmSources,
  onFeedback,
  sessionTitle = "Documentation Browser",
  onUpdateSessionTitle
}) => {
  const [userQuery, setUserQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(sessionTitle);

  useEffect(() => {
    setTempTitle(sessionTitle);
  }, [sessionTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== sessionTitle && onUpdateSessionTitle) {
      onUpdateSessionTitle(tempTitle.trim());
    } else {
      setTempTitle(sessionTitle);
    }
  };

  const showSuggestions = initialQuerySuggestions && initialQuerySuggestions.length > 0 && messages.filter(m => m.sender !== MessageSender.SYSTEM).length <= 1;

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)] rounded-xl shadow-md border border-[var(--border)] transition-colors duration-200">
      <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
        <div className="flex items-center gap-3 w-full">
           {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--element-hover)] transition-colors md:hidden"
              aria-label="Open knowledge base"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex-grow min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
                  if (e.key === 'Escape') {
                    setTempTitle(sessionTitle);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="w-full bg-[var(--element-bg)] text-[var(--text-primary)] font-semibold text-lg px-2 py-1 rounded border border-[var(--accent)] outline-none"
              />
            ) : (
              <div 
                className="group flex items-center gap-2 cursor-pointer"
                onClick={() => onUpdateSessionTitle && setIsEditingTitle(true)}
              >
                <h2 className="text-xl font-semibold text-[var(--text-primary)] truncate">{sessionTitle || "New Conversation"}</h2>
                {onUpdateSessionTitle && (
                  <Edit2 size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            )}
            {placeholderText && messages.filter(m => m.sender !== MessageSender.SYSTEM).length === 0 && (
               <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md truncate" title={placeholderText}>{placeholderText}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto chat-container bg-[var(--element-bg)]">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onConfirmSources={onConfirmSources}
              onFeedback={onFeedback}
            />
          ))}
          
          {isFetchingSuggestions && (
              <div className="flex justify-center items-center p-3">
                  <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                      <span className="text-sm">Fetching suggestions...</span>
                  </div>
              </div>
          )}

          {showSuggestions && onSuggestedQueryClick && (
            <div className="my-3 px-1">
              <p className="text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Or try one of these: </p>
              <div className="flex flex-wrap gap-1.5">
                {initialQuerySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedQueryClick(suggestion)}
                    className="bg-[var(--accent-dim)] text-[var(--accent-text)] px-2.5 py-1 rounded-full text-xs hover:opacity-80 transition-colors shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--panel-bg)] rounded-b-xl">
        <div className="flex items-center gap-2">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask about the documents..."
            className="flex-grow h-8 min-h-[32px] py-1.5 px-2.5 border border-[var(--border)] bg-[var(--element-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-shadow resize-none text-sm outline-none"
            rows={1}
            disabled={isLoading || isFetchingSuggestions}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || isFetchingSuggestions || !userQuery.trim()}
            className="h-8 w-8 p-1.5 bg-[var(--element-hover)] hover:bg-[var(--accent)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 border border-[var(--border)] hover:border-transparent"
            aria-label="Send message"
          >
            {(isLoading && messages[messages.length-1]?.isLoading && messages[messages.length-1]?.sender === MessageSender.MODEL) ? 
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> 
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
