import { users, files, projects, logs } from "@shared/schema";
import type { User, InsertUser, File, InsertFile, Project, InsertProject, Log, InsertLog } from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Arquivos
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, fileData: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Projetos
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getLogsByUser(userId: number): Promise<Log[]>;
}

export class DbStorage implements IStorage {
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }
  
  // Arquivos
  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id)).limit(1);
    return result[0];
  }
  
  async getFilesByUser(userId: number): Promise<File[]> {
    return db.select().from(files).where(eq(files.user_id, userId));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(files).values(file).returning();
    return result[0];
  }
  
  async updateFile(id: number, fileData: Partial<File>): Promise<File | undefined> {
    const result = await db.update(files).set(fileData).where(eq(files.id, id)).returning();
    return result[0];
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id)).returning({ id: files.id });
    return result.length > 0;
  }
  
  // Projetos
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.user_id, userId));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return result[0];
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    return result.length > 0;
  }
  
  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const result = await db.insert(logs).values(log).returning();
    return result[0];
  }
  
  async getLogsByUser(userId: number): Promise<Log[]> {
    return db.select().from(logs).where(eq(logs.user_id, userId));
  }
}

// Implementação com memória como fallback
export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private fileMap: Map<number, File>;
  private projectMap: Map<number, Project>;
  private logMap: Map<number, Log>;
  private currentIds = {
    users: 1,
    files: 1,
    projects: 1,
    logs: 1
  };

  constructor() {
    this.userMap = new Map();
    this.fileMap = new Map();
    this.projectMap = new Map();
    this.logMap = new Map();
  }

  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: now,
      is_active: true 
    };
    this.userMap.set(user.id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.userMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.userMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.userMap.delete(id);
  }
  
  // Arquivos
  async getFile(id: number): Promise<File | undefined> {
    return this.fileMap.get(id);
  }
  
  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.fileMap.values()).filter(file => file.user_id === userId);
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentIds.files++;
    const now = new Date();
    const newFile: File = {
      ...file,
      id,
      uploaded_at: now,
      is_public: file.is_public || false
    };
    this.fileMap.set(id, newFile);
    return newFile;
  }
  
  async updateFile(id: number, fileData: Partial<File>): Promise<File | undefined> {
    const file = this.fileMap.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...fileData };
    this.fileMap.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.fileMap.delete(id);
  }
  
  // Projetos
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectMap.get(id);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projectMap.values()).filter(project => project.user_id === userId);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentIds.projects++;
    const now = new Date();
    const newProject: Project = {
      ...project,
      id,
      created_at: now,
      updated_at: now,
      status: project.status || 'active'
    };
    this.projectMap.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projectMap.get(id);
    if (!project) return undefined;
    
    const updatedProject = { 
      ...project, 
      ...projectData,
      updated_at: new Date()
    };
    this.projectMap.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projectMap.delete(id);
  }
  
  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentIds.logs++;
    const now = new Date();
    const newLog: Log = {
      ...log,
      id,
      created_at: now
    };
    this.logMap.set(id, newLog);
    return newLog;
  }
  
  async getLogsByUser(userId: number): Promise<Log[]> {
    return Array.from(this.logMap.values()).filter(log => log.user_id === userId);
  }
}

// Escolha a implementação baseada na configuração
const useDb = process.env.NODE_ENV === 'production' || process.env.USE_DB === 'true';

// Export a instância apropriada
export const storage = useDb ? new DbStorage() : new MemStorage();
