import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageType, WebSocketMessage } from '@shared/schema';
import { websocketClient } from '@/lib/websocket';
import { cn } from '@/lib/utils';

// Monaco Editor will be lazy-loaded
import { Skeleton } from '@/components/ui/skeleton';

type FileTab = {
  id?: number;
  name: string;
  content: string;
  language: string;
  isActive: boolean;
};

type CodeEditorProps = {
  sessionId: number;
  userId: number;
  initialFiles?: any[];
  onContentChange?: (content: string, fileId?: number) => void;
};

export default function CodeEditor({ sessionId, userId, initialFiles = [], onContentChange }: CodeEditorProps) {
  const [files, setFiles] = useState<FileTab[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [isLoading, setIsLoading] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    // Initialize with either initialFiles or a default file
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles.map((file, index) => ({
        id: file.id,
        name: file.name,
        content: file.content || '',
        language: file.language || 'javascript',
        isActive: index === 0
      })));
      if (initialFiles[0]) {
        setSelectedLanguage(initialFiles[0].language || 'javascript');
      }
    } else {
      setFiles([{
        name: 'main.js',
        content: '// Start coding here',
        language: 'javascript',
        isActive: true
      }]);
    }

    // Dynamically import Monaco Editor
    import('monaco-editor').then(monaco => {
      monacoRef.current = monaco;
      
      // Initialize editor with first file
      const container = document.getElementById('monaco-editor-container');
      if (container) {
        editorRef.current = monaco.editor.create(container, {
          value: files[0]?.content || '// Start coding here',
          language: 'javascript',
          theme: 'vs-dark',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: '"Fira Code", monospace',
          renderLineHighlight: 'all',
        });
        
        // Listen for content changes
        editorRef.current.onDidChangeModelContent(() => {
          const content = editorRef.current.getValue();
          const activeFile = files.find(f => f.isActive);
          
          // Update the active file content
          setFiles(prev => prev.map(f => 
            f.isActive ? { ...f, content } : f
          ));
          
          // Call the callback if provided
          if (onContentChange) {
            onContentChange(content, activeFile?.id);
          }
          
          // Send change via WebSocket
          if (activeFile?.id) {
            websocketClient.sendCodeChange(activeFile.id, content);
          }
        });
        
        // Update line numbers when content changes
        updateLineNumbers(editorRef.current.getValue());
        
        setIsLoading(false);
      }
    });
    
    // Listen for code changes from WebSocket
    const unsubscribe = websocketClient.addMessageHandler(
      MessageType.CODE_CHANGE,
      (message: WebSocketMessage) => {
        if (message.userId !== userId && message.payload.fileId) {
          // Find the file that was changed
          const fileIndex = files.findIndex(f => f.id === message.payload.fileId);
          if (fileIndex >= 0) {
            // Update the file content
            setFiles(prev => 
              prev.map((f, i) => 
                i === fileIndex ? { ...f, content: message.payload.content } : f
              )
            );
            
            // If this is the active file, update the editor content
            if (files[fileIndex]?.isActive && editorRef.current) {
              const currentPos = editorRef.current.getPosition();
              editorRef.current.setValue(message.payload.content);
              editorRef.current.setPosition(currentPos);
            }
          }
        }
      }
    );
    
    return () => {
      // Clean up
      unsubscribe();
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [sessionId, userId]);
  
  // Update editor when active file changes
  useEffect(() => {
    const activeFile = files.find(f => f.isActive);
    if (activeFile && editorRef.current && monacoRef.current) {
      // Change the model
      const model = monacoRef.current.editor.createModel(
        activeFile.content,
        activeFile.language
      );
      editorRef.current.setModel(model);
      
      // Update language
      setSelectedLanguage(activeFile.language);
      
      // Update line numbers
      updateLineNumbers(activeFile.content);
    }
  }, [files]);
  
  // Helper to update line numbers
  const updateLineNumbers = (content: string) => {
    const lines = content.split('\n');
    setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
  };
  
  // Handle tab changes
  const handleTabClick = (index: number) => {
    if (files[index] && !files[index].isActive) {
      setFiles(prev => prev.map((file, i) => ({
        ...file,
        isActive: i === index
      })));
    }
  };
  
  // Handle language changes
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    setSelectedLanguage(language);
    
    // Update the language of the active file
    setFiles(prev => prev.map(file => 
      file.isActive ? { ...file, language } : file
    ));
    
    // Update the editor language
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelLanguage(model, language);
    }
  };
  
  // Handle creating a new file
  const handleNewFile = () => {
    const defaultName = `file${files.length + 1}.${getFileExtension(selectedLanguage)}`;
    
    // Create a new file and make it active
    setFiles(prev => [
      ...prev.map(file => ({ ...file, isActive: false })),
      {
        name: defaultName,
        content: '',
        language: selectedLanguage,
        isActive: true
      }
    ]);
    
    // Send file create message via WebSocket
    websocketClient.sendFileCreate(defaultName, '', selectedLanguage);
  };
  
  // Helper to get file extension from language
  const getFileExtension = (language: string): string => {
    switch (language) {
      case 'javascript': return 'js';
      case 'typescript': return 'ts';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'python': return 'py';
      case 'java': return 'java';
      case 'csharp': return 'cs';
      case 'php': return 'php';
      default: return 'txt';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center">
        <div className="flex space-x-1 overflow-x-auto hide-scrollbar">
          {files.map((file, index) => (
            <button
              key={index}
              className={cn(
                "tab-transition px-3 py-2 text-sm font-medium rounded-t-md border-b-2",
                file.isActive 
                  ? "bg-slate-700 text-white border-primary-500" 
                  : "text-slate-300 hover:bg-slate-700 hover:text-white border-transparent"
              )}
              onClick={() => handleTabClick(index)}
            >
              {file.name}
            </button>
          ))}
          <button 
            className="px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-md"
            onClick={handleNewFile}
          >
            <i className="bi bi-plus"></i>
          </button>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <select 
            className="bg-slate-700 text-sm text-white rounded-md border-0 py-1 px-2"
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="php">PHP</option>
          </select>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <i className="bi bi-gear"></i>
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden bg-slate-900">
        {isLoading ? (
          <div className="h-full flex">
            <div className="bg-slate-800 w-12 pt-2">
              <Skeleton className="h-4 w-6 mx-auto mb-2" />
              <Skeleton className="h-4 w-6 mx-auto mb-2" />
              <Skeleton className="h-4 w-6 mx-auto mb-2" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-6 w-5/6 mb-2" />
            </div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Line Numbers */}
            <div className="bg-slate-800 text-slate-500 text-right pr-2 pt-2 select-none code-font">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            
            {/* Editor Content */}
            <div className="flex-1 overflow-hidden" id="monaco-editor-container" />
          </div>
        )}
      </div>
    </div>
  );
}
