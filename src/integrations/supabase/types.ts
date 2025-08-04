export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      AgentSchedule: {
        Row: {
          agentId: string
          allowWeekendWork: boolean
          autoAssignEnabled: boolean
          bufferTime: number
          createdAt: string
          id: string
          isActive: boolean
          maxDailyAppointments: number | null
          timezone: string
          updatedAt: string
          workingHours: Json
        }
        Insert: {
          agentId: string
          allowWeekendWork?: boolean
          autoAssignEnabled?: boolean
          bufferTime?: number
          createdAt?: string
          id: string
          isActive?: boolean
          maxDailyAppointments?: number | null
          timezone?: string
          updatedAt: string
          workingHours: Json
        }
        Update: {
          agentId?: string
          allowWeekendWork?: boolean
          autoAssignEnabled?: boolean
          bufferTime?: number
          createdAt?: string
          id?: string
          isActive?: boolean
          maxDailyAppointments?: number | null
          timezone?: string
          updatedAt?: string
          workingHours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "AgentSchedule_agentId_fkey"
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
          automationTrigger:
            | Database["public"]["Enums"]["AutomationTrigger"]
            | null
          availabilitySlotId: string | null
          clientFeedback: Json | null
          confirmationSent: boolean
          conflictResolved: boolean
          conflictStrategy:
            | Database["public"]["Enums"]["ConflictStrategy"]
            | null
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
        Insert: {
          actualDuration?: number | null
          agentId: string
          assignmentReason?: string | null
          assignmentScore?: number | null
          autoAssigned?: boolean
          automationData?: Json | null
          automationTrigger?:
            | Database["public"]["Enums"]["AutomationTrigger"]
            | null
          availabilitySlotId?: string | null
          clientFeedback?: Json | null
          confirmationSent?: boolean
          conflictResolved?: boolean
          conflictStrategy?:
            | Database["public"]["Enums"]["ConflictStrategy"]
            | null
          contactId: string
          createdAt?: string
          date: string
          description?: string | null
          estimatedDuration?: number
          googleCalendarEventId?: string | null
          googleCalendarId?: string | null
          id: string
          lastSyncAt?: string | null
          n8nExecutionId?: string | null
          n8nWorkflowId?: string | null
          originalSlotId?: string | null
          priority?: Database["public"]["Enums"]["AppointmentPriority"]
          propertyId?: string | null
          reassignmentCount?: number
          remindersSent?: Json | null
          reschedulingCount?: number
          source?: Database["public"]["Enums"]["AppointmentSource"]
          status?: Database["public"]["Enums"]["AppointmentStatus"]
          syncAttempts?: number
          syncError?: string | null
          syncStatus?: Database["public"]["Enums"]["SyncStatus"]
          title: string
          type?: Database["public"]["Enums"]["AppointmentType"]
          updatedAt: string
        }
        Update: {
          actualDuration?: number | null
          agentId?: string
          assignmentReason?: string | null
          assignmentScore?: number | null
          autoAssigned?: boolean
          automationData?: Json | null
          automationTrigger?:
            | Database["public"]["Enums"]["AutomationTrigger"]
            | null
          availabilitySlotId?: string | null
          clientFeedback?: Json | null
          confirmationSent?: boolean
          conflictResolved?: boolean
          conflictStrategy?:
            | Database["public"]["Enums"]["ConflictStrategy"]
            | null
          contactId?: string
          createdAt?: string
          date?: string
          description?: string | null
          estimatedDuration?: number
          googleCalendarEventId?: string | null
          googleCalendarId?: string | null
          id?: string
          lastSyncAt?: string | null
          n8nExecutionId?: string | null
          n8nWorkflowId?: string | null
          originalSlotId?: string | null
          priority?: Database["public"]["Enums"]["AppointmentPriority"]
          propertyId?: string | null
          reassignmentCount?: number
          remindersSent?: Json | null
          reschedulingCount?: number
          source?: Database["public"]["Enums"]["AppointmentSource"]
          status?: Database["public"]["Enums"]["AppointmentStatus"]
          syncAttempts?: number
          syncError?: string | null
          syncStatus?: Database["public"]["Enums"]["SyncStatus"]
          title?: string
          type?: Database["public"]["Enums"]["AppointmentType"]
          updatedAt?: string
        }
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
      AppointmentConflictLog: {
        Row: {
          appointmentId: string
          conflictingData: Json
          conflictSource: Database["public"]["Enums"]["ConflictSource"]
          conflictType: Database["public"]["Enums"]["ConflictType"]
          createdAt: string
          id: string
          originalData: Json
          resolution: Database["public"]["Enums"]["ConflictResolution"]
          resolvedAt: string | null
          resolvedBy: string | null
          resolvedData: Json | null
          strategy: Database["public"]["Enums"]["ConflictStrategy"]
        }
        Insert: {
          appointmentId: string
          conflictingData: Json
          conflictSource: Database["public"]["Enums"]["ConflictSource"]
          conflictType: Database["public"]["Enums"]["ConflictType"]
          createdAt?: string
          id: string
          originalData: Json
          resolution: Database["public"]["Enums"]["ConflictResolution"]
          resolvedAt?: string | null
          resolvedBy?: string | null
          resolvedData?: Json | null
          strategy: Database["public"]["Enums"]["ConflictStrategy"]
        }
        Update: {
          appointmentId?: string
          conflictingData?: Json
          conflictSource?: Database["public"]["Enums"]["ConflictSource"]
          conflictType?: Database["public"]["Enums"]["ConflictType"]
          createdAt?: string
          id?: string
          originalData?: Json
          resolution?: Database["public"]["Enums"]["ConflictResolution"]
          resolvedAt?: string | null
          resolvedBy?: string | null
          resolvedData?: Json | null
          strategy?: Database["public"]["Enums"]["ConflictStrategy"]
        }
        Relationships: [
          {
            foreignKeyName: "AppointmentConflictLog_appointmentId_fkey"
            columns: ["appointmentId"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      AvailabilitySlot: {
        Row: {
          agentId: string
          automationData: Json | null
          createdAt: string
          date: string
          duration: number
          endTime: string
          externalId: string | null
          id: string
          priority: number
          slotType: Database["public"]["Enums"]["SlotType"]
          source: string | null
          startTime: string
          status: Database["public"]["Enums"]["SlotStatus"]
          updatedAt: string
        }
        Insert: {
          agentId: string
          automationData?: Json | null
          createdAt?: string
          date: string
          duration: number
          endTime: string
          externalId?: string | null
          id: string
          priority?: number
          slotType?: Database["public"]["Enums"]["SlotType"]
          source?: string | null
          startTime: string
          status?: Database["public"]["Enums"]["SlotStatus"]
          updatedAt: string
        }
        Update: {
          agentId?: string
          automationData?: Json | null
          createdAt?: string
          date?: string
          duration?: number
          endTime?: string
          externalId?: string | null
          id?: string
          priority?: number
          slotType?: Database["public"]["Enums"]["SlotType"]
          source?: string | null
          startTime?: string
          status?: Database["public"]["Enums"]["SlotStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "AvailabilitySlot_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CalendarSyncLog: {
        Row: {
          appointmentId: string | null
          createdAt: string
          direction: Database["public"]["Enums"]["SyncDirection"]
          duration: number | null
          errorMessage: string | null
          googleCalendarId: string | null
          googleEventId: string | null
          id: string
          operation: Database["public"]["Enums"]["SyncOperation"]
          requestData: Json | null
          responseData: Json | null
          retryCount: number
          status: Database["public"]["Enums"]["SyncLogStatus"]
        }
        Insert: {
          appointmentId?: string | null
          createdAt?: string
          direction: Database["public"]["Enums"]["SyncDirection"]
          duration?: number | null
          errorMessage?: string | null
          googleCalendarId?: string | null
          googleEventId?: string | null
          id: string
          operation: Database["public"]["Enums"]["SyncOperation"]
          requestData?: Json | null
          responseData?: Json | null
          retryCount?: number
          status: Database["public"]["Enums"]["SyncLogStatus"]
        }
        Update: {
          appointmentId?: string | null
          createdAt?: string
          direction?: Database["public"]["Enums"]["SyncDirection"]
          duration?: number | null
          errorMessage?: string | null
          googleCalendarId?: string | null
          googleEventId?: string | null
          id?: string
          operation?: Database["public"]["Enums"]["SyncOperation"]
          requestData?: Json | null
          responseData?: Json | null
          retryCount?: number
          status?: Database["public"]["Enums"]["SyncLogStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "CalendarSyncLog_appointmentId_fkey"
            columns: ["appointmentId"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      Chat: {
        Row: {
          agentId: string
          contactId: string
          createdAt: string
          id: string
          updatedAt: string
        }
        Insert: {
          agentId: string
          contactId: string
          createdAt?: string
          id: string
          updatedAt: string
        }
        Update: {
          agentId?: string
          contactId?: string
          createdAt?: string
          id?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chat_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Chat_contactId_fkey"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "Contact"
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
      GoogleCalendarConfig: {
        Row: {
          autoCreateSlots: boolean
          calendarId: string
          calendarName: string
          color: string | null
          createdAt: string
          credentialId: string
          eventFilter: Json | null
          id: string
          isActive: boolean
          isPrimary: boolean
          syncAvailability: boolean
          syncDirection: Database["public"]["Enums"]["SyncDirection"]
          syncEvents: boolean
          timeRange: Json | null
          updatedAt: string
        }
        Insert: {
          autoCreateSlots?: boolean
          calendarId: string
          calendarName: string
          color?: string | null
          createdAt?: string
          credentialId: string
          eventFilter?: Json | null
          id: string
          isActive?: boolean
          isPrimary?: boolean
          syncAvailability?: boolean
          syncDirection?: Database["public"]["Enums"]["SyncDirection"]
          syncEvents?: boolean
          timeRange?: Json | null
          updatedAt: string
        }
        Update: {
          autoCreateSlots?: boolean
          calendarId?: string
          calendarName?: string
          color?: string | null
          createdAt?: string
          credentialId?: string
          eventFilter?: Json | null
          id?: string
          isActive?: boolean
          isPrimary?: boolean
          syncAvailability?: boolean
          syncDirection?: Database["public"]["Enums"]["SyncDirection"]
          syncEvents?: boolean
          timeRange?: Json | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "GoogleCalendarConfig_credentialId_fkey"
            columns: ["credentialId"]
            isOneToOne: false
            referencedRelation: "GoogleCalendarCredentials"
            referencedColumns: ["id"]
          },
        ]
      }
      GoogleCalendarCredentials: {
        Row: {
          accessToken: string
          createdAt: string
          defaultCalendarId: string | null
          id: string
          isActive: boolean
          lastSyncAt: string | null
          refreshToken: string
          scope: string
          syncErrors: number
          tokenExpiry: string
          updatedAt: string
          userId: string
          watchChannelId: string | null
          watchExpiration: string | null
        }
        Insert: {
          accessToken: string
          createdAt?: string
          defaultCalendarId?: string | null
          id: string
          isActive?: boolean
          lastSyncAt?: string | null
          refreshToken: string
          scope: string
          syncErrors?: number
          tokenExpiry: string
          updatedAt: string
          userId: string
          watchChannelId?: string | null
          watchExpiration?: string | null
        }
        Update: {
          accessToken?: string
          createdAt?: string
          defaultCalendarId?: string | null
          id?: string
          isActive?: boolean
          lastSyncAt?: string | null
          refreshToken?: string
          scope?: string
          syncErrors?: number
          tokenExpiry?: string
          updatedAt?: string
          userId?: string
          watchChannelId?: string | null
          watchExpiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "GoogleCalendarCredentials_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Message: {
        Row: {
          chatId: string
          content: string
          id: string
          senderId: string
          sentAt: string
        }
        Insert: {
          chatId: string
          content: string
          id: string
          senderId: string
          sentAt?: string
        }
        Update: {
          chatId?: string
          content?: string
          id?: string
          senderId?: string
          sentAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Message_senderId_fkey"
            columns: ["senderId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      N8nExecutionLog: {
        Row: {
          appointmentId: string | null
          createdAt: string
          duration: number | null
          errorData: Json | null
          executionId: string
          finishedAt: string | null
          id: string
          inputData: Json | null
          outputData: Json | null
          startedAt: string
          status: Database["public"]["Enums"]["N8nExecutionStatus"]
          workflowConfigId: string
        }
        Insert: {
          appointmentId?: string | null
          createdAt?: string
          duration?: number | null
          errorData?: Json | null
          executionId: string
          finishedAt?: string | null
          id: string
          inputData?: Json | null
          outputData?: Json | null
          startedAt: string
          status: Database["public"]["Enums"]["N8nExecutionStatus"]
          workflowConfigId: string
        }
        Update: {
          appointmentId?: string | null
          createdAt?: string
          duration?: number | null
          errorData?: Json | null
          executionId?: string
          finishedAt?: string | null
          id?: string
          inputData?: Json | null
          outputData?: Json | null
          startedAt?: string
          status?: Database["public"]["Enums"]["N8nExecutionStatus"]
          workflowConfigId?: string
        }
        Relationships: [
          {
            foreignKeyName: "N8nExecutionLog_appointmentId_fkey"
            columns: ["appointmentId"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "N8nExecutionLog_workflowConfigId_fkey"
            columns: ["workflowConfigId"]
            isOneToOne: false
            referencedRelation: "N8nWorkflowConfig"
            referencedColumns: ["id"]
          },
        ]
      }
      N8nWorkflowConfig: {
        Row: {
          agentId: string | null
          companyId: string | null
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          mapping: Json | null
          name: string
          settings: Json | null
          triggerType: Database["public"]["Enums"]["N8nTriggerType"]
          updatedAt: string
          webhookUrl: string | null
          workflowId: string
        }
        Insert: {
          agentId?: string | null
          companyId?: string | null
          createdAt?: string
          description?: string | null
          id: string
          isActive?: boolean
          mapping?: Json | null
          name: string
          settings?: Json | null
          triggerType: Database["public"]["Enums"]["N8nTriggerType"]
          updatedAt: string
          webhookUrl?: string | null
          workflowId: string
        }
        Update: {
          agentId?: string | null
          companyId?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          mapping?: Json | null
          name?: string
          settings?: Json | null
          triggerType?: Database["public"]["Enums"]["N8nTriggerType"]
          updatedAt?: string
          webhookUrl?: string | null
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "N8nWorkflowConfig_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "N8nWorkflowConfig_companyId_fkey"
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
          area: number
          bathrooms: number | null
          bedrooms: number | null
          characteristics: Json | null
          city: string
          createdAt: string
          description: string | null
          id: string
          images: string[] | null
          price: number
          state: string
          status: Database["public"]["Enums"]["PropertyStatus"]
          title: string
          type: Database["public"]["Enums"]["PropertyType"]
          updatedAt: string
          zipCode: string
        }
        Insert: {
          address: string
          agentId: string
          area: number
          bathrooms?: number | null
          bedrooms?: number | null
          characteristics?: Json | null
          city: string
          createdAt?: string
          description?: string | null
          id: string
          images?: string[] | null
          price: number
          state: string
          status?: Database["public"]["Enums"]["PropertyStatus"]
          title: string
          type?: Database["public"]["Enums"]["PropertyType"]
          updatedAt: string
          zipCode: string
        }
        Update: {
          address?: string
          agentId?: string
          area?: number
          bathrooms?: number | null
          bedrooms?: number | null
          characteristics?: Json | null
          city?: string
          createdAt?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number
          state?: string
          status?: Database["public"]["Enums"]["PropertyStatus"]
          title?: string
          type?: Database["public"]["Enums"]["PropertyType"]
          updatedAt?: string
          zipCode?: string
        }
        Relationships: [
          {
            foreignKeyName: "Property_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ReportHistory: {
        Row: {
          content: string
          contentSize: number | null
          createdAt: string
          error: string | null
          executionTime: number | null
          format: Database["public"]["Enums"]["ReportFormat"]
          id: string
          metadata: Json | null
          recipients: string[]
          scheduledReportId: string
          sentAt: string | null
          status: Database["public"]["Enums"]["ReportStatus"]
          triggeredBy: string | null
        }
        Insert: {
          content: string
          contentSize?: number | null
          createdAt?: string
          error?: string | null
          executionTime?: number | null
          format: Database["public"]["Enums"]["ReportFormat"]
          id?: string
          metadata?: Json | null
          recipients?: string[]
          scheduledReportId: string
          sentAt?: string | null
          status?: Database["public"]["Enums"]["ReportStatus"]
          triggeredBy?: string | null
        }
        Update: {
          content?: string
          contentSize?: number | null
          createdAt?: string
          error?: string | null
          executionTime?: number | null
          format?: Database["public"]["Enums"]["ReportFormat"]
          id?: string
          metadata?: Json | null
          recipients?: string[]
          scheduledReportId?: string
          sentAt?: string | null
          status?: Database["public"]["Enums"]["ReportStatus"]
          triggeredBy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ReportHistory_scheduledReportId_fkey"
            columns: ["scheduledReportId"]
            isOneToOne: false
            referencedRelation: "ScheduledReport"
            referencedColumns: ["id"]
          },
        ]
      }
      ReportTemplate: {
        Row: {
          companyId: string
          createdAt: string
          createdBy: string
          description: string | null
          id: string
          isActive: boolean
          name: string
          template: string
          type: Database["public"]["Enums"]["ReportType"]
          updatedAt: string
          variables: Json | null
        }
        Insert: {
          companyId: string
          createdAt?: string
          createdBy: string
          description?: string | null
          id?: string
          isActive?: boolean
          name: string
          template: string
          type: Database["public"]["Enums"]["ReportType"]
          updatedAt?: string
          variables?: Json | null
        }
        Update: {
          companyId?: string
          createdAt?: string
          createdBy?: string
          description?: string | null
          id?: string
          isActive?: boolean
          name?: string
          template?: string
          type?: Database["public"]["Enums"]["ReportType"]
          updatedAt?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ReportTemplate_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ReportTemplate_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ScheduledReport: {
        Row: {
          companyId: string
          createdAt: string
          createdBy: string
          description: string | null
          filters: Json | null
          format: Database["public"]["Enums"]["ReportFormat"]
          id: string
          isActive: boolean
          lastSentAt: string | null
          name: string
          nextSendAt: string | null
          parameters: Json | null
          recipients: string[]
          schedule: string
          templateId: string
          updatedAt: string
        }
        Insert: {
          companyId: string
          createdAt?: string
          createdBy: string
          description?: string | null
          filters?: Json | null
          format?: Database["public"]["Enums"]["ReportFormat"]
          id?: string
          isActive?: boolean
          lastSentAt?: string | null
          name: string
          nextSendAt?: string | null
          parameters?: Json | null
          recipients?: string[]
          schedule: string
          templateId: string
          updatedAt?: string
        }
        Update: {
          companyId?: string
          createdAt?: string
          createdBy?: string
          description?: string | null
          filters?: Json | null
          format?: Database["public"]["Enums"]["ReportFormat"]
          id?: string
          isActive?: boolean
          lastSentAt?: string | null
          name?: string
          nextSendAt?: string | null
          parameters?: Json | null
          recipients?: string[]
          schedule?: string
          templateId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ScheduledReport_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledReport_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledReport_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "ReportTemplate"
            referencedColumns: ["id"]
          },
        ]
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
      WhatsAppConfig: {
        Row: {
          allowedIPs: string[] | null
          autoQRRefresh: boolean
          autoReplyEnabled: boolean
          companyId: string
          createdAt: string
          enableN8nIntegration: boolean
          id: string
          maxInstancesPerAgent: number
          messageRateLimit: number
          n8nWebhookUrl: string | null
          qrRefreshInterval: number
          requireIPWhitelist: boolean
          updatedAt: string
          webhookSecret: string | null
        }
        Insert: {
          allowedIPs?: string[] | null
          autoQRRefresh?: boolean
          autoReplyEnabled?: boolean
          companyId: string
          createdAt?: string
          enableN8nIntegration?: boolean
          id: string
          maxInstancesPerAgent?: number
          messageRateLimit?: number
          n8nWebhookUrl?: string | null
          qrRefreshInterval?: number
          requireIPWhitelist?: boolean
          updatedAt: string
          webhookSecret?: string | null
        }
        Update: {
          allowedIPs?: string[] | null
          autoQRRefresh?: boolean
          autoReplyEnabled?: boolean
          companyId?: string
          createdAt?: string
          enableN8nIntegration?: boolean
          id?: string
          maxInstancesPerAgent?: number
          messageRateLimit?: number
          n8nWebhookUrl?: string | null
          qrRefreshInterval?: number
          requireIPWhitelist?: boolean
          updatedAt?: string
          webhookSecret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WhatsAppConfig_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
        ]
      }
      WhatsAppConnectionLog: {
        Row: {
          action: Database["public"]["Enums"]["ConnectionAction"]
          createdAt: string
          duration: number | null
          errorMessage: string | null
          id: string
          instanceId: string
          ipAddress: string | null
          metadata: Json | null
          retryCount: number
          status: string
          userAgent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["ConnectionAction"]
          createdAt?: string
          duration?: number | null
          errorMessage?: string | null
          id: string
          instanceId: string
          ipAddress?: string | null
          metadata?: Json | null
          retryCount?: number
          status: string
          userAgent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["ConnectionAction"]
          createdAt?: string
          duration?: number | null
          errorMessage?: string | null
          id?: string
          instanceId?: string
          ipAddress?: string | null
          metadata?: Json | null
          retryCount?: number
          status?: string
          userAgent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WhatsAppConnectionLog_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "WhatsAppInstance"
            referencedColumns: ["id"]
          },
        ]
      }
      WhatsAppInstance: {
        Row: {
          agentId: string
          autoReply: boolean
          autoReplyMessage: string | null
          canConnect: boolean
          createdAt: string
          displayName: string | null
          id: string
          instanceId: string
          isActive: boolean
          lastConnectionAt: string | null
          maxDailyMessages: number | null
          messagesReceivedToday: number
          messagesSentToday: number
          phoneNumber: string | null
          qrCode: string | null
          qrCodeExpiry: string | null
          status: Database["public"]["Enums"]["WhatsAppStatus"]
          totalMessagesReceived: number
          totalMessagesSent: number
          updatedAt: string
          webhookUrl: string | null
        }
        Insert: {
          agentId: string
          autoReply?: boolean
          autoReplyMessage?: string | null
          canConnect?: boolean
          createdAt?: string
          displayName?: string | null
          id: string
          instanceId: string
          isActive?: boolean
          lastConnectionAt?: string | null
          maxDailyMessages?: number | null
          messagesReceivedToday?: number
          messagesSentToday?: number
          phoneNumber?: string | null
          qrCode?: string | null
          qrCodeExpiry?: string | null
          status?: Database["public"]["Enums"]["WhatsAppStatus"]
          totalMessagesReceived?: number
          totalMessagesSent?: number
          updatedAt: string
          webhookUrl?: string | null
        }
        Update: {
          agentId?: string
          autoReply?: boolean
          autoReplyMessage?: string | null
          canConnect?: boolean
          createdAt?: string
          displayName?: string | null
          id?: string
          instanceId?: string
          isActive?: boolean
          lastConnectionAt?: string | null
          maxDailyMessages?: number | null
          messagesReceivedToday?: number
          messagesSentToday?: number
          phoneNumber?: string | null
          qrCode?: string | null
          qrCodeExpiry?: string | null
          status?: Database["public"]["Enums"]["WhatsAppStatus"]
          totalMessagesReceived?: number
          totalMessagesSent?: number
          updatedAt?: string
          webhookUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "WhatsAppInstance_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      WhatsAppMessage: {
        Row: {
          caption: string | null
          chatId: string | null
          contactId: string | null
          content: string
          conversationId: string
          createdAt: string
          fromNumber: string
          id: string
          instanceId: string
          isAutoReply: boolean
          isFromMe: boolean
          isProcessed: boolean
          mediaMimeType: string | null
          mediaSize: number | null
          mediaUrl: string | null
          messageStatus: string
          messageType: Database["public"]["Enums"]["MessageType"]
          metadata: Json | null
          timestamp: string
          toNumber: string
          updatedAt: string
          whatsappMessageId: string
        }
        Insert: {
          caption?: string | null
          chatId?: string | null
          contactId?: string | null
          content: string
          conversationId: string
          createdAt?: string
          fromNumber: string
          id: string
          instanceId: string
          isAutoReply?: boolean
          isFromMe: boolean
          isProcessed?: boolean
          mediaMimeType?: string | null
          mediaSize?: number | null
          mediaUrl?: string | null
          messageStatus: string
          messageType?: Database["public"]["Enums"]["MessageType"]
          metadata?: Json | null
          timestamp: string
          toNumber: string
          updatedAt: string
          whatsappMessageId: string
        }
        Update: {
          caption?: string | null
          chatId?: string | null
          contactId?: string | null
          content?: string
          conversationId?: string
          createdAt?: string
          fromNumber?: string
          id?: string
          instanceId?: string
          isAutoReply?: boolean
          isFromMe?: boolean
          isProcessed?: boolean
          mediaMimeType?: string | null
          mediaSize?: number | null
          mediaUrl?: string | null
          messageStatus?: string
          messageType?: Database["public"]["Enums"]["MessageType"]
          metadata?: Json | null
          timestamp?: string
          toNumber?: string
          updatedAt?: string
          whatsappMessageId?: string
        }
        Relationships: [
          {
            foreignKeyName: "WhatsAppMessage_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WhatsAppMessage_contactId_fkey"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "Contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WhatsAppMessage_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "WhatsAppInstance"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      create_report_execution: {
        Args: {
          scheduled_report_id: string
          report_content: string
          report_recipients: string[]
          report_format: Database["public"]["Enums"]["ReportFormat"]
          execution_time_ms?: number
          content_size_bytes?: number
          triggered_by_source?: string
        }
        Returns: string
      }
      get_user_company_reports: {
        Args: { user_id: string }
        Returns: {
          template_id: string
          template_name: string
          template_type: Database["public"]["Enums"]["ReportType"]
          scheduled_reports_count: number
          last_execution: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_report_execution_status: {
        Args: {
          history_id: string
          new_status: Database["public"]["Enums"]["ReportStatus"]
          sent_timestamp?: string
          error_message?: string
        }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
        | "USER_DELETED"
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
      N8nExecutionStatus:
        | "RUNNING"
        | "SUCCESS"
        | "FAILED"
        | "CANCELLED"
        | "WAITING"
      N8nTriggerType: "WEBHOOK" | "SCHEDULE" | "MANUAL" | "EVENT_DRIVEN"
      PropertyStatus: "AVAILABLE" | "SOLD" | "RESERVED"
      PropertyType: "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "OTHER"
      ReportFormat: "WHATSAPP" | "EMAIL" | "PDF" | "EXCEL" | "JSON"
      ReportStatus: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED"
      ReportType:
        | "WEEKLY_SALES"
        | "LEAD_CONVERSION"
        | "APPOINTMENT_SUMMARY"
        | "AGENT_PERFORMANCE"
        | "PROPERTY_ANALYSIS"
        | "CUSTOM"
      SlotStatus:
        | "AVAILABLE"
        | "BOOKED"
        | "BLOCKED"
        | "PENDING"
        | "CANCELLED"
        | "TENTATIVE"
      SlotType:
        | "REGULAR"
        | "URGENT"
        | "FOLLOW_UP"
        | "VIEWING"
        | "MEETING"
        | "BREAK"
      SyncDirection: "TO_GOOGLE" | "FROM_GOOGLE" | "BIDIRECTIONAL"
      SyncLogStatus: "SUCCESS" | "FAILED" | "RETRYING" | "CANCELLED"
      SyncOperation: "CREATE" | "UPDATE" | "DELETE" | "SYNC_CHECK"
      SyncStatus: "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ActivityType: [
        "USER_CREATED",
        "PROPERTY_CREATED",
        "PROPERTY_UPDATED",
        "PROPERTY_DELETED",
        "CONTACT_CREATED",
        "CONTACT_UPDATED",
        "CONTACT_DELETED",
        "APPOINTMENT_SCHEDULED",
        "APPOINTMENT_UPDATED",
        "APPOINTMENT_CANCELED",
        "DEAL_CREATED",
        "DEAL_UPDATED",
        "DEAL_CLOSED",
        "CHAT_MESSAGE_SENT",
      ],
      AppointmentPriority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      AppointmentSource: [
        "MANUAL",
        "WHATSAPP",
        "N8N_AUTOMATION",
        "GOOGLE_CALENDAR",
        "API_INTEGRATION",
        "BULK_IMPORT",
      ],
      AppointmentStatus: ["CONFIRMED", "PENDING", "COMPLETED", "CANCELED"],
      AppointmentType: ["VISIT", "MEETING", "CALL", "OTHER"],
      AutomationTrigger: [
        "N8N_WEBHOOK",
        "WHATSAPP_BOT",
        "CALENDAR_SYNC",
        "AUTO_ASSIGNMENT",
        "MANUAL_CREATION",
      ],
      ConflictResolution: [
        "AUTO_RESOLVED",
        "MANUAL_RESOLVED",
        "ESCALATED",
        "PENDING",
      ],
      ConflictSource: [
        "GOOGLE_CALENDAR",
        "N8N_WORKFLOW",
        "MANUAL_EDIT",
        "AUTO_ASSIGNMENT",
      ],
      ConflictStrategy: [
        "LATEST_WINS",
        "IMOBIPRO_WINS",
        "GOOGLE_WINS",
        "MANUAL_REVIEW",
      ],
      ConflictType: [
        "TIME_OVERLAP",
        "DOUBLE_BOOKING",
        "SYNC_MISMATCH",
        "AVAILABILITY",
      ],
      ConnectionAction: [
        "CONNECT",
        "DISCONNECT",
        "QR_GENERATED",
        "ERROR",
        "RECONNECT",
      ],
      ContactCategory: ["CLIENT", "LEAD", "PARTNER"],
      ContactStatus: ["ACTIVE", "NEW", "INACTIVE"],
      DealStage: [
        "LEAD_IN",
        "QUALIFICATION",
        "PROPOSAL",
        "NEGOTIATION",
        "WON",
        "LOST",
      ],
      MessageType: [
        "TEXT",
        "IMAGE",
        "AUDIO",
        "VIDEO",
        "DOCUMENT",
        "LOCATION",
        "STICKER",
        "CONTACT",
      ],
      N8nExecutionStatus: [
        "RUNNING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "WAITING",
      ],
      N8nTriggerType: ["WEBHOOK", "SCHEDULE", "MANUAL", "EVENT_DRIVEN"],
      PropertyStatus: ["AVAILABLE", "SOLD", "RESERVED"],
      PropertyType: ["APARTMENT", "HOUSE", "COMMERCIAL", "LAND", "OTHER"],
      ReportFormat: ["WHATSAPP", "EMAIL", "PDF", "EXCEL", "JSON"],
      ReportStatus: ["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"],
      ReportType: [
        "WEEKLY_SALES",
        "LEAD_CONVERSION",
        "APPOINTMENT_SUMMARY",
        "AGENT_PERFORMANCE",
        "PROPERTY_ANALYSIS",
        "CUSTOM",
      ],
      SlotStatus: [
        "AVAILABLE",
        "BOOKED",
        "BLOCKED",
        "PENDING",
        "CANCELLED",
        "TENTATIVE",
      ],
      SlotType: [
        "REGULAR",
        "URGENT",
        "FOLLOW_UP",
        "VIEWING",
        "MEETING",
        "BREAK",
      ],
      SyncDirection: ["TO_GOOGLE", "FROM_GOOGLE", "BIDIRECTIONAL"],
      SyncLogStatus: ["SUCCESS", "FAILED", "RETRYING", "CANCELLED"],
      SyncOperation: ["CREATE", "UPDATE", "DELETE", "SYNC_CHECK"],
      SyncStatus: ["PENDING", "SYNCING", "SYNCED", "FAILED", "CONFLICT"],
      UserRole: ["CREATOR", "ADMIN", "AGENT"],
      WhatsAppStatus: [
        "CONNECTED",
        "DISCONNECTED",
        "CONNECTING",
        "ERROR",
        "QR_CODE_PENDING",
      ],
    },
  },
} as const
