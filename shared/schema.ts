import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  isOnline: boolean("is_online").default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isOnline: true,
});

// User skills schema
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({ 
  id: true 
});

// Code session schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  partnerId: integer("partner_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  language: text("language").default("javascript"),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  endedAt: true,
  isActive: true,
});

// Files in a session
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  name: text("name").notNull(),
  content: text("content").default(""),
  language: text("language").default("javascript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Session feedback
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// WebSocket message types
export enum MessageType {
  CODE_CHANGE = 'code-change',
  CURSOR_MOVE = 'cursor-move',
  FILE_CREATE = 'file-create',
  FILE_DELETE = 'file-delete',
  CHAT_MESSAGE = 'chat-message',
  SESSION_JOIN = 'session-join',
  SESSION_LEAVE = 'session-leave',
  TERMINAL_OUTPUT = 'terminal-output',
  TERMINAL_INPUT = 'terminal-input',
}

export interface WebSocketMessage {
  type: MessageType;
  sessionId: number;
  userId: number;
  payload: any;
}
