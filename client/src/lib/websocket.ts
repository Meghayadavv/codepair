import { MessageType, WebSocketMessage } from "@shared/schema";

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionStateHandler = (connected: boolean) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private reconnectTimer: number | null = null;
  private userId: number | null = null;
  private sessionId: number | null = null;
  private isConnected = false;

  constructor() {
    // Initialize the message handler sets for each message type
    Object.values(MessageType).forEach(type => {
      this.messageHandlers.set(type as MessageType, new Set());
    });
  }

  connect(userId: number) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      this.isConnected = true;
      this.notifyConnectionStateHandlers(true);
      
      // Clear any reconnect timer
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });
    
    this.socket.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      this.isConnected = false;
      this.notifyConnectionStateHandlers(false);
      
      // Try to reconnect after a delay
      this.reconnectTimer = window.setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, 3000);
    });
    
    this.socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });
    
    this.socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.notifyMessageHandlers(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
    this.notifyConnectionStateHandlers(false);
  }
  
  joinSession(sessionId: number) {
    if (!this.isConnected || !this.userId) {
      console.error("Cannot join session: Not connected");
      return;
    }
    
    this.sessionId = sessionId;
    
    const joinMessage: WebSocketMessage = {
      type: MessageType.SESSION_JOIN,
      sessionId,
      userId: this.userId,
      payload: { userId: this.userId }
    };
    
    this.sendMessage(joinMessage);
  }
  
  leaveSession() {
    if (!this.isConnected || !this.userId || !this.sessionId) {
      return;
    }
    
    const leaveMessage: WebSocketMessage = {
      type: MessageType.SESSION_LEAVE,
      sessionId: this.sessionId,
      userId: this.userId,
      payload: { userId: this.userId }
    };
    
    this.sendMessage(leaveMessage);
    this.sessionId = null;
  }
  
  sendCodeChange(fileId: number, content: string) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.CODE_CHANGE,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { fileId, content }
    };
    
    this.sendMessage(message);
  }
  
  sendCursorMove(fileId: number, position: { line: number, column: number }) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.CURSOR_MOVE,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { fileId, position }
    };
    
    this.sendMessage(message);
  }
  
  sendFileCreate(name: string, content: string = "", language: string = "javascript") {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.FILE_CREATE,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { name, content, language }
    };
    
    this.sendMessage(message);
  }
  
  sendFileDelete(fileId: number) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.FILE_DELETE,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { fileId }
    };
    
    this.sendMessage(message);
  }
  
  sendChatMessage(content: string) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.CHAT_MESSAGE,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { content, timestamp: new Date().toISOString() }
    };
    
    this.sendMessage(message);
  }
  
  sendTerminalOutput(content: string) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.TERMINAL_OUTPUT,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { content }
    };
    
    this.sendMessage(message);
  }
  
  sendTerminalInput(content: string) {
    if (!this.sessionId) return;
    
    const message: WebSocketMessage = {
      type: MessageType.TERMINAL_INPUT,
      sessionId: this.sessionId,
      userId: this.userId!,
      payload: { content }
    };
    
    this.sendMessage(message);
  }
  
  sendMessage(message: WebSocketMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket not open");
      return;
    }
    
    this.socket.send(JSON.stringify(message));
  }
  
  addMessageHandler(type: MessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.add(handler);
    }
    
    // Return a function to remove the handler
    return () => this.removeMessageHandler(type, handler);
  }
  
  removeMessageHandler(type: MessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  addConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionStateHandlers.add(handler);
    
    // Return a function to remove the handler
    return () => this.removeConnectionStateHandler(handler);
  }
  
  removeConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionStateHandlers.delete(handler);
  }
  
  private notifyMessageHandlers(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      }
    }
  }
  
  private notifyConnectionStateHandlers(connected: boolean) {
    for (const handler of this.connectionStateHandlers) {
      try {
        handler(connected);
      } catch (error) {
        console.error("Error in connection state handler:", error);
      }
    }
  }
  
  isWebSocketConnected() {
    return this.isConnected;
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();
