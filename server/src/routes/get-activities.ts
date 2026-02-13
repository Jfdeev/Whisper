import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

export const getActivitiesRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/rooms/:roomId/activities",
    {
      schema: {
        params: z.object({
          roomId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { roomId } = request.params;

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
          .where(eq(schema.activities.roomId, roomId));

        return reply.status(200).send(activities);
      } catch (error) {
        console.error("Error getting activities:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};