import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { eq, and } from 'drizzle-orm'
import { getUserFromRequest, type FolderParams, type UpdateFolderBody } from '../types/index.ts'

export const updateFolderRoute: FastifyPluginCallbackZod = (app) => {
  app.put(
    '/folders/:folderId',
    {
      schema: {
        params: z.object({
          folderId: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          color: z.string().optional(),
          parentId: z.string().uuid().nullable().optional(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub
      const { folderId } = request.params as FolderParams
      const { name, color, parentId } = request.body as UpdateFolderBody

      const [folder] = await db
        .update(schema.folders)
        .set({
          ...(name && { name }),
          ...(color && { color }),
          ...(parentId !== undefined && { parentId }),
          updatedAt: new Date(),
        })
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

      return reply.send({ folder })
    }
  )
}
