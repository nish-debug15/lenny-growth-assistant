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
    margin: 0; padding: 0;
    background: #ffffff; color: #111111;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px; line-height: 1.6;
  }
  h1,h2,h3 { color: #000000; margin-bottom: 12px; font-weight: 600; }
  p { margin-bottom: 12px; }
  strong { color: #000000; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th { background: #f9f9f9; padding: 10px 12px; border: 1px solid #e5e5e5; font-weight: 600; text-align: left; }
  td { padding: 10px 12px; border: 1px solid #e5e5e5; }
  a { color: #000000; text-decoration: underline; text-decoration-color: #d4d4d4; }
  blockquote { border-left: 3px solid #e5e5e5; padding-left: 16px; color: #666666; margin: 16px 0; }
  code { background: #f3f3f3; padding: 2px 6px; border-radius: 4px; color: #000000; font-family: monospace; font-size: 13px; }
  pre { background: #f9f9f9; border: 1px solid #e5e5e5; padding: 16px; border-radius: 8px; overflow-x: auto; }
  ul, ol { padding-left: 24px; margin-bottom: 12px; }
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
