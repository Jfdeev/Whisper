import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { generateActivity } from "../services/gemini.ts";
import { eq } from "drizzle-orm";

export const createActivityRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
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

        // Busca o contexto da sala através dos chunks de áudio
        const audioChunks = await db
          .select({
            transcription: schema.audioChunks.transcription,
          })
          .from(schema.audioChunks)
          .where(eq(schema.audioChunks.roomId, roomId));

        if (audioChunks.length === 0) {
          return reply
            .status(400)
            .send({ error: "Nenhum conteúdo encontrado para esta sala" });
        }

        // Junta todas as transcrições para formar o contexto
        const roomContext = audioChunks
          .map(chunk => chunk.transcription)
          .join('\n\n');

        // Gera a atividade usando IA
        const activityData = await generateActivity(roomContext);

        // Salva a atividade no banco
        const result = await db
          .insert(schema.activities)
          .values({
            roomId,
            title: activityData.title,
            description: activityData.description,
            questions: activityData.questions,
            totalQuestions: activityData.questions.length,
            timeLimit: activityData.timeLimit,
          })
          .returning();

        const activity = result[0];

        if (!activity) {
          return reply
            .status(500)
            .send({ error: "Erro ao criar atividade" });
        }

        return reply.status(201).send({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          questions: activity.questions,
          totalQuestions: activity.totalQuestions,
          timeLimit: activity.timeLimit,
          createdAt: activity.createdAt,
        });
      } catch (error) {
        console.error("Error creating activity:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};