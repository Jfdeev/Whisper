import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { db } from "../db/connection.ts";
import { z } from "zod";
import { questions } from "../db/schema/questions.ts";
import { eq, desc } from "drizzle-orm";

export const getQuestionsByRoomRoute: FastifyPluginAsyncZod = async (app) => {
  app.get('/rooms/:roomId/questions', async (request, reply) => {
    const paramsSchema = z.object({
      roomId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    });
    const params = paramsSchema.parse(request.params);

    const result = await db
      .select({
        id: questions.id,
        roomId: questions.roomId,
        question: questions.question,
        answer: questions.answer,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(eq(questions.roomId, params.roomId))
      .orderBy(desc(questions.createdAt));

    return reply.send(result);
  });
};
