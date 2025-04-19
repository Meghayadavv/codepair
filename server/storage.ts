import { 
  users, type User, type InsertUser,
  skills, type Skill, type InsertSkill,
  sessions, type Session, type InsertSession,
  files, type File, type InsertFile,
  feedbacks, type Feedback, type InsertFeedback
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  listOnlineUsers(): Promise<User[]>;

  // Skills operations
  getUserSkills(userId: number): Promise<Skill[]>;
  addSkill(skill: InsertSkill): Promise<Skill>;
  removeSkill(id: number): Promise<boolean>;

  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  getUserSessions(userId: number): Promise<Session[]>;
  endSession(id: number): Promise<Session | undefined>;
  findActiveSessions(): Promise<Session[]>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getSessionFiles(sessionId: number): Promise<File[]>;
  updateFile(id: number, content: string): Promise<File | undefined>;
  
  // Feedback operations
  addFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getSessionFeedback(sessionId: number): Promise<Feedback[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private sessions: Map<number, Session>;
  private files: Map<number, File>;
  private feedbacks: Map<number, Feedback>;
  
  private userIdCounter: number;
  private skillIdCounter: number;
  private sessionIdCounter: number;
  private fileIdCounter: number;
  private feedbackIdCounter: number;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.sessions = new Map();
    this.files = new Map();
    this.feedbacks = new Map();
    
    this.userIdCounter = 1;
    this.skillIdCounter = 1;
    this.sessionIdCounter = 1;
    this.fileIdCounter = 1;
    this.feedbackIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, isOnline: false };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async listOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  // Skills operations
  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId,
    );
  }

  async addSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = this.skillIdCounter++;
    const skill: Skill = { ...insertSkill, id };
    this.skills.set(id, skill);
    return skill;
  }

  async removeSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const session: Session = { 
      ...insertSession, 
      id, 
      createdAt: now, 
      endedAt: null,
      isActive: true 
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.creatorId === userId || session.partnerId === userId,
    );
  }

  async endSession(id: number): Promise<Session | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      isActive: false,
      endedAt: new Date()
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async findActiveSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.isActive
    );
  }
  
  // File operations
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = { 
      ...insertFile, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.files.set(id, file);
    return file;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getSessionFiles(sessionId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.sessionId === sessionId,
    );
  }

  async updateFile(id: number, content: string): Promise<File | undefined> {
    const file = await this.getFile(id);
    if (!file) return undefined;
    
    const updatedFile = { 
      ...file, 
      content,
      updatedAt: new Date()
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  // Feedback operations
  async addFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const now = new Date();
    const feedback: Feedback = { 
      ...insertFeedback, 
      id, 
      createdAt: now 
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async getSessionFeedback(sessionId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      (feedback) => feedback.sessionId === sessionId,
    );
  }
}

export const storage = new MemStorage();
