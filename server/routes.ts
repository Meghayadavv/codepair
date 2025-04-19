import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  MessageType, 
  type WebSocketMessage, 
  type User,
  insertUserSchema,
  insertSessionSchema,
  insertFileSchema,
  insertFeedbackSchema,
  insertSkillSchema
} from "@shared/schema";
import { z } from "zod";

// Map to keep track of connected clients
const connectedClients = new Map<number, WebSocket>();
const sessionClients = new Map<number, Set<number>>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    let sessionId: number | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Set user ID and session ID from first message
        if (!userId) userId = data.userId;
        
        // Add client to session
        if (data.type === MessageType.SESSION_JOIN) {
          sessionId = data.sessionId;
          
          // Add user to session clients
          if (!sessionClients.has(sessionId)) {
            sessionClients.set(sessionId, new Set());
          }
          sessionClients.get(sessionId)?.add(userId);
          
          // Store connection in clients map
          connectedClients.set(userId, ws);
        }
        
        // Broadcast message to all clients in the session
        if (sessionId) {
          const sessionUsers = sessionClients.get(sessionId);
          if (sessionUsers) {
            for (const clientId of sessionUsers) {
              // Skip sender
              if (clientId === userId) continue;
              
              const clientWs = connectedClients.get(clientId);
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(data));
              }
            }
          }
        }
        
        // Handle specific message types that require server action
        switch (data.type) {
          case MessageType.CODE_CHANGE:
            if (data.payload.fileId) {
              await storage.updateFile(data.payload.fileId, data.payload.content);
            }
            break;
            
          case MessageType.FILE_CREATE:
            if (sessionId) {
              await storage.createFile({
                sessionId,
                name: data.payload.name,
                content: data.payload.content || '',
                language: data.payload.language || 'javascript'
              });
            }
            break;
            
          case MessageType.SESSION_LEAVE:
            if (sessionId && userId) {
              // Remove client from session
              sessionClients.get(sessionId)?.delete(userId);
              
              // If session is empty, end it
              if (sessionClients.get(sessionId)?.size === 0) {
                await storage.endSession(sessionId);
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      
      if (userId) {
        // Remove client from connected clients
        connectedClients.delete(userId);
        
        // Set user as offline
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUser(userId, { isOnline: false });
        }
        
        // Remove from session if applicable
        if (sessionId) {
          sessionClients.get(sessionId)?.delete(userId);
          
          // Notify others in session that user left
          const sessionUsers = sessionClients.get(sessionId);
          if (sessionUsers) {
            const leaveMsg: WebSocketMessage = {
              type: MessageType.SESSION_LEAVE,
              sessionId,
              userId,
              payload: { userId }
            };
            
            for (const clientId of sessionUsers) {
              const clientWs = connectedClients.get(clientId);
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(leaveMsg));
              }
            }
            
            // If session is empty, end it
            if (sessionUsers.size === 0) {
              await storage.endSession(sessionId);
            }
          }
        }
      }
    });
  });

  // User API routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Update user status to online
      await storage.updateUser(user.id, { isOnline: true });
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/users/online', async (req, res) => {
    try {
      const users = await storage.listOnlineUsers();
      
      // Don't return passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Skills API routes
  app.get('/api/users/:userId/skills', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/users/:userId/skills', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const skillData = insertSkillSchema.parse({ ...req.body, userId });
      const skill = await storage.addSkill(skillData);
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.delete('/api/skills/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeSkill(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Skill not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Session API routes
  app.post('/api/sessions', async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      
      // Create initial file for the session
      await storage.createFile({
        sessionId: session.id,
        name: 'main.js',
        content: '// Start coding here',
        language: 'javascript'
      });
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSession(id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/users/:userId/sessions', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/sessions/:id/end', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.endSession(id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/sessions/active', async (req, res) => {
    try {
      const sessions = await storage.findActiveSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // File API routes
  app.post('/api/sessions/:sessionId/files', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const fileData = insertFileSchema.parse({ ...req.body, sessionId });
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.get('/api/sessions/:sessionId/files', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const files = await storage.getSessionFiles(sessionId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/files/:id/content', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      
      if (typeof content !== 'string') {
        return res.status(400).json({ message: 'Content must be a string' });
      }
      
      const file = await storage.updateFile(id, content);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Feedback API routes
  app.post('/api/sessions/:sessionId/feedback', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, sessionId });
      const feedback = await storage.addFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.get('/api/sessions/:sessionId/feedback', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const feedback = await storage.getSessionFeedback(sessionId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
