import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { parseMessageArtifacts, ParsedArtifact } from './utils/artifactParser';
import ArtifactViewer from './components/ArtifactViewer';
import MarkdownRenderer from './components/MarkdownRenderer';

const SUGGESTIONS = [
  "What's Lenny's top advice on retention?",
  "Write a Ship 30/30 essay on activation",
  "How to find product-market fit?",
  "Best growth loops for consumer apps?",
];

function App() {
  const { sessions, currentSessionId, setCurrentSessionId, messages, isLoading, error, startNewSession, sendUserMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [activeArtifact, setActiveArtifact] = useState<ParsedArtifact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !currentSessionId) return;
    sendUserMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="app-layout">

      {/* ━━━ SIDEBAR ━━━ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🎙</div>
            <div>
              <div className="sidebar-logo-text">Lenny AI</div>
              <div className="sidebar-logo-sub">Growth Assistant</div>
            </div>
          </div>
          <button className="new-chat-btn" onClick={startNewSession}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> New Chat
          </button>
        </div>

        <div className="session-list">
          {sessions.length === 0 ? (
            <p className="session-empty">No chats yet — start one!</p>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                className={`session-item ${s.id === currentSessionId ? 'active' : ''}`}
                onClick={() => setCurrentSessionId(s.id)}
              >
                <span className="session-icon">💬</span>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div className="session-title">{s.user_metadata?.title || 'Chat Session'}</div>
                  <div className="session-date">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Groq · gpt-oss-120b</span>
        </div>
      </aside>

      {/* ━━━ MAIN PANEL ━━━ */}
      <main className="main-panel">

        {/* Topbar */}
        <div className="topbar">
          <div className={`topbar-dot ${currentSessionId ? 'online' : 'offline'}`} />
          <span>{currentSession?.user_metadata?.title || (currentSessionId ? 'Chat Session' : 'Select or create a chat')}</span>
        </div>

        {error && <div className="error-bar">⚠️ {error}</div>}

        {/* Messages area */}
        <div className="messages-area">
          {!currentSessionId ? (
            /* Welcome screen */
            <div className="center-screen">
              <div className="welcome-icon">🎙</div>
              <div>
                <h1 className="welcome-title">Lenny Growth Assistant</h1>
                <p className="welcome-subtitle">
                  RAG-powered AI over Lenny Rachitsky's podcast transcripts.
                  Ask anything about growth, retention, PMF, and more.
                </p>
              </div>
              <button className="start-btn" onClick={startNewSession}>
                Start your first chat →
              </button>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            /* Empty session */
            <div className="center-screen">
              <div style={{ fontSize: '44px' }}>💬</div>
              <p className="welcome-subtitle">Ask Lenny anything about growth strategy</p>
              <div className="suggestion-chips">
                {SUGGESTIONS.map(q => (
                  <button
                    key={q}
                    className="suggestion-chip"
                    onClick={() => { setInputText(q); textareaRef.current?.focus(); }}
                  >
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
                  <div key={msg.id} className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
                    {/* Label */}
                    <div className="msg-label">
                      {isUser ? (
                        <><span className="avatar-dot">Y</span> You</>
                      ) : (
                        <>🎙 Lenny AI{msg.provider_used && <span className="provider-tag">· {msg.provider_used}</span>}</>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`msg-bubble ${isUser ? 'user' : 'assistant'}`}>
                      {parts.map((part, idx) => {
                        if (part.type === 'text') {
                          return <div key={idx}><MarkdownRenderer content={part.content} /></div>;
                        }
                        if (part.type === 'artifact' && part.artifact) {
                          const a = part.artifact;
                          return (
                            <div key={idx} className="artifact-card" onClick={() => setActiveArtifact(a)}>
                              <span className="artifact-icon">📄</span>
                              <div>
                                <div className="artifact-title">{a.title}</div>
                                <div className="artifact-sub">Click to open · {a.type}</div>
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
                <div className="msg-row assistant">
                  <div className="msg-label">🎙 Lenny AI</div>
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ━━━ INPUT BAR ━━━ */}
        <div className="input-bar">
          <form className="input-form" onSubmit={handleSend}>
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="input-textarea"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentSessionId ? "Ask Lenny… (⏎ send, ⇧⏎ newline)" : "Create a new chat to start"}
                disabled={isLoading || !currentSessionId}
                rows={1}
              />
            </div>
            <button
              type="submit"
              className="send-btn"
              disabled={isLoading || !currentSessionId || !inputText.trim()}
            >
              {isLoading ? '…' : '↑'}
            </button>
          </form>
          <div className="input-footer">Grounded in Lenny's Podcast transcripts · RAG + Groq</div>
        </div>
      </main>

      {/* ━━━ ARTIFACT PANEL ━━━ */}
      {activeArtifact && (
        <aside className="artifact-panel">
          <div className="artifact-panel-header">
            <div>
              <div className="artifact-panel-title">{activeArtifact.title}</div>
              <div className="artifact-panel-type">{activeArtifact.type}</div>
            </div>
            <button className="artifact-close-btn" onClick={() => setActiveArtifact(null)}>✕</button>
          </div>
          <div className="artifact-panel-body">
            <ArtifactViewer content={activeArtifact.content} type={activeArtifact.type} title={activeArtifact.title} />
          </div>
        </aside>
      )}
    </div>
  );
}

export default App;
