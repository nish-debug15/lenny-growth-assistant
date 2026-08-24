export interface ParsedArtifact {
  type: string;
  title: string;
  content: string;
  raw: string;
}

export interface MessagePart {
  type: 'text' | 'artifact';
  content: string;
  artifact?: ParsedArtifact;
}

/**
 * Parses a message string containing <artifact> tags and splits it into text and artifact parts.
 */
export function parseMessageArtifacts(message: string): MessagePart[] {
  const parts: MessagePart[] = [];
  
  // Basic regex to match <artifact type="..." title="...">content</artifact>
  // Note: HTML parsing with regex is brittle, but this is a controlled format.
  const artifactRegex = /<artifact\s+(?:type="([^"]+)")?\s*(?:title="([^"]+)")?>([\s\S]*?)<\/artifact>/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = artifactRegex.exec(message)) !== null) {
    // Add text before the artifact
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: message.substring(lastIndex, match.index)
      });
    }
    
    // Add the artifact
    parts.push({
      type: 'artifact',
      content: 'Artifact reference',
      artifact: {
        type: match[1] || 'html',
        title: match[2] || 'Artifact',
        content: match[3],
        raw: match[0]
      }
    });
    
    lastIndex = artifactRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < message.length) {
    parts.push({
      type: 'text',
      content: message.substring(lastIndex)
    });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: message }];
}
