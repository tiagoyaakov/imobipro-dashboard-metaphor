import { z } from 'zod';
import type { UserRole } from '@/integrations/supabase/types';

// -----------------------------------------------------------
// Schema para criação de usuário
// -----------------------------------------------------------

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  role: z.enum(['DEV_MASTER', 'ADMIN', 'AGENT'] as const, {
    required_error: 'Função é obrigatória',
    invalid_type_error: 'Função inválida',
  }),
  
  company_id: z
    .string()
    .min(1, 'Empresa é obrigatória')
    .uuid('ID da empresa inválido'),
  
  telefone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Campo opcional
      // Validar formato brasileiro: (11) 99999-9999 ou 11999999999
      const phoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/;
      return phoneRegex.test(val.replace(/\D/g, ''));
    }, 'Telefone deve estar no formato brasileiro válido'),
  
  avatar_url: z
    .string()
    .url('URL do avatar deve ser válida')
    .optional()
    .or(z.literal('')),
});

// -----------------------------------------------------------
// Tipos derivados do schema
// -----------------------------------------------------------

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export type CreateUserFormErrors = {
  [K in keyof CreateUserFormData]?: string;
};

// -----------------------------------------------------------
// Validações customizadas baseadas na hierarquia
// -----------------------------------------------------------

export const validateUserRoleByHierarchy = (
  currentUserRole: UserRole,
  targetRole: UserRole
): { isValid: boolean; error?: string } => {
  switch (currentUserRole) {
    case 'DEV_MASTER':
      // DEV_MASTER pode criar ADMIN e AGENT (mas não outros DEV_MASTER)
      if (targetRole === 'DEV_MASTER') {
        return {
          isValid: false,
          error: 'DEV_MASTER não pode criar outros usuários DEV_MASTER',
        };
      }
      return { isValid: true };
    
    case 'ADMIN':
      // ADMIN pode criar apenas AGENT
      if (targetRole !== 'AGENT') {
        return {
          isValid: false,
          error: 'Administradores podem criar apenas Corretores',
        };
      }
      return { isValid: true };
    
    default:
      return {
        isValid: false,
        error: 'Você não tem permissão para criar usuários',
      };
  }
};

// -----------------------------------------------------------
// Helpers para validação
// -----------------------------------------------------------

export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Aplica máscara brasileira
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// -----------------------------------------------------------
// Opções para campos select
// -----------------------------------------------------------

export const roleOptions = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'AGENT', label: 'Corretor' },
] as const;

export const getRoleOptionsByUser = (currentUserRole: UserRole) => {
  switch (currentUserRole) {
    case 'DEV_MASTER':
      return roleOptions;
    case 'ADMIN':
      return roleOptions.filter(option => option.value === 'AGENT');
    default:
      return [];
  }
};

// -----------------------------------------------------------
// Mensagens de erro customizadas
// -----------------------------------------------------------

export const userFormErrorMessages = {
  email: {
    required: 'Email é obrigatório',
    invalid: 'Email inválido',
    alreadyExists: 'Este email já está em uso',
  },
  name: {
    required: 'Nome é obrigatório',
    minLength: 'Nome deve ter pelo menos 2 caracteres',
    maxLength: 'Nome deve ter no máximo 100 caracteres',
  },
  role: {
    required: 'Função é obrigatória',
    invalid: 'Função inválida',
    noPermission: 'Você não tem permissão para criar usuários com esta função',
  },
  company_id: {
    required: 'Empresa é obrigatória',
    invalid: 'Empresa inválida',
  },
  telefone: {
    invalid: 'Telefone deve estar no formato brasileiro válido',
  },
  avatar_url: {
    invalid: 'URL do avatar deve ser válida',
  },
} as const; 