// -----------------------------------------------------------
// Exports dos Componentes de Impersonation
// -----------------------------------------------------------

export { ImpersonationButton } from './ImpersonationButton';
export { ImpersonationIndicator } from './ImpersonationIndicator';

// -----------------------------------------------------------
// Re-export dos hooks relacionados
// -----------------------------------------------------------

export { 
  useImpersonation, 
  useImpersonationTargets, 
  useEffectiveUser 
} from '@/hooks/useImpersonation';

// -----------------------------------------------------------
// Re-export dos tipos (se necessário)
// -----------------------------------------------------------

export type { 
  ImpersonationSession, 
  ImpersonatedUser, 
  ImpersonationData,
  StartImpersonationParams 
} from '@/hooks/useImpersonation'; 