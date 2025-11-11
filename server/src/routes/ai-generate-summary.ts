import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { generateSummary } from '../services/gemini.ts'

export const aiGenerateSummaryRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/generate-summary',
    {
      schema: {
        body: z.object({
          content: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      await request.jwtVerify()
      const { content } = request.body as { content: string }

      try {
        const summary = await generateSummary(content)
        return reply.send({ summary })
      } catch (error) {
        console.error('Error generating summary:', error)
        return reply.status(500).send({ error: 'Erro ao gerar resumo' })
      }
    }
  )
}
