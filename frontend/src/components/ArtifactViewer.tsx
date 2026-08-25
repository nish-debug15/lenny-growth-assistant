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
    background: #fff; color: #1a1a2e;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 14px; line-height: 1.7;
  }
  h1,h2,h3 { color: #111827; margin-bottom: 10px; }
  p { margin-bottom: 10px; }
  strong { color: #111827; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #f3f4f6; padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 600; }
  td { padding: 8px 10px; border: 1px solid #e5e7eb; }
  a { color: #2563eb; }
  blockquote { border-left: 3px solid #2563eb; padding-left: 14px; color: #6b7280; margin: 12px 0; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #e11d48; }
  pre { background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 8px; overflow-x: auto; }
  ul, ol { padding-left: 22px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
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
