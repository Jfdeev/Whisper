import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.ts'

export const folders = pgTable('folders', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  color: text().default('#3B82F6'), // Default blue color
  parentId: uuid('parent_id').references((): any => folders.id, { onDelete: 'cascade' }), // Self-reference for nested folders
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
