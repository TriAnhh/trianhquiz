import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth (admins)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table for quiz participants
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sessionId: varchar("session_id"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Quiz sessions table
export const quizSessions = pgTable("quiz_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").default("Quiz Session"),
  currentQuestionNumber: integer("current_question_number").default(1),
  duration: integer("duration").notNull().default(5), // minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Answers table for tracking student responses
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  quizSessionId: varchar("quiz_session_id").notNull().references(() => quizSessions.id),
  questionNumber: integer("question_number").notNull(),
  selectedOption: varchar("selected_option", { length: 1 }).notNull(), // A, B, C, D
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  sessionId: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).pick({
  title: true,
  duration: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  studentId: true,
  quizSessionId: true,
  questionNumber: true,
  selectedOption: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;
