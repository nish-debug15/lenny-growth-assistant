import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { parseMessageArtifacts, ParsedArtifact } from './utils/artifactParser';
import ArtifactViewer from './components/ArtifactViewer';
import MarkdownRenderer from './components/MarkdownRenderer';

function App() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    messages,
    isLoading,
    error,
    startNewSession,
    sendUserMessage
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [activeArtifact, setActiveArtifact] = useState<ParsedArtifact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendUserMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎙</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>Lenny AI</span>
          </div>
          <button
            onClick={startNewSession}
            style={{
              width: '100%', padding: '9px 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span> New Chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '13px', padding: '12px', textAlign: 'center' }}>No chats yet</p>
          )}
          {sessions.map(session => {
            const isActive = session.id === currentSessionId;
            return (
              <button
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: '2px',
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent',
                  borderRadius: '8px', cursor: 'pointer', color: isActive ? '#a5b4fc' : '#94a3b8',
                  fontSize: '13px', fontWeight: isActive ? 600 : 400, transition: 'all 0.15s'
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  💬 {session.user_metadata?.title || 'Chat Session'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: '11px', color: '#475569' }}>
          RAG over Lenny's Podcast
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Error banner */}
        {error && (
          <div style={{ padding: '10px 20px', backgroundColor: '#450a0a', color: '#fca5a5', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {!currentSessionId ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '12px' }}>
              <div style={{ fontSize: '48px' }}>🎙️</div>
              <h2 style={{ margin: 0, color: '#94a3b8' }}>Welcome to Lenny AI</h2>
              <p style={{ margin: 0, fontSize: '14px' }}>Click "+ New Chat" to start a conversation</p>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '12px' }}>
              <div style={{ fontSize: '48px' }}>💬</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Ask anything about growth, product, or marketing</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                {["What's Lenny's advice on retention?", "Write a Ship 30/30 essay on activation", "How to find PMF?"].map(q => (
                  <button key={q} onClick={() => { setInputText(q); }}
                    style={{ padding: '8px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => {
                const isUser = msg.role === 'user';
                const parts = parseMessageArtifacts(msg.content);

                return (
                  <div key={msg.id} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    {/* Role label */}
                    <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
                      {isUser ? 'You' : '🎙 Lenny AI'}
                      {!isUser && msg.provider_used && <span style={{ marginLeft: '6px', color: '#334155' }}>· {msg.provider_used}</span>}
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth: '75%', padding: '14px 16px', borderRadius: '12px',
                      background: isUser
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : '#1e293b',
                      border: isUser ? 'none' : '1px solid #334155',
                      color: isUser ? '#fff' : '#e2e8f0',
                      fontSize: '14px', lineHeight: '1.6'
                    }}>
                      {parts.map((part, idx) => {
                        if (part.type === 'text') {
                          return (
                            <div key={idx} style={{ color: isUser ? '#fff' : '#e2e8f0' }}>
                              <MarkdownRenderer content={part.content} />
                            </div>
                          );
                        } else if (part.type === 'artifact' && part.artifact) {
                          const artifact = part.artifact;
                          return (
                            <div
                              key={idx}
                              onClick={() => setActiveArtifact(artifact)}
                              style={{
                                marginTop: '12px', padding: '12px 14px',
                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                                borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                color: '#a5b4fc', transition: 'background 0.15s'
                              }}
                            >
                              <span style={{ fontSize: '22px' }}>📄</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{artifact.title}</div>
                                <div style={{ fontSize: '11px', color: '#6366f1' }}>Click to open · {artifact.type}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>🎙 Lenny AI</div>
                  <div style={{ padding: '14px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentSessionId ? "Ask Lenny… (Enter to send, Shift+Enter for newline)" : "Start a new chat first →"}
              disabled={isLoading || !currentSessionId}
              rows={1}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px',
                border: '1px solid #334155', backgroundColor: '#1e293b',
                color: '#e2e8f0', fontSize: '14px', outline: 'none', resize: 'none',
                maxHeight: '120px', overflowY: 'auto', lineHeight: '1.5',
                opacity: (!currentSessionId) ? 0.5 : 1
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !currentSessionId || !inputText.trim()}
              style={{
                padding: '12px 20px', height: '46px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap',
                opacity: (isLoading || !currentSessionId || !inputText.trim()) ? 0.4 : 1,
                transition: 'opacity 0.15s'
              }}
            >
              {isLoading ? '...' : '↑ Send'}
            </button>
          </form>
        </div>
      </main>

      {/* ── Artifact Viewer Panel ── */}
      {activeArtifact && (
        <aside style={{
          width: '420px', borderLeft: '1px solid #334155',
          backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9' }}>{activeArtifact.title}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{activeArtifact.type}</div>
            </div>
            <button
              onClick={() => setActiveArtifact(null)}
              style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}
            >✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <ArtifactViewer content={activeArtifact.content} type={activeArtifact.type} title={activeArtifact.title} />
          </div>
        </aside>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .markdown-body p { margin: 0 0 8px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 4px 0 8px; }
        .markdown-body code { background: rgba(99,102,241,0.2); padding: 1px 5px; border-radius: 4px; font-size: 13px; }
        .markdown-body pre { background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; }
        .markdown-body pre code { background: none; padding: 0; }
      `}</style>
    </div>
  );
}

export default App;
