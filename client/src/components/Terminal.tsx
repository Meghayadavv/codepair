import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageType } from '@shared/schema';
import { websocketClient } from '@/lib/websocket';

type TerminalProps = {
  sessionId: number;
  userId: number;
};

export default function Terminal({ sessionId, userId }: TerminalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'terminal' | 'console' | 'problems'>('terminal');
  const [terminalContent, setTerminalContent] = useState<string[]>([
    '> Ready for commands'
  ]);
  const [consoleContent, setConsoleContent] = useState<string[]>([]);
  const [problemsContent, setProblemsContent] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when content changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalContent, consoleContent, problemsContent, activeTab]);

  useEffect(() => {
    // Set up WebSocket listeners for terminal messages
    const terminalOutputHandler = websocketClient.addMessageHandler(
      MessageType.TERMINAL_OUTPUT,
      (message) => {
        if (message.userId !== userId) {
          setTerminalContent(prev => [...prev, message.payload.content]);
        }
      }
    );

    const terminalInputHandler = websocketClient.addMessageHandler(
      MessageType.TERMINAL_INPUT,
      (message) => {
        if (message.userId !== userId) {
          setTerminalContent(prev => [...prev, `> ${message.payload.content}`]);
        }
      }
    );

    return () => {
      terminalOutputHandler();
      terminalInputHandler();
    };
  }, [sessionId, userId]);

  // Handle terminal input
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputElement = e.target as HTMLInputElement;
      const command = inputElement.value;
      
      if (command.trim()) {
        // Add command to terminal with prompt
        setTerminalContent(prev => [...prev, `> ${command}`]);
        
        // Send command to peers via WebSocket
        websocketClient.sendTerminalInput(command);
        
        // Simulate some output (in a real app, this would come from the server)
        setTimeout(() => {
          let output: string;
          
          if (command.startsWith('npm ') || command.startsWith('node ')) {
            output = `Running ${command}...\nSuccess!`;
          } else if (command === 'clear') {
            setTerminalContent([]);
            output = '';
          } else {
            output = `Command not found: ${command}`;
          }
          
          if (output) {
            setTerminalContent(prev => [...prev, output]);
            websocketClient.sendTerminalOutput(output);
          }
        }, 200);
      }
      
      // Clear input
      inputElement.value = '';
    }
  };

  // Toggle terminal panel
  const toggleTerminal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`bg-slate-900 border-t border-slate-700 flex flex-col ${isOpen ? 'h-1/4' : 'h-8'}`}>
      <div className="flex items-center justify-between bg-slate-800 px-4 py-1 border-b border-slate-700">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'terminal' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'terminal' ? 'bg-slate-700' : ''}
            onClick={() => setActiveTab('terminal')}
          >
            Terminal
          </Button>
          <Button
            variant={activeTab === 'console' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'console' ? 'bg-slate-700' : ''}
            onClick={() => setActiveTab('console')}
          >
            Console
          </Button>
          <Button
            variant={activeTab === 'problems' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'problems' ? 'bg-slate-700' : ''}
            onClick={() => setActiveTab('problems')}
          >
            Problems
          </Button>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white h-7 w-7"
            onClick={toggleTerminal}
          >
            <i className={`bi bi-${isOpen ? 'x-lg' : 'chevron-up'}`}></i>
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className="flex-1 flex flex-col">
          <div 
            className="flex-1 p-2 overflow-auto editor-scrollbar"
            ref={terminalRef}
          >
            {activeTab === 'terminal' && (
              <pre className="font-mono text-sm text-slate-300">
                {terminalContent.join('\n')}
              </pre>
            )}
            
            {activeTab === 'console' && (
              <pre className="font-mono text-sm text-slate-300">
                {consoleContent.length > 0 
                  ? consoleContent.join('\n') 
                  : 'No console messages yet.'}
              </pre>
            )}
            
            {activeTab === 'problems' && (
              <pre className="font-mono text-sm text-slate-300">
                {problemsContent.length > 0 
                  ? problemsContent.join('\n') 
                  : 'No problems detected.'}
              </pre>
            )}
          </div>
          
          {activeTab === 'terminal' && (
            <div className="px-2 py-1 border-t border-slate-700 flex items-center">
              <span className="text-green-500 font-mono mr-2">$</span>
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-slate-200"
                placeholder="Type command here..."
                onKeyDown={handleTerminalKeyDown}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
