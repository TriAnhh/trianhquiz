import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStudentSchema, insertQuizSessionSchema, insertAnswerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Student routes
  app.post('/api/students', async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      
      // Check if student name already exists
      const existingStudent = await storage.getStudentByName(studentData.name);
      if (existingStudent) {
        // Reactivate existing student
        await storage.updateStudentStatus(existingStudent.id, true);
        res.json(existingStudent);
        return;
      }

      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.get('/api/students/active', async (req, res) => {
    try {
      const students = await storage.getActiveStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching active students:", error);
      res.status(500).json({ message: "Failed to fetch active students" });
    }
  });

  // Quiz session routes (protected)
  app.post('/api/quiz-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const sessionData = insertQuizSessionSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const session = await storage.createQuizSession(sessionData, userId);
      res.json(session);
    } catch (error) {
      console.error("Error creating quiz session:", error);
      res.status(400).json({ message: "Failed to create quiz session" });
    }
  });

  app.get('/api/quiz-sessions/current', async (req, res) => {
    try {
      const session = await storage.getCurrentQuizSession();
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching current session:", error);
      res.status(500).json({ message: "Failed to fetch current session" });
    }
  });

  app.post('/api/quiz-sessions/:id/start', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.startQuizSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error starting quiz session:", error);
      res.status(400).json({ message: "Failed to start quiz session" });
    }
  });

  app.post('/api/quiz-sessions/:id/stop', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.stopQuizSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error stopping quiz session:", error);
      res.status(400).json({ message: "Failed to stop quiz session" });
    }
  });

  app.patch('/api/quiz-sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const session = await storage.updateQuizSession(id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating quiz session:", error);
      res.status(400).json({ message: "Failed to update quiz session" });
    }
  });

  // Answer routes
  app.post('/api/answers', async (req, res) => {
    try {
      const answerData = insertAnswerSchema.parse(req.body);
      const answer = await storage.submitAnswer(answerData);
      res.json(answer);
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(400).json({ message: "Failed to submit answer" });
    }
  });

  app.get('/api/quiz-sessions/:sessionId/questions/:questionNumber/stats', async (req, res) => {
    try {
      const { sessionId, questionNumber } = req.params;
      const stats = await storage.getAnswerStats(sessionId, parseInt(questionNumber));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching answer stats:", error);
      res.status(500).json({ message: "Failed to fetch answer stats" });
    }
  });

  // Get all questions history with statistics
  app.get('/api/quiz-sessions/:sessionId/history', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getCurrentQuizSession();
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ error: "Quiz session not found" });
      }

      const history = [];
      for (let q = 1; q <= session.totalQuestions; q++) {
        const stats = await storage.getAnswerStats(sessionId, q);
        history.push({
          questionNumber: q,
          stats: stats
        });
      }
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      res.status(500).json({ message: "Failed to fetch quiz history" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'quiz_started':
          case 'quiz_stopped':
          case 'question_changed':
          case 'answer_submitted':
          case 'student_joined':
          case 'student_left':
            // Broadcast to all connected clients
            broadcast(data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  return httpServer;
}
