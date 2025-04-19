import React from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({ 
  code, 
  language = 'javascript', 
  showLineNumbers = true,
  className
}: CodeBlockProps) {
  // Split code into lines
  const lines = code.split('\n');
  
  // Tokens for different code elements
  const getTokenClass = (token: string, lang: string) => {
    if (lang === 'javascript' || lang === 'typescript') {
      // Keywords
      if (/^(const|let|var|function|class|import|export|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|this|super|extends|async|await)$/.test(token)) {
        return 'text-violet-400';
      }
      // Variables
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token) && !/^(true|false|null|undefined)$/.test(token)) {
        return 'text-green-400';
      }
      // Built-in objects
      if (/^(console|document|window|Array|Object|String|Number|Boolean|Function|Symbol|Map|Set|Promise|JSON)$/.test(token)) {
        return 'text-blue-300';
      }
      // String literals
      if (/^['"`].*['"`]$/.test(token)) {
        return 'text-green-300';
      }
      // Numbers
      if (/^[0-9]+(\.[0-9]+)?$/.test(token)) {
        return 'text-orange-400';
      }
      // Comments
      if (token.startsWith('//')) {
        return 'text-slate-500';
      }
      // Punctuation
      if (/^[{}()\[\].,;:]$/.test(token)) {
        return 'text-slate-400';
      }
    }
    
    // Default
    return '';
  };
  
  // Simple tokenizer (very basic)
  const tokenize = (line: string, lang: string) => {
    // This is a very simple tokenizer and won't handle all cases properly
    // In a real app, you would use a proper syntax highlighter library
    return line.split(/([{}()\[\].,;:]|".*?"|'.*?'|`.*?`|\s+)/).filter(Boolean).map((token, i) => (
      <span key={i} className={getTokenClass(token, lang)}>
        {token}
      </span>
    ));
  };

  return (
    <div className={cn(
      "rounded-md overflow-hidden bg-slate-900 font-mono text-sm",
      className
    )}>
      <div className="flex">
        {showLineNumbers && (
          <div className="bg-slate-800 text-slate-500 text-right pr-2 pt-2 select-none">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        
        <pre className="p-2 overflow-auto">
          <code>
            {lines.map((line, i) => (
              <div key={i}>
                {tokenize(line, language)}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
