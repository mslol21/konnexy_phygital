'use server';

import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { env } from '@/lib/env';
import {
  ForgotPasswordSchema,
  UpdatePasswordSchema
} from '@/lib/schemas/auth';
import { signIn } from '@/lib/auth/sign-in';
import { checkRateLimit, AUTH_LOGIN_RATE_LIMIT } from '@/lib/security/rate-limiter';

export interface AuthActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}

const GENERIC_AUTH_ERROR = 'E-mail ou senha incorretos.';

/**
 * 1. SERVER ACTION: login(formData)
 * - Valida inputs com Zod (RFC Email + Política Estrita de Senha)
 * - Prevenção de User Enumeration (mensagem idêntica para e-mail inexistente ou senha inválida)
 * - Sessão gerenciada via cookies HttpOnly + redirecionamento por RBAC (/admin ou /dashboard)
 */
export async function login(formData: FormData): Promise<AuthActionResult> {
  const headerStore = await headers();
  const limit = await checkRateLimit(headerStore.get('x-real-ip') || 'unknown', AUTH_LOGIN_RATE_LIMIT);
  if (!limit.allowed) return { success: false, message: AUTH_LOGIN_RATE_LIMIT.errorMessage };
  let destination: string;
  try {
    const result = await signIn({ email: formData.get('email'), password: formData.get('password') });
    destination = result.redirectTo;
  } catch { return { success: false, message: GENERIC_AUTH_ERROR }; }
  redirect(destination);
}

/**
 * 2. SERVER ACTION: logout()
 * - Encerra sessão no Supabase Auth
 * - Limpa de forma segura todos os cookies de sessão e assinatura RBAC
 * - Redireciona para /login
 */
export async function logout(): Promise<void> {
  try {
    const isLiveSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
    if (isLiveSupabase) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch {
    // Continua limpeza local dos cookies mesmo se a rede oscilar
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  for (const ck of allCookies) {
    if (
      ck.name === 'konnexy_role' ||
      ck.name === 'konnexy_sig' ||
      ck.name.startsWith('sb-')
    ) {
      cookieStore.set(ck.name, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      });
    }
  }

  redirect('/login');
}

/**
 * 3. SERVER ACTION: requestPasswordReset(formData)
 * - Valida e-mail via Zod
 * - Dispara link temporário de uso único para /reset-password
 * - Mensagem neutra anti-enumeração de usuários
 */
export async function requestPasswordReset(
  formData: FormData
): Promise<AuthActionResult> {
  const rawEmail = String(formData.get('email') || '');
  const parsed = ForgotPasswordSchema.safeParse({ email: rawEmail });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Informe um endereço de e-mail válido.',
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const { email } = parsed.data;
  const isLiveSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!isLiveSupabase) return { success: false, message: 'Serviço temporariamente indisponível.' };

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`
      });
      if (error) return { success: false, message: 'Não foi possível solicitar a recuperação agora.' };
    } catch {
      return { success: false, message: 'Serviço temporariamente indisponível.' };
      // Silencia erros de conta inexistente para prevenir User Enumeration
    }
  }

  return {
    success: true,
    message:
      'Se o e-mail informado estiver cadastrado em nossa base, enviamos um link seguro de recuperação de uso único.'
  };
}

/**
 * 4. SERVER ACTION: updatePassword(formData)
 * - Valida força da nova senha (mínimo 8 chars, maiúscula, minúscula, número e especial)
 * - Atualiza credencial da sessão ativa no Supabase Auth
 */
export async function updatePassword(
  formData: FormData
): Promise<AuthActionResult> {
  const rawPayload = {
    password: String(formData.get('password') || ''),
    confirmPassword: String(formData.get('confirmPassword') || '')
  };

  const parsed = UpdatePasswordSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      success: false,
      message: 'A nova senha não atende aos critérios mínimos de segurança.',
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const isLiveSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!isLiveSupabase) return { success: false, message: 'Serviço temporariamente indisponível.' };

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password
      });

      if (error) {
        return {
          success: false,
          message:
            'Sessão de recuperação expirada ou inválida. Solicite um novo link.'
        };
      }
    } catch {
      return {
        success: false,
        message: 'Não foi possível concluir a alteração de senha no momento.'
      };
    }
  }

  return {
    success: true,
    message: 'Senha redefinida com sucesso! Você já pode acessar sua conta.',
    redirectTo: '/login'
  };
}
