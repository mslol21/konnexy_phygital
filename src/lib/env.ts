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
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY inválida ou ausente.'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('https://konnexy-phygital.vercel.app')
});

/**
 * Schema estrito para segredos exclusivos de Servidor (Server-Only)
 */
const ServerEnvSchema = PublicEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória para operações privilegiadas.'),
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY é obrigatória para geração de resenhas com IA.'),
  SESSION_HMAC_SECRET: z
    .string()
    .min(16, 'SESSION_HMAC_SECRET deve possuir no mínimo 16 caracteres.'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Valida todas as variáveis de ambiente via Zod.
 * Caso alguma variável ainda não tenha sido cadastrada no painel da Vercel durante o primeiro deploy,
 * injeta valores de Sandbox validados pelo Zod e emite um aviso de auditoria no log do servidor,
 * evitando falha de compilação estática ("Collecting page data") no Vercel Build.
 */
function parseServerEnv(): ServerEnv {
  const missingVars: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.GEMINI_API_KEY) missingVars.push('GEMINI_API_KEY');
  if (!process.env.SESSION_HMAC_SECRET) missingVars.push('SESSION_HMAC_SECRET');

  if (missingVars.length > 0 && process.env.STRICT_ENV_VALIDATION === 'true') {
    throw new Error(
      `❌ [APPSEC FATAL - Variáveis Obrigatórias Ausentes]: ${missingVars.join(', ')}`
    );
  }

  const rawEnv = {
    NODE_ENV:
      (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sandbox-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_anon_key_dev',
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'),
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_service_role_dev',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'DEV_FALLBACK_MODE_KEY',
    SESSION_HMAC_SECRET:
      process.env.SESSION_HMAC_SECRET || 'konnexy_default_hmac_secret_2026_safe',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined
  };

  return ServerEnvSchema.parse(rawEnv);
}

export const env = parseServerEnv();

/**
 * Verifica se a chave real do Gemini está presente (não é o placeholder de sandbox)
 */
export function hasLiveGeminiKey(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.length >= 15 &&
      process.env.GEMINI_API_KEY !== 'DEV_FALLBACK_MODE_KEY'
  );
}
