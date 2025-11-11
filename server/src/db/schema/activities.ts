import { 
    pgTable,
    text,
    timestamp,
    uuid,
    jsonb,
    integer,
    boolean
 } from "drizzle-orm/pg-core";
import { rooms } from "./rooms.ts";
import { users } from "./users.ts";

export const activities = pgTable("activities", {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid().notNull().references(() => rooms.id),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    description: text(),
    questions: jsonb().notNull(), // Array de questões com alternativas
    totalQuestions: integer().notNull(),
    timeLimit: integer(), // Em minutos (opcional)
    isActive: boolean().default(true),
    createdAt: timestamp().defaultNow().notNull(),
});

export const activityResponses = pgTable("activity_responses", {
    id: uuid().primaryKey().defaultRandom(),
    activityId: uuid().notNull().references(() => activities.id),
    userName: text().notNull(),
    answers: jsonb().notNull(), // Respostas do usuário
    score: integer().notNull(),
    completedAt: timestamp().defaultNow().notNull(),
});