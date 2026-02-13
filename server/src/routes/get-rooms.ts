import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { count, eq } from 'drizzle-orm'

export const getRooms: FastifyPluginAsyncZod = async (app) => {
    app.get('/rooms', async () => {
      const results = await db
        .select({
          id: schema.rooms.id,
          name: schema.rooms.name,
          description: schema.rooms.description,
          questionsCount: count(schema.questions.id),
          created_at: schema.rooms.createdAt,
        })
        .from(schema.rooms)
        .leftJoin(schema.questions, eq(schema.questions.roomId, schema.rooms.id))
        .groupBy(schema.rooms.id, schema.rooms.name)
        .orderBy(schema.rooms.createdAt)

      return results
    })
  }