// Agenda Components Export Index
export { default as CalendarView } from './CalendarView';
export type { Appointment } from './CalendarView';

export { default as AgentAvailability } from './AgentAvailability';
export type { 
  TimeSlot, 
  WorkingDay, 
  AgentAvailabilityData 
} from './AgentAvailability';

export { default as BookingWizard } from './BookingWizard';
export type { 
  BookingData, 
  TimeSlotOption, 
  Agent 
} from './BookingWizard';

export { default as SyncStatus } from './SyncStatus';
export { 
  ConnectionIndicator, 
  useSyncStatus 
} from './SyncStatus';
export type { 
  SyncEvent, 
  SyncStatusData 
} from './SyncStatus';

export { default as NotificationSystem } from './NotificationSystem';
export { 
  useNotifications 
} from './NotificationSystem';
export type { 
  NotificationData, 
  NotificationAction, 
  NotificationSettings 
} from './NotificationSystem';

export { default as OfflineMode } from './OfflineMode';
export { 
  useOfflineMode 
} from './OfflineMode';
export type { 
  OfflineQueueItem, 
  CacheStats 
} from './OfflineMode';