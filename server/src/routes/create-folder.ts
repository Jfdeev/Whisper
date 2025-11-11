import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { getUserFromRequest, type CreateFolderBody } from '../types/index.ts'

export const createFolderRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/folders',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          color: z.string().optional(),
          parentId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const userId = getUserFromRequest(request).sub

      const { name, color, parentId } = request.body as CreateFolderBody

      const [folder] = await db
        .insert(schema.folders)
        .values({
          userId,
          name,
          color: color || '#3B82F6',
          parentId: parentId || null,
        })
        .returning()

      return reply.status(201).send({ folder })
    }
  )
}
