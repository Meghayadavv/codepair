import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { peerClient } from '@/lib/peerjs';
import { useToast } from '@/hooks/use-toast';

type VideoChatProps = {
  userId: number;
  partnerId?: number;
  partnerName?: string;
  sessionId: number;
};

export default function VideoChat({ userId, partnerId, partnerName = 'Partner', sessionId }: VideoChatProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Initialize PeerJS and connect to partner if available
  useEffect(() => {
    const initPeerConnection = async () => {
      try {
        // Initialize PeerJS with user ID
        setIsConnecting(true);
        await peerClient.initialize(userId);

        // Set up event handlers
        const removeConnectionHandler = peerClient.onConnectionState((connected) => {
          setIsConnected(connected);
          setIsConnecting(false);
          
          if (connected) {
            toast({
              title: 'Video Connected',
              description: `You are now connected with ${partnerName}`,
            });
          } else {
            toast({
              title: 'Video Disconnected',
              description: 'The video call has ended',
            });
          }
        });

        const removeRemoteStreamHandler = peerClient.onRemoteStream((stream) => {
          if (partnerVideoRef.current) {
            partnerVideoRef.current.srcObject = stream;
          }
        });

        const removeLocalStreamHandler = peerClient.onLocalStream((stream) => {
          if (selfVideoRef.current) {
            selfVideoRef.current.srcObject = stream;
          }
        });

        const removeErrorHandler = peerClient.onError((error) => {
          toast({
            title: 'Video Error',
            description: error.message,
            variant: 'destructive',
          });
          setIsConnecting(false);
        });

        // Call partner if partner ID is available
        if (partnerId) {
          await peerClient.call(`codepair-${partnerId}`);
        }

        return () => {
          removeConnectionHandler();
          removeRemoteStreamHandler();
          removeLocalStreamHandler();
          removeErrorHandler();
          peerClient.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize peer connection:', error);
        setIsConnecting(false);
        toast({
          title: 'Connection Error',
          description: 'Failed to initialize video chat',
          variant: 'destructive',
        });
      }
    };

    if (userId) {
      initPeerConnection();
    }

    return () => {
      peerClient.destroy();
    };
  }, [userId, partnerId, partnerName, toast]);

  // Handle toggle video
  const handleToggleVideo = async () => {
    await peerClient.toggleVideo(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  // Handle toggle audio
  const handleToggleAudio = async () => {
    await peerClient.toggleAudio(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  // Handle end call
  const handleEndCall = () => {
    peerClient.endCall();
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Partner Video */}
      <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden relative">
        {isConnecting && !isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500 border-r-2 mx-auto mb-2"></div>
              <p className="text-sm text-slate-300">Connecting to {partnerName}...</p>
            </div>
          </div>
        )}
        
        {!isConnected && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center">
              <i className="bi bi-camera-video-off text-3xl text-slate-400 mb-2"></i>
              <p className="text-sm text-slate-300">Video not connected</p>
            </div>
          </div>
        )}
        
        <video
          ref={partnerVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        
        {partnerName && isConnected && (
          <div className="absolute top-2 left-2 bg-slate-900 bg-opacity-70 px-2 py-1 rounded-md text-xs flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
            <span>{partnerName}</span>
          </div>
        )}
      </div>
      
      {/* Self Video */}
      <div className="h-1/4 bg-slate-900 rounded-lg overflow-hidden relative">
        <video
          ref={selfVideoRef}
          autoPlay
          playsInline
          muted={true}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-2 left-2 bg-slate-900 bg-opacity-70 px-2 py-1 rounded-md text-xs">
          You
        </div>
        
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-75">
            <i className="bi bi-camera-video-off text-2xl text-slate-400"></i>
          </div>
        )}
      </div>
      
      {/* Video Controls */}
      <div className="flex justify-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className={`p-2 ${isVideoEnabled ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'} rounded-full hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          onClick={handleToggleVideo}
        >
          <i className={`bi bi-camera-video${isVideoEnabled ? '' : '-off'}`}></i>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-2 ${isAudioEnabled ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'} rounded-full hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          onClick={handleToggleAudio}
        >
          <i className={`bi bi-mic${isAudioEnabled ? '' : '-mute'}`}></i>
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={handleEndCall}
        >
          <i className="bi bi-telephone-x"></i>
        </Button>
      </div>
    </div>
  );
}
