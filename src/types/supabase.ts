export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ===================================
// TYPES FOR SERVICES AND TESTS
// ===================================

// Property Types
export type Property = Database['public']['Tables']['Property']['Row']
export type PropertyInsert = Database['public']['Tables']['Property']['Insert']
export type PropertyUpdate = Database['public']['Tables']['Property']['Update']
export type PropertyType = Database['public']['Enums']['PropertyType']
export type PropertyStatus = Database['public']['Enums']['PropertyStatus']

// Contact Types
export type Contact = Database['public']['Tables']['Contact']['Row']
export type ContactInsert = Database['public']['Tables']['Contact']['Insert']
export type ContactUpdate = Database['public']['Tables']['Contact']['Update']
export type ContactCategory = Database['public']['Enums']['ContactCategory']
export type ContactStatus = Database['public']['Enums']['ContactStatus']
export type LeadStage = Database['public']['Enums']['LeadStage']

// Appointment Types
export type Appointment = Database['public']['Tables']['Appointment']['Row']
export type AppointmentInsert = Database['public']['Tables']['Appointment']['Insert']
export type AppointmentUpdate = Database['public']['Tables']['Appointment']['Update']
export type AppointmentType = Database['public']['Enums']['AppointmentType']
export type AppointmentStatus = Database['public']['Enums']['AppointmentStatus']
export type AppointmentPriority = Database['public']['Enums']['AppointmentPriority']
export type AppointmentSource = Database['public']['Enums']['AppointmentSource']

// Deal Types
export type Deal = Database['public']['Tables']['Deal']['Row']
export type DealInsert = Database['public']['Tables']['Deal']['Insert']
export type DealUpdate = Database['public']['Tables']['Deal']['Update']
export type DealStage = Database['public']['Enums']['DealStage']

// Availability Slot Types
export type AvailabilitySlot = Database['public']['Tables']['AvailabilitySlot']['Row']
export type SlotStatus = Database['public']['Enums']['SlotStatus']
export type SlotType = Database['public']['Enums']['SlotType']

// Activity Types
export type Activity = Database['public']['Tables']['Activity']['Row']
export type ActivityType = Database['public']['Enums']['ActivityType']

// User Types
export type User = Database['public']['Tables']['User']['Row']
export type UserRole = Database['public']['Enums']['UserRole']

// Additional Filter Types for Services
export interface PropertyFilters {
  status?: PropertyStatus
  type?: PropertyType
  minPrice?: number
  maxPrice?: number
  city?: string
  search?: string
  agentId?: string
}

export interface ContactFilters {
  category?: ContactCategory
  status?: ContactStatus
  leadStage?: LeadStage
  minScore?: number
  maxScore?: number
  search?: string
  agentId?: string
}

export interface AppointmentFilters {
  status?: AppointmentStatus
  type?: AppointmentType
  priority?: AppointmentPriority
  agentId?: string
  contactId?: string
  propertyId?: string
  dateStart?: string
  dateEnd?: string
  search?: string
}

export interface DealFilters {
  stage?: DealStage
  status?: string
  agentId?: string
  clientId?: string
  propertyId?: string
  minValue?: number
  maxValue?: number
  search?: string
}

// Common result types
export interface ServiceResult<T> {
  data: T | null
  error: Error | null
  count?: number
}

// Additional Types for Tests
export interface TimeSlot {
  startTime: string
  endTime: string
  duration: number
}

export interface DealMetrics {
  totalValue: number
  averageValue: number
  conversionRate: number
  winRate: number
}

// Tables shorthand
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

export type Database = {
  public: {
    Tables: {
      Activity: {
        Row: {
          createdAt: string
          description: string
          entityId: string | null
          entityType: string | null
          id: string
          type: Database["public"]["Enums"]["ActivityType"]
          userId: string
        }
        Insert: {
          createdAt?: string
          description: string
          entityId?: string | null
          entityType?: string | null
          id: string
          type: Database["public"]["Enums"]["ActivityType"]
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string
          entityId?: string | null
          entityType?: string | null
          id?: string
          type?: Database["public"]["Enums"]["ActivityType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Activity_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Company: {
        Row: {
          active: boolean
          createdAt: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          active?: boolean
          createdAt?: string
          id: string
          name: string
          updatedAt: string
        }
        Update: {
          active?: boolean
          createdAt?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      User: {
        Row: {
          avatarUrl: string | null
          companyId: string
          createdAt: string
          email: string
          id: string
          isActive: boolean
          name: string
          password: string
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Insert: {
          avatarUrl?: string | null
          companyId: string
          createdAt?: string
          email: string
          id: string
          isActive?: boolean
          name: string
          password: string
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Update: {
          avatarUrl?: string | null
          companyId?: string
          createdAt?: string
          email?: string
          id?: string
          isActive?: boolean
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
        ]
      }
      Property: {
        Row: {
          address: string
          agentId: string
          amenities: string[] | null
          area: number
          bathrooms: number | null
          bedrooms: number | null
          builtArea: number | null
          category: Database["public"]["Enums"]["PropertyCategory"]
          characteristics: Json | null
          city: string
          companyId: string
          complement: string | null
          condition: Database["public"]["Enums"]["PropertyCondition"] | null
          condominiumFee: number | null
          country: string | null
          createdAt: string
          currencySymbol: string | null
          description: string | null
          externalId: string | null
          favoriteCount: number | null
          features: string[] | null
          floor: number | null
          floors: number | null
          geolocationPrecision: string | null
          id: string
          images: string[] | null
          iptuPrice: number | null
          isActive: boolean
          isDevelopmentUnit: boolean | null
          isFeatured: boolean | null
          lastSyncAt: string | null
          latitude: number | null
          listingType: Database["public"]["Enums"]["PropertyListingType"]
          longitude: number | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          ownerId: string | null
          parkingSpaces: number | null
          price: number
          propertyType: Database["public"]["Enums"]["PropertyType"]
          rentPrice: number | null
          salePrice: number | null
          source: Database["public"]["Enums"]["PropertySource"]
          state: string
          status: Database["public"]["Enums"]["PropertyStatus"]
          suites: number | null
          syncError: string | null
          title: string
          totalArea: number | null
          type: Database["public"]["Enums"]["PropertyType"]
          units: number | null
          updatedAt: string
          usefulArea: number | null
          viewCount: number | null
          vivaRealId: string | null
          vivaRealListingId: string | null
          vivaRealUrl: string | null
          yearBuilt: number | null
          zipCode: string
        }
        Insert: Omit<Database["public"]["Tables"]["Property"]["Row"], "createdAt" | "updatedAt" | "isActive" | "favoriteCount" | "viewCount"> & {
          createdAt?: string
          updatedAt?: string
          isActive?: boolean
          favoriteCount?: number | null
          viewCount?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["Property"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "Property_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Property_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Property_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "PropertyOwner"
            referencedColumns: ["id"]
          },
        ]
      }
      Contact: {
        Row: {
          agentId: string
          avatarUrl: string | null
          category: Database["public"]["Enums"]["ContactCategory"]
          createdAt: string
          email: string | null
          id: string
          lastContactAt: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["ContactStatus"]
          updatedAt: string
        }
        Insert: {
          agentId: string
          avatarUrl?: string | null
          category?: Database["public"]["Enums"]["ContactCategory"]
          createdAt?: string
          email?: string | null
          id: string
          lastContactAt?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["ContactStatus"]
          updatedAt: string
        }
        Update: {
          agentId?: string
          avatarUrl?: string | null
          category?: Database["public"]["Enums"]["ContactCategory"]
          createdAt?: string
          email?: string | null
          id?: string
          lastContactAt?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["ContactStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Contact_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Appointment: {
        Row: {
          actualDuration: number | null
          agentId: string
          assignmentReason: string | null
          assignmentScore: number | null
          autoAssigned: boolean
          automationData: Json | null
          automationTrigger: Database["public"]["Enums"]["AutomationTrigger"] | null
          availabilitySlotId: string | null
          clientFeedback: Json | null
          confirmationSent: boolean
          conflictResolved: boolean
          conflictStrategy: Database["public"]["Enums"]["ConflictStrategy"] | null
          contactId: string
          createdAt: string
          date: string
          description: string | null
          estimatedDuration: number
          googleCalendarEventId: string | null
          googleCalendarId: string | null
          id: string
          lastSyncAt: string | null
          n8nExecutionId: string | null
          n8nWorkflowId: string | null
          originalSlotId: string | null
          priority: Database["public"]["Enums"]["AppointmentPriority"]
          propertyId: string | null
          reassignmentCount: number
          remindersSent: Json | null
          reschedulingCount: number
          source: Database["public"]["Enums"]["AppointmentSource"]
          status: Database["public"]["Enums"]["AppointmentStatus"]
          syncAttempts: number
          syncError: string | null
          syncStatus: Database["public"]["Enums"]["SyncStatus"]
          title: string
          type: Database["public"]["Enums"]["AppointmentType"]
          updatedAt: string
        }
        Insert: Omit<Database["public"]["Tables"]["Appointment"]["Row"], "createdAt" | "updatedAt" | "autoAssigned" | "confirmationSent" | "conflictResolved" | "estimatedDuration" | "priority" | "reassignmentCount" | "reschedulingCount" | "source" | "status" | "syncAttempts" | "syncStatus" | "type"> & {
          createdAt?: string
          updatedAt?: string
          autoAssigned?: boolean
          confirmationSent?: boolean
          conflictResolved?: boolean
          estimatedDuration?: number
          priority?: Database["public"]["Enums"]["AppointmentPriority"]
          reassignmentCount?: number
          reschedulingCount?: number
          source?: Database["public"]["Enums"]["AppointmentSource"]
          status?: Database["public"]["Enums"]["AppointmentStatus"]
          syncAttempts?: number
          syncStatus?: Database["public"]["Enums"]["SyncStatus"]
          type?: Database["public"]["Enums"]["AppointmentType"]
        }
        Update: Partial<Database["public"]["Tables"]["Appointment"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "Appointment_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_availabilitySlotId_fkey"
            columns: ["availabilitySlotId"]
            isOneToOne: false
            referencedRelation: "AvailabilitySlot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_contactId_fkey"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "Contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_propertyId_fkey"
            columns: ["propertyId"]
            isOneToOne: false
            referencedRelation: "Property"
            referencedColumns: ["id"]
          },
        ]
      }
      Deal: {
        Row: {
          agentId: string
          clientId: string
          closedAt: string | null
          createdAt: string
          expectedCloseDate: string | null
          id: string
          propertyId: string
          stage: Database["public"]["Enums"]["DealStage"]
          status: string
          title: string
          updatedAt: string
          value: number
        }
        Insert: {
          agentId: string
          clientId: string
          closedAt?: string | null
          createdAt?: string
          expectedCloseDate?: string | null
          id: string
          propertyId: string
          stage?: Database["public"]["Enums"]["DealStage"]
          status?: string
          title: string
          updatedAt: string
          value: number
        }
        Update: {
          agentId?: string
          clientId?: string
          closedAt?: string | null
          createdAt?: string
          expectedCloseDate?: string | null
          id?: string
          propertyId?: string
          stage?: Database["public"]["Enums"]["DealStage"]
          status?: string
          title?: string
          updatedAt?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "Deal_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Deal_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Deal_propertyId_fkey"
            columns: ["propertyId"]
            isOneToOne: false
            referencedRelation: "Property"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      search_properties_by_location: {
        Args: {
          search_lat: number
          search_lon: number
          radius_km: number
          company_id: string
        }
        Returns: {
          id: string
          title: string
          address: string
          distance_km: number
        }[]
      }
    }
    Enums: {
      ActivityType:
        | "USER_CREATED"
        | "PROPERTY_CREATED"
        | "PROPERTY_UPDATED"
        | "PROPERTY_DELETED"
        | "CONTACT_CREATED"
        | "CONTACT_UPDATED"
        | "CONTACT_DELETED"
        | "APPOINTMENT_SCHEDULED"
        | "APPOINTMENT_UPDATED"
        | "APPOINTMENT_CANCELED"
        | "DEAL_CREATED"
        | "DEAL_UPDATED"
        | "DEAL_CLOSED"
        | "CHAT_MESSAGE_SENT"
      AppointmentPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      AppointmentSource:
        | "MANUAL"
        | "WHATSAPP"
        | "N8N_AUTOMATION"
        | "GOOGLE_CALENDAR"
        | "API_INTEGRATION"
        | "BULK_IMPORT"
      AppointmentStatus: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELED"
      AppointmentType: "VISIT" | "MEETING" | "CALL" | "OTHER"
      AutomationTrigger:
        | "N8N_WEBHOOK"
        | "WHATSAPP_BOT"
        | "CALENDAR_SYNC"
        | "AUTO_ASSIGNMENT"
        | "MANUAL_CREATION"
      ConflictResolution:
        | "AUTO_RESOLVED"
        | "MANUAL_RESOLVED"
        | "ESCALATED"
        | "PENDING"
      ConflictSource:
        | "GOOGLE_CALENDAR"
        | "N8N_WORKFLOW"
        | "MANUAL_EDIT"
        | "AUTO_ASSIGNMENT"
      ConflictStrategy:
        | "LATEST_WINS"
        | "IMOBIPRO_WINS"
        | "GOOGLE_WINS"
        | "MANUAL_REVIEW"
      ConflictType:
        | "TIME_OVERLAP"
        | "DOUBLE_BOOKING"
        | "SYNC_MISMATCH"
        | "AVAILABILITY"
      ConnectionAction:
        | "CONNECT"
        | "DISCONNECT"
        | "QR_GENERATED"
        | "ERROR"
        | "RECONNECT"
      ContactCategory: "CLIENT" | "LEAD" | "PARTNER"
      ContactStatus: "ACTIVE" | "NEW" | "INACTIVE"
      DealStage:
        | "LEAD_IN"
        | "QUALIFICATION"
        | "PROPOSAL"
        | "NEGOTIATION"
        | "WON"
        | "LOST"
      MessageType:
        | "TEXT"
        | "IMAGE"
        | "AUDIO"
        | "VIDEO"
        | "DOCUMENT"
        | "LOCATION"
        | "STICKER"
        | "CONTACT"
      PropertyCategory:
        | "RESIDENTIAL"
        | "COMMERCIAL"
        | "INDUSTRIAL"
        | "RURAL"
        | "MIXED_USE"
      PropertyCondition:
        | "NEW"
        | "EXCELLENT"
        | "GOOD"
        | "FAIR"
        | "NEEDS_RENOVATION"
      PropertyListingType: "SALE" | "RENT" | "BOTH"
      PropertySource:
        | "MANUAL"
        | "VIVA_REAL"
        | "ZAP"
        | "OLX"
        | "API_IMPORT"
        | "BULK_IMPORT"
      PropertyStatus: "AVAILABLE" | "SOLD" | "RESERVED"
      PropertyType: "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "OTHER"
      UserRole: "CREATOR" | "ADMIN" | "AGENT"
      WhatsAppStatus:
        | "CONNECTED"
        | "DISCONNECTED"
        | "CONNECTING"
        | "ERROR"
        | "QR_CODE_PENDING"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never