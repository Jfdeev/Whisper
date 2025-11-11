import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq } from 'drizzle-orm'
import { getUserFromRequest } from '../types/index.ts'

export const getFoldersRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/folders', async (request, reply) => {
    await request.jwtVerify()
    const userId = getUserFromRequest(request).sub

    const folders = await db
      .select()
      .from(schema.folders)
      .where(eq(schema.folders.userId, userId))
      .orderBy(schema.folders.createdAt)

    return reply.send({ folders })
  })
}
