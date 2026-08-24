import React, { useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface ArtifactViewerProps {
  content: string;
  type?: string;
  title?: string;
}

const DARK_IFRAME_STYLES = `
  body {
    margin: 0; padding: 20px;
    background: #070b14; color: #cbd5e1;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px; line-height: 1.7;
  }
  h1,h2,h3 { color: #f1f5f9; margin-bottom: 10px; }
  p { margin-bottom: 10px; }
  table { border-collapse: collapse; width: 100%; }
  th { background: rgba(99,102,241,0.15); padding: 8px 12px; border: 1px solid #1e293b; color: #a5b4fc; }
  td { padding: 8px 12px; border: 1px solid #1e293b; }
  a { color: #818cf8; }
  blockquote { border-left: 3px solid rgba(99,102,241,0.5); padding-left: 14px; color: #94a3b8; margin: 12px 0; }
  code { background: rgba(99,102,241,0.18); padding: 2px 6px; border-radius: 4px; color: #c7d2fe; }
  pre { background: #0a0f1e; border: 1px solid #1e293b; padding: 14px; border-radius: 10px; overflow-x: auto; }
`;

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ content, type = 'html', title = 'Artifact' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMarkdown = type === 'markdown' || type === 'ship30_essay';

  useEffect(() => {
    if (!isMarkdown && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${DARK_IFRAME_STYLES}</style></head><body>${content}</body></html>`);
        doc.close();
      }
    }
  }, [content, isMarkdown]);

  return (
    <div style={{ border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(7,11,20,0.9)' }}>
      <div style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.7 }} />
        </div>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#475569' }}>{title}</span>
        <span style={{ fontSize: '10px', color: '#334155', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{type}</span>
      </div>

      <div style={{ padding: isMarkdown ? '20px' : '0', overflowY: 'auto', maxHeight: '60vh' }}>
        {isMarkdown ? (
          <div style={{ color: '#cbd5e1' }}><MarkdownRenderer content={content} /></div>
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            style={{ width: '100%', border: 'none', minHeight: '300px', background: 'transparent' }}
            title={title}
          />
        )}
      </div>
    </div>
  );
};

export default ArtifactViewer;
