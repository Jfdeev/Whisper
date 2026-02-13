import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";
import { db } from "../db/connection.ts";
import { schema } from "../db/schema/index.ts";
import { generateEmbeddings, transcribeAudio } from "../services/gemini.ts";

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/rooms/:roomId/upload-audio",
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
        const audio = await request.file();

        if (!audio) {
          return reply.status(400).send({ error: "No file uploaded" });
        }

        const audioBuffer = await audio.toBuffer();
        const audioBase64 = audioBuffer.toString("base64");
        const mimeType = audio.mimetype;

        const transcription = await transcribeAudio(audioBase64, mimeType);
        const embeddings = await generateEmbeddings(transcription);

        if (!transcription) {
          return reply
            .status(500)
            .send({ error: "Failed to transcribe audio" });
        }

        if (!embeddings) {
          return reply
            .status(500)
            .send({ error: "Failed to generate embeddings" });
        }

        const result = await db
          .insert(schema.audioChunks)
          .values({
            roomId,
            transcription,
            embeddings,
          })
          .returning();

        const chunk = result[0];

        if (!chunk) {
          return reply
            .status(500)
            .send({ error: "Failed to save audio chunk" });
        }

        return reply.status(201).send({
          chunkId: chunk.id,
          transcriptionLength: chunk.transcription.length,
        });
      } catch (error) {
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
};
