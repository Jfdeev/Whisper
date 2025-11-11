import { z } from 'zod'

const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    GEMINI_API_KEY: z.string().min(1, { message: 'GEMINI_API_KEY is required' }),
    JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET deve ter pelo menos 32 caracteres' }),
})

export const env = envSchema.parse(process.env)

