import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq } from 'drizzle-orm'
import { getUserFromRequest } from '../types/index.ts'

export const getAudioChunksRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/rooms/:roomId/audio-chunks',
    {
      schema: {
        params: z.object({
          roomId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub
      const { roomId } = request.params as { roomId: string }

      // Verify room belongs to user
      const [room] = await db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.id, roomId))
        .limit(1)

      if (!room || room.userId !== userId) {
        return reply.status(404).send({ error: 'Nota não encontrada' })
      }

      // Get audio chunks
      const chunks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          created_at: schema.audioChunks.createdAt,
        })
        .from(schema.audioChunks)
        .where(eq(schema.audioChunks.roomId, roomId))
        .orderBy(schema.audioChunks.createdAt)

      return reply.send(chunks)
    }
  )
}
