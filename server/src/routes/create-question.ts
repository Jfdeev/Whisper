import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../db/connection.ts'
import { schema } from '../db/schema/index.ts'
import { generateAnswer, generateEmbeddings } from '../services/gemini.ts'
import { and, eq, sql } from 'drizzle-orm'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
    app.post('/questions', {
        schema: {
            body: z.object({
                roomId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
                question: z.string().min(1, { message: 'Question is required' }),
            })
        },
    },
        async (request, reply) => {
            const { roomId, question } = request.body

            const embeddings = await generateEmbeddings(question);

            if (!embeddings) {
                throw new Error('Failed to generate embeddings');
            }

            const embeddingString = `[${embeddings.join(', ')}]`;
            
            // Verifica se há chunks na sala
            const totalChunks = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.audioChunks)
                .where(eq(schema.audioChunks.roomId, roomId));

            // Sistema de limiar adaptativo
            const thresholds = [0.5, 0.4, 0.3, 0.2];
            let chunks: Array<{ id: any, transcription: string, similarity: number }> = [];
            let usedThreshold;
            
            for (const threshold of thresholds) {
                chunks = await db
                    .select({
                        id: schema.audioChunks.id,
                        transcription: schema.audioChunks.transcription,
                        similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector)`
                    })
                    .from(schema.audioChunks)
                    .where(and(
                        eq(schema.audioChunks.roomId, roomId),
                        sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector) > ${threshold}`
                    ))
                    .orderBy(sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingString}::vector) DESC`)
                    .limit(5);
                
                if (chunks.length > 0) {
                    usedThreshold = threshold;
                    break;
                }
            }

            let answer: string | null = null;

            if (chunks && chunks.length > 0) {
                const transcriptions = chunks.map(chunk => chunk.transcription);
                
                answer = await generateAnswer(question, transcriptions);

                if (!answer) {
                    throw new Error('Failed to generate answer');
                }
            } else {
                // Fallback: tenta gerar resposta com os chunks mais recentes da sala
                const fallbackChunks = await db
                    .select({ transcription: schema.audioChunks.transcription })
                    .from(schema.audioChunks)
                    .where(eq(schema.audioChunks.roomId, roomId))
                    .orderBy(sql`created_at DESC`)
                    .limit(3);
                
                if (fallbackChunks.length > 0) {
                    const fallbackTranscriptions = fallbackChunks.map(chunk => chunk.transcription);
                    
                    answer = await generateAnswer(question, fallbackTranscriptions);
                    
                    if (!answer) {
                        throw new Error('Failed to generate fallback answer');
                    }
                } else {
                    answer = "Desculpe, não há conteúdo de áudio suficiente nesta sala para responder à sua pergunta. Por favor, faça o upload de alguns áudios primeiro.";
                }
            }

            const result = await db.insert(schema.questions).values({
                roomId,
                question,
                answer: answer,
            }).returning();

            const insertQuestion = result[0]

            if (!insertQuestion) {
                throw new Error('Failed to create question')
            }

            return reply.status(201).send({
                questionId: insertQuestion.id
            })
        }
    )
}