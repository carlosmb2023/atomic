import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  profile_img: text("profile_img"),
  is_active: boolean("is_active").default(true),
});

// Arquivos
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  type: varchar("type", { length: 100 }),
  user_id: integer("user_id").references(() => users.id),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  description: text("description"),
  is_public: boolean("is_public").default(false),
});

// Projetos
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  user_id: integer("user_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  status: varchar("status", { length: 50 }).default("active"),
});

// Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  created_at: timestamp("created_at").defaultNow(),
  ip_address: varchar("ip_address", { length: 45 }),
});

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  path: true,
  size: true,
  type: true,
  user_id: true,
  description: true,
  is_public: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  user_id: true,
  status: true,
});

export const insertLogSchema = createInsertSchema(logs).pick({
  user_id: true,
  action: true,
  details: true,
  ip_address: true,
});

// Tipos para os modelos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
