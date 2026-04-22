import TerminalCode from './TerminalCode';
import './MarkdownText.css';

/**
 * Lightweight markdown renderer for AI-generated text.
 * Supports: ## headings, ```code blocks```, **bold**, bullet points, numbered lists.
 */
function MarkdownText({ content }) {
  if (!content) return null;

  const renderMarkdown = (text) => {
    // Split into blocks by code fences first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0]?.trim() || '';
        const code = (language && !language.includes(' ') && language.length < 20)
          ? lines.slice(1).join('\n')
          : lines.join('\n');
        const displayLang = (language && !language.includes(' ') && language.length < 20) ? language : '';

        return (
          <TerminalCode 
            key={index}
            code={code.trim()}
            title={displayLang ? `audit-fix.${displayLang}` : "remediation-script"} 
          />
        );
      }

      // Regular text — process line by line
      const lines = part.split('\n');
      return lines.map((line, lineIndex) => {
        const key = `${index}-${lineIndex}`;
        const trimmed = line.trim();

        if (!trimmed) return <div className="md-spacer" key={key} />;

        // ## Heading
        if (trimmed.startsWith('## ')) {
          return <h3 className="md-heading" key={key}>{renderInline(trimmed.slice(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 className="md-heading md-heading-lg" key={key}>{renderInline(trimmed.slice(2))}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 className="md-heading md-heading-sm" key={key}>{renderInline(trimmed.slice(4))}</h4>;
        }

        // Numbered list: 1. item, 2. item
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div className="md-list-item md-numbered" key={key}>
              <span className="md-list-number">{numberedMatch[1]}</span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        // Bullet list: - item or * item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div className="md-list-item" key={key}>
              <span className="md-bullet">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Regular paragraph
        return <p className="md-paragraph" key={key}>{renderInline(trimmed)}</p>;
      });
    });
  };

  // Inline formatting: **bold**, `code`, *italic*
  const renderInline = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      // Inline code `text`
      const codeMatch = remaining.match(/`([^`]+)`/);

      let firstMatch = null;
      let matchType = null;

      if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index)) {
        firstMatch = boldMatch;
        matchType = 'bold';
      } else if (codeMatch) {
        firstMatch = codeMatch;
        matchType = 'code';
      }

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      // Add text before match
      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }

      if (matchType === 'bold') {
        parts.push(<strong key={key++}>{firstMatch[1]}</strong>);
      } else if (matchType === 'code') {
        parts.push(<code className="md-inline-code" key={key++}>{firstMatch[1]}</code>);
      }

      remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
    }

    return parts;
  };

  return <div className="markdown-text">{renderMarkdown(content)}</div>;
}

export default MarkdownText;
