import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { folders } from "./folders.ts";

// Mantendo nome 'rooms' na tabela por compatibilidade, mas conceitualmente são 'notes/lessons'
export const rooms = pgTable("rooms", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }), // Null = pasta raiz
    name: text().notNull(),
    description: text().notNull(),
    content: text().default(''), // Conteúdo Markdown da nota
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
})