import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import CodeEditor from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';
import VideoChat from '@/components/VideoChat';
import AIAssistant from '@/components/AIAssistant';
import SessionEndModal from '@/components/SessionEndModal';
import { websocketClient } from '@/lib/websocket';
import { AppContext } from '@/App';
import { MessageType, Session, File } from '@shared/schema';

export default function CodeSessionPage() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const { user } = useContext(AppContext);
  const [currentCode, setCurrentCode] = useState('// Start coding here');
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [isSessionEndModalOpen, setIsSessionEndModalOpen] = useState(false);

  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch session files
  const { data: files, isLoading: isLoadingFiles } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/files`],
    enabled: !!sessionId,
  });

  // Determine partner information
  const partnerId = session ? 
    (user?.id === session.creatorId ? session.partnerId : session.creatorId) 
    : undefined;

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    if (user && sessionId) {
      // Connect to WebSocket
      websocketClient.connect(user.id);
      
      // Join the session
      websocketClient.joinSession(sessionId);
      
      // Clean up on unmount
      return () => {
        websocketClient.leaveSession();
      };
    }
  }, [user, sessionId]);

  // Handle code content change
  const handleContentChange = (content: string, fileId?: number) => {
    setCurrentCode(content);
    
    // Update the file content via WebSocket
    if (fileId && user) {
      websocketClient.sendCodeChange(fileId, content);
    }
  };

  // Handle ending the session
  const handleEndSession = () => {
    setIsSessionEndModalOpen(true);
  };

  // Process files data
  const processedFiles = files ? files.map((file: File) => ({
    id: file.id,
    name: file.name,
    content: file.content,
    language: file.language,
    isActive: false
  })) : [];

  // Set the first file as active
  if (processedFiles.length > 0) {
    processedFiles[0].isActive = true;
  }

  return (
    <div className="bg-slate-900 text-slate-50 min-h-screen flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar sessionId={sessionId} partnerId={partnerId} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Code Editor Section */}
          {isLoadingFiles ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500 border-r-2"></div>
            </div>
          ) : (
            <CodeEditor 
              sessionId={sessionId} 
              userId={user?.id || 0} 
              initialFiles={processedFiles}
              onContentChange={handleContentChange}
            />
          )}
          
          {/* Terminal Panel */}
          <Terminal sessionId={sessionId} userId={user?.id || 0} />
        </div>
        
        {/* Video Chat & Controls Section */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          <VideoChat 
            userId={user?.id || 0} 
            partnerId={partnerId}
            sessionId={sessionId}
          />
          
          {/* AI Assistant */}
          <AIAssistant 
            sessionId={sessionId} 
            currentCode={currentCode}
            language={currentLanguage}
          />
        </div>
      </div>
      
      {/* Session End Modal */}
      <SessionEndModal
        isOpen={isSessionEndModalOpen}
        onClose={() => setIsSessionEndModalOpen(false)}
        sessionId={sessionId}
        userId={user?.id || 0}
      />
      
      {/* End Session Button (Mobile) */}
      <div className="md:hidden fixed bottom-4 right-4">
        <button 
          className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700"
          onClick={handleEndSession}
        >
          <i className="bi bi-telephone-x"></i>
        </button>
      </div>
    </div>
  );
}
