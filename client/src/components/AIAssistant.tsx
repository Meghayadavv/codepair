import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCodeSuggestion } from '@/lib/openai';

type AIAssistantProps = {
  sessionId: number;
  currentCode: string;
  language: string;
};

export default function AIAssistant({ sessionId, currentCode, language }: AIAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle submitting a question to the AI
  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getCodeSuggestion(currentCode, language, question);
      setSuggestion(response.suggestion);
      setExplanation(response.explanation);
      setQuestion('');
    } catch (err) {
      console.error('Error getting AI suggestion:', err);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press for input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitQuestion();
    }
  };

  // Handle showing code example
  const handleShowExample = () => {
    // This would typically make another API call or reveal more details
    // For now, we'll just toggle showing the full suggestion
    setSuggestion(prev => prev ? null : 'Here is an example of proper error handling for Socket.IO:\n\nsocket.on("error", (error) => {\n  console.error("Socket error:", error);\n});\n\nsocket.on("connect_error", (error) => {\n  console.error("Connection error:", error);\n});');
  };

  return (
    <div className="border-t border-slate-700 p-4">
      <h3 className="text-sm font-medium flex items-center">
        <i className="bi bi-robot mr-2"></i> AI Assistant
      </h3>
      
      <div className="mt-2 p-3 bg-slate-900 rounded-lg text-xs space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : suggestion ? (
          <>
            <p>{explanation}</p>
            {suggestion.includes('\n') && (
              <div className="pt-2 border-t border-slate-700">
                <Button 
                  variant="link" 
                  className="text-primary-400 hover:text-primary-300 text-xs p-0"
                  onClick={handleShowExample}
                >
                  {suggestion.length > 0 ? 'Hide example' : 'Show me how'}
                </Button>
                
                {suggestion.length > 0 && (
                  <pre className="mt-2 p-2 bg-slate-800 rounded text-xs overflow-x-auto">
                    <code>{suggestion}</code>
                  </pre>
                )}
              </div>
            )}
          </>
        ) : (
          <p>I can help with your code. Ask me a question about your current code or how to implement a feature.</p>
        )}
      </div>
      
      <div className="mt-3 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask for help..."
          className="w-full bg-slate-700 border-0 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-5 w-5 text-slate-400 hover:text-white"
          onClick={handleSubmitQuestion}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? (
            <i className="bi bi-three-dots animate-pulse"></i>
          ) : (
            <i className="bi bi-send"></i>
          )}
        </Button>
      </div>
    </div>
  );
}
