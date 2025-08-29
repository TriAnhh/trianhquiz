import {
  users,
  students,
  quizSessions,
  answers,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type QuizSession,
  type InsertQuizSession,
  type Answer,
  type InsertAnswer,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByName(name: string): Promise<Student | undefined>;
  getActiveStudents(): Promise<Student[]>;
  updateStudentStatus(id: string, isActive: boolean): Promise<void>;
  
  // Quiz session operations
  createQuizSession(session: InsertQuizSession, createdBy: string): Promise<QuizSession>;
  getCurrentQuizSession(): Promise<QuizSession | undefined>;
  updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession>;
  startQuizSession(id: string): Promise<QuizSession>;
  stopQuizSession(id: string): Promise<QuizSession>;
  
  // Answer operations
  submitAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersForQuestion(sessionId: string, questionNumber: number): Promise<Answer[]>;
  getStudentAnswer(studentId: string, sessionId: string, questionNumber: number): Promise<Answer | undefined>;
  getAnswerStats(sessionId: string, questionNumber: number): Promise<{
    A: number;
    B: number;
    C: number;
    D: number;
    total: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db
      .insert(students)
      .values(student)
      .returning();
    return newStudent;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByName(name: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.name, name));
    return student;
  }

  async getActiveStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.isActive, true));
  }

  async updateStudentStatus(id: string, isActive: boolean): Promise<void> {
    await db.update(students)
      .set({ isActive })
      .where(eq(students.id, id));
  }

  // Quiz session operations
  async createQuizSession(session: InsertQuizSession, createdBy: string): Promise<QuizSession> {
    const [newSession] = await db
      .insert(quizSessions)
      .values({ ...session, createdBy })
      .returning();
    return newSession;
  }

  async getCurrentQuizSession(): Promise<QuizSession | undefined> {
    const [session] = await db.select()
      .from(quizSessions)
      .where(eq(quizSessions.isActive, true))
      .orderBy(desc(quizSessions.createdAt))
      .limit(1);
    return session;
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession> {
    const [session] = await db.update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, id))
      .returning();
    return session;
  }

  async startQuizSession(id: string): Promise<QuizSession> {
    const [session] = await db.update(quizSessions)
      .set({ 
        isActive: true, 
        startTime: new Date()
      })
      .where(eq(quizSessions.id, id))
      .returning();
    return session;
  }

  async stopQuizSession(id: string): Promise<QuizSession> {
    const [session] = await db.update(quizSessions)
      .set({ isActive: false, endTime: new Date() })
      .where(eq(quizSessions.id, id))
      .returning();
    return session;
  }

  // Answer operations
  async submitAnswer(answer: InsertAnswer): Promise<Answer> {
    // Check if student has already answered this question
    const existingAnswer = await this.getStudentAnswer(
      answer.studentId, 
      answer.quizSessionId, 
      answer.questionNumber
    );

    if (existingAnswer) {
      // Update existing answer
      const [updatedAnswer] = await db.update(answers)
        .set({ 
          selectedOption: answer.selectedOption,
          answeredAt: new Date()
        })
        .where(eq(answers.id, existingAnswer.id))
        .returning();
      return updatedAnswer;
    } else {
      // Create new answer
      const [newAnswer] = await db
        .insert(answers)
        .values(answer)
        .returning();
      return newAnswer;
    }
  }

  async getAnswersForQuestion(sessionId: string, questionNumber: number): Promise<Answer[]> {
    return await db.select()
      .from(answers)
      .where(
        and(
          eq(answers.quizSessionId, sessionId),
          eq(answers.questionNumber, questionNumber)
        )
      );
  }

  async getStudentAnswer(studentId: string, sessionId: string, questionNumber: number): Promise<Answer | undefined> {
    const [answer] = await db.select()
      .from(answers)
      .where(
        and(
          eq(answers.studentId, studentId),
          eq(answers.quizSessionId, sessionId),
          eq(answers.questionNumber, questionNumber)
        )
      );
    return answer;
  }

  async getAnswerStats(sessionId: string, questionNumber: number): Promise<{
    A: number;
    B: number;
    C: number;
    D: number;
    total: number;
  }> {
    const answersForQuestion = await this.getAnswersForQuestion(sessionId, questionNumber);
    
    const stats = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      total: answersForQuestion.length
    };

    answersForQuestion.forEach(answer => {
      if (answer.selectedOption in stats) {
        stats[answer.selectedOption as keyof typeof stats]++;
      }
    });

    return stats;
  }
}

export const storage = new DatabaseStorage();
