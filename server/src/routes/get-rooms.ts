import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { id } from 'zod/v4/locales'
import { count, eq } from 'drizzle-orm'
import { questions } from '../db/schema/questions.ts'

import { getUserFromRequest } from '../types/index.ts'

export const getRooms: FastifyPluginAsyncZod = async (app) => {
    app.get('/rooms', async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub

      const results = await db
        .select({
          id: schema.rooms.id,
          name: schema.rooms.name,
          description: schema.rooms.description,
          folderId: schema.rooms.folderId,
          questionsCount: count(schema.questions.id),
          created_at: schema.rooms.createdAt,
        })
        .from(schema.rooms)
        .where(eq(schema.rooms.userId, userId))
        .leftJoin(schema.questions, eq(schema.questions.roomId, schema.rooms.id))
        .groupBy(schema.rooms.id, schema.rooms.name, schema.rooms.folderId)
        .orderBy(schema.rooms.createdAt)

      return results
    })
  }