// Types para integração com Google Calendar API

// ===================================================
// OAUTH 2.0 CONFIGURATION
// ===================================================

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate: number;
  scope: string;
  tokenType: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// ===================================================
// GOOGLE CALENDAR DATA STRUCTURES
// ===================================================

export interface GoogleCalendar {
  kind: "calendar#calendarListEntry";
  etag: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole: "owner" | "reader" | "writer" | "freeBusyReader";
  defaultReminders?: GoogleReminder[];
  primary?: boolean;
}

export interface GoogleCalendarEvent {
  kind: "calendar#event";
  etag: string;
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator: GoogleEventPerson;
  organizer: GoogleEventPerson;
  start: GoogleDateTime;
  end: GoogleDateTime;
  endTimeUnspecified?: boolean;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: GoogleDateTime;
  transparency?: "opaque" | "transparent";
  visibility?: "default" | "public" | "private" | "confidential";
  iCalUID: string;
  sequence: number;
  attendees?: GoogleAttendee[];
  attendeesOmitted?: boolean;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  hangoutLink?: string;
  conferenceData?: GoogleConferenceData;
  gadget?: any;
  anyoneCanAddSelf?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  privateCopy?: boolean;
  locked?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: GoogleReminder[];
  };
  source?: {
    url: string;
    title: string;
  };
  workingLocationProperties?: any;
  outOfOfficeProperties?: any;
  focusTimeProperties?: any;
}

export interface GoogleDateTime {
  date?: string; // YYYY-MM-DD para eventos de dia inteiro
  dateTime?: string; // RFC3339 timestamp para eventos com hora específica
  timeZone?: string;
}

export interface GoogleEventPerson {
  id?: string;
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface GoogleAttendee extends GoogleEventPerson {
  organizer?: boolean;
  resource?: boolean;
  optional?: boolean;
  responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
  comment?: string;
  additionalGuests?: number;
}

export interface GoogleReminder {
  method: "email" | "popup";
  minutes: number;
}

export interface GoogleConferenceData {
  createRequest?: any;
  entryPoints?: Array<{
    entryPointType: "video" | "phone" | "sip" | "more";
    uri: string;
    label?: string;
    pin?: string;
    accessCode?: string;
    meetingCode?: string;
    passcode?: string;
    password?: string;
  }>;
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri: string;
  };
  conferenceId?: string;
  signature?: string;
  notes?: string;
}

// ===================================================
// SYNC MANAGEMENT TYPES
// ===================================================

export enum SyncStatus {
  IDLE = "IDLE",
  CONNECTING = "CONNECTING",
  SYNCING = "SYNCING",
  SYNCED = "SYNCED",
  ERROR = "ERROR",
  CONFLICT = "CONFLICT"
}

export enum SyncDirection {
  TO_GOOGLE = "TO_GOOGLE",
  FROM_GOOGLE = "FROM_GOOGLE",
  BIDIRECTIONAL = "BIDIRECTIONAL"
}

export enum ConflictType {
  TIME_OVERLAP = "TIME_OVERLAP",
  CONTENT_MISMATCH = "CONTENT_MISMATCH",
  DELETION_CONFLICT = "DELETION_CONFLICT",
  CREATION_CONFLICT = "CREATION_CONFLICT",
  UPDATE_CONFLICT = "UPDATE_CONFLICT",
  ORPHANED_EVENT = "ORPHANED_EVENT",
  EXTERNAL_CONFLICT = "EXTERNAL_CONFLICT"
}

export enum ConflictStrategy {
  LATEST_WINS = "LATEST_WINS",
  IMOBIPRO_WINS = "IMOBIPRO_WINS",
  GOOGLE_WINS = "GOOGLE_WINS",
  ASK_USER = "ASK_USER"
}

export interface SyncConflict {
  id?: string;
  type: ConflictType;
  localEvent?: any; // PlantaoEvent
  googleEvent?: GoogleCalendarEvent;
  detectedAt?: Date;
  resolvedAt?: Date;
  resolution?: ConflictStrategy;
  resolvedBy?: string;
  description: string;
  suggestedResolution?: string;
}

export interface SyncResult {
  success: boolean;
  action: "CREATE" | "UPDATE" | "DELETE" | "SKIP";
  localId?: string;
  googleId?: string;
  error?: string;
  conflicts?: SyncConflict[];
}

export interface SyncReport {
  success: boolean;
  timestamp: Date;
  conflicts: SyncConflict[];
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  
  // Campos legados para compatibilidade
  startedAt?: Date;
  completedAt?: Date;
  totalEvents?: number;
  syncedCount?: number;
  conflictCount?: number;
  errorCount?: number;
  results?: SyncResult[];
}

// ===================================================
// CONNECTION MANAGEMENT
// ===================================================

export interface GoogleCalendarConnection {
  id: string;
  userId: string;
  isConnected: boolean;
  connectedAt?: Date;
  lastSyncAt?: Date;
  tokens?: GoogleTokens;
  calendars: GoogleCalendar[];
  syncSettings: GoogleCalendarSyncSettings;
  syncStatus: SyncStatus;
  lastError?: string;
}

export interface GoogleCalendarSyncSettings {
  calendars: Record<string, CalendarSyncConfig>;
  defaultReminders: GoogleReminder[];
  syncDirection: SyncDirection;
  autoSync: boolean;
  syncInterval: number; // minutos
  conflictStrategy: ConflictStrategy;
}

export interface CalendarSyncConfig {
  calendarId: string;
  enabled: boolean;
  syncDirection: SyncDirection;
  colorOverride?: string;
  includeReminders: boolean;
  filters?: {
    skipAllDayEvents?: boolean;
    onlyMyEvents?: boolean;
    keywordFilters?: string[];
  };
}

// ===================================================
// WEBHOOK TYPES
// ===================================================

export interface GoogleWebhookNotification {
  kind: "api#channel";
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration: string;
  type: string;
  address: string;
}

export interface GoogleWebhookEvent {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
  type: string;
  address: string;
  payload?: string;
}

// ===================================================
// API RESPONSE TYPES
// ===================================================

export interface GoogleCalendarListResponse {
  kind: "calendar#calendarList";
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleEventsListResponse {
  kind: "calendar#events";
  etag: string;
  summary: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: GoogleReminder[];
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendarEvent[];
}

// ===================================================
// ERROR TYPES
// ===================================================

export interface GoogleCalendarError {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
    location?: string;
    locationType?: string;
  }>;
}

export class GoogleApiError extends Error {
  public code: number;
  public errors?: GoogleCalendarError['errors'];

  constructor(message: string, code: number = 500, errors?: GoogleCalendarError['errors']) {
    super(message);
    this.name = 'GoogleApiError';
    this.code = code;
    this.errors = errors;
  }
}

// ===================================================
// UTILITY TYPES
// ===================================================

export type GoogleCalendarScope = 
  | "https://www.googleapis.com/auth/calendar"
  | "https://www.googleapis.com/auth/calendar.events"
  | "https://www.googleapis.com/auth/calendar.readonly";

export const GOOGLE_CALENDAR_SCOPES: GoogleCalendarScope[] = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
];

// Default OAuth configuration
export const DEFAULT_GOOGLE_OAUTH_CONFIG: Omit<GoogleOAuthConfig, 'clientId' | 'redirectUri'> = {
  scope: GOOGLE_CALENDAR_SCOPES
};

// Default sync settings
export const DEFAULT_SYNC_SETTINGS: GoogleCalendarSyncSettings = {
  calendars: {},
  defaultReminders: [
    { method: "popup", minutes: 15 },
    { method: "email", minutes: 60 }
  ],
  syncDirection: SyncDirection.BIDIRECTIONAL,
  autoSync: true,
  syncInterval: 15, // 15 minutos
  conflictStrategy: ConflictStrategy.ASK_USER
};

// ===================================================
// TYPE GUARDS
// ===================================================

export const isGoogleCalendarEvent = (obj: any): obj is GoogleCalendarEvent => {
  return obj && obj.kind === "calendar#event" && typeof obj.id === "string";
};

export const isGoogleCalendar = (obj: any): obj is GoogleCalendar => {
  return obj && obj.kind === "calendar#calendarListEntry" && typeof obj.id === "string";
};

export const isGoogleApiError = (error: any): error is GoogleApiError => {
  return error && typeof error.code === "number" && typeof error.message === "string";
};