import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { parseMessageArtifacts, ParsedArtifact } from './utils/artifactParser';
import ArtifactViewer from './components/ArtifactViewer';
import MarkdownRenderer from './components/MarkdownRenderer';

const SUGGESTIONS = [
  "What is the best way to improve retention?",
  "How to measure product-market fit?",
  "Generate a Ship 30/30 essay on activation",
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
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
          <button className="new-chat-btn" onClick={startNewSession}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New chat
          </button>
        </div>

        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="session-empty">No chats yet</div>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                className={`session-item ${s.id === currentSessionId ? 'active' : ''}`}
                onClick={() => setCurrentSessionId(s.id)}
              >
                <div className="session-title">{s.user_metadata?.title || 'New chat'}</div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ━━━ MAIN PANEL ━━━ */}
      <main className="main-panel">
        <div className="topbar">
          <span style={{ fontWeight: 600, color: '#000' }}>Lenny AI</span>
          <span style={{ color: '#d4d4d4' }}>/</span>
          <span>{currentSession?.user_metadata?.title || 'New chat'}</span>
        </div>

        {error && <div className="error-bar">{error}</div>}

        <div className="messages-area">
          <div className="messages-container">
            {!currentSessionId ? (
              <div className="center-screen">
                <div className="welcome-icon">🎙</div>
                <h1 className="welcome-title">Good morning</h1>
                <div className="suggestion-chips">
                  {SUGGESTIONS.map(q => (
                    <button key={q} className="suggestion-chip" onClick={() => sendUserMessage(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="center-screen">
                <div className="welcome-icon" style={{ background: 'transparent', color: '#000', fontSize: '32px' }}>👋</div>
                <h1 className="welcome-title">How can I help you today?</h1>
                <div className="suggestion-chips">
                  {SUGGESTIONS.map(q => (
                    <button key={q} className="suggestion-chip" onClick={() => sendUserMessage(q)}>
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
                    <div key={msg.id} className="msg-row">
                      <div className={`msg-avatar ${isUser ? 'user' : 'assistant'}`}>
                        {isUser ? 'U' : '🎙'}
                      </div>
                      <div className="msg-content-wrapper">
                        <div className="msg-name">
                          {isUser ? 'You' : 'Lenny AI'}
                          {!isUser && msg.provider_used && (
                            <span className="provider-tag">· {msg.provider_used}</span>
                          )}
                        </div>
                        <div className="msg-text">
                          {parts.map((part, idx) => {
                            if (part.type === 'text') {
                              return <MarkdownRenderer key={idx} content={part.content} />;
                            }
                            if (part.type === 'artifact' && part.artifact) {
                              const a = part.artifact;
                              return (
                                <div key={idx} className="artifact-card" onClick={() => setActiveArtifact(a)}>
                                  <div className="artifact-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  </div>
                                  <div>
                                    <div className="artifact-title">{a.title}</div>
                                    <div className="artifact-sub">Click to open</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="msg-row">
                    <div className="msg-avatar assistant">🎙</div>
                    <div className="msg-content-wrapper">
                      <div className="msg-name">Lenny AI</div>
                      <div className="typing-dots">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="input-area-container">
          <form className="input-form" onSubmit={handleSend}>
            <textarea
              ref={textareaRef}
              className="input-textarea"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Lenny AI..."
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={isLoading || !inputText.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
          </form>
          <div className="input-footer">
            Lenny AI can make mistakes. Grounded in podcast transcripts.
          </div>
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
            <button className="artifact-close-btn" onClick={() => setActiveArtifact(null)}>
              Close
            </button>
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
