import { useState, useEffect } from 'react';
import { Session, Message, getSessions, createSession, getSessionMessages, sendMessage } from '../api';

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load sessions');
    }
  };

  const loadMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await getSessionMessages(id);
      setMessages(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      const newSession = await createSession();
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
    } catch (err) {
      console.error(err);
      setError('Failed to create new session');
    }
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Optimistic UI update FIRST
    const tempId = Date.now().toString();
    const userMsg: Message = { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    
    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      try {
        const newSession = await createSession();
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        targetSessionId = newSession.id;
      } catch (err) {
        console.error(err);
        setError('Network Error: Failed to create new session. Please check backend connection.');
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsLoading(false);
        return;
      }
    }

    try {
      await sendMessage(targetSessionId, text);
      // Reload messages to get the real AI response with provider_used and ID
      await loadMessages(targetSessionId);
    } catch (err) {
      console.error(err);
      setError('Network Error: Failed to send message to backend.');
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setIsLoading(false);
    }
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    messages,
    isLoading,
    error,
    startNewSession,
    sendUserMessage
  };
}
