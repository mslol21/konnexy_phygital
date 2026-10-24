'use server';

import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { env } from '@/lib/env';
import {
  LoginCredentialsSchema,
  ForgotPasswordSchema,
  UpdatePasswordSchema
} from '@/lib/schemas/auth';
import {
  logSecurityAudit,
  computeRoleSignature
} from '@/lib/security/audit-logger';
import type { UserRole } from '@/types/phygital';

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
  const rawPayload = {
    email: String(formData.get('email') || ''),
    password: String(formData.get('password') || ''),
    role: (formData.get('role') as UserRole) || undefined
  };

  const parsed = LoginCredentialsSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os requisitos de e-mail e política de senha.',
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const { email, password, role: requestedDemoRole } = parsed.data;
  const headerStore = await headers();
  const clientIp =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  let resolvedRole: UserRole =
    requestedDemoRole ||
    (email.startsWith('ceo@') || email.startsWith('admin@')
      ? 'super_admin'
      : 'tenant_admin');

  const isLiveSupabase =
    !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (authError || !authData.user) {
        logSecurityAudit({
          action: 'AUTH_LOGIN_RATE_LIMITED',
          actorRole: 'unauthenticated',
          clientIp,
          path: '/login',
          severity: 'WARN',
          metadata: { reason: 'INVALID_CREDENTIALS_GENERIC' }
        });

        // Prevenção estrita de User Enumeration: jamais revela se o e-mail existe ou não
        return {
          success: false,
          message: GENERIC_AUTH_ERROR
        };
      }

      // Consulta o papel RBAC na tabela public.profiles sem vazar erros internos
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role === 'super_admin' || profile?.role === 'tenant_admin') {
        resolvedRole = profile.role;
      }
    } catch {
      return {
        success: false,
        message: GENERIC_AUTH_ERROR
      };
    }
  }

  // Emite cookies de sessão HttpOnly assinados com HMAC
  const cookieStore = await cookies();
  const signature = computeRoleSignature(resolvedRole, env.SESSION_HMAC_SECRET);

  cookieStore.set('konnexy_role', resolvedRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 horas
  });

  cookieStore.set('konnexy_sig', signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24
  });

  logSecurityAudit({
    action: 'AUTH_LOGIN_SUCCESS',
    actorRole: resolvedRole,
    clientIp,
    path: '/login',
    severity: 'INFO'
  });

  const targetDestination =
    resolvedRole === 'super_admin' ? '/admin' : '/dashboard';

  redirect(targetDestination);
}

/**
 * 2. SERVER ACTION: logout()
 * - Encerra sessão no Supabase Auth
 * - Limpa de forma segura todos os cookies de sessão e assinatura RBAC
 * - Redireciona para /login
 */
export async function logout(): Promise<void> {
  try {
    const isLiveSupabase =
      !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');
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
  const isLiveSupabase =
    !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`
      });
    } catch {
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

  const isLiveSupabase =
    !env.NEXT_PUBLIC_SUPABASE_URL.includes('sandbox-project.supabase.co');

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
