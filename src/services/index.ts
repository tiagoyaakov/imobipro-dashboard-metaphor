// Exportar todos os serviços do sistema
export { propertyService } from './property.service'
export { contactService } from './contact.service'
export { appointmentService } from './appointment.service'
export { dealService } from './deal.service'

// Exportar tipos dos serviços
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
  Appointment, 
  AppointmentInsert, 
  AppointmentUpdate, 
  AppointmentFilters,
  AppointmentStats,
  AvailabilitySlot,
  AppointmentConflict
} from './appointment.service'

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