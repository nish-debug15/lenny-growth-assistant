import React, { useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import './ArtifactViewer.css';

interface ArtifactViewerProps {
  content: string;
  type?: string;
  title?: string;
}

const IFRAME_STYLES = `
  body {
    margin: 0; padding: 20px;
    background: #060a13; color: #c8d1de;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px; line-height: 1.7;
  }
  h1,h2,h3 { color: #f1f5f9; margin-bottom: 10px; }
  p { margin-bottom: 10px; }
  strong { color: #e2e8f0; }
  table { border-collapse: collapse; width: 100%; }
  th { background: rgba(99,102,241,0.12); padding: 8px 12px; border: 1px solid rgba(99,102,241,0.15); color: #a5b4fc; font-weight: 600; }
  td { padding: 8px 12px; border: 1px solid rgba(99,102,241,0.1); }
  a { color: #818cf8; }
  blockquote { border-left: 3px solid rgba(99,102,241,0.5); padding-left: 14px; color: #94a3b8; margin: 12px 0; }
  code { background: rgba(99,102,241,0.15); padding: 2px 6px; border-radius: 4px; color: #c7d2fe; }
  pre { background: #080c18; border: 1px solid rgba(99,102,241,0.15); padding: 14px; border-radius: 10px; overflow-x: auto; }
  ul, ol { padding-left: 22px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
  li::marker { color: #6366f1; }
`;

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ content, type = 'html', title = 'Artifact' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMarkdown = type === 'markdown' || type === 'ship30_essay';

  useEffect(() => {
    if (!isMarkdown && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${IFRAME_STYLES}</style></head><body>${content}</body></html>`);
        doc.close();
      }
    }
  }, [content, isMarkdown]);

  return (
    <div className="av-container">
      {/* Browser-style header */}
      <div className="av-header">
        <div className="av-dots">
          <div className="av-dot red" />
          <div className="av-dot yellow" />
          <div className="av-dot green" />
        </div>
        <span className="av-title">{title}</span>
        <span className="av-type">{type}</span>
      </div>

      {/* Content */}
      <div className={`av-body ${isMarkdown ? 'padded' : ''}`}>
        {isMarkdown ? (
          <MarkdownRenderer content={content} />
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            className="av-iframe"
            title={title}
          />
        )}
      </div>
    </div>
  );
};

export default ArtifactViewer;
