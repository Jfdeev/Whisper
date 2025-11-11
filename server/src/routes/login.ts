import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { users } from '../db/schema/users.ts'
import { verifyPassword } from '../services/auth.ts'
import { eq } from 'drizzle-orm'
import type { LoginBody } from '../types/index.ts'

export const loginRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/auth/login',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as LoginBody

      // Buscar usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user) {
        return reply.status(401).send({
          message: 'Email ou senha inválidos',
        })
      }

      // Verificar senha
      const isValidPassword = await verifyPassword(password, user.passwordHash)

      if (!isValidPassword) {
        return reply.status(401).send({
          message: 'Email ou senha inválidos',
        })
      }

      // Gerar token JWT
      const token = app.jwt.sign(
        {
          sub: user.id,
          name: user.name,
          email: user.email,
        },
        {
          expiresIn: '7d',
        }
      )

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      })
    }
  )
}
