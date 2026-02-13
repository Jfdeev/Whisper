import { eq } from "drizzle-orm";
import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";

export const deleteRoomRoute: FastifyPluginCallbackZod = (app) => {
  app.delete(
    "/rooms/:roomId",
    {
      schema: {
        params: z.object({
          roomId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;

      try {
        // Delete all questions from the room
        await db
          .delete(schema.questions)
          .where(eq(schema.questions.roomId, roomId));

        // Delete all audio chunks from the room
        await db
          .delete(schema.audioChunks)
          .where(eq(schema.audioChunks.roomId, roomId));

        // Finally, delete the room
        const result = await db
          .delete(schema.rooms)
          .where(eq(schema.rooms.id, roomId))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({
            error: "Room not found",
          });
        }

        return reply.status(200).send({
          message: "Room deleted successfully",
          deletedRoom: result[0],
        });
      } catch (error) {
        console.error("Error deleting room:", error);
        return reply.status(500).send({
          error: "Internal server error",
        });
      }
    }
  );
};
