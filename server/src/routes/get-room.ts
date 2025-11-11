import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { db } from "../db/connection.ts";
import { z } from "zod";
import { rooms } from "../db/schema/rooms.ts";
import { eq } from "drizzle-orm";

export const getRoomRoute: FastifyPluginAsyncZod = async (app) => {
  app.get('/rooms/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const params = paramsSchema.parse(request.params);

    const result = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        content: rooms.content,
        created_at: rooms.createdAt,
      })
      .from(rooms)
      .where(eq(rooms.id, params.id));
      

    const room = result[0];
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    return reply.send(room);
  });
};
