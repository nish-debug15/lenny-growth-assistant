import React, { useState } from 'react';
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendUserMessage(inputText);
    setInputText('');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar - Session List */}
      <div style={{ width: '260px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Lenny Growth Assistant</h2>
          <button 
            onClick={startNewSession}
            style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              style={{
                padding: '10px',
                marginBottom: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: session.id === currentSessionId ? '#e0f2fe' : 'transparent',
                color: session.id === currentSessionId ? '#0369a1' : '#334155',
                fontWeight: session.id === currentSessionId ? 500 : 400
              }}
            >
              {session.title || 'Chat Session'}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', position: 'relative' }}>
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '8px 16px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Send a message to start chatting.
            </div>
          ) : (
            messages.map(msg => {
              const isUser = msg.role === 'user';
              const parts = parseMessageArtifacts(msg.content);

              return (
                <div key={msg.id} style={{ marginBottom: '24px', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ 
                      backgroundColor: isUser ? '#3b82f6' : '#f1f5f9', 
                      color: isUser ? '#fff' : '#334155',
                      padding: '16px', 
                      borderRadius: '8px',
                      borderTopRightRadius: isUser ? '0' : '8px',
                      borderTopLeftRadius: isUser ? '8px' : '0'
                    }}>
                      {parts.map((part, idx) => {
                        if (part.type === 'text') {
                          return <div key={idx}><MarkdownRenderer content={part.content} /></div>;
                        } else if (part.type === 'artifact' && part.artifact) {
                          const artifact = part.artifact;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setActiveArtifact(artifact)}
                              style={{ 
                                marginTop: '12px', padding: '12px', backgroundColor: '#fff', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer',
                                color: '#334155', display: 'flex', alignItems: 'center', gap: '8px'
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>📄</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>{artifact.title}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>Click to view {artifact.type}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                    {!isUser && msg.provider_used && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⚡</span> Powered by {msg.provider_used}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '16px', borderRadius: '8px' }}>
                Assistant is typing...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Lenny..."
              disabled={isLoading || !currentSessionId}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '16px' }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !currentSessionId || !inputText.trim()}
              style={{ 
                padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', 
                border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 500,
                opacity: (isLoading || !currentSessionId || !inputText.trim()) ? 0.5 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Artifact Viewer Sandbox */}
      {(activeArtifact || true) && (
        <div style={{ 
          width: activeArtifact ? '400px' : '0px', 
          transition: 'width 0.3s ease',
          backgroundColor: '#f8fafc',
          borderLeft: activeArtifact ? '1px solid #e2e8f0' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeArtifact && (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '16px' }}>Artifact Viewer</h2>
                <button onClick={() => setActiveArtifact(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>
              <ArtifactViewer 
                content={activeArtifact.content} 
                type={activeArtifact.type} 
                title={activeArtifact.title} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
