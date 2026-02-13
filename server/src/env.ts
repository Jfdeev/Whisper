import { z } from 'zod'

const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    GEMINI_API_KEY: z.string().min(1, { message: 'GEMINI_API_KEY is required' }),
    CORS_ORIGIN: z.string().default('*'),
})

export const env = envSchema.parse(process.env)

