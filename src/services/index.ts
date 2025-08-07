// ================================================================
// SERVIÇOS MVP (6 TABELAS) - RECOMENDADOS
// ================================================================
export { dadosClienteService } from './dadosCliente.service'
export { imoveisVivaRealService } from './imoveisVivaReal.service'
export { chatsMvpService } from './chatsMvp.service'
export { chatMessagesMvpService } from './chatMessagesMvp.service'
export { imobiproMessagesService } from './imobiproMessages.service'
export { interesseImoveisService } from './interesseImoveis.service'

// ================================================================
// SERVIÇOS LEGADOS (DEPRECATED) - Para compatibilidade
// ================================================================
export { propertyService } from './property.service'
export { contactService } from './contact.service'
export { dealService } from './deal.service'

// Exportar classes dos serviços legados (para testes e extensão)
export { PropertyService } from './property.service'
export { ContactService } from './contact.service'
export { DealService } from './deal.service'

// ================================================================
// TIPOS DOS SERVIÇOS MVP (6 TABELAS)
// ================================================================
export type { 
  DadosCliente,
  DadosClienteInsert,
  DadosClienteUpdate,
  DadosClienteFilters,
  DadosClienteStats
} from './dadosCliente.service'

export type { 
  ImoveisVivaReal4,
  ImoveisVivaReal4Insert,
  ImoveisVivaReal4Update,
  ImoveisVivaReal4Filters,
  ImoveisVivaReal4Stats
} from './imoveisVivaReal.service'

export type { 
  ChatsMvp,
  ChatsMvpInsert,
  ChatsMvpUpdate,
  ChatsMvpFilters,
  ChatsMvpStats
} from './chatsMvp.service'

export type { 
  ChatMessagesMvp,
  ChatMessagesMvpInsert,
  ChatMessagesMvpUpdate,
  ChatMessagesMvpFilters,
  ChatMessagesMvpStats
} from './chatMessagesMvp.service'

export type { 
  InteresseImoveis,
  InteresseImoveisInsert,
  InteresseImoveisUpdate,
  InteresseImoveisFilters,
  InteresseImoveisStats
} from './interesseImoveis.service'

// ================================================================
// TIPOS DOS SERVIÇOS LEGADOS (DEPRECATED)
// ================================================================
export type { 
  Property, 
  PropertyInsert, 
  PropertyUpdate, 
  PropertyFilters,
  PropertyStats 
} from './property.service'

export type { 
  Contact, 
  ContactInsert, 
  ContactUpdate, 
  ContactFilters,
  ContactStats,
  LeadActivity
} from './contact.service'

export type { 
  Deal, 
  DealInsert, 
  DealUpdate, 
  DealFilters,
  DealStats,
  StageHistory,
  DealForecast
} from './deal.service'

// Exportar base service para extensão futura
export { BaseService } from './base.service'
export type { ServiceResult, QueryOptions } from './base.service'