import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

export const deleteActivityRoute: FastifyPluginCallbackZod = (app) => {
  app.delete(
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

        // Primeiro, excluir todas as respostas da atividade
        await db
          .delete(schema.activityResponses)
          .where(eq(schema.activityResponses.activityId, activityId));

        // Depois, excluir a atividade
        const result = await db
          .delete(schema.activities)
          .where(eq(schema.activities.id, activityId))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: "Atividade não encontrada" });
        }

        return reply.status(200).send({ message: "Atividade excluída com sucesso" });
      } catch (error) {
        console.error("Error deleting activity:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};