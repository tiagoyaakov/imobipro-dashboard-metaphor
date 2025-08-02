import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { User } from '@supabase/supabase-js';

/**
 * Serviço de segurança para validação de permissões
 * Complementa as políticas RLS do backend
 */
export class SecurityService {
  private static instance: SecurityService;
  private currentUser: User | null = null;
  private userRole: UserRole | null = null;

  private constructor() {}

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Inicializa o serviço com o usuário atual
   */
  async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser = user;
    
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        this.userRole = data.role as UserRole;
      }
    }
  }

  /**
   * Valida se o usuário pode executar uma ação
   */
  async validateAction(action: SecurityAction): Promise<ValidationResult> {
    if (!this.currentUser || !this.userRole) {
      return {
        allowed: false,
        reason: 'Usuário não autenticado'
      };
    }

    // Validações específicas por ação
    switch (action.type) {
      case 'CREATE':
        return this.validateCreate(action);
      case 'READ':
        return this.validateRead(action);
      case 'UPDATE':
        return this.validateUpdate(action);
      case 'DELETE':
        return this.validateDelete(action);
      default:
        return {
          allowed: false,
          reason: 'Ação não reconhecida'
        };
    }
  }

  private async validateCreate(action: SecurityAction): Promise<ValidationResult> {
    const { resource, data } = action;

    switch (resource) {
      case 'company':
        // Apenas DEV_MASTER pode criar empresas
        return {
          allowed: this.userRole === 'DEV_MASTER',
          reason: this.userRole !== 'DEV_MASTER' ? 'Apenas DEV_MASTER pode criar empresas' : undefined
        };

      case 'user':
        // DEV_MASTER pode criar qualquer usuário
        // ADMIN pode criar apenas AGENT na mesma empresa
        if (this.userRole === 'DEV_MASTER') {
          return { allowed: true };
        }
        
        if (this.userRole === 'ADMIN' && data?.role === 'AGENT') {
          return { allowed: true };
        }
        
        return {
          allowed: false,
          reason: 'Permissão insuficiente para criar usuário'
        };

      case 'property':
      case 'contact':
      case 'appointment':
      case 'deal':
        // ADMIN e AGENT podem criar
        return {
          allowed: ['ADMIN', 'AGENT'].includes(this.userRole),
          reason: !['ADMIN', 'AGENT'].includes(this.userRole) ? 'Permissão insuficiente' : undefined
        };

      default:
        return { allowed: true };
    }
  }

  private async validateRead(action: SecurityAction): Promise<ValidationResult> {
    const { resource, resourceId } = action;

    // Para leitura, geralmente permitimos e deixamos o RLS filtrar
    // Aqui fazemos validações adicionais se necessário
    
    switch (resource) {
      case 'user':
        // Verificar se pode ver outros usuários
        if (this.userRole === 'AGENT' && resourceId !== this.currentUser?.id) {
          // Agents só podem ver a si mesmos
          return {
            allowed: false,
            reason: 'Agents podem visualizar apenas seus próprios dados'
          };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  private async validateUpdate(action: SecurityAction): Promise<ValidationResult> {
    const { resource, resourceId, data } = action;

    switch (resource) {
      case 'company':
        // DEV_MASTER pode atualizar qualquer empresa
        // ADMIN pode atualizar apenas sua própria
        if (this.userRole === 'DEV_MASTER') {
          return { allowed: true };
        }
        
        if (this.userRole === 'ADMIN') {
          // Verificar se é a própria empresa
          const userCompany = await this.getUserCompany();
          return {
            allowed: userCompany === resourceId,
            reason: userCompany !== resourceId ? 'Você pode editar apenas sua própria empresa' : undefined
          };
        }
        
        return {
          allowed: false,
          reason: 'Permissão insuficiente para editar empresa'
        };

      case 'user':
        // DEV_MASTER pode atualizar qualquer usuário
        if (this.userRole === 'DEV_MASTER') {
          return { allowed: true };
        }
        
        // ADMIN pode atualizar usuários da mesma empresa (exceto DEV_MASTER)
        if (this.userRole === 'ADMIN') {
          const targetUserRole = await this.getUserRole(resourceId);
          if (targetUserRole === 'DEV_MASTER') {
            return {
              allowed: false,
              reason: 'Não é possível editar usuários DEV_MASTER'
            };
          }
          return { allowed: true };
        }
        
        // AGENT pode atualizar apenas seu próprio perfil
        return {
          allowed: resourceId === this.currentUser?.id,
          reason: resourceId !== this.currentUser?.id ? 'Você pode editar apenas seu próprio perfil' : undefined
        };

      default:
        return { allowed: true };
    }
  }

  private async validateDelete(action: SecurityAction): Promise<ValidationResult> {
    const { resource } = action;

    switch (resource) {
      case 'company':
      case 'user':
        // Apenas DEV_MASTER pode deletar empresas e usuários
        return {
          allowed: this.userRole === 'DEV_MASTER',
          reason: this.userRole !== 'DEV_MASTER' ? 'Apenas DEV_MASTER pode deletar este recurso' : undefined
        };

      case 'property':
      case 'deal':
      case 'chat':
        // Apenas ADMIN pode deletar
        return {
          allowed: ['DEV_MASTER', 'ADMIN'].includes(this.userRole!),
          reason: !['DEV_MASTER', 'ADMIN'].includes(this.userRole!) ? 'Apenas administradores podem deletar este recurso' : undefined
        };

      case 'contact':
      case 'appointment':
        // ADMIN pode deletar qualquer um, AGENT apenas os próprios
        return { allowed: true }; // RLS cuidará da validação específica

      default:
        return { allowed: true };
    }
  }

  /**
   * Valida acesso a dados baseado em hierarquia
   */
  async validateDataAccess(params: DataAccessParams): Promise<ValidationResult> {
    if (!this.currentUser || !this.userRole) {
      return {
        allowed: false,
        reason: 'Usuário não autenticado'
      };
    }

    const { targetUserId, targetCompanyId } = params;

    // DEV_MASTER tem acesso total
    if (this.userRole === 'DEV_MASTER') {
      return { allowed: true };
    }

    // Verificar acesso por empresa
    if (targetCompanyId) {
      const userCompany = await this.getUserCompany();
      if (userCompany !== targetCompanyId) {
        return {
          allowed: false,
          reason: 'Acesso negado: dados de outra empresa'
        };
      }
    }

    // Verificar acesso por usuário
    if (targetUserId && this.userRole === 'AGENT') {
      if (targetUserId !== this.currentUser.id) {
        return {
          allowed: false,
          reason: 'Agents podem acessar apenas seus próprios dados'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Helpers privados
   */
  private async getUserCompany(): Promise<string | null> {
    if (!this.currentUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', this.currentUser.id)
      .single();

    return error ? null : data?.company_id;
  }

  private async getUserRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    return error ? null : data?.role as UserRole;
  }

  /**
   * Limpa o cache do serviço
   */
  clearCache() {
    this.currentUser = null;
    this.userRole = null;
  }
}

// Tipos
export interface SecurityAction {
  type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId?: string;
  data?: any;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface DataAccessParams {
  targetUserId?: string;
  targetCompanyId?: string;
}

// Singleton instance
export const securityService = SecurityService.getInstance();