const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('RUNTIME VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('ACTIVE API_BASE:', API_BASE);

export interface Session {
  id: string;
  user_metadata: any;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  provider_used?: string | null;
}

export async function createSession(title: string = "New Chat"): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_metadata: { title } }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function getSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to get sessions');
  return res.json();
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
  if (!res.ok) throw new Error('Failed to get messages');
  return res.json();
}

export async function sendMessage(sessionId: string, message: string): Promise<{ response: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
