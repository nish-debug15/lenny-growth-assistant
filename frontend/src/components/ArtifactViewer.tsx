import React, { useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface ArtifactViewerProps {
  content: string;
  type?: string;
  title?: string;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ content, type = 'html', title = 'Artifact' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isMarkdown = type === 'markdown' || type === 'ship30_essay';

  useEffect(() => {
    if (!isMarkdown && iframeRef.current) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        // Provide a basic wrapper to ensure styles look decent inside the iframe
        document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  padding: 20px;
                  margin: 0;
                }
                h1, h2, h3 { color: #111; }
                p { margin-bottom: 1em; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        document.close();
      }
    }
  }, [content, isMarkdown]);

  return (
    <div className="artifact-viewer" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
      <div className="artifact-header" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          {title} {type && <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>({type})</span>}
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: isMarkdown ? '20px' : '0' }}>
        {isMarkdown ? (
          <MarkdownRenderer content={content} />
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none', minHeight: '300px' }}
            title={title}
          />
        )}
      </div>
    </div>
  );
};

export default ArtifactViewer;
