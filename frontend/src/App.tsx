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

  // Auto-resize textarea
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

  const handleSuggestion = (q: string) => {
    setInputText(q);
    textareaRef.current?.focus();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070b14; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }

        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .msg-bubble { animation: fadeSlideIn 0.25s ease; }
        .session-btn:hover { background: rgba(99,102,241,0.12) !important; color: #a5b4fc !important; }
        .send-btn:not(:disabled):hover { opacity: 0.9; transform: scale(1.02); }
        .send-btn { transition: all 0.15s; }
        .suggestion-chip:hover { background: rgba(99,102,241,0.2) !important; border-color: rgba(99,102,241,0.5) !important; color: #c7d2fe !important; }
        .suggestion-chip { transition: all 0.15s; }
        .artifact-card:hover { background: rgba(99,102,241,0.2) !important; border-color: rgba(99,102,241,0.6) !important; }
        .artifact-card { transition: all 0.15s; }
        .new-chat-btn:hover { opacity: 0.9; transform: scale(1.02); }
        .new-chat-btn { transition: all 0.15s; }

        .markdown-body { color: inherit; font-size: 14px; line-height: 1.7; }
        .markdown-body p { margin-bottom: 10px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 22px; margin-bottom: 10px; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body strong { color: #f1f5f9; font-weight: 600; }
        .markdown-body em { font-style: italic; color: #94a3b8; }
        .markdown-body blockquote { border-left: 3px solid rgba(99,102,241,0.6); padding-left: 14px; color: #94a3b8; font-style: italic; margin: 10px 0; }
        .markdown-body code { background: rgba(99,102,241,0.18); padding: 2px 6px; border-radius: 4px; font-size: 12.5px; font-family: 'Fira Code', monospace; color: #c7d2fe; }
        .markdown-body pre { background: #0a0f1e; border: 1px solid #1e293b; padding: 14px; border-radius: 10px; overflow-x: auto; margin: 10px 0; }
        .markdown-body pre code { background: none; padding: 0; color: #e2e8f0; }
        .markdown-body h1,.markdown-body h2,.markdown-body h3 { color: #f1f5f9; margin-bottom: 8px; margin-top: 14px; font-weight: 600; }
        .markdown-body a { color: #818cf8; text-decoration: underline; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .markdown-body th { background: rgba(99,102,241,0.15); padding: 8px 12px; border: 1px solid #1e293b; color: #a5b4fc; font-weight: 600; }
        .markdown-body td { padding: 8px 12px; border: 1px solid #1e293b; color: #cbd5e1; }
        .markdown-body hr { border: none; border-top: 1px solid #1e293b; margin: 14px 0; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#070b14', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>

        {/* ━━━ SIDEBAR ━━━ */}
        <aside style={{
          width: '260px', flexShrink: 0,
          background: 'rgba(15,23,42,0.95)',
          borderRight: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(12px)'
        }}>
          {/* Logo */}
          <div style={{ padding: '22px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                boxShadow: '0 0 16px rgba(99,102,241,0.4)'
              }}>🎙</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9', lineHeight: 1.2 }}>Lenny AI</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Growth Assistant</div>
              </div>
            </div>

            <button
              className="new-chat-btn"
              onClick={startNewSession}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>＋</span> New Chat
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
            {sessions.length === 0 ? (
              <p style={{ color: '#334155', fontSize: '12px', textAlign: 'center', padding: '20px 8px' }}>No chats yet — start one!</p>
            ) : (
              sessions.map(s => {
                const active = s.id === currentSessionId;
                return (
                  <button
                    key={s.id}
                    className="session-btn"
                    onClick={() => setCurrentSessionId(s.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px', marginBottom: '2px',
                      background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                      border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                      borderRadius: '9px', cursor: 'pointer',
                      color: active ? '#a5b4fc' : '#64748b',
                      fontSize: '13px', fontWeight: active ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>💬</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.user_metadata?.title || 'Chat Session'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '11px', color: '#475569' }}>Groq · gpt-oss-120b</span>
            </div>
          </div>
        </aside>

        {/* ━━━ MAIN CHAT ━━━ */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {/* Top bar */}
          <div style={{
            padding: '14px 24px', borderBottom: '1px solid rgba(99,102,241,0.1)',
            background: 'rgba(7,11,20,0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentSessionId ? '#22c55e' : '#475569', boxShadow: currentSessionId ? '0 0 8px #22c55e' : 'none' }} />
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              {currentSessionId
                ? (sessions.find(s => s.id === currentSessionId)?.user_metadata?.title || 'Chat Session')
                : 'Select or create a chat'}
            </span>
          </div>

          {/* Error bar */}
          {error && (
            <div style={{ padding: '10px 24px', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
            {!currentSessionId ? (
              // Welcome screen
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
                  boxShadow: '0 0 40px rgba(99,102,241,0.4)'
                }}>🎙</div>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>Lenny Growth Assistant</h1>
                  <p style={{ color: '#475569', fontSize: '14px', maxWidth: '360px' }}>RAG-powered AI over Lenny Rachitsky's podcast transcripts. Ask anything about growth, retention, PMF, and more.</p>
                </div>
                <button className="new-chat-btn" onClick={startNewSession} style={{
                  padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
                }}>Start your first chat →</button>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              // Empty session
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px' }}>💬</div>
                <p style={{ color: '#475569', fontSize: '14px' }}>Ask Lenny anything about growth strategy</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '520px' }}>
                  {SUGGESTIONS.map(q => (
                    <button key={q} className="suggestion-chip" onClick={() => handleSuggestion(q)}
                      style={{
                        padding: '9px 16px', background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(99,102,241,0.25)', borderRadius: '99px',
                        color: '#64748b', fontSize: '13px', cursor: 'pointer'
                      }}>
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
                    <div key={msg.id} className="msg-bubble" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                      {/* Label */}
                      <div style={{ fontSize: '11px', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 4px' }}>
                        {isUser ? (
                          <><span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>Y</span> You</>
                        ) : (
                          <><span style={{ fontSize: '13px' }}>🎙</span> Lenny AI{msg.provider_used && <span style={{ color: '#1e293b', marginLeft: '4px' }}>· {msg.provider_used}</span>}</>
                        )}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        maxWidth: '72%',
                        padding: '14px 18px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isUser
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : 'rgba(15,23,42,0.9)',
                        border: isUser ? 'none' : '1px solid rgba(99,102,241,0.2)',
                        boxShadow: isUser
                          ? '0 4px 20px rgba(99,102,241,0.3)'
                          : '0 2px 12px rgba(0,0,0,0.3)',
                        color: isUser ? '#fff' : '#cbd5e1',
                      }}>
                        {parts.map((part, idx) => {
                          if (part.type === 'text') {
                            return <div key={idx} style={{ color: isUser ? '#fff' : '#cbd5e1' }}><MarkdownRenderer content={part.content} /></div>;
                          } else if (part.type === 'artifact' && part.artifact) {
                            const a = part.artifact;
                            return (
                              <div key={idx} className="artifact-card" onClick={() => setActiveArtifact(a)}
                                style={{
                                  marginTop: '10px', padding: '12px 14px', cursor: 'pointer',
                                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                                  borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px'
                                }}>
                                <span style={{ fontSize: '24px' }}>📄</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#a5b4fc' }}>{a.title}</div>
                                  <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>Click to open · {a.type}</div>
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

                {/* Typing */}
                {isLoading && (
                  <div className="msg-bubble" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '11px', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 4px' }}>
                      <span style={{ fontSize: '13px' }}>🎙</span> Lenny AI
                    </div>
                    <div style={{ padding: '14px 18px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ━━━ INPUT BAR ━━━ */}
          <div style={{
            padding: '16px 24px 20px',
            background: 'rgba(7,11,20,0.95)',
            borderTop: '1px solid rgba(99,102,241,0.1)',
            backdropFilter: 'blur(12px)'
          }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'flex-end',
                background: 'rgba(15,23,42,0.9)', borderRadius: '14px',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 0 0 0 rgba(99,102,241,0)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
                onFocus={() => {}}
              >
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentSessionId ? "Ask Lenny about growth, retention, PMF… (⏎ send, ⇧⏎ newline)" : "Create a new chat to get started"}
                  disabled={isLoading || !currentSessionId}
                  rows={1}
                  style={{
                    flex: 1, padding: '13px 16px', background: 'transparent',
                    border: 'none', outline: 'none', resize: 'none',
                    color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5',
                    maxHeight: '120px', overflowY: 'auto',
                    opacity: !currentSessionId ? 0.4 : 1
                  }}
                />
              </div>
              <button
                type="submit"
                className="send-btn"
                disabled={isLoading || !currentSessionId || !inputText.trim()}
                style={{
                  height: '46px', padding: '0 20px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '14px', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  opacity: (isLoading || !currentSessionId || !inputText.trim()) ? 0.35 : 1,
                }}
              >
                {isLoading ? '…' : '↑'}
              </button>
            </form>
            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: '#1e293b' }}>
              Grounded in Lenny's Podcast transcripts · RAG + Groq
            </div>
          </div>
        </main>

        {/* ━━━ ARTIFACT PANEL ━━━ */}
        {activeArtifact && (
          <aside style={{
            width: '420px', flexShrink: 0,
            background: 'rgba(10,15,30,0.98)',
            borderLeft: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9' }}>{activeArtifact.title}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeArtifact.type}</div>
              </div>
              <button
                onClick={() => setActiveArtifact(null)}
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#94a3b8', borderRadius: '8px', padding: '5px 11px', cursor: 'pointer', fontSize: '13px' }}
              >✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <ArtifactViewer content={activeArtifact.content} type={activeArtifact.type} title={activeArtifact.title} />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

export default App;
