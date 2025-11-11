import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq, and } from 'drizzle-orm'
import { getUserFromRequest } from '../types/index.ts'

export const updateRoomRoute: FastifyPluginCallbackZod = (app) => {
  app.patch(
    '/rooms/:roomId',
    {
      schema: {
        params: z.object({
          roomId: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          content: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub
      const { roomId } = request.params as { roomId: string }
      const body = request.body as { name?: string; description?: string; content?: string }

      console.log('[UPDATE ROOM] Request:', { roomId, userId, body })

      // Build update object dynamically
      const updateData: {
        name?: string
        description?: string
        content?: string
        updatedAt: Date
      } = {
        updatedAt: new Date(),
      }

      if (body.name !== undefined) updateData.name = body.name
      if (body.description !== undefined) updateData.description = body.description
      if (body.content !== undefined) updateData.content = body.content

      console.log('[UPDATE ROOM] Update data:', updateData)

      const [room] = await db
        .update(schema.rooms)
        .set(updateData)
        .where(
          and(
            eq(schema.rooms.id, roomId),
            eq(schema.rooms.userId, userId)
          )
        )
        .returning()

      console.log('[UPDATE ROOM] Updated room:', room)

      if (!room) {
        return reply.status(404).send({ error: 'Nota não encontrada' })
      }

      return reply.send(room)
    }
  )
}
