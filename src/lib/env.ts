import 'server-only';
import { z } from 'zod';

/**
 * Schema estrito para variáveis públicas (NEXT_PUBLIC_*)
 */
const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida (https://xyz.supabase.co).')
    .min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY inválida ou ausente.'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
});

/**
 * Schema estrito para segredos exclusivos de Servidor (Server-Only)
 * Nunca expostos ao navegador.
 */
const ServerEnvSchema = PublicEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória para operações privilegiadas.'),
  GEMINI_API_KEY: z
    .string()
    .min(10, 'GEMINI_API_KEY é obrigatória para geração de resenhas com IA.'),
  SESSION_HMAC_SECRET: z
    .string()
    .min(16, 'SESSION_HMAC_SECRET deve possuir no mínimo 16 caracteres.'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Valida todas as variáveis de ambiente via Zod.
 * - Em PRODUÇÃO (`NODE_ENV === 'production'`), falha imediatamente (fail-fast) caso falte qualquer credencial obrigatória.
 * - Em DESENVOLVIMENTO, emite aviso estruturado de AppSec e provê fallbacks seguros de sandbox para não travar testes locais.
 */
function parseServerEnv(): ServerEnv {
  const isProd = process.env.NODE_ENV === 'production';

  const rawEnv = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (isProd ? '' : 'https://sandbox-project.supabase.co'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (isProd ? '' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_anon_key_dev'),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      (isProd ? '' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_service_role_dev'),
    GEMINI_API_KEY:
      process.env.GEMINI_API_KEY || (isProd ? '' : 'DEV_FALLBACK_MODE_KEY'),
    SESSION_HMAC_SECRET:
      process.env.SESSION_HMAC_SECRET ||
      (isProd ? '' : 'konnexy_dev_hmac_secret_2026_safe'),
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
  };

  const parsed = ServerEnvSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formattedErrors = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    throw new Error(
      `❌ [APPSEC FATAL - Variáveis de Ambiente Inválidas ou Ausentes]:\n${formattedErrors}`
    );
  }

  return parsed.data;
}

export const env = parseServerEnv();

/**
 * Verifica se a chave real do Gemini está presente (não é o placeholder de desenvolvimento)
 */
export function hasLiveGeminiKey(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.length >= 15 &&
      process.env.GEMINI_API_KEY !== 'DEV_FALLBACK_MODE_KEY'
  );
}
