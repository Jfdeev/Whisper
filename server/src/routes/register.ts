import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/connection.ts'
import { users } from '../db/schema/users.ts'
import { hashPassword } from '../services/auth.ts'
import { eq } from 'drizzle-orm'
import type { RegisterBody } from '../types/index.ts'

export const registerRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/auth/register',
    {
      schema: {
        body: z.object({
          name: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body as RegisterBody

      // Verificar se o email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        return reply.status(409).send({
          message: 'Email já cadastrado',
        })
      }

      // Hash da senha
      const passwordHash = await hashPassword(password)

      // Criar usuário
      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })

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

      return reply.status(201).send({
        user,
        token,
      })
    }
  )
}
