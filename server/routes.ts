import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";

// Set up multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API status endpoint
  app.get("/api", (_req, res) => {
    res.json({ status: "Sistema online e operacional", time: new Date().toISOString() });
  });
  
  // File upload endpoint
  app.post("/upload", upload.array("files"), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).send("No files uploaded");
      }
      
      const fileNames = files.map(file => file.filename);
      return res.status(200).json({ 
        message: "Files uploaded successfully", 
        files: fileNames 
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      return res.status(500).send("Error uploading files");
    }
  });
  
  // List files endpoint
  app.get("/files", (_req, res) => {
    try {
      fs.readdir(uploadsDir, (err, files) => {
        if (err) {
          console.error("Error reading uploads directory:", err);
          return res.status(500).send("Error reading files");
        }
        
        return res.status(200).json(files);
      });
    } catch (error) {
      console.error("Error listing files:", error);
      return res.status(500).send("Error listing files");
    }
  });
  
  // Login endpoint (mock for demo)
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    // Very basic validation - in a real app, we would use proper authentication
    if (username && password) {
      return res.status(200).json({ message: "Login successful" });
    }
    
    return res.status(401).send("Invalid username or password");
  });

  const httpServer = createServer(app);

  return httpServer;
}
