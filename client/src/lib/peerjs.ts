import { Peer, MediaConnection } from 'peerjs';

type VideoStreamHandler = (stream: MediaStream) => void;
type ConnectionStateHandler = (connected: boolean) => void;
type ErrorHandler = (error: Error) => void;

class PeerJSClient {
  private peer: Peer | null = null;
  private userId: string | null = null;
  private remotePeerId: string | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private mediaConnection: MediaConnection | null = null;
  private onRemoteStreamHandlers: Set<VideoStreamHandler> = new Set();
  private onLocalStreamHandlers: Set<VideoStreamHandler> = new Set();
  private onConnectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private onErrorHandlers: Set<ErrorHandler> = new Set();
  
  constructor() {}
  
  async initialize(userId: number): Promise<void> {
    try {
      // Convert numeric userId to string for PeerJS
      this.userId = `codepair-${userId}`;
      
      this.peer = new Peer(this.userId);
      
      this.peer.on('open', (id) => {
        console.log('PeerJS connection opened with ID:', id);
      });
      
      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        this.notifyErrorHandlers(err);
      });
      
      this.peer.on('call', (call) => {
        this.mediaConnection = call;
        
        this.notifyConnectionStateHandlers(true);
        
        // Answer the call with our local stream
        if (this.localStream) {
          call.answer(this.localStream);
        } else {
          // If we don't have a local stream yet, get it and then answer
          this.getLocalStream()
            .then(() => {
              if (this.localStream) {
                call.answer(this.localStream);
              }
            })
            .catch((err) => {
              console.error('Error getting local stream:', err);
              this.notifyErrorHandlers(err);
            });
        }
        
        call.on('stream', (remoteStream) => {
          this.remoteStream = remoteStream;
          this.notifyRemoteStreamHandlers(remoteStream);
        });
        
        call.on('close', () => {
          this.notifyConnectionStateHandlers(false);
          this.mediaConnection = null;
        });
      });
      
      // Initialize local stream
      await this.getLocalStream();
      
    } catch (error) {
      console.error('Error initializing PeerJS:', error);
      this.notifyErrorHandlers(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async getLocalStream(): Promise<MediaStream> {
    if (!this.localStream) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        this.notifyLocalStreamHandlers(this.localStream);
      } catch (error) {
        console.error('Error getting local media stream:', error);
        throw error;
      }
    }
    
    return this.localStream;
  }
  
  async call(remotePeerId: string): Promise<void> {
    if (!this.peer) {
      throw new Error('PeerJS not initialized');
    }
    
    this.remotePeerId = remotePeerId;
    
    try {
      // Make sure we have a local stream
      if (!this.localStream) {
        await this.getLocalStream();
      }
      
      // Initiate the call
      this.mediaConnection = this.peer.call(remotePeerId, this.localStream!);
      
      this.mediaConnection.on('stream', (remoteStream) => {
        this.remoteStream = remoteStream;
        this.notifyRemoteStreamHandlers(remoteStream);
        this.notifyConnectionStateHandlers(true);
      });
      
      this.mediaConnection.on('close', () => {
        this.notifyConnectionStateHandlers(false);
        this.mediaConnection = null;
      });
      
    } catch (error) {
      console.error('Error making call:', error);
      this.notifyErrorHandlers(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.localStream) return;
    
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
  
  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
  
  endCall(): void {
    if (this.mediaConnection) {
      this.mediaConnection.close();
      this.mediaConnection = null;
    }
    
    this.notifyConnectionStateHandlers(false);
  }
  
  destroy(): void {
    this.endCall();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.userId = null;
    this.remotePeerId = null;
    this.remoteStream = null;
  }
  
  // Event handler methods
  onRemoteStream(handler: VideoStreamHandler): () => void {
    this.onRemoteStreamHandlers.add(handler);
    
    // If we already have a remote stream, notify the handler immediately
    if (this.remoteStream) {
      handler(this.remoteStream);
    }
    
    // Return a function to remove the handler
    return () => this.onRemoteStreamHandlers.delete(handler);
  }
  
  onLocalStream(handler: VideoStreamHandler): () => void {
    this.onLocalStreamHandlers.add(handler);
    
    // If we already have a local stream, notify the handler immediately
    if (this.localStream) {
      handler(this.localStream);
    }
    
    // Return a function to remove the handler
    return () => this.onLocalStreamHandlers.delete(handler);
  }
  
  onConnectionState(handler: ConnectionStateHandler): () => void {
    this.onConnectionStateHandlers.add(handler);
    
    // Return a function to remove the handler
    return () => this.onConnectionStateHandlers.delete(handler);
  }
  
  onError(handler: ErrorHandler): () => void {
    this.onErrorHandlers.add(handler);
    
    // Return a function to remove the handler
    return () => this.onErrorHandlers.delete(handler);
  }
  
  // Private notification methods
  private notifyRemoteStreamHandlers(stream: MediaStream): void {
    for (const handler of this.onRemoteStreamHandlers) {
      try {
        handler(stream);
      } catch (error) {
        console.error('Error in remote stream handler:', error);
      }
    }
  }
  
  private notifyLocalStreamHandlers(stream: MediaStream): void {
    for (const handler of this.onLocalStreamHandlers) {
      try {
        handler(stream);
      } catch (error) {
        console.error('Error in local stream handler:', error);
      }
    }
  }
  
  private notifyConnectionStateHandlers(connected: boolean): void {
    for (const handler of this.onConnectionStateHandlers) {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection state handler:', error);
      }
    }
  }
  
  private notifyErrorHandlers(error: Error): void {
    for (const handler of this.onErrorHandlers) {
      try {
        handler(error);
      } catch (error) {
        console.error('Error in error handler:', error);
      }
    }
  }
  
  // Status methods
  isInitialized(): boolean {
    return this.peer !== null;
  }
  
  isConnected(): boolean {
    return this.mediaConnection !== null;
  }
  
  getRemoteStreamStatus(): boolean {
    return this.remoteStream !== null;
  }
  
  getLocalStreamStatus(): boolean {
    return this.localStream !== null;
  }
  
  getPeerId(): string | null {
    return this.userId;
  }
}

// Create a singleton instance
export const peerClient = new PeerJSClient();
