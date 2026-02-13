import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

export const getActivityRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/activities/:activityId",
    {
      schema: {
        params: z.object({
          activityId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { activityId } = request.params;

        const activity = await db
          .select()
          .from(schema.activities)
          .where(eq(schema.activities.id, activityId))
          .limit(1);

        if (activity.length === 0) {
          return reply.status(404).send({ error: "Atividade não encontrada" });
        }

        return reply.status(200).send(activity[0]);
      } catch (error) {
        console.error("Error getting activity:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};