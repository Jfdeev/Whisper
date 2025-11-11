import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { chatWithAI } from '../services/gemini.ts'
import { db } from '../db/connection.ts'
import { audioChunks } from '../db/schema/audio-chunks.ts'
import { eq } from 'drizzle-orm'

export const aiChatQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/chat-question',
    {
      schema: {
        body: z.object({
          question: z.string().min(1),
          roomId: z.string().uuid(),
          conversationHistory: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string()
          })).optional()
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const { question, roomId, conversationHistory = [] } = request.body as { 
        question: string
        roomId: string
        conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
      }

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

        // Criar prompt com contexto dos áudios e histórico da conversa
        let prompt = `Você é um professor assistente virtual. Você tem acesso ao conteúdo da aula através das seguintes transcrições de áudio:\n\n${audioContext}\n\n`
        
        // Adicionar histórico da conversa
        if (conversationHistory.length > 0) {
          prompt += 'Histórico da conversa:\n'
          conversationHistory.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'Aluno' : 'Professor'}: ${msg.content}\n`
          })
          prompt += '\n'
        }

        prompt += `Pergunta do aluno: ${question}\n\nResponda de forma clara, educativa e baseada no conteúdo da aula. Se a pergunta não estiver relacionada ao conteúdo, gentilmente redirecione o aluno para o assunto da aula.`

        const answer = await chatWithAI(prompt)
        
        return reply.send({ 
          answer,
          hasContext: audioContext.length > 0 
        })
      } catch (error) {
        console.error('Error answering question:', error)
        return reply.status(500).send({ error: 'Erro ao responder pergunta' })
      }
    }
  )
}
