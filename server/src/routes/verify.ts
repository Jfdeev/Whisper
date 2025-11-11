import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'

export const verifyRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/auth/verify', async (request, reply) => {
    try {
      await request.jwtVerify()
      
      return reply.send({
        valid: true,
        user: request.user,
      })
    } catch (error) {
      return reply.status(401).send({
        valid: false,
        message: 'Token inválido ou expirado',
      })
    }
  })
}
