import { z } from 'zod';

// -----------------------------------------------------------
// Schema de validação para perfil do usuário
// -----------------------------------------------------------

/**
 * Schema para validação de atualização de perfil
 */
export const ProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => {
        if (!phone || phone.trim() === '') return true;
        // Validação básica de telefone brasileiro
        const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:[9]?\d{4})-?\d{4}$/;
        return phoneRegex.test(phone);
      },
      { message: 'Telefone inválido' }
    ),
  avatar: z
    .string()
    .url('Avatar deve ser uma URL válida')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema para validação de alteração de senha no perfil
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(1, 'Nova senha é obrigatória')
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(50, 'Nova senha deve ter no máximo 50 caracteres'),
  confirmNewPassword: z
    .string()
    .min(1, 'Confirmação da nova senha é obrigatória'),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  }
);

// -----------------------------------------------------------
// Tipos inferidos dos schemas
// -----------------------------------------------------------

export type ProfileFormData = z.infer<typeof ProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

// -----------------------------------------------------------
// Exportações
// -----------------------------------------------------------

// Schemas já exportados individualmente acima 