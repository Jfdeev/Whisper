import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

export const submitActivityRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/activities/:activityId/submit",
    {
      schema: {
        params: z.object({
          activityId: z.string(),
        }),
        body: z.object({
          userName: z.string(),
          answers: z.record(z.string(), z.string()), // { questionId: selectedAnswer }
        }),
      },
    },
    async (request, reply) => {
      try {
        const { activityId } = request.params;
        const { userName, answers } = request.body;

        // Busca a atividade para calcular a pontuação
        const activity = await db
          .select()
          .from(schema.activities)
          .where(eq(schema.activities.id, activityId))
          .limit(1);

        if (activity.length === 0) {
          return reply.status(404).send({ error: "Atividade não encontrada" });
        }

        const activityData = activity[0];
        const questions = activityData.questions as any[];

        // Calcula a pontuação
        let score = 0;
        const results: any[] = [];

        questions.forEach((question: any) => {
          // Convertemos o ID da questão para string para garantir compatibilidade
          const questionIdStr = String(question.id);
          const userAnswer = answers[questionIdStr];
          const isCorrect = userAnswer === question.correctAnswer;
          
          if (isCorrect) {
            score++;
          }

          results.push({
            questionId: question.id,
            question: question.question,
            userAnswer: userAnswer || 'Não respondida',
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanation: question.explanation,
          });
        });

        // Salva a resposta
        const responseResult = await db
          .insert(schema.activityResponses)
          .values({
            activityId,
            userName,
            answers: JSON.stringify(answers), // Garantir que seja string JSON
            score,
          })
          .returning();

        const response = responseResult[0];

        if (!response) {
          return reply
            .status(500)
            .send({ error: "Erro ao salvar resposta" });
        }

        // Preparar resposta para exibir feedback
        const responseData = {
          id: response.id,
          score,
          totalQuestions: questions.length,
          percentage: Math.round((score / questions.length) * 100),
          results,
          completedAt: response.completedAt,
        };

        // Retorna o resultado com feedback (atividade NÃO é excluída ainda)
        return reply.status(201).send(responseData);
      } catch (error) {
        console.error("Error submitting activity:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};