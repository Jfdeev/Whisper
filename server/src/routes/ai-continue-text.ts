import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { continueTextWithAI } from '../services/gemini.ts'
import { db } from '../db/connection.ts'
import { audioChunks } from '../db/schema/audio-chunks.ts'
import { eq } from 'drizzle-orm'

export const aiContinueTextRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/continue-text',
    {
      schema: {
        body: z.object({
          text: z.string().min(1),
          roomId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const { text, roomId } = request.body as { text: string; roomId: string }

      try {
        // Buscar todas as transcrições de áudio da sala para usar como contexto
        const chunks = await db
          .select({
            transcription: audioChunks.transcription,
          })
          .from(audioChunks)
          .where(eq(audioChunks.roomId, roomId))
          .orderBy(audioChunks.createdAt)

        // Concatenar todas as transcrições para criar o contexto
        const audioContext = chunks
          .map(chunk => chunk.transcription)
          .filter(t => t && t.trim().length > 0)
          .join('\n\n')

        // Criar prompt com contexto dos áudios
        const promptWithContext = audioContext.length > 0
          ? `Contexto da sala de estudo (transcrições de áudio):\n${audioContext}\n\nTexto atual do usuário:\n${text}\n\nCom base no contexto da sala e no que o usuário está escrevendo, sugira uma continuação natural e relevante do texto. A sugestão deve ser concisa (1-3 frases) e se encaixar perfeitamente após o texto atual.`
          : `Texto atual: ${text}\n\nSugira uma continuação natural e concisa (1-3 frases) para este texto.`

        const continuation = await continueTextWithAI(promptWithContext)
        
        return reply.send({ 
          continuation,
          hasContext: audioContext.length > 0 
        })
      } catch (error) {
        console.error('Error continuing text:', error)
        return reply.status(500).send({ error: 'Erro ao continuar texto' })
      }
    }
  )
}
