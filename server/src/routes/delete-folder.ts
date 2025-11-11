import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq, and } from 'drizzle-orm'
import { getUserFromRequest, type FolderParams } from '../types/index.ts'

export const deleteFolderRoute: FastifyPluginCallbackZod = (app) => {
  app.delete(
    '/folders/:folderId',
    {
      schema: {
        params: z.object({
          folderId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub
      const { folderId } = request.params as FolderParams

      const [folder] = await db
        .delete(schema.folders)
        .where(
          and(
            eq(schema.folders.id, folderId),
            eq(schema.folders.userId, userId)
          )
        )
        .returning()

      if (!folder) {
        return reply.status(404).send({ error: 'Pasta não encontrada' })
      }

      return reply.status(204).send()
    }
  )
}
