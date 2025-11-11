import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq, and } from 'drizzle-orm'
import { getUserFromRequest, type RoomParams, type MoveLessonBody } from '../types/index.ts'

export const moveLessonToFolderRoute: FastifyPluginCallbackZod = (app) => {
  app.patch(
    '/rooms/:roomId/move',
    {
      schema: {
        params: z.object({
          roomId: z.string().uuid(),
        }),
        body: z.object({
          folderId: z.string().uuid().nullable(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub
      const { roomId } = request.params as RoomParams
      const { folderId } = request.body as MoveLessonBody

      const [room] = await db
        .update(schema.rooms)
        .set({
          folderId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.rooms.id, roomId),
            eq(schema.rooms.userId, userId)
          )
        )
        .returning()

      if (!room) {
        return reply.status(404).send({ error: 'Aula não encontrada' })
      }

      return reply.send({ room })
    }
  )
}
