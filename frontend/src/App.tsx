function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎙️ Lenny Growth Assistant</h1>
      <p>
        RAG-powered conversational assistant over Lenny's Podcast transcripts.
      </p>
      <p style={{ color: '#666' }}>
        Chat UI coming in Block 7. Backend API is live at{' '}
        <a href="http://localhost:8000/health" target="_blank" rel="noopener noreferrer">
          localhost:8000/health
        </a>
      </p>
    </div>
  )
}

export default App
