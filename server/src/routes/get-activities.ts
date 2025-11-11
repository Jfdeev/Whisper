import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest, type RoomParams } from "../types/index.ts";

export const getActivitiesRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/rooms/:roomId/activities",
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        await request.jwtVerify()
        const userId = getUserFromRequest(request).sub
        const { roomId } = request.params as RoomParams;

        const activities = await db
          .select({
            id: schema.activities.id,
            title: schema.activities.title,
            description: schema.activities.description,
            totalQuestions: schema.activities.totalQuestions,
            timeLimit: schema.activities.timeLimit,
            isActive: schema.activities.isActive,
            createdAt: schema.activities.createdAt,
          })
          .from(schema.activities)
          .innerJoin(schema.rooms, eq(schema.activities.roomId, schema.rooms.id))
          .where(
            and(
              eq(schema.activities.roomId, roomId),
              eq(schema.rooms.userId, userId)
            )
          );

        return reply.status(200).send(activities);
      } catch (error) {
        console.error("Error getting activities:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};