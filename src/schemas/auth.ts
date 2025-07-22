import { z } from 'zod';

// -----------------------------------------------------------
// Schemas de Validação para Autenticação
// Baseado em: docs/rules-supabase-auth.md
// -----------------------------------------------------------

/**
 * Schema para validação de email
 */
export const EmailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório')
  .max(254, 'Email muito longo');

/**
 * Schema para validação de senha
 * Seguindo regras de segurança do Supabase
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'
  );

/**
 * Schema para validação de nome
 */
export const NameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços');

// -----------------------------------------------------------
// Schemas para Formulários de Autenticação
// -----------------------------------------------------------

/**
 * Schema para formulário de login
 */
export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Senha é obrigatória'), // No login, não validamos complexidade
});

/**
 * Schema para formulário de registro
 */
export const SignupFormSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  companyId: z.string().uuid('ID da empresa inválido').optional(),
  role: z.enum(['AGENT', 'ADMIN', 'CREATOR']).default('AGENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

/**
 * Schema para formulário de recuperação de senha
 */
export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

/**
 * Schema para formulário de redefinição de senha
 */
export const ResetPasswordSchema = z.object({
  password: PasswordSchema,
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});



// -----------------------------------------------------------
// Tipos TypeScript derivados dos schemas
// -----------------------------------------------------------

export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type SignupFormData = z.infer<typeof SignupFormSchema>;
export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

// -----------------------------------------------------------
// Schemas para Respostas da API
// -----------------------------------------------------------

/**
 * Schema para dados do usuário autenticado (Supabase User)
 */
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  email_confirmed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  user_metadata: z.record(z.any()).optional(),
  app_metadata: z.record(z.any()).optional(),
});

/**
 * Schema para sessão do Supabase
 */
export const AuthSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  expires_at: z.number().optional(),
  token_type: z.string(),
  user: AuthUserSchema,
});

/**
 * Schema para resposta de autenticação
 */
export const AuthResponseSchema = z.object({
  user: AuthUserSchema.nullable(),
  session: AuthSessionSchema.nullable(),
});

// -----------------------------------------------------------
// Schemas para Erros de Autenticação
// -----------------------------------------------------------

/**
 * Schema para erros do Supabase Auth
 */
export const AuthErrorSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
  code: z.string().optional(),
});

// -----------------------------------------------------------
// Tipos para Erros Customizados
// -----------------------------------------------------------

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// -----------------------------------------------------------
// Utilitários de Validação
// -----------------------------------------------------------

/**
 * Valida se um email é válido
 */
export const isValidEmail = (email: string): boolean => {
  const result = EmailSchema.safeParse(email);
  return result.success;
};

/**
 * Valida se uma senha atende aos critérios de segurança
 */
export const isValidPassword = (password: string): boolean => {
  const result = PasswordSchema.safeParse(password);
  return result.success;
};

/**
 * Obtém mensagens de erro de validação formatadas
 */
export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};

// -----------------------------------------------------------
// Constantes de Mensagens de Erro
// -----------------------------------------------------------

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha incorretos',
  EMAIL_NOT_CONFIRMED: 'Verifique seu email para ativar a conta',
  SIGNUP_DISABLED: 'Registro desabilitado no momento',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Tente novamente em alguns minutos',
  WEAK_PASSWORD: 'Senha muito fraca. Use uma senha mais forte',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado',
  USER_NOT_FOUND: 'Usuário não encontrado',
  INVALID_TOKEN: 'Token de recuperação inválido ou expirado',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet',
  UNKNOWN_ERROR: 'Erro inesperado. Tente novamente',
} as const;

// -----------------------------------------------------------
// Schemas para Perfil e Configurações
// -----------------------------------------------------------

/**
 * Schema para atualização de perfil
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  
  avatarUrl: z
    .string()
    .url('URL do avatar inválida')
    .optional(),
});

/**
 * Schema para alteração de senha
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos 1 letra minúscula')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos 1 letra maiúscula')
    .regex(/\d/, 'Nova senha deve conter pelo menos 1 número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

/**
 * Schema para configurações de conta
 */
export const AccountSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }),
  
  preferences: z.object({
    language: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
    timezone: z.string().default('America/Sao_Paulo'),
    theme: z.enum(['light', 'dark', 'system']).default('dark'),
  }),
  
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'company']).default('company'),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
  }),
});

// -----------------------------------------------------------
// Tipos TypeScript Derivados
// -----------------------------------------------------------

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type AccountSettingsData = z.infer<typeof AccountSettingsSchema>;

// -----------------------------------------------------------
// Tipos para Query Keys (TanStack React Query)
// -----------------------------------------------------------

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  settings: () => [...authKeys.all, 'settings'] as const,
} as const; 