/**
 * 🔲 ImobiPRO - Componentes de Clientes
 * 
 * Índice principal para exportação de componentes do módulo de clientes.
 * Facilita importações e organização dos componentes.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

export { default as LeadFunnelKanban } from './LeadFunnelKanban';
export { default as NewLeadForm } from './NewLeadForm';
export { 
  default as AddLeadButton,
  FloatingAddLeadButton,
  InlineAddLeadButton,
  MinimalAddLeadButton
} from './AddLeadButton';
export { default as ClientsPage, ClientsPageDemo } from './ClientsPage';

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type {
  ContactWithDetails,
  CreateContactInput,
  UpdateContactInput,
  CreateLeadActivityInput,
  CreateCampaignInput,
  FunnelStats,
  LeadScoringFactors
} from '@/types/clients';

// ============================================================================
// HOOKS EXPORTADOS
// ============================================================================

export {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useMoveContactInFunnel,
  useDeleteContact,
  useLeadActivities,
  useCreateLeadActivity,
  useCampaigns,
  useCreateCampaign,
  useFunnelStats,
  useFunnelKanban,
  useContactSearch,
  useBulkContactActions,
  clientsKeys
} from '@/hooks/useClients';

// ============================================================================
// SERVIÇO EXPORTADO
// ============================================================================

export { default as clientsService } from '@/services/clientsService';