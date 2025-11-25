
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, URLGroup, ChatSession, FeedbackType } from './types';
import { generateContentStreamWithUrlContext, getInitialSuggestions, identifyRelevantUrls } from './services/geminiService';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import ChatInterface from './components/ChatInterface';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';

// Default URLs to seed for new users
const GEMINI_DOCS_URLS = [
  "https://ai.google.dev/gemini-api/docs",
  "https://ai.google.dev/gemini-api/docs/quickstart",
  "https://ai.google.dev/gemini-api/docs/models",
];

const MODEL_CAPABILITIES_URLS = [
  "https://ai.google.dev/gemini-api/docs/text-generation",
  "https://ai.google.dev/gemini-api/docs/image-generation",
  "https://ai.google.dev/gemini-api/docs/function-calling",
];

const INITIAL_DEFAULT_GROUPS = [
  { name: 'Gemini Docs Overview', urls: GEMINI_DOCS_URLS },
  { name: 'Model Capabilities', urls: MODEL_CAPABILITIES_URLS },
];

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>([]);
  const [activeUrlGroupId, setActiveUrlGroupId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [initialQuerySuggestions, setInitialQuerySuggestions] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  
  const MAX_URLS = 20;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch URL Groups
  useEffect(() => {
    if (!session) return;

    const fetchGroups = async () => {
      const { data: groups, error } = await supabase
        .from('url_groups')
        .select(`
          id,
          name,
          group_urls ( url )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching groups:', error);
        return;
      }

      if (groups && groups.length > 0) {
        const formattedGroups: URLGroup[] = groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          urls: g.group_urls.map((u: any) => u.url)
        }));
        setUrlGroups(formattedGroups);
        if (!activeUrlGroupId) {
           setActiveUrlGroupId(formattedGroups[0].id);
        }
      } else {
        // Seed default groups if empty
        await seedDefaultGroups(session.user.id);
      }
    };

    fetchGroups();
  }, [session]);

  const seedDefaultGroups = async (userId: string) => {
    for (const group of INITIAL_DEFAULT_GROUPS) {
      const { data: groupData, error: groupError } = await supabase
        .from('url_groups')
        .insert({ user_id: userId, name: group.name })
        .select()
        .single();
      
      if (groupData && !groupError) {
        const urlInserts = group.urls.map(url => ({ group_id: groupData.id, url }));
        await supabase.from('group_urls').insert(urlInserts);
      }
    }
    // Refetch to update state
    const { data: groups } = await supabase
        .from('url_groups')
        .select('id, name, group_urls(url)')
        .order('created_at', { ascending: true });
        
    if (groups) {
      const formattedGroups: URLGroup[] = groups.map((g: any) => ({
        id: g.id,
        name: g.name,
        urls: g.group_urls.map((u: any) => u.url)
      }));
      setUrlGroups(formattedGroups);
      if (formattedGroups.length > 0) setActiveUrlGroupId(formattedGroups[0].id);
    }
  };

  // Fetch Chat Sessions
  useEffect(() => {
    if (!session) return;
    
    const fetchSessions = async () => {
       const { data, error } = await supabase
         .from('chat_sessions')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (data && !error) {
         setChatSessions(data);
         if (!currentSessionId && data.length > 0) {
            // Load the most recent session
            loadSession(data[0].id);
         } else if (data.length === 0) {
            // No sessions, start fresh (no messages)
            setChatMessages([]);
            const activeGroup = urlGroups.find(group => group.id === activeUrlGroupId);
            setWelcomeMessage(activeGroup);
         }
       }
    };
    fetchSessions();
  }, [session]);

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
      
    if (data && !error) {
       const formattedMessages: ChatMessage[] = data.map((m: any) => ({
         id: m.id,
         text: m.content,
         sender: m.sender as MessageSender,
         timestamp: new Date(m.created_at),
         urlContext: m.metadata?.urlContext,
         // Load saved source selection state if any
         isSourceConfirmationPending: m.metadata?.isSourceConfirmationPending,
         sourceSelection: m.metadata?.sourceSelection,
         feedback: m.metadata?.feedback || null
       }));
       setChatMessages(formattedMessages);
    }
  };

  const activeGroup = urlGroups.find(group => group.id === activeUrlGroupId);
  const currentUrlsForChat = activeGroup ? activeGroup.urls : [];

  const setWelcomeMessage = (group?: URLGroup) => {
      const apiKey = process.env.API_KEY;
       const welcomeMessageText = !apiKey 
        ? 'ERROR: Gemini API Key (process.env.API_KEY) is not configured. Please set this environment variable to use the application.'
        : group 
            ? `Welcome to Documentation Browser! You're currently browsing content from: "${group.name}". Just ask me questions, or try one of the suggestions below to get started`
            : `Welcome! Create a URL group and add documentation links to get started.`;
    
     setChatMessages([{
      id: `system-welcome-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  };

   useEffect(() => {
    // Only set welcome message if starting fresh and NOT loading a history session
    if (!currentSessionId && chatMessages.length === 0 && urlGroups.length > 0) {
        setWelcomeMessage(activeGroup);
    }
  }, [activeUrlGroupId, urlGroups, currentSessionId]); 


  const fetchAndSetInitialSuggestions = useCallback(async (currentUrls: string[]) => {
    if (currentUrls.length === 0) {
      setInitialQuerySuggestions([]);
      return;
    }
      
    setIsFetchingSuggestions(true);
    setInitialQuerySuggestions([]); 

    try {
      const response = await getInitialSuggestions(currentUrls); 
      let suggestionsArray: string[] = [];
      if (response.text) {
        try {
          let jsonStr = response.text.trim();
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
          const match = jsonStr.match(fenceRegex);
          if (match && match[2]) {
            jsonStr = match[2].trim();
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.suggestions)) {
            suggestionsArray = parsed.suggestions.filter((s: unknown) => typeof s === 'string');
          }
        } catch (parseError) {
          console.error("Failed to parse suggestions JSON:", parseError);
        }
      }
      setInitialQuerySuggestions(suggestionsArray.slice(0, 4)); 
    } catch (e: any) {
      console.error("Error fetching suggestions:", e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []); 

  useEffect(() => {
    if (currentUrlsForChat.length > 0 && process.env.API_KEY) { 
        fetchAndSetInitialSuggestions(currentUrlsForChat);
    } else {
        setInitialQuerySuggestions([]); 
    }
  }, [currentUrlsForChat, fetchAndSetInitialSuggestions]); 

  // --- DB Handlers ---

  const handleAddUrl = async (url: string) => {
    if (!activeUrlGroupId) return;
    
    const { error } = await supabase
      .from('group_urls')
      .insert({ group_id: activeUrlGroupId, url: url });
      
    if (!error) {
      setUrlGroups(prevGroups => 
        prevGroups.map(group => {
          if (group.id === activeUrlGroupId) {
            return { ...group, urls: [...group.urls, url] };
          }
          return group;
        })
      );
    } else {
      alert("Failed to add URL");
    }
  };

  const handleRemoveUrl = async (urlToRemove: string) => {
    if (!activeUrlGroupId) return;
    const { error } = await supabase
      .from('group_urls')
      .delete()
      .match({ group_id: activeUrlGroupId, url: urlToRemove });

    if (!error) {
      setUrlGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.id === activeUrlGroupId) {
            return { ...group, urls: group.urls.filter(url => url !== urlToRemove) };
          }
          return group;
        })
      );
    }
  };

  const handleAddGroup = async (name: string) => {
    if (!session) return;
    
    const { data, error } = await supabase
      .from('url_groups')
      .insert({ user_id: session.user.id, name: name })
      .select()
      .single();

    if (data && !error) {
      const newGroup: URLGroup = {
        id: data.id,
        name: data.name,
        urls: []
      };
      setUrlGroups(prev => [...prev, newGroup]);
      setActiveUrlGroupId(data.id);
    } else {
      console.error('Error creating group:', error);
    }
  };

  const handleRenameGroup = async (id: string, newName: string) => {
    const { error } = await supabase
      .from('url_groups')
      .update({ name: newName })
      .eq('id', id);

    if (!error) {
      setUrlGroups(prev => prev.map(group => 
        group.id === id ? { ...group, name: newName } : group
      ));
    } else {
      console.error('Error renaming group:', error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    await supabase.from('group_urls').delete().eq('group_id', id);

    const { error } = await supabase
      .from('url_groups')
      .delete()
      .eq('id', id);
      
    if (!error) {
      const remainingGroups = urlGroups.filter(group => group.id !== id);
      setUrlGroups(remainingGroups);
      if (activeUrlGroupId === id) {
        if (remainingGroups.length > 0) {
          setActiveUrlGroupId(remainingGroups[0].id);
        } else {
          setActiveUrlGroupId('');
        }
      }
    } else {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleNewChat = () => {
     setCurrentSessionId(null);
     setChatMessages([]);
     setWelcomeMessage(activeGroup);
     setIsSidebarOpen(false); 
  };

  const handleFeedback = async (messageId: string, feedback: FeedbackType) => {
     // Update UI
     setChatMessages(prev => prev.map(msg => 
       msg.id === messageId ? { ...msg, feedback } : msg
     ));

     // Update DB
     if (currentSessionId) {
        const { data } = await supabase
          .from('chat_messages')
          .select('metadata')
          .eq('id', messageId)
          .single();
          
        if (data) {
           const newMetadata = { ...data.metadata, feedback };
           await supabase.from('chat_messages').update({ metadata: newMetadata }).eq('id', messageId);
        }
     }
  };

  // --- Step 1: Handle Initial Query -> Identify Relevant URLs ---
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading || isFetchingSuggestions) return;
    if (!session) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) return;
    
    setIsLoading(true);
    setInitialQuerySuggestions([]); 

    // Ensure we have a session ID
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
       const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
       const { data, error } = await supabase
         .from('chat_sessions')
         .insert({ user_id: session.user.id, title: title })
         .select()
         .single();
         
       if (data && !error) {
          activeSessionId = data.id;
          setCurrentSessionId(data.id);
          setChatSessions(prev => [data, ...prev]);
       } else {
         console.error("Failed to create session", error);
         setIsLoading(false);
         return; 
       }
    }

    // 1. Save User Message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    setChatMessages(prevMessages => [...prevMessages, userMessage]);
    
    await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        sender: MessageSender.USER,
        content: query,
        created_at: new Date()
    });

    // 2. Add placeholder for "Analzying"
    const selectionPlaceholderId = `selection-${Date.now()}`;
    const selectionPlaceholder: ChatMessage = {
        id: selectionPlaceholderId,
        text: 'Analyzing your query and finding relevant documentation...',
        sender: MessageSender.MODEL,
        timestamp: new Date(),
        isLoading: true
    };
    setChatMessages(prev => [...prev, selectionPlaceholder]);

    try {
        // 3. Find Relevant URLs
        const relevantUrls = await identifyRelevantUrls(query, currentUrlsForChat);

        // 4. Update placeholder to be the "Selection" interface
        setChatMessages(prev => prev.map(msg => 
            msg.id === selectionPlaceholderId 
            ? {
                ...msg,
                isLoading: false,
                isSourceConfirmationPending: true,
                sourceSelection: {
                    originalQuery: query,
                    urls: relevantUrls
                }
            }
            : msg
        ));

        // Save this state to DB so it persists on reload
        await supabase.from('chat_messages').insert({
            session_id: activeSessionId,
            sender: MessageSender.MODEL,
            content: "", 
            metadata: { 
                isSourceConfirmationPending: true,
                sourceSelection: { originalQuery: query, urls: relevantUrls }
            },
            created_at: new Date()
        });

    } catch (e: any) {
        console.error("Error identifying urls", e);
        setChatMessages(prev => prev.map(msg => 
            msg.id === selectionPlaceholderId 
            ? { ...msg, text: "Error identifying relevant sources.", isLoading: false }
            : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  // --- Step 2: Handle Confirmation -> Generate Answer (Streaming) ---
  const handleConfirmSources = async (messageId: string, selectedUrls: string[], originalQuery: string) => {
    if (!currentSessionId) return;

    let activeMessageId = messageId;
    
    // Find the message in DB to update
    const { data: dbMessage } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', currentSessionId)
        .contains('metadata', { sourceSelection: { originalQuery: originalQuery } })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    const dbMessageId = dbMessage?.id;

    // Update UI to "Thinking" / Streaming start state
    setChatMessages(prev => prev.map(msg => {
        if (msg.id === messageId || (msg.sourceSelection && msg.sourceSelection.originalQuery === originalQuery && msg.isSourceConfirmationPending)) {
            return {
                ...msg,
                id: dbMessageId || msg.id, // Sync ID if possible
                isSourceConfirmationPending: false,
                isLoading: true,
                text: "" // Clear text for streaming
            };
        }
        return msg;
    }));
    
    setIsLoading(true);

    try {
        const stream = generateContentStreamWithUrlContext(originalQuery, selectedUrls);
        let accumulatedText = "";
        let finalUrlContext: any = null;

        for await (const chunk of stream) {
            accumulatedText += chunk.textChunk;
            if (chunk.urlContextMetadata) {
                finalUrlContext = chunk.urlContextMetadata;
            }

            // Update UI incrementally
            setChatMessages(prev => prev.map(msg => {
                 if (msg.id === (dbMessageId || messageId) || (msg.isLoading && msg.sender === MessageSender.MODEL && msg.text === accumulatedText.slice(0, -chunk.textChunk.length))) {
                     return {
                         ...msg,
                         text: accumulatedText,
                         isLoading: true, // Still loading until done
                         urlContext: chunk.urlContextMetadata || msg.urlContext
                     };
                 }
                 return msg;
            }));
        }

        // Final UI update
        setChatMessages(prev => prev.map(msg => {
             if (msg.id === (dbMessageId || messageId) || (msg.isLoading && msg.sender === MessageSender.MODEL)) {
                 return {
                     ...msg,
                     text: accumulatedText,
                     isLoading: false,
                     urlContext: finalUrlContext || msg.urlContext,
                     isSourceConfirmationPending: false,
                 };
             }
             return msg;
        }));

        // Auto-save: Update DB with final content
        // IMPORTANT: We preserve the `sourceSelection` in metadata so we can regenerate later if needed.
        if (dbMessageId) {
             await supabase.from('chat_messages').update({
                 content: accumulatedText,
                 metadata: { 
                    urlContext: finalUrlContext, 
                    isSourceConfirmationPending: false,
                    sourceSelection: { originalQuery: originalQuery, urls: selectedUrls } 
                 } 
             }).eq('id', dbMessageId);
        } else {
            // Fallback insert
            await supabase.from('chat_messages').insert({
                session_id: currentSessionId,
                sender: MessageSender.MODEL,
                content: accumulatedText,
                metadata: { 
                    urlContext: finalUrlContext,
                    sourceSelection: { originalQuery: originalQuery, urls: selectedUrls }
                },
                created_at: new Date()
            });
        }

    } catch (e: any) {
        setChatMessages(prev => prev.map(msg => 
             msg.isLoading ? { ...msg, text: `Error: ${e.message}`, isLoading: false } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSuggestedQueryClick = (query: string) => {
    handleSendMessage(query);
  };
  
  const chatPlaceholder = currentUrlsForChat.length > 0 
    ? `Ask questions about "${activeGroup?.name || 'current documents'}"...`
    : "Select a group and/or add URLs to the knowledge base to enable chat.";

  if (authLoading) {
     return <div className="h-screen w-screen flex items-center justify-center bg-[#121212] text-white">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-[#121212] text-[#E2E2E2]">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="flex h-full w-full md:p-4 md:gap-4">
        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3
          md:static md:p-0 md:w-1/3 lg:w-1/4 md:h-full md:max-w-none md:translate-x-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <KnowledgeBaseManager
            urls={currentUrlsForChat}
            onAddUrl={handleAddUrl}
            onRemoveUrl={handleRemoveUrl}
            maxUrls={MAX_URLS}
            urlGroups={urlGroups}
            activeUrlGroupId={activeUrlGroupId}
            onSetGroupId={setActiveUrlGroupId}
            onAddGroup={handleAddGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            chatSessions={chatSessions}
            onSelectSession={(id) => {
                loadSession(id);
                setIsSidebarOpen(false);
            }}
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSignOut={() => supabase.auth.signOut()}
          />
        </div>

        {/* Chat Interface */}
        <div className="w-full h-full p-3 md:p-0 md:w-2/3 lg:w-3/4">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholderText={chatPlaceholder}
            initialQuerySuggestions={initialQuerySuggestions}
            onSuggestedQueryClick={handleSuggestedQueryClick}
            isFetchingSuggestions={isFetchingSuggestions}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onConfirmSources={handleConfirmSources}
            onFeedback={handleFeedback}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
