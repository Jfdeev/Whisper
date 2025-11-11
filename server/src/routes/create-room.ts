import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { getUserFromRequest, type CreateRoomBody } from '../types/index.ts'

export const createRoomRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/rooms', {
        schema: {
            body: z.object({
                name: z.string().min(1),
                description: z.string().optional(),
                folderId: z.string().uuid().optional(),
            })
        }
    },
        async (request, reply) => {
            await request.jwtVerify()
            const userId = getUserFromRequest(request).sub
            const { name, description, folderId } = request.body as CreateRoomBody

            const result = await db.insert(schema.rooms).values({
                userId,
                name,
                description: description ?? '',
                folderId: folderId || null,
            }).returning()

            const insertRoom = result[0]

            if (!insertRoom) {
                throw new Error('Failed to create room')
            }

            return reply.status(201).send({
                roomId: insertRoom.id
            })
        }
    )
}