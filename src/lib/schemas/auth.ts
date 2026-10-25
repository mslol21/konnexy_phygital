import { z } from 'zod';

/**
 * Remove caracteres de controle ASCII invisíveis (0x00-0x1F e 0x7F-0x9F)
 */
export function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

/**
 * Schema Estrito de E-mail:
 * - Remoção de espaços em branco (trim)
 * - Sanitização contra caracteres de controle
 * - Conversão automática para minúsculas (toLowerCase)
 * - Validação formal RFC 5322 via Zod
 */
export const EmailSchema = z
  .string()
  .transform((val) => stripControlChars(val).trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(5, { message: 'Informe um endereço de e-mail válido.' })
      .max(120, { message: 'O e-mail não pode exceder 120 caracteres.' })
      .email({ message: 'Formato de e-mail inválido.' })
  );

/**
 * Política Corporativa de Senhas (StrongPasswordSchema):
 * - Sanitização contra caracteres de controle invisíveis
 * - Mínimo de 8 e máximo de 128 caracteres
 * - Pelo menos 1 letra maiúscula (A-Z)
 * - Pelo menos 1 letra minúscula (a-z)
 * - Pelo menos 1 número (0-9)
 * - Pelo menos 1 caractere especial (!@#$%^&*...)
 */
export const StrongPasswordSchema = z
  .string()
  .transform(stripControlChars)
  .pipe(
    z
      .string()
      .min(8, { message: 'A senha deve conter no mínimo 8 caracteres.' })
      .max(128, { message: 'A senha não pode exceder 128 caracteres.' })
      .regex(/[A-Z]/, {
        message: 'A senha deve conter pelo menos 1 letra maiúscula.'
      })
      .regex(/[a-z]/, {
        message: 'A senha deve conter pelo menos 1 letra minúscula.'
      })
      .regex(/[0-9]/, {
        message: 'A senha deve conter pelo menos 1 número.'
      })
      .regex(/[^A-Za-z0-9\s]/, {
        message: 'A senha deve conter pelo menos 1 caractere especial (ex: @, #, !, $).'
      })
  );

/**
 * Schema do formulário de Login
 */
export const LoginCredentialsSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Informe sua senha.').max(128)
});

export type LoginCredentialsInput = z.infer<typeof LoginCredentialsSchema>;

/**
 * Schema de Solicitação de Recuperação de Senha
 */
export const ForgotPasswordSchema = z.object({
  email: EmailSchema
});

/**
 * Schema de Redefinição de Senha com confirmação
 */
export const UpdatePasswordSchema = z
  .object({
    password: StrongPasswordSchema,
    confirmPassword: z.string().transform(stripControlChars)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação de senha não coincide com a nova senha.',
    path: ['confirmPassword']
  });

/**
 * Avaliador visual de força de senha para uso na UI de Reset de Senha
 */
export interface PasswordStrengthReport {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte';
  colorClass: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(rawPassword: string): PasswordStrengthReport {
  const clean = stripControlChars(rawPassword);
  const checks = {
    minLength: clean.length >= 8,
    hasUpper: /[A-Z]/.test(clean),
    hasLower: /[a-z]/.test(clean),
    hasNumber: /[0-9]/.test(clean),
    hasSpecial: /[^A-Za-z0-9\s]/.test(clean)
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  if (passedCount <= 1) {
    return { score: 1, label: 'Muito Fraca', colorClass: 'bg-rose-500', checks };
  }
  if (passedCount <= 3) {
    return { score: 2, label: 'Fraca', colorClass: 'bg-orange-500', checks };
  }
  if (passedCount === 4) {
    return { score: 3, label: 'Média', colorClass: 'bg-amber-400', checks };
  }
  return { score: 4, label: 'Forte', colorClass: 'bg-emerald-500', checks };
}
