import { 
    pgTable,
    text,
    timestamp,
    uuid
 } from "drizzle-orm/pg-core";
import { rooms } from "./rooms.ts";
import { users } from "./users.ts";

export const questions = pgTable("questions", {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid().notNull().references(() => rooms.id),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    question: text().notNull(),
    answer: text(),
    createdAt: timestamp().defaultNow().notNull(),
})